import unittest
import pandas as pd
from backend.app.database import SessionLocal, Base, engine
from backend.app.models import User, Location, Organization, SystemARecord, SystemBRecord, ReconciliationRun
from backend.app.services.cleaner import DataCleanerService
from backend.app.services.reconciler import ReconciliationEngine
from backend.app.services.reporter import ReportService
from backend.app.utils.validators import standardize_identifier, parse_numeric

class TestReconciliationSystem(unittest.TestCase):
    def setUp(self):
        Base.metadata.create_all(bind=engine)
        self.db = SessionLocal()
        # Seed if empty
        if self.db.query(Location).count() == 0:
            import os
            data_dir = "./data" if os.path.exists("./data") else ".."
            loc_df = pd.read_csv(os.path.join(data_dir, "locations.csv"))
            clean_loc = DataCleanerService.clean_and_load_locations(loc_df, self.db)
            for r in clean_loc["cleaned_records"]:
                self.db.add(Location(**r))
            self.db.commit()

            a_df = pd.read_csv(os.path.join(data_dir, "system_a.csv"))
            clean_a = DataCleanerService.clean_and_load_system_a(a_df, self.db)
            for r in clean_a["cleaned_records"]:
                self.db.add(SystemARecord(**r))
            self.db.commit()

            b_df = pd.read_csv(os.path.join(data_dir, "system_b.csv"))
            clean_b = DataCleanerService.clean_and_load_system_b(b_df, self.db)
            for r in clean_b["cleaned_records"]:
                self.db.add(SystemBRecord(**r))
            self.db.commit()

    def tearDown(self):
        self.db.close()

    def test_identifier_standardization(self):
        # REC-1001
        res, mal, msg = standardize_identifier("REC-1001")
        self.assertEqual(res, "REC-1001")
        self.assertFalse(mal)

        # rec1034 -> REC-1034
        res, mal, msg = standardize_identifier("rec1034")
        self.assertEqual(res, "REC-1034")
        self.assertTrue(mal)

        # ' REC - 1070 ' -> REC-1070
        res, mal, msg = standardize_identifier(" REC - 1070 ")
        self.assertEqual(res, "REC-1070")
        self.assertTrue(mal)

        # 1112 -> REC-1112
        res, mal, msg = standardize_identifier("1112")
        self.assertEqual(res, "REC-1112")
        self.assertTrue(mal)

    def test_numeric_parsing(self):
        # '1,25,400.00'
        val, issue, msg = parse_numeric("1,25,400.00")
        self.assertEqual(val, 125400.0)
        self.assertTrue(issue)

        # standard float
        val, issue, msg = parse_numeric(88969.92)
        self.assertEqual(val, 88969.92)
        self.assertFalse(issue)

        # null/None
        val, issue, msg = parse_numeric(None)
        self.assertIsNone(val)
        self.assertTrue(issue)

    def test_full_reconciliation_pipeline(self):
        # Verify locations loaded
        loc_count = self.db.query(Location).count()
        self.assertGreaterEqual(loc_count, 5)

        # Verify A and B loaded
        a_count = self.db.query(SystemARecord).count()
        b_count = self.db.query(SystemBRecord).count()
        self.assertGreaterEqual(a_count, 120)
        self.assertGreaterEqual(b_count, 121)

        # Run reconciliation
        summary = ReconciliationEngine.run_reconciliation(self.db, "Unit Test Verification")
        self.assertIsNotNone(summary)
        self.assertGreater(summary["matched_records"], 100)
        self.assertGreaterEqual(summary["mismatched_records"], 7)
        self.assertGreaterEqual(summary["missing_records"], 3)
        self.assertGreaterEqual(summary["duplicate_records"], 2)

        # Metrics check
        metrics = ReportService.get_dashboard_metrics(self.db)
        self.assertTrue(metrics["has_run"])
        self.assertGreater(metrics["reconciliation_completion_percentage"], 85.0)

if __name__ == "__main__":
    unittest.main()
