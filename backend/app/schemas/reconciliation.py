from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ReconciliationRunSummary(BaseModel):
    id: int
    run_code: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    status: str
    total_a_records: int
    total_b_records: int
    matched_records: int
    mismatched_records: int
    missing_records: int
    missing_in_b_count: int
    missing_in_a_count: int
    duplicate_records: int
    data_quality_issues: int
    voided_records: int
    completion_percentage: float
    total_a_value: float
    total_b_value: float
    net_difference: float
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class ReconciliationResultResponse(BaseModel):
    id: int
    run_id: Optional[int] = None
    record_id: str
    entry_id: Optional[str] = None
    status: str
    match_category: str
    a_total_value: Optional[float] = None
    b_value: Optional[float] = None
    difference: Optional[float] = None
    a_date: Optional[str] = None
    b_date: Optional[str] = None
    date_diff_days: Optional[int] = None
    a_location_id: Optional[str] = None
    b_location_id: Optional[str] = None
    org_id: Optional[str] = None
    a_state: Optional[str] = None
    discrepancy_details: Optional[str] = None
    has_discrepancy: bool

    class Config:
        from_attributes = True

class PaginatedResultsResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: List[ReconciliationResultResponse]
    metrics: dict

