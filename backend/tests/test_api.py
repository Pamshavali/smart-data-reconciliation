import unittest
from backend.app.database import SessionLocal
from backend.app.routes.auth import login, get_current_user
from backend.app.routes.dashboard import get_dashboard_summary, get_dashboard_charts, get_recent_activity
from backend.app.routes.records import get_system_a_records, get_system_b_records, get_locations
from backend.app.routes.reconciliation import get_reconciliation_results, trigger_reconciliation
from backend.app.routes.exceptions import get_exceptions, review_exception
from backend.app.schemas.auth import LoginRequest
from backend.app.schemas.exception import ExceptionReviewRequest

class TestAPIEndpoints(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_auth_login(self):
        req = LoginRequest(username="admin", password="admin123")
        res = login(req, self.db)
        self.assertIn("access_token", res)
        self.assertEqual(res["user"]["username"], "admin")

    def test_dashboard_summary_and_charts(self):
        summary = get_dashboard_summary(self.db)
        self.assertGreater(summary["total_a_records"], 0)
        self.assertGreater(summary["matched_records"], 0)

        charts = get_dashboard_charts(self.db)
        self.assertIn("matched_vs_mismatched", charts)
        self.assertIn("org_wise_reconciliation", charts)

    def test_records_explorer(self):
        res_a = get_system_a_records(page=1, page_size=5, db=self.db)
        self.assertGreater(res_a["total"], 0)
        self.assertEqual(len(res_a["items"]), 5)

        res_b = get_system_b_records(page=1, page_size=5, db=self.db)
        self.assertGreater(res_b["total"], 0)
        self.assertEqual(len(res_b["items"]), 5)

    def test_reconciliation_results(self):
        results = get_reconciliation_results(page=1, page_size=10, db=self.db)
        self.assertGreater(results["total"], 0)
        self.assertIn("metrics", results)

    def test_exception_review(self):
        exceptions = get_exceptions(db=self.db)
        self.assertGreater(len(exceptions), 0)
        ex = exceptions[0]
        
        req = ExceptionReviewRequest(
            review_status="APPROVED",
            comments="Verified in automated test.",
            reviewer="Lead Auditor"
        )
        updated = review_exception(ex.id, req, self.db)
        self.assertEqual(updated.review_status, "APPROVED")

if __name__ == "__main__":
    unittest.main()
