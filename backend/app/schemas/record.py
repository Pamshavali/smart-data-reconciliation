from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class LocationResponse(BaseModel):
    id: int
    location_id: str
    org_id: str
    location_name: str
    is_active: str

    class Config:
        from_attributes = True

class SystemARecordResponse(BaseModel):
    id: int
    record_id: str
    raw_record_id: str
    location_id: str
    event_date: str
    category_code: Optional[str] = None
    actor_id: Optional[str] = None
    base_value: float
    adjustment: float
    total_value: float
    state: str
    is_valid_location: bool
    has_quality_issue: bool
    quality_notes: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SystemBRecordResponse(BaseModel):
    id: int
    entry_id: str
    record_ref: str
    raw_record_ref: str
    location_id: str
    recorded_on: str
    value: Optional[float] = None
    raw_value: Optional[str] = None
    label: Optional[str] = None
    is_valid_location: bool
    has_quality_issue: bool
    quality_notes: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PaginatedRecordsResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: list

