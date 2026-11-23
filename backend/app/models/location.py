from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(String(50), unique=True, index=True, nullable=False)
    org_id = Column(String(50), index=True, nullable=False)
    location_name = Column(String(150), nullable=False)
    is_active = Column(String(10), default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow)

