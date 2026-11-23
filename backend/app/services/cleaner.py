import pandas as pd
import numpy as np
import re
from typing import Tuple, List, Dict, Any, Set
from sqlalchemy.orm import Session
from ..models import Location, SystemARecord, SystemBRecord
from ..utils.validators import standardize_identifier, parse_numeric, parse_date, validate_location

class DataCleanerService:
    @staticmethod
    def get_valid_locations(db: Session) -> Set[str]:
        locations = db.query(Location.location_id).all()
        return {loc[0].strip().upper() for loc in locations}

    @classmethod
    def clean_and_load_locations(cls, df: pd.DataFrame, db: Session) -> Dict[str, Any]:
        """Validate and clean locations.csv."""
        required = {'location_id', 'org_id', 'location_name'}
        missing = required - set(df.columns)
        if missing:
            raise ValueError(f"Missing required columns in locations.csv: {', '.join(missing)}")

        cleaned_records = []
        errors = []

        for idx, row in df.iterrows():
            loc_id = str(row['location_id']).strip().upper() if pd.notna(row['location_id']) else ""
            org_id = str(row['org_id']).strip().upper() if pd.notna(row['org_id']) else ""
            name = str(row['location_name']).strip() if pd.notna(row['location_name']) else ""

            if not loc_id:
                errors.append(f"Row {idx+1}: Missing location_id")
                continue

            cleaned_records.append({
                "location_id": loc_id,
                "org_id": org_id,
                "location_name": name,
                "is_active": "ACTIVE"
            })

        return {"cleaned_records": cleaned_records, "errors": errors, "total": len(df)}

    @classmethod
    def clean_and_load_system_a(cls, df: pd.DataFrame, db: Session, batch_id: str = "DEFAULT") -> Dict[str, Any]:
        """
        Clean, standardize, and validate System A records:
        Columns: record_id, location_id, event_date, category_code, actor_id, base_value, adjustment, total_value, state
        """
        required = {'record_id', 'location_id', 'event_date', 'total_value'}
        missing = required - set(df.columns)
        if missing:
            raise ValueError(f"Missing required columns in system_a.csv: {', '.join(missing)}")

        valid_locs = cls.get_valid_locations(db)
        cleaned_records = []
        quality_issues = []
        duplicate_ids = set()

        seen_ids = set()
        for idx, row in df.iterrows():
            raw_id = str(row['record_id']) if pd.notna(row['record_id']) else ""
            std_id, id_malformed, id_msg = standardize_identifier(raw_id)
            
            # Duplicate check
            is_duplicate = std_id in seen_ids
            if is_duplicate:
                duplicate_ids.add(std_id)
            seen_ids.add(std_id)

            raw_loc = str(row['location_id']).strip().upper() if pd.notna(row['location_id']) else ""
            is_valid_loc, loc_msg = validate_location(raw_loc, valid_locs)

            raw_date = row.get('event_date')
            iso_date, date_malformed, date_msg = parse_date(raw_date)

            cat_code = str(row.get('category_code', '')).strip() if pd.notna(row.get('category_code')) else ""
            
            # Actor ID check (Row 49 has null actor_id)
            raw_actor = row.get('actor_id')
            actor_id = str(raw_actor).strip() if (pd.notna(raw_actor) and str(raw_actor).strip().lower() not in ('nan', 'none', '')) else None
            actor_issue = actor_id is None

            base_val, base_issue, base_msg = parse_numeric(row.get('base_value', 0.0))
            adj_val, adj_issue, adj_msg = parse_numeric(row.get('adjustment', 0.0))
            tot_val, tot_issue, tot_msg = parse_numeric(row.get('total_value', 0.0))

            raw_state = str(row.get('state', 'CONFIRMED')).strip().upper()
            state = "VOIDED" if "VOID" in raw_state else "CONFIRMED"

            # Accumulate quality issues
            issues = []
            if id_malformed and id_msg:
                issues.append(id_msg)
            if not is_valid_loc:
                issues.append(loc_msg)
            if date_malformed and date_msg:
                issues.append(date_msg)
            if actor_issue:
                issues.append("Missing actor_id (audit identifier null)")
            if tot_issue and tot_msg:
                issues.append(tot_msg)
            if state == "VOIDED":
                issues.append("Transaction marked as VOIDED in System A")
            if is_duplicate:
                issues.append(f"Duplicate record_id {std_id} found in System A")

            has_issue = len(issues) > 0
            notes_str = "; ".join(issues) if issues else None

            if has_issue:
                quality_issues.append({
                    "record_id": std_id,
                    "issues": issues,
                    "row_index": idx + 1
                })

            cleaned_records.append({
                "record_id": std_id,
                "raw_record_id": raw_id,
                "location_id": raw_loc,
                "event_date": iso_date or str(raw_date),
                "category_code": cat_code,
                "actor_id": actor_id,
                "base_value": base_val or 0.0,
                "adjustment": adj_val or 0.0,
                "total_value": tot_val or 0.0,
                "state": state,
                "upload_batch": batch_id,
                "is_valid_location": is_valid_loc,
                "has_quality_issue": has_issue,
                "quality_notes": notes_str
            })

        return {
            "cleaned_records": cleaned_records,
            "quality_issues": quality_issues,
            "duplicate_ids": list(duplicate_ids),
            "total_rows": len(df)
        }

    @classmethod
    def clean_and_load_system_b(cls, df: pd.DataFrame, db: Session, batch_id: str = "DEFAULT") -> Dict[str, Any]:
        """
        Clean, standardize, and validate System B records:
        Columns: entry_id, record_ref, location_id, recorded_on, value, label
        """
        required = {'entry_id', 'record_ref', 'location_id', 'recorded_on'}
        missing = required - set(df.columns)
        if missing:
            raise ValueError(f"Missing required columns in system_b.csv: {', '.join(missing)}")

        valid_locs = cls.get_valid_locations(db)
        cleaned_records = []
        quality_issues = []
        seen_refs = {}
        duplicates = []

        for idx, row in df.iterrows():
            entry_id = str(row['entry_id']).strip() if pd.notna(row['entry_id']) else f"ENT-UNKNOWN-{idx+1}"
            raw_ref = str(row['record_ref']) if pd.notna(row['record_ref']) else ""
            
            # Standardization of REC-1001, rec1034, ' REC - 1070 ', 1112
            std_ref, ref_malformed, ref_msg = standardize_identifier(raw_ref)

            # Track duplicate record_refs in System B
            if std_ref in seen_refs:
                duplicates.append({
                    "record_ref": std_ref,
                    "current_entry": entry_id,
                    "previous_entry": seen_refs[std_ref]
                })
            seen_refs[std_ref] = entry_id

            raw_loc = str(row['location_id']).strip().upper() if pd.notna(row['location_id']) else ""
            is_valid_loc, loc_msg = validate_location(raw_loc, valid_locs)

            raw_date = row.get('recorded_on')
            iso_date, date_malformed, date_msg = parse_date(raw_date)

            raw_val = row.get('value')
            clean_val, val_issue, val_msg = parse_numeric(raw_val)

            label = str(row.get('label', '')).strip() if pd.notna(row.get('label')) else ""

            # Accumulate quality notes
            issues = []
            if ref_malformed and ref_msg:
                issues.append(ref_msg)
            if not is_valid_loc:
                issues.append(loc_msg)
            if date_malformed and date_msg:
                issues.append(date_msg)
            if val_issue and val_msg:
                issues.append(val_msg)
            if "part 2 of 2" in label.lower():
                issues.append("Multipart entry detected (split transaction)")

            has_issue = len(issues) > 0
            notes_str = "; ".join(issues) if issues else None

            if has_issue:
                quality_issues.append({
                    "entry_id": entry_id,
                    "record_ref": std_ref,
                    "issues": issues,
                    "row_index": idx + 1
                })

            cleaned_records.append({
                "entry_id": entry_id,
                "record_ref": std_ref,
                "raw_record_ref": raw_ref,
                "location_id": raw_loc,
                "recorded_on": iso_date or str(raw_date),
                "value": clean_val,
                "raw_value": str(raw_val) if pd.notna(raw_val) else None,
                "label": label,
                "upload_batch": batch_id,
                "is_valid_location": is_valid_loc,
                "has_quality_issue": has_issue,
                "quality_notes": notes_str
            })

        return {
            "cleaned_records": cleaned_records,
            "quality_issues": quality_issues,
            "duplicate_refs": duplicates,
            "total_rows": len(df)
        }

