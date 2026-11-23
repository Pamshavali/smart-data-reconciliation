import math
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from ..models import ReconciliationRun, ReconciliationResult, SystemARecord, SystemBRecord
from ..schemas import (
    ReconciliationRunSummary,
    ReconciliationResultResponse,
    PaginatedResultsResponse
)
from ..services.reconciler import ReconciliationEngine
from ..services.reporter import ReportService

router = APIRouter(prefix="/api/reconciliation", tags=["Reconciliation Engine"])

@router.post("/run")
def trigger_reconciliation(notes: Optional[str] = "Standard Automated Run", db: Session = Depends(get_db)):
    a_count = db.query(SystemARecord).count()
    b_count = db.query(SystemBRecord).count()
    if a_count == 0 or b_count == 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot run reconciliation: please upload both System A and System B records first."
        )

    try:
        run_summary = ReconciliationEngine.run_reconciliation(db, run_notes=notes)
        return {
            "status": "success",
            "message": "Reconciliation completed successfully!",
            "summary": run_summary
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Reconciliation run failed: {str(e)}")

@router.get("/runs", response_model=list[ReconciliationRunSummary])
def get_reconciliation_runs(limit: int = 10, db: Session = Depends(get_db)):
    runs = db.query(ReconciliationRun).order_by(ReconciliationRun.id.desc()).limit(limit).all()
    return runs

@router.get("/summary")
def get_reconciliation_summary(db: Session = Depends(get_db)):
    metrics = ReportService.get_dashboard_metrics(db)
    return metrics

@router.get("/results", response_model=PaginatedResultsResponse)
def get_reconciliation_results(
    status: Optional[str] = None,
    location_id: Optional[str] = None,
    search: Optional[str] = None,
    match_category: Optional[str] = None,
    has_discrepancy: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db)
):
    latest_run = db.query(ReconciliationRun).order_by(ReconciliationRun.id.desc()).first()
    if not latest_run:
        return {
            "total": 0,
            "page": page,
            "page_size": page_size,
            "total_pages": 1,
            "items": [],
            "metrics": {}
        }

    query = db.query(ReconciliationResult).filter(ReconciliationResult.run_id == latest_run.id)

    if status and status.upper() != "ALL":
        query = query.filter(ReconciliationResult.status == status.strip().upper())

    if match_category and match_category.upper() != "ALL":
        query = query.filter(ReconciliationResult.match_category == match_category.strip().upper())

    if location_id and location_id.upper() != "ALL":
        loc = location_id.strip()
        query = query.filter(
            or_(
                ReconciliationResult.a_location_id == loc,
                ReconciliationResult.b_location_id == loc
            )
        )

    if has_discrepancy is not None:
        query = query.filter(ReconciliationResult.has_discrepancy == has_discrepancy)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                ReconciliationResult.record_id.ilike(term),
                ReconciliationResult.entry_id.ilike(term),
                ReconciliationResult.discrepancy_details.ilike(term)
            )
        )

    total = query.count()
    items = query.order_by(ReconciliationResult.has_discrepancy.desc(), ReconciliationResult.id.asc()).offset((page - 1) * page_size).limit(page_size).all()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "items": items,
        "metrics": {
            "matched": latest_run.matched_records,
            "mismatched": latest_run.mismatched_records,
            "missing": latest_run.missing_records,
            "duplicates": latest_run.duplicate_records,
            "voided": latest_run.voided_records,
            "completion_pct": latest_run.completion_percentage
        }
    }

