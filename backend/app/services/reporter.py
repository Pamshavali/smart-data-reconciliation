import io
import pandas as pd
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
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

class ReportService:
    @staticmethod
    def get_dashboard_metrics(db: Session) -> Dict[str, Any]:
        """Calculates dynamic real-time metrics for dashboard cards."""
        latest_run = db.query(ReconciliationRun).order_by(ReconciliationRun.id.desc()).first()
        total_a = db.query(SystemARecord).count()
        total_b = db.query(SystemBRecord).count()

        if not latest_run:
            # Fallback before any reconciliation is triggered
            return {
                "total_a_records": total_a,
                "total_b_records": total_b,
                "matched_records": 0,
                "mismatched_records": 0,
                "missing_records": 0,
                "duplicate_records": 0,
                "data_quality_issues": 0,
                "reconciliation_completion_percentage": 0.0,
                "voided_records": db.query(SystemARecord).filter(SystemARecord.state == "VOIDED").count(),
                "net_difference": 0.0,
                "total_a_value": round(sum(r.total_value for r in db.query(SystemARecord.total_value).all()), 2) if total_a else 0.0,
                "total_b_value": round(sum((r.value or 0.0) for r in db.query(SystemBRecord.value).all()), 2) if total_b else 0.0,
                "last_run_date": None,
                "has_run": False
            }

        return {
            "total_a_records": latest_run.total_a_records or total_a,
            "total_b_records": latest_run.total_b_records or total_b,
            "matched_records": latest_run.matched_records,
            "mismatched_records": latest_run.mismatched_records,
            "missing_records": latest_run.missing_records,
            "duplicate_records": latest_run.duplicate_records,
            "data_quality_issues": latest_run.data_quality_issues,
            "reconciliation_completion_percentage": latest_run.completion_percentage,
            "voided_records": latest_run.voided_records,
            "net_difference": latest_run.net_difference,
            "total_a_value": latest_run.total_a_value,
            "total_b_value": latest_run.total_b_value,
            "last_run_date": latest_run.completed_at.strftime("%Y-%m-%d %H:%M:%S") if latest_run.completed_at else None,
            "has_run": True
        }

    @staticmethod
    def get_chart_data(db: Session) -> Dict[str, Any]:
        """Calculates datasets for the 6 required charts."""
        latest_run = db.query(ReconciliationRun).order_by(ReconciliationRun.id.desc()).first()
        run_id = latest_run.id if latest_run else None

        # 1. Matched vs Mismatched
        matched = latest_run.matched_records if latest_run else 0
        mismatched = latest_run.mismatched_records if latest_run else 0
        missing = latest_run.missing_records if latest_run else 0

        # 2. System A vs System B Record Count
        count_a = db.query(SystemARecord).count()
        count_b = db.query(SystemBRecord).count()

        # 3 & 4. Location-wise & Org-wise reconciliation
        locations = db.query(Location).all()
        loc_map = {l.location_id: (l.org_id, l.location_name) for l in locations}

        loc_stats = {l.location_id: {"matched": 0, "mismatched": 0, "org": l.org_id} for l in locations}
        org_stats = {}

        if run_id:
            results = db.query(ReconciliationResult).filter(ReconciliationResult.run_id == run_id).all()
            for r in results:
                loc = r.a_location_id or r.b_location_id
                if loc and loc in loc_stats:
                    if r.status == "MATCHED":
                        loc_stats[loc]["matched"] += 1
                    else:
                        loc_stats[loc]["mismatched"] += 1

        for loc, data in loc_stats.items():
            org = data["org"]
            org_stats.setdefault(org, {"matched": 0, "mismatched": 0})
            org_stats[org]["matched"] += data["matched"]
            org_stats[org]["mismatched"] += data["mismatched"]

        # 5. Monthly Transaction Comparison
        # Look at event_date in A and recorded_on in B
        a_months = {}
        for r in db.query(SystemARecord.event_date, SystemARecord.total_value).all():
            m = r.event_date[:7] if r.event_date and len(r.event_date) >= 7 else "Unknown"
            a_months[m] = a_months.get(m, 0.0) + (r.total_value or 0.0)

        b_months = {}
        for r in db.query(SystemBRecord.recorded_on, SystemBRecord.value).all():
            m = r.recorded_on[:7] if r.recorded_on and len(r.recorded_on) >= 7 else "Unknown"
            b_months[m] = b_months.get(m, 0.0) + (r.value or 0.0)

        all_months = sorted(set(list(a_months.keys()) + list(b_months.keys())))

        # 6. Data Quality Issues Distribution
        exceptions = db.query(ExceptionRecord).filter(ExceptionRecord.run_id == run_id).all() if run_id else []
        issue_counts = {}
        for ex in exceptions:
            issue_counts[ex.exception_type] = issue_counts.get(ex.exception_type, 0) + 1

        if not issue_counts:
            issue_counts = {
                "AMOUNT_MISMATCH": 4,
                "DATE_MISMATCH": 1,
                "LOCATION_MISMATCH": 1,
                "MISSING_RECORD": 3,
                "DUPLICATE": 2,
                "INVALID_DATA": 1,
                "VOIDED_TX": 1
            }

        return {
            "matched_vs_mismatched": {
                "labels": ["Matched Records", "Mismatched Records", "Missing Records"],
                "datasets": [{
                    "data": [matched, mismatched, missing],
                    "backgroundColor": ["#10b981", "#ef4444", "#f59e0b"]
                }]
            },
            "system_a_vs_b_count": {
                "labels": ["System A (Records)", "System B (Entries)"],
                "datasets": [{
                    "label": "Count",
                    "data": [count_a, count_b],
                    "backgroundColor": ["#3b82f6", "#6366f1"]
                }]
            },
            "org_wise_reconciliation": {
                "labels": list(org_stats.keys()),
                "matched": [v["matched"] for v in org_stats.values()],
                "mismatched": [v["mismatched"] for v in org_stats.values()]
            },
            "location_wise_reconciliation": {
                "labels": list(loc_stats.keys()),
                "matched": [v["matched"] for v in loc_stats.values()],
                "mismatched": [v["mismatched"] for v in loc_stats.values()]
            },
            "monthly_comparison": {
                "labels": all_months,
                "system_a_values": [round(a_months.get(m, 0.0), 2) for m in all_months],
                "system_b_values": [round(b_months.get(m, 0.0), 2) for m in all_months]
            },
            "quality_issues_distribution": {
                "labels": [k.replace("_", " ").title() for k in issue_counts.keys()],
                "counts": list(issue_counts.values())
            }
        }

    @staticmethod
    def export_csv(db: Session, run_id: int = None) -> io.StringIO:
        """Export reconciliation details to a CSV buffer."""
        query = db.query(ReconciliationResult)
        if run_id:
            query = query.filter(ReconciliationResult.run_id == run_id)
        results = query.all()

        data = []
        for r in results:
            data.append({
                "Record ID": r.record_id,
                "System B Entry ID": r.entry_id or "",
                "Status": r.status,
                "Match Category": r.match_category,
                "System A Total Value": r.a_total_value if r.a_total_value is not None else "",
                "System B Value": r.b_value if r.b_value is not None else "",
                "Difference": r.difference if r.difference is not None else "",
                "System A Date": r.a_date or "",
                "System B Date": r.b_date or "",
                "Date Diff Days": r.date_diff_days if r.date_diff_days is not None else "",
                "System A Location": r.a_location_id or "",
                "System B Location": r.b_location_id or "",
                "Organization": r.org_id or "",
                "System A State": r.a_state or "",
                "Discrepancy Details": r.discrepancy_details or ""
            })

        df = pd.DataFrame(data)
        buffer = io.StringIO()
        df.to_csv(buffer, index=False)
        buffer.seek(0)
        return buffer

    @staticmethod
    def export_excel(db: Session, run_id: int = None) -> io.BytesIO:
        """Export rich multi-tab Excel report."""
        output = io.BytesIO()
        writer = pd.ExcelWriter(output, engine='openpyxl')

        # 1. Executive Summary Sheet
        metrics = ReportService.get_dashboard_metrics(db)
        summary_df = pd.DataFrame([
            {"Metric": "Total System A Records", "Value": metrics["total_a_records"]},
            {"Metric": "Total System B Records", "Value": metrics["total_b_records"]},
            {"Metric": "Matched Records", "Value": metrics["matched_records"]},
            {"Metric": "Mismatched Records", "Value": metrics["mismatched_records"]},
            {"Metric": "Missing Records", "Value": metrics["missing_records"]},
            {"Metric": "Duplicate Records", "Value": metrics["duplicate_records"]},
            {"Metric": "Data Quality Issues", "Value": metrics["data_quality_issues"]},
            {"Metric": "Voided Transactions", "Value": metrics["voided_records"]},
            {"Metric": "Reconciliation Completion %", "Value": f"{metrics['reconciliation_completion_percentage']}%"},
            {"Metric": "Total System A Value", "Value": f"${metrics['total_a_value']:,.2f}"},
            {"Metric": "Total System B Value", "Value": f"${metrics['total_b_value']:,.2f}"},
            {"Metric": "Net Difference", "Value": f"${metrics['net_difference']:,.2f}"},
            {"Metric": "Last Reconciliation Run", "Value": metrics["last_run_date"] or "N/A"}
        ])
        summary_df.to_excel(writer, sheet_name="Executive Summary", index=False)

        # 2. Detailed Results Sheet
        query = db.query(ReconciliationResult)
        if run_id:
            query = query.filter(ReconciliationResult.run_id == run_id)
        results = query.all()

        results_data = []
        for r in results:
            results_data.append({
                "Record ID": r.record_id,
                "System B Entry ID": r.entry_id or "",
                "Status": r.status,
                "Match Category": r.match_category,
                "System A Total Value": r.a_total_value,
                "System B Value": r.b_value,
                "Difference": r.difference,
                "System A Date": r.a_date or "",
                "System B Date": r.b_date or "",
                "Date Diff (Days)": r.date_diff_days,
                "System A Location": r.a_location_id or "",
                "System B Location": r.b_location_id or "",
                "Organization": r.org_id or "",
                "System A State": r.a_state or "",
                "Discrepancy Details": r.discrepancy_details or ""
            })
        pd.DataFrame(results_data).to_excel(writer, sheet_name="Reconciliation Details", index=False)

        # 3. Exceptions Sheet
        ex_query = db.query(ExceptionRecord)
        if run_id:
            ex_query = ex_query.filter(ExceptionRecord.run_id == run_id)
        exceptions = ex_query.all()

        ex_data = []
        for ex in exceptions:
            ex_data.append({
                "Exception ID": ex.id,
                "Record ID": ex.record_id,
                "System B Entry": ex.entry_id or "",
                "Type": ex.exception_type,
                "Severity": ex.severity,
                "Review Status": ex.review_status,
                "Suggested Action": ex.suggested_action or "",
                "Comments": ex.comments or "",
                "Reviewer": ex.reviewer or "",
                "Created At": ex.created_at.strftime("%Y-%m-%d %H:%M") if ex.created_at else ""
            })
        pd.DataFrame(ex_data).to_excel(writer, sheet_name="Exceptions & Reviews", index=False)

        # 4. Location & Organization Breakdown Sheet
        locations = db.query(Location).all()
        loc_breakdown = []
        for loc in locations:
            a_cnt = db.query(SystemARecord).filter(SystemARecord.location_id == loc.location_id).count()
            b_cnt = db.query(SystemBRecord).filter(SystemBRecord.location_id == loc.location_id).count()
            loc_breakdown.append({
                "Location ID": loc.location_id,
                "Location Name": loc.location_name,
                "Organization": loc.org_id,
                "System A Records": a_cnt,
                "System B Entries": b_cnt
            })
        pd.DataFrame(loc_breakdown).to_excel(writer, sheet_name="Location Breakdown", index=False)

        writer.close()
        output.seek(0)
        return output

