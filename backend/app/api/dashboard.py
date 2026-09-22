"""
Dashboard and Overview Metrics Router.
Aggregates case status breakdown, risk distribution, and workload counters.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.database import get_db
from app.database.models import Case, Customer, Transaction, Report

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    """Computes high-level KPI metrics for the investigator dashboard."""
    total_cases = db.query(Case).count()
    critical_cases = db.query(Case).filter(Case.risk_level == "CRITICAL").count()
    high_cases = db.query(Case).filter(Case.risk_level == "HIGH").count()
    medium_cases = db.query(Case).filter(Case.risk_level == "MEDIUM").count()
    low_cases = db.query(Case).filter(Case.risk_level == "LOW").count()

    pending_review = db.query(Case).filter(Case.status.in_(["REPORT_DRAFTED", "PENDING_REVIEW"])).count()
    approved_cases = db.query(Case).filter(Case.status == "APPROVED").count()
    under_investigation = db.query(Case).filter(Case.status == "UNDER_INVESTIGATION").count()

    total_customers = db.query(Customer).count()
    total_transactions = db.query(Transaction).count()

    # Recent high-risk cases
    recent_flagged = (
        db.query(Case)
        .order_by(Case.risk_score.desc())
        .limit(5)
        .all()
    )

    return {
        "total_cases": total_cases,
        "critical_cases": critical_cases,
        "high_risk_cases": high_cases,
        "medium_risk_cases": medium_cases,
        "low_risk_cases": low_cases,
        "pending_review": pending_review,
        "approved_cases": approved_cases,
        "under_investigation": under_investigation,
        "total_customers": total_customers,
        "total_transactions": total_transactions,
        "top_flagged_cases": [
            {
                "case_id": c.case_id,
                "account_id": c.account_id,
                "risk_score": c.risk_score,
                "risk_level": c.risk_level,
                "status": c.status
            }
            for c in recent_flagged
        ]
    }
