from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from ..models import SystemARecord, SystemBRecord, Location
from ..schemas import (
    SystemARecordResponse,
    SystemBRecordResponse,
    LocationResponse,
    PaginatedRecordsResponse
)

router = APIRouter(prefix="/api/records", tags=["Records Explorer"])

@router.get("/locations", response_model=list[LocationResponse])
def get_locations(db: Session = Depends(get_db)):
    return db.query(Location).all()

@router.get("/system-a", response_model=PaginatedRecordsResponse)
def get_system_a_records(
    search: Optional[str] = None,
    location_id: Optional[str] = None,
    state: Optional[str] = None,
    quality_issue: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(SystemARecord)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                SystemARecord.record_id.ilike(term),
                SystemARecord.raw_record_id.ilike(term),
                SystemARecord.actor_id.ilike(term),
                SystemARecord.category_code.ilike(term)
            )
        )

    if location_id:
        query = query.filter(SystemARecord.location_id == location_id.strip())

    if state:
        query = query.filter(SystemARecord.state == state.strip())

    if quality_issue is not None:
        query = query.filter(SystemARecord.has_quality_issue == quality_issue)

    total = query.count()
    items = query.order_by(SystemARecord.id.asc()).offset((page - 1) * page_size).limit(page_size).all()
    
    import math
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "items": [SystemARecordResponse.model_validate(item).model_dump() for item in items]
    }

@router.get("/system-b", response_model=PaginatedRecordsResponse)
def get_system_b_records(
    search: Optional[str] = None,
    location_id: Optional[str] = None,
    quality_issue: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(SystemBRecord)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                SystemBRecord.entry_id.ilike(term),
                SystemBRecord.record_ref.ilike(term),
                SystemBRecord.raw_record_ref.ilike(term),
                SystemBRecord.label.ilike(term)
            )
        )

    if location_id:
        query = query.filter(SystemBRecord.location_id == location_id.strip())

    if quality_issue is not None:
        query = query.filter(SystemBRecord.has_quality_issue == quality_issue)

    total = query.count()
    items = query.order_by(SystemBRecord.id.asc()).offset((page - 1) * page_size).limit(page_size).all()
    
    import math
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "items": [SystemBRecordResponse.model_validate(item).model_dump() for item in items]
    }
