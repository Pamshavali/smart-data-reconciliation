from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base

class ReconciliationRun(Base):
    __tablename__ = "reconciliation_runs"

    id = Column(Integer, primary_key=True, index=True)
    run_code = Column(String(50), unique=True, index=True, nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String(20), default="COMPLETED") # RUNNING, COMPLETED, FAILED
    
    total_a_records = Column(Integer, default=0)
    total_b_records = Column(Integer, default=0)
    matched_records = Column(Integer, default=0)
    mismatched_records = Column(Integer, default=0)
    missing_records = Column(Integer, default=0) # Total missing (missing in B + missing in A)
    missing_in_b_count = Column(Integer, default=0)
    missing_in_a_count = Column(Integer, default=0)
    duplicate_records = Column(Integer, default=0)
    data_quality_issues = Column(Integer, default=0)
    voided_records = Column(Integer, default=0)
    completion_percentage = Column(Float, default=0.0)
    
    total_a_value = Column(Float, default=0.0)
    total_b_value = Column(Float, default=0.0)
    net_difference = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)

class ReconciliationResult(Base):
    __tablename__ = "reconciliation_results"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("reconciliation_runs.id"), index=True, nullable=True)
    record_id = Column(String(50), index=True, nullable=False)
    system_a_id = Column(Integer, ForeignKey("system_a_records.id"), nullable=True)
    system_b_id = Column(Integer, ForeignKey("system_b_records.id"), nullable=True)
    entry_id = Column(String(50), nullable=True) # From System B
    
    status = Column(String(50), index=True, nullable=False) 
    # MATCHED, AMOUNT_MISMATCH, DATE_MISMATCH, LOCATION_MISMATCH, MISSING_IN_B, MISSING_IN_A, DUPLICATE_ENTRY, VOIDED_TRANSACTION, QUALITY_ISSUE
    
    match_category = Column(String(30), default="EXACT") # EXACT, SUGGESTED, MANUAL, UNMATCHED
    
    # Financial details
    a_total_value = Column(Float, nullable=True)
    b_value = Column(Float, nullable=True)
    difference = Column(Float, nullable=True)
    
    # Date details
    a_date = Column(String(20), nullable=True)
    b_date = Column(String(20), nullable=True)
    date_diff_days = Column(Integer, nullable=True)
    
    # Location details
    a_location_id = Column(String(50), nullable=True)
    b_location_id = Column(String(50), nullable=True)
    org_id = Column(String(50), nullable=True)
    
    # State details
    a_state = Column(String(20), nullable=True)
    
    discrepancy_details = Column(Text, nullable=True)
    has_discrepancy = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class ExceptionRecord(Base):
    __tablename__ = "exceptions"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("reconciliation_runs.id"), nullable=True)
    reconciliation_result_id = Column(Integer, ForeignKey("reconciliation_results.id"), nullable=True)
    record_id = Column(String(50), index=True, nullable=False)
    entry_id = Column(String(50), nullable=True)
    
    exception_type = Column(String(50), index=True, nullable=False)
    # AMOUNT_MISMATCH, DATE_MISMATCH, LOCATION_MISMATCH, MISSING_RECORD, DUPLICATE, INVALID_DATA, VOIDED_TX, MALFORMED_IDENTIFIER
    
    severity = Column(String(20), default="MEDIUM") # HIGH, MEDIUM, LOW
    suggested_action = Column(Text, nullable=True)
    
    review_status = Column(String(30), default="PENDING", index=True) # PENDING, APPROVED, REJECTED, RESOLVED
    reviewer = Column(String(50), nullable=True)
    comments = Column(Text, nullable=True)
    original_data = Column(Text, nullable=True) # JSON snapshot of affected record(s)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

