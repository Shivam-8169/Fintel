"""
Data Management and Ingestion Router.
Provides endpoints for CSV uploads, synthetic dataset loading, and ingestion summaries.
"""

import os
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import Customer, Account, Transaction, User, AuditLog
from app.agents.ingestion_agent import IngestionAgent
from app.services.detection_service import DetectionService
from app.schemas.data import IngestionSummary
from app.api.deps import get_current_user

router = APIRouter(prefix="/data", tags=["Data Ingestion"])


@router.post("/upload", response_model=IngestionSummary)
async def upload_dataset_csv(
    file: UploadFile = File(...),
    dataset_type: str = Form(..., description="customers, accounts, or transactions"),
    run_detection_after: bool = Form(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Accepts CSV uploads, validates schemas and types, stores valid records,
    and optionally executes the detection engine immediately.
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV format is accepted.")

    content = await file.read()
    agent = IngestionAgent(db)
    dataset_type = dataset_type.lower().strip()

    if dataset_type == "customers":
        summary = agent.ingest_customers_csv(content, file.filename)
    elif dataset_type == "accounts":
        summary = agent.ingest_accounts_csv(content, file.filename)
    elif dataset_type == "transactions":
        summary = agent.ingest_transactions_csv(content, file.filename)
    else:
        raise HTTPException(
            status_code=400,
            detail="Invalid dataset_type. Expected 'customers', 'accounts', or 'transactions'."
        )

    # Trigger detection if requested and new transactions were ingested
    if run_detection_after and summary.transactions_added > 0:
        det_svc = DetectionService(db)
        det_svc.run_detection_pipeline()

    # Audit log
    audit = AuditLog(
        actor_type=current_user.role,
        actor_id=current_user.email,
        action="DATA_INGESTION",
        details=f"Uploaded {file.filename} ({dataset_type}): {summary.records_valid} valid, {summary.records_rejected} rejected.",
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()

    return summary


@router.get("/status")
def get_data_status(db: Session = Depends(get_db)):
    """Returns overview counts of currently loaded entities in the system."""
    cust_count = db.query(Customer).count()
    acc_count = db.query(Account).count()
    tx_count = db.query(Transaction).count()

    return {
        "status": "READY",
        "customers_count": cust_count,
        "accounts_count": acc_count,
        "transactions_count": tx_count,
        "database_type": "SQLite (Development/Demo Mode)",
        "synthetic_ground_truth_available": True
    }
