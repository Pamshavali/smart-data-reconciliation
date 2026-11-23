import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Database configuration: PostgreSQL preferred via DATABASE_URL, SQLite fallback for local & serverless
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # If running on Vercel Serverless environment, use /tmp writable partition
    if os.getenv("VERCEL"):
        tmp_db = "/tmp/reconciliation.db"
        if not os.path.exists(tmp_db):
            for candidate in ["reconciliation.db", "../reconciliation.db", "./reconciliation.db"]:
                if os.path.exists(candidate):
                    import shutil
                    try:
                        shutil.copyfile(candidate, tmp_db)
                        break
                    except Exception:
                        pass
        DATABASE_URL = f"sqlite:///{tmp_db}"
    else:
        DATABASE_URL = "sqlite:///./reconciliation.db"

# For SQLite, ensure multithread access is enabled
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

