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


def init_db_schema():
    """Initializes tables and safely runs lightweight column migrations for SQLite."""
    import uuid
    from sqlalchemy import text

    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        try:
            res = conn.execute(text("PRAGMA table_info(users)"))
            cols = [row[1] for row in res.fetchall()]
            if cols:
                if "user_id" not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN user_id VARCHAR(50)"))
                if "status" not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN status VARCHAR(50) DEFAULT 'Active'"))
                if "invited_by" not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN invited_by VARCHAR(100)"))
                if "invited_at" not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN invited_at DATETIME"))
                if "last_login_at" not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN last_login_at DATETIME"))
                conn.commit()

            rows = conn.execute(text("SELECT id, user_id FROM users WHERE user_id IS NULL")).fetchall()
            for r in rows:
                new_uid = f"USR-{uuid.uuid4().hex[:8].upper()}"
                conn.execute(text("UPDATE users SET user_id = :uid WHERE id = :id"), {"uid": new_uid, "id": r[0]})
            conn.commit()
        except Exception:
            pass

        try:
            res_c = conn.execute(text("PRAGMA table_info(cases)"))
            cols_c = [row[1] for row in res_c.fetchall()]
            if cols_c and "assigned_to" not in cols_c:
                conn.execute(text("ALTER TABLE cases ADD COLUMN assigned_to VARCHAR(100)"))
                conn.commit()
        except Exception:
            pass


def get_db():
    """FastAPI dependency for yielding database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
