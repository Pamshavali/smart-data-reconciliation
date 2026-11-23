from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import ExceptionRecord, ReconciliationRun
from ..schemas import ExceptionResponse, ExceptionReviewRequest
from ..services.audit_service import log_activity

router = APIRouter(prefix="/api/exceptions", tags=["Exception Management"])

@router.get("", response_model=List[ExceptionResponse])
def get_exceptions(
    review_status: Optional[str] = None,
    exception_type: Optional[str] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db)
):
    latest_run = db.query(ReconciliationRun).order_by(ReconciliationRun.id.desc()).first()
    query = db.query(ExceptionRecord)
    if latest_run:
        query = query.filter(ExceptionRecord.run_id == latest_run.id)

    if review_status and review_status.upper() != "ALL":
        query = query.filter(ExceptionRecord.review_status == review_status.strip().upper())

    if exception_type and exception_type.upper() != "ALL":
        query = query.filter(ExceptionRecord.exception_type == exception_type.strip().upper())

    if severity and severity.upper() != "ALL":
        query = query.filter(ExceptionRecord.severity == severity.strip().upper())

    return query.order_by(ExceptionRecord.id.asc()).all()

@router.get("/stats")
def get_exception_stats(db: Session = Depends(get_db)):
    latest_run = db.query(ReconciliationRun).order_by(ReconciliationRun.id.desc()).first()
    query = db.query(ExceptionRecord)
    if latest_run:
        query = query.filter(ExceptionRecord.run_id == latest_run.id)

    all_ex = query.all()
    pending = sum(1 for e in all_ex if e.review_status == "PENDING")
    approved = sum(1 for e in all_ex if e.review_status == "APPROVED")
    rejected = sum(1 for e in all_ex if e.review_status == "REJECTED")
    resolved = sum(1 for e in all_ex if e.review_status == "RESOLVED")

    return {
        "total": len(all_ex),
        "pending": pending,
        "approved": approved,
        "rejected": rejected,
        "resolved": resolved
    }

@router.post("/{exception_id}/review", response_model=ExceptionResponse)
def review_exception(
    exception_id: int,
    payload: ExceptionReviewRequest,
    db: Session = Depends(get_db)
):
    ex = db.query(ExceptionRecord).filter(ExceptionRecord.id == exception_id).first()
    if not ex:
        raise HTTPException(status_code=404, detail="Exception record not found")

    status_normalized = payload.review_status.strip().upper()
    if status_normalized not in ("APPROVED", "REJECTED", "RESOLVED", "PENDING"):
        raise HTTPException(status_code=400, detail="Invalid review status")

    ex.review_status = status_normalized
    if payload.comments:
        ex.comments = payload.comments
    ex.reviewer = payload.reviewer or "Compliance Officer"

    db.commit()
    db.refresh(ex)

    log_activity(
        db,
        action=f"EXCEPTION_{status_normalized}",
        entity_type="EXCEPTION",
        entity_id=str(ex.id),
        user=ex.reviewer,
        details={
            "record_id": ex.record_id,
            "exception_type": ex.exception_type,
            "status": status_normalized,
            "comments": payload.comments
        }
    )

    return ex

