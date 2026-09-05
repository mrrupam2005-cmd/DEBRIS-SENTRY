from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import tempfile

database_url = os.getenv("DATABASE_URL")

if not database_url:
    # Fallback to /tmp in serverless/read-only environments like Vercel
    if os.getenv("VERCEL") or not os.access(".", os.W_OK):
        db_path = os.path.join(tempfile.gettempdir(), "ssa.db")
        database_url = f"sqlite:///{db_path}"
    else:
        db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ssa.db"))
        database_url = f"sqlite:///{db_path}"


# Convert legacy postgres:// prefix to postgresql:// for SQLAlchemy compatibility
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}

engine = create_engine(database_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

