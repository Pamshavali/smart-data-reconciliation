from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text
from ..database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(100), nullable=False) # e.g. UPLOAD_SYSTEM_A, RUN_RECONCILIATION, APPROVE_EXCEPTION
    entity_type = Column(String(50), nullable=True) # e.g. RECONCILIATION, EXCEPTION, SYSTEM_A
    entity_id = Column(String(100), nullable=True)
    user = Column(String(50), default="system")
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

