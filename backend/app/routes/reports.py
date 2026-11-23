from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..services.reporter import ReportService

router = APIRouter(prefix="/api/reports", tags=["Reports & Export"])

@router.get("/summary")
def get_report_summary(db: Session = Depends(get_db)):
    metrics = ReportService.get_dashboard_metrics(db)
    charts = ReportService.get_chart_data(db)
    return {
        "metrics": metrics,
        "charts": charts
    }

@router.get("/export/csv")
def export_csv_report(run_id: int = Query(None), db: Session = Depends(get_db)):
    csv_buf = ReportService.export_csv(db, run_id=run_id)
    filename = f"reconciliation_report_{run_id or 'latest'}.csv"
    return StreamingResponse(
        iter([csv_buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/export/excel")
def export_excel_report(run_id: int = Query(None), db: Session = Depends(get_db)):
    excel_buf = ReportService.export_excel(db, run_id=run_id)
    filename = f"reconciliation_report_{run_id or 'latest'}.xlsx"
    return StreamingResponse(
        excel_buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

