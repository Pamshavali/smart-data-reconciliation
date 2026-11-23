from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ExceptionResponse(BaseModel):
    id: int
    run_id: Optional[int] = None
    reconciliation_result_id: Optional[int] = None
    record_id: str
    entry_id: Optional[str] = None
    exception_type: str
    severity: str
    suggested_action: Optional[str] = None
    review_status: str
    reviewer: Optional[str] = None
    comments: Optional[str] = None
    original_data: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ExceptionReviewRequest(BaseModel):
    review_status: str # APPROVED, REJECTED, RESOLVED, PENDING
    comments: Optional[str] = None
    reviewer: Optional[str] = "Admin Analyst"

