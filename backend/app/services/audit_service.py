import json
from sqlalchemy.orm import Session
from ..models import AuditLog

def log_activity(
    db: Session,
    action: str,
    entity_type: str = None,
    entity_id: str = None,
    user: str = "Admin Analyst",
    details: dict = None,
    ip_address: str = "127.0.0.1"
):
    """Record an audit trail event."""
    try:
        details_str = json.dumps(details) if isinstance(details, dict) else str(details or "")
        audit = AuditLog(
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id else None,
            user=user,
            details=details_str,
            ip_address=ip_address
        )
        db.add(audit)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Failed to write audit log: {e}")

