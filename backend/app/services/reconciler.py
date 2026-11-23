import uuid
from datetime import datetime
from typing import Dict, Any, List, Set, Optional
from sqlalchemy.orm import Session
from ..models import (
    Location,
    Organization,
    SystemARecord,
    SystemBRecord,
    ReconciliationRun,
    ReconciliationResult,
    ExceptionRecord,
    AuditLog
)

class ReconciliationEngine:
    @staticmethod
    def run_reconciliation(db: Session, run_notes: Optional[str] = "Standard Automated Reconciliation") -> Dict[str, Any]:
        """
        Executes full reconciliation across all 8 rules.
        """
        run_code = f"REC-RUN-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        started_at = datetime.utcnow()

        # Fetch master locations
        locations_db = db.query(Location).all()
        loc_to_org = {loc.location_id.strip().upper(): loc.org_id.strip().upper() for loc in locations_db}
        valid_locations = set(loc_to_org.keys())

        # Fetch all records
        a_records = db.query(SystemARecord).all()
        b_records = db.query(SystemBRecord).all()

        total_a = len(a_records)
        total_b = len(b_records)

        # Index records
        a_by_id: Dict[str, List[SystemARecord]] = {}
        for r in a_records:
            a_by_id.setdefault(r.record_id, []).append(r)

        b_by_ref: Dict[str, List[SystemBRecord]] = {}
        for r in b_records:
            b_by_ref.setdefault(r.record_ref, []).append(r)

        # Create ReconciliationRun record
        rec_run = ReconciliationRun(
            run_code=run_code,
            started_at=started_at,
            status="RUNNING",
            total_a_records=total_a,
            total_b_records=total_b,
            notes=run_notes
        )
        db.add(rec_run)
        db.flush()

        results_to_insert = []
        exceptions_to_insert = []

        all_identifiers = sorted(set(list(a_by_id.keys()) + list(b_by_ref.keys())))

        matched_count = 0
        mismatched_count = 0
        missing_in_b_count = 0
        missing_in_a_count = 0
        duplicate_count = 0
        quality_count = 0
        voided_count = 0
        total_a_val = 0.0
        total_b_val = 0.0

        for identifier in all_identifiers:
            a_list = a_by_id.get(identifier, [])
            b_list = b_by_ref.get(identifier, [])

            # Check duplicates in System A
            if len(a_list) > 1:
                duplicate_count += (len(a_list) - 1)
                exceptions_to_insert.append(ExceptionRecord(
                    run_id=rec_run.id,
                    record_id=identifier,
                    exception_type="DUPLICATE",
                    severity="HIGH",
                    suggested_action="Deduplicate System A entries; retain the most recent authoritative transaction.",
                    review_status="PENDING",
                    comments=f"Found {len(a_list)} records with the same record_id {identifier} in System A."
                ))

            # Check duplicates in System B
            if len(b_list) > 1:
                duplicate_count += (len(b_list) - 1)
                # Check if it's a split transaction (like REC-1055 where part 1 + part 2 == A total)
                is_split = any("part" in (b.label or "").lower() for b in b_list)
                combined_b_val = sum((b.value or 0.0) for b in b_list)
                a_total = a_list[0].total_value if a_list else None
                is_exact_split_sum = (a_total is not None and abs(a_total - combined_b_val) < 0.01)

                action_desc = "Verify multipart split transaction." if is_split or is_exact_split_sum else "Review and resolve duplicate System B entries."
                exceptions_to_insert.append(ExceptionRecord(
                    run_id=rec_run.id,
                    record_id=identifier,
                    exception_type="DUPLICATE",
                    severity="MEDIUM" if is_exact_split_sum else "HIGH",
                    suggested_action=action_desc,
                    review_status="PENDING",
                    comments=f"Found {len(b_list)} entries in System B for {identifier} (Entry IDs: {', '.join(b.entry_id for b in b_list)})."
                ))

            # Case 1: Present in System A but missing in System B (Rule 5)
            if a_list and not b_list:
                missing_in_b_count += 1
                for a_rec in a_list:
                    total_a_val += a_rec.total_value
                    res = ReconciliationResult(
                        run_id=rec_run.id,
                        record_id=identifier,
                        system_a_id=a_rec.id,
                        status="MISSING_IN_B",
                        match_category="UNMATCHED",
                        a_total_value=a_rec.total_value,
                        b_value=None,
                        difference=a_rec.total_value,
                        a_date=a_rec.event_date,
                        b_date=None,
                        a_location_id=a_rec.location_id,
                        b_location_id=None,
                        org_id=loc_to_org.get(a_rec.location_id),
                        a_state=a_rec.state,
                        has_discrepancy=True,
                        discrepancy_details=f"Record {identifier} exists in System A (${a_rec.total_value:,.2f}) but is completely missing from System B."
                    )
                    results_to_insert.append(res)

                    exceptions_to_insert.append(ExceptionRecord(
                        run_id=rec_run.id,
                        record_id=identifier,
                        exception_type="MISSING_RECORD",
                        severity="HIGH",
                        suggested_action="Create missing entry in System B or verify omitted transaction with operations.",
                        review_status="PENDING",
                        comments=f"Missing from System B. System A total: ${a_rec.total_value:,.2f} at {a_rec.location_id}"
                    ))
                continue

            # Case 2: Present in System B but missing in System A (Rule 5)
            if b_list and not a_list:
                missing_in_a_count += 1
                for b_rec in b_list:
                    b_v = b_rec.value or 0.0
                    total_b_val += b_v
                    res = ReconciliationResult(
                        run_id=rec_run.id,
                        record_id=identifier,
                        system_b_id=b_rec.id,
                        entry_id=b_rec.entry_id,
                        status="MISSING_IN_A",
                        match_category="UNMATCHED",
                        a_total_value=None,
                        b_value=b_rec.value,
                        difference=b_rec.value,
                        a_date=None,
                        b_date=b_rec.recorded_on,
                        a_location_id=None,
                        b_location_id=b_rec.location_id,
                        org_id=loc_to_org.get(b_rec.location_id),
                        a_state=None,
                        has_discrepancy=True,
                        discrepancy_details=f"Entry {b_rec.entry_id} (Ref: {identifier}) exists in System B (${b_v:,.2f}) but has no corresponding record in System A."
                    )
                    results_to_insert.append(res)

                    exceptions_to_insert.append(ExceptionRecord(
                        run_id=rec_run.id,
                        record_id=identifier,
                        entry_id=b_rec.entry_id,
                        exception_type="MISSING_RECORD",
                        severity="HIGH",
                        suggested_action="Investigate orphaned System B entry; book into System A or reverse unapproved entry.",
                        review_status="PENDING",
                        comments=f"Missing from System A. System B entry {b_rec.entry_id} for ${b_v:,.2f} at {b_rec.location_id}"
                    ))
                continue

            # Case 3: Present in both systems (Rule 1, 2, 3, 4, 7, 8)
            a_rec = a_list[0]
            total_a_val += a_rec.total_value

            for b_rec in b_list:
                b_v = b_rec.value or 0.0
                total_b_val += b_v

                discrepancies = []
                primary_status = "MATCHED"
                match_category = "EXACT" if (a_rec.raw_record_id == b_rec.raw_record_ref) else "SUGGESTED"

                # Rule 8: State validation (VOIDED records)
                is_voided = a_rec.state == "VOIDED"
                if is_voided:
                    voided_count += 1
                    discrepancies.append(f"System A transaction is VOIDED (System B recorded active value ${b_v:,.2f})")
                    primary_status = "VOIDED_TRANSACTION"
                    exceptions_to_insert.append(ExceptionRecord(
                        run_id=rec_run.id,
                        record_id=identifier,
                        entry_id=b_rec.entry_id,
                        exception_type="VOIDED_TX",
                        severity="HIGH",
                        suggested_action="Deactivate/Void entry in System B to prevent duplicate cash leakage.",
                        review_status="PENDING",
                        comments=f"Transaction {identifier} was voided in System A but remains active in System B."
                    ))

                # Rule 7: Data Quality check
                has_quality_issue = False
                quality_reasons = []
                if a_rec.has_quality_issue:
                    has_quality_issue = True
                    quality_reasons.append(f"System A: {a_rec.quality_notes}")
                if b_rec.has_quality_issue:
                    has_quality_issue = True
                    quality_reasons.append(f"System B: {b_rec.quality_notes}")
                if b_rec.value is None:
                    has_quality_issue = True
                    quality_reasons.append("System B value is NULL")

                if has_quality_issue:
                    quality_count += 1
                    if primary_status == "MATCHED":
                        primary_status = "QUALITY_ISSUE"
                    discrepancies.append(f"Data Quality: {'; '.join(quality_reasons)}")
                    exceptions_to_insert.append(ExceptionRecord(
                        run_id=rec_run.id,
                        record_id=identifier,
                        entry_id=b_rec.entry_id,
                        exception_type="INVALID_DATA",
                        severity="MEDIUM",
                        suggested_action="Standardize source field or backfill missing values.",
                        review_status="PENDING",
                        comments="; ".join(quality_reasons)
                    ))

                # Rule 2: Amount validation
                val_diff = None
                amt_mismatch = False
                if b_rec.value is not None:
                    val_diff = round(a_rec.total_value - b_rec.value, 2)
                    if abs(val_diff) > 0.01:
                        amt_mismatch = True
                        discrepancies.append(f"Amount mismatch: A=${a_rec.total_value:,.2f} vs B=${b_rec.value:,.2f} (Diff: ${abs(val_diff):,.2f})")
                        if primary_status in ("MATCHED", "QUALITY_ISSUE"):
                            primary_status = "AMOUNT_MISMATCH"
                        exceptions_to_insert.append(ExceptionRecord(
                            run_id=rec_run.id,
                            record_id=identifier,
                            entry_id=b_rec.entry_id,
                            exception_type="AMOUNT_MISMATCH",
                            severity="HIGH" if abs(val_diff) > 1000 else "MEDIUM",
                            suggested_action="Adjust System B booking to reflect total value (check missing adjustment/fee).",
                            review_status="PENDING",
                            comments=f"Discrepancy of ${abs(val_diff):,.2f} between System A (${a_rec.total_value:,.2f}) and System B (${b_rec.value:,.2f})."
                        ))

                # Rule 3: Location validation
                loc_mismatch = (a_rec.location_id != b_rec.location_id)
                if loc_mismatch:
                    discrepancies.append(f"Location mismatch: System A has {a_rec.location_id} while System B has {b_rec.location_id}")
                    if primary_status == "MATCHED":
                        primary_status = "LOCATION_MISMATCH"
                    exceptions_to_insert.append(ExceptionRecord(
                        run_id=rec_run.id,
                        record_id=identifier,
                        entry_id=b_rec.entry_id,
                        exception_type="LOCATION_MISMATCH",
                        severity="HIGH",
                        suggested_action=f"Reassign location code to correct organizational entity ({a_rec.location_id} vs {b_rec.location_id}).",
                        review_status="PENDING",
                        comments=f"Location conflict: {a_rec.location_id} (Org {loc_to_org.get(a_rec.location_id)}) vs {b_rec.location_id} (Org {loc_to_org.get(b_rec.location_id)})"
                    ))

                # Rule 4: Date validation
                date_mismatch = False
                days_diff = None
                try:
                    d_a = datetime.strptime(a_rec.event_date, "%Y-%m-%d")
                    d_b = datetime.strptime(b_rec.recorded_on, "%Y-%m-%d")
                    days_diff = (d_b - d_a).days
                    if days_diff != 0:
                        date_mismatch = True
                        discrepancies.append(f"Date mismatch: A recorded on {a_rec.event_date}, B recorded on {b_rec.recorded_on} ({abs(days_diff)} days apart)")
                        if primary_status == "MATCHED":
                            primary_status = "DATE_MISMATCH"
                        exceptions_to_insert.append(ExceptionRecord(
                            run_id=rec_run.id,
                            record_id=identifier,
                            entry_id=b_rec.entry_id,
                            exception_type="DATE_MISMATCH",
                            severity="LOW" if abs(days_diff) <= 2 else "MEDIUM",
                            suggested_action="Review posting timing difference across systems.",
                            review_status="PENDING",
                            comments=f"Timing variance of {abs(days_diff)} days ({a_rec.event_date} vs {b_rec.recorded_on})."
                        ))
                except Exception:
                    pass

                has_disc = len(discrepancies) > 0
                if primary_status == "MATCHED":
                    matched_count += 1
                else:
                    mismatched_count += 1

                res = ReconciliationResult(
                    run_id=rec_run.id,
                    record_id=identifier,
                    system_a_id=a_rec.id,
                    system_b_id=b_rec.id,
                    entry_id=b_rec.entry_id,
                    status=primary_status,
                    match_category=match_category,
                    a_total_value=a_rec.total_value,
                    b_value=b_rec.value,
                    difference=val_diff,
                    a_date=a_rec.event_date,
                    b_date=b_rec.recorded_on,
                    date_diff_days=days_diff,
                    a_location_id=a_rec.location_id,
                    b_location_id=b_rec.location_id,
                    org_id=loc_to_org.get(a_rec.location_id),
                    a_state=a_rec.state,
                    has_discrepancy=has_disc,
                    discrepancy_details=" | ".join(discrepancies) if discrepancies else "All validation rules passed cleanly."
                )
                results_to_insert.append(res)

        # Batch insert results and exceptions
        db.bulk_save_objects(results_to_insert)
        db.bulk_save_objects(exceptions_to_insert)

        # Update run stats
        completed_at = datetime.utcnow()
        missing_total = missing_in_b_count + missing_in_a_count
        completion_pct = round((matched_count / max(total_a, 1)) * 100, 2)
        net_diff = round(abs(total_a_val - total_b_val), 2)

        rec_run.completed_at = completed_at
        rec_run.status = "COMPLETED"
        rec_run.matched_records = matched_count
        rec_run.mismatched_records = mismatched_count
        rec_run.missing_records = missing_total
        rec_run.missing_in_b_count = missing_in_b_count
        rec_run.missing_in_a_count = missing_in_a_count
        rec_run.duplicate_records = duplicate_count
        rec_run.data_quality_issues = quality_count
        rec_run.voided_records = voided_count
        rec_run.completion_percentage = completion_pct
        rec_run.total_a_value = round(total_a_val, 2)
        rec_run.total_b_value = round(total_b_val, 2)
        rec_run.net_difference = net_diff

        db.commit()

        # Audit log
        AuditLog_entry = AuditLog(
            action="RUN_RECONCILIATION",
            entity_type="RECONCILIATION_RUN",
            entity_id=str(rec_run.id),
            user="System Auditor",
            details=f"Completed run {run_code}: {matched_count} matched, {mismatched_count} mismatched, {missing_total} missing, {duplicate_count} duplicates."
        )
        db.add(AuditLog_entry)
        db.commit()

        return {
            "run_id": rec_run.id,
            "run_code": run_code,
            "matched_records": matched_count,
            "mismatched_records": mismatched_count,
            "missing_records": missing_total,
            "duplicate_records": duplicate_count,
            "data_quality_issues": quality_count,
            "voided_records": voided_count,
            "completion_percentage": completion_pct,
            "total_a_records": total_a,
            "total_b_records": total_b,
            "total_a_value": round(total_a_val, 2),
            "total_b_value": round(total_b_val, 2),
            "net_difference": net_diff
        }

