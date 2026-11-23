import io
import os
import pandas as pd
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Location, Organization, SystemARecord, SystemBRecord
from ..services.cleaner import DataCleanerService
from ..services.audit_service import log_activity

router = APIRouter(prefix="/api/upload", tags=["Upload & Ingestion"])

@router.get("/status")
def get_upload_status(db: Session = Depends(get_db)):
    loc_count = db.query(Location).count()
    a_count = db.query(SystemARecord).count()
    b_count = db.query(SystemBRecord).count()
    
    return {
        "locations_uploaded": loc_count > 0,
        "locations_count": loc_count,
        "system_a_uploaded": a_count > 0,
        "system_a_count": a_count,
        "system_b_uploaded": b_count > 0,
        "system_b_count": b_count,
        "all_uploaded": loc_count > 0 and a_count > 0 and b_count > 0
    }

@router.post("/locations")
async def upload_locations(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")
    
    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")
    
    try:
        clean_res = DataCleanerService.clean_and_load_locations(df, db)
        
        # Clear existing locations to prevent duplication on re-upload
        db.query(Location).delete()
        db.query(Organization).delete()

        org_names = {}
        locations_to_add = []
        for r in clean_res["cleaned_records"]:
            locations_to_add.append(Location(**r))
            org_names[r["org_id"]] = f"Organization {r['org_id'][-1]}"

        for org_id, name in org_names.items():
            db.add(Organization(org_id=org_id, name=name))

        db.bulk_save_objects(locations_to_add)
        db.commit()

        log_activity(db, "UPLOAD_LOCATIONS", "LOCATION", str(len(locations_to_add)), details={"count": len(locations_to_add)})

        return {
            "status": "success",
            "message": f"Successfully ingested {len(locations_to_add)} locations across {len(org_names)} organizations.",
            "total_rows": clean_res["total"],
            "errors": clean_res["errors"]
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/system-a")
async def upload_system_a(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")
    
    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")

    try:
        clean_res = DataCleanerService.clean_and_load_system_a(df, db)
        
        # Clear existing records for clean test run
        db.query(SystemARecord).delete()

        records_to_add = [SystemARecord(**r) for r in clean_res["cleaned_records"]]
        db.bulk_save_objects(records_to_add)
        db.commit()

        log_activity(db, "UPLOAD_SYSTEM_A", "SYSTEM_A", str(len(records_to_add)), details={
            "count": len(records_to_add),
            "quality_issues": len(clean_res["quality_issues"]),
            "duplicates": len(clean_res["duplicate_ids"])
        })

        return {
            "status": "success",
            "message": f"Successfully ingested and cleaned {len(records_to_add)} System A records.",
            "total_rows": clean_res["total_rows"],
            "quality_issues_detected": len(clean_res["quality_issues"]),
            "duplicates_detected": len(clean_res["duplicate_ids"]),
            "issues": clean_res["quality_issues"][:10] # Return top 10 previews
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/system-b")
async def upload_system_b(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")
    
    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")

    try:
        clean_res = DataCleanerService.clean_and_load_system_b(df, db)
        
        db.query(SystemBRecord).delete()

        records_to_add = [SystemBRecord(**r) for r in clean_res["cleaned_records"]]
        db.bulk_save_objects(records_to_add)
        db.commit()

        log_activity(db, "UPLOAD_SYSTEM_B", "SYSTEM_B", str(len(records_to_add)), details={
            "count": len(records_to_add),
            "quality_issues": len(clean_res["quality_issues"]),
            "duplicates": len(clean_res["duplicate_refs"])
        })

        return {
            "status": "success",
            "message": f"Successfully ingested and cleaned {len(records_to_add)} System B entries.",
            "total_rows": clean_res["total_rows"],
            "quality_issues_detected": len(clean_res["quality_issues"]),
            "duplicates_detected": len(clean_res["duplicate_refs"]),
            "issues": clean_res["quality_issues"][:10]
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/load-sample-datasets")
def load_sample_datasets(db: Session = Depends(get_db)):
    """Loads the 3 bundled CSV datasets (locations, system_a, system_b) in one click."""
    data_dir = "./data" if os.path.exists("./data") else "."
    loc_path = os.path.join(data_dir, "locations.csv")
    a_path = os.path.join(data_dir, "system_a.csv")
    b_path = os.path.join(data_dir, "system_b.csv")

    if not (os.path.exists(loc_path) and os.path.exists(a_path) and os.path.exists(b_path)):
        raise HTTPException(status_code=404, detail="Sample CSV datasets not found in data directory.")

    try:
        # 1. Locations
        loc_df = pd.read_csv(loc_path)
        clean_loc = DataCleanerService.clean_and_load_locations(loc_df, db)
        db.query(Location).delete()
        db.query(Organization).delete()
        
        org_names = {}
        loc_objs = []
        for r in clean_loc["cleaned_records"]:
            loc_objs.append(Location(**r))
            org_names[r["org_id"]] = f"Organization {r['org_id'][-1]}"
        for org_id, name in org_names.items():
            db.add(Organization(org_id=org_id, name=name))
        db.bulk_save_objects(loc_objs)
        db.commit()

        # 2. System A
        a_df = pd.read_csv(a_path)
        clean_a = DataCleanerService.clean_and_load_system_a(a_df, db)
        db.query(SystemARecord).delete()
        a_objs = [SystemARecord(**r) for r in clean_a["cleaned_records"]]
        db.bulk_save_objects(a_objs)
        db.commit()

        # 3. System B
        b_df = pd.read_csv(b_path)
        clean_b = DataCleanerService.clean_and_load_system_b(b_df, db)
        db.query(SystemBRecord).delete()
        b_objs = [SystemBRecord(**r) for r in clean_b["cleaned_records"]]
        db.bulk_save_objects(b_objs)
        db.commit()

        log_activity(db, "LOAD_SAMPLE_DATASETS", "SYSTEM", "ALL", details={
            "locations": len(loc_objs),
            "system_a": len(a_objs),
            "system_b": len(b_objs)
        })

        return {
            "status": "success",
            "message": "All 3 sample datasets loaded and cleaned successfully!",
            "counts": {
                "locations": len(loc_objs),
                "system_a": len(a_objs),
                "system_b": len(b_objs)
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

