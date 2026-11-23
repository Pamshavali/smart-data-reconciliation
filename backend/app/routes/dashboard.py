from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import AuditLog
from ..schemas import DashboardStatsResponse, ChartDataResponse
from ..services.reporter import ReportService

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard Analytics"])

@router.get("/summary", response_model=DashboardStatsResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    return ReportService.get_dashboard_metrics(db)

@router.get("/charts", response_model=ChartDataResponse)
def get_dashboard_charts(db: Session = Depends(get_db)):
    return ReportService.get_chart_data(db)

@router.get("/recent-activity")
def get_recent_activity(limit: int = 10, db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.id.desc()).limit(limit).all()
    return [{
        "id": l.id,
        "action": l.action,
        "entity_type": l.entity_type,
        "entity_id": l.entity_id,
        "user": l.user,
        "details": l.details,
        "timestamp": l.timestamp.strftime("%Y-%m-%d %H:%M:%S") if l.timestamp else ""
    } for l in logs]

