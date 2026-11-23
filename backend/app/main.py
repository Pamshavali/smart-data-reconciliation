import os
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .models import User, Location, Organization, SystemARecord, SystemBRecord
from .utils.security import hash_password
from .routes import (
    auth_router,
    upload_router,
    records_router,
    reconciliation_router,
    exceptions_router,
    dashboard_router,
    reports_router
)
from .services.cleaner import DataCleanerService
from .services.reconciler import ReconciliationEngine

# Create all database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart Data Reconciliation & Validation System API",
    description="Enterprise-grade data reconciliation, matching, exception management, and reporting system.",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(records_router)
app.include_router(reconciliation_router)
app.include_router(exceptions_router)
app.include_router(dashboard_router)
app.include_router(reports_router)

@app.on_event("startup")
def startup_event():
    """Initializes default admin accounts and initial datasets if empty."""
    db = SessionLocal()
    try:
        # 1. Seed Default Users
        if db.query(User).count() == 0:
            admin_user = User(
                username="admin",
                email="admin@enterprise-reconciliation.io",
                hashed_password=hash_password("admin123"),
                full_name="Lead Reconciliation Engineer",
                role="admin"
            )
            analyst_user = User(
                username="analyst",
                email="analyst@enterprise-reconciliation.io",
                hashed_password=hash_password("analyst123"),
                full_name="Senior Data Analyst",
                role="analyst"
            )
            db.add(admin_user)
            db.add(analyst_user)
            db.commit()
            print("[INFO] Seeded default users: admin / admin123, analyst / analyst123")

        # 2. Seed Initial Datasets if present in data folder and database is clean
        if db.query(Location).count() == 0:
            data_dir = "./data" if os.path.exists("./data") else ".."
            loc_path = os.path.join(data_dir, "locations.csv")
            a_path = os.path.join(data_dir, "system_a.csv")
            b_path = os.path.join(data_dir, "system_b.csv")

            if os.path.exists(loc_path):
                loc_df = pd.read_csv(loc_path)
                clean_loc = DataCleanerService.clean_and_load_locations(loc_df, db)
                org_names = {}
                for r in clean_loc["cleaned_records"]:
                    db.add(Location(**r))
                    org_names[r["org_id"]] = f"Organization {r['org_id'][-1]}"
                for org_id, name in org_names.items():
                    db.add(Organization(org_id=org_id, name=name))
                db.commit()
                print(f"[INFO] Auto-loaded {len(clean_loc['cleaned_records'])} locations.")

            if os.path.exists(a_path):
                a_df = pd.read_csv(a_path)
                clean_a = DataCleanerService.clean_and_load_system_a(a_df, db)
                for r in clean_a["cleaned_records"]:
                    db.add(SystemARecord(**r))
                db.commit()
                print(f"[INFO] Auto-loaded {len(clean_a['cleaned_records'])} System A records.")

            if os.path.exists(b_path):
                b_df = pd.read_csv(b_path)
                clean_b = DataCleanerService.clean_and_load_system_b(b_df, db)
                for r in clean_b["cleaned_records"]:
                    db.add(SystemBRecord(**r))
                db.commit()
                print(f"[INFO] Auto-loaded {len(clean_b['cleaned_records'])} System B records.")

            # Trigger initial reconciliation run
            if db.query(SystemARecord).count() > 0 and db.query(SystemBRecord).count() > 0:
                ReconciliationEngine.run_reconciliation(db, run_notes="Automated Initial Ingestion Run")
                print("[INFO] Executed initial baseline reconciliation.")
    except Exception as e:
        db.rollback()
        print(f"[WARN] Startup initialization error: {e}")
    finally:
        db.close()

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Check if compiled frontend dist exists
frontend_dist_path = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
if os.path.exists(frontend_dist_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist_path, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        # Allow API routes to be handled by routers
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            return None
        index_file = os.path.join(frontend_dist_path, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"system": "Smart Data Reconciliation API", "version": "1.0.0"}
else:
    @app.get("/")
    def root():
        return {
            "system": "Smart Data Reconciliation & Validation System",
            "version": "1.0.0",
            "status": "HEALTHY",
            "docs_url": "/docs",
            "endpoints": {
                "auth": "/api/auth/login",
                "dashboard_summary": "/api/dashboard/summary",
                "reconciliation_run": "/api/reconciliation/run",
                "exceptions": "/api/exceptions",
                "reports_export_csv": "/api/reports/export/csv",
                "reports_export_excel": "/api/reports/export/excel"
            }
        }
