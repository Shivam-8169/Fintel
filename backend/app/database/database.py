import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config.settings import settings

db_url = settings.DATABASE_URL
connect_args = {}
if db_url.startswith("sqlite:///./") or db_url == "sqlite:///fintel.db":
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    db_file_path = os.path.join(backend_dir, "fintel.db")
    db_url = f"sqlite:///{db_file_path}"
    connect_args = {"check_same_thread": False}
elif db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    db_url,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency for yielding database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
