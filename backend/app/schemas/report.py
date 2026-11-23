from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class DashboardStatsResponse(BaseModel):
    total_a_records: int
    total_b_records: int
    matched_records: int
    mismatched_records: int
    missing_records: int
    duplicate_records: int
    data_quality_issues: int
    reconciliation_completion_percentage: float
    voided_records: int
    net_difference: float
    total_a_value: float
    total_b_value: float
    last_run_date: Optional[str] = None
    has_run: bool

class ChartDataResponse(BaseModel):
    matched_vs_mismatched: Dict[str, Any]
    system_a_vs_b_count: Dict[str, Any]
    org_wise_reconciliation: Dict[str, Any]
    location_wise_reconciliation: Dict[str, Any]
    monthly_comparison: Dict[str, Any]
    quality_issues_distribution: Dict[str, Any]

