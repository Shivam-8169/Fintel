"""
Audit Trail Router.
Exposes chronological forensic event logs for compliance and accountability.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.database import get_db
from app.database.models import AuditLog
from app.schemas.audit import AuditLogResponse

router = APIRouter(tags=["Audit Trail"])


@router.get("/cases/{case_id}/audit", response_model=List[AuditLogResponse])
def get_case_audit_logs(case_id: str, db: Session = Depends(get_db)):
    """Retrieves all chronological audit events for a specific case."""
    logs = (
        db.query(AuditLog)
        .filter(AuditLog.case_id == case_id)
        .order_by(desc(AuditLog.timestamp))
        .all()
    )
    return logs


@router.get("/audit", response_model=List[AuditLogResponse])
def get_system_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Retrieves recent system-wide audit events."""
    logs = db.query(AuditLog).order_by(desc(AuditLog.timestamp)).limit(limit).all()
    return logs
