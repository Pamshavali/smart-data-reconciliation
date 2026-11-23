from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
from ..database import Base

class SystemARecord(Base):
    __tablename__ = "system_a_records"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(String(50), index=True, nullable=False) # Standardized
    raw_record_id = Column(String(50), nullable=False)
    location_id = Column(String(50), index=True, nullable=False)
    event_date = Column(String(20), index=True, nullable=False)
    category_code = Column(String(50), nullable=True)
    actor_id = Column(String(50), nullable=True) # Can be null (Row 49)
    base_value = Column(Float, nullable=False, default=0.0)
    adjustment = Column(Float, nullable=False, default=0.0)
    total_value = Column(Float, nullable=False, default=0.0)
    state = Column(String(20), nullable=False, default="CONFIRMED") # CONFIRMED, VOIDED
    upload_batch = Column(String(50), nullable=True)
    is_valid_location = Column(Boolean, default=True)
    has_quality_issue = Column(Boolean, default=False)
    quality_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class SystemBRecord(Base):
    __tablename__ = "system_b_records"

    id = Column(Integer, primary_key=True, index=True)
    entry_id = Column(String(50), unique=True, index=True, nullable=False)
    record_ref = Column(String(50), index=True, nullable=False) # Standardized
    raw_record_ref = Column(String(50), nullable=False)
    location_id = Column(String(50), index=True, nullable=False)
    recorded_on = Column(String(20), index=True, nullable=False)
    value = Column(Float, nullable=True) # Cleaned float value (None if missing/invalid)
    raw_value = Column(String(50), nullable=True) # Preserves original (e.g. '1,25,400.00')
    label = Column(String(100), nullable=True)
    upload_batch = Column(String(50), nullable=True)
    is_valid_location = Column(Boolean, default=True)
    has_quality_issue = Column(Boolean, default=False)
    quality_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

