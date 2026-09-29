from datetime import datetime, timezone


def utcnow() -> datetime:
    """Returns the current UTC datetime as a naive datetime object for SQLite/SQLAlchemy compatibility."""
    return datetime.now(timezone.utc).replace(tzinfo=None)
