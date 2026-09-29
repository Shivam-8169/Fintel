"""
Case Management Router for Fintel.
Provides listing, filtering, detail retrieval, notes, and lifecycle management.
"""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.database import get_db
from app.database.models import Case, Account, Customer, DetectionResult, Evidence, InvestigatorNote, Report, Investigation, User, AuditLog
from app.schemas.case import (
    CaseListItem,
    CaseDetailResponse,
    InvestigatorNoteCreate,
    InvestigatorNoteResponse,
    CaseStatusUpdate,
    CaseAssignRequest
)
from app.schemas.detection import IndicatorResult, EvidenceItemSchema
from app.schemas.data import AccountSchema, CustomerSchema
from app.api.deps import get_current_user, require_lead_investigator, normalize_role
from app.utils.datetime_utils import utcnow

router = APIRouter(prefix="/cases", tags=["Case Management"])


@router.get("", response_model=List[CaseListItem])
def list_cases(
    status: Optional[str] = Query(None, description="Filter by status"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level (LOW, MEDIUM, HIGH, CRITICAL)"),
    search: Optional[str] = Query(None, description="Search account ID or customer name"),
    min_score: Optional[float] = Query(None, description="Minimum risk score threshold"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Retrieves list of cases filtered by risk level, status, or search keywords."""
    query = db.query(Case).order_by(desc(Case.risk_score), desc(Case.created_at))

    if status:
        query = query.filter(Case.status == status.upper())
    if risk_level:
        query = query.filter(Case.risk_level == risk_level.upper())
    if min_score is not None:
        query = query.filter(Case.risk_score >= min_score)

    cases = query.limit(limit).all()

    # Pre-fetch account/customer info
    account_ids = [c.account_id for c in cases]
    accounts = {a.account_id: a for a in db.query(Account).filter(Account.account_id.in_(account_ids)).all()}
    cust_ids = [a.customer_id for a in accounts.values() if a.customer_id]
    customers = {c.customer_id: c for c in db.query(Customer).filter(Customer.customer_id.in_(cust_ids)).all()}

    results: List[CaseListItem] = []
    for c in cases:
        acc = accounts.get(c.account_id)
        cust = customers.get(acc.customer_id) if acc and acc.customer_id else None
        cust_name = cust.name if cust else "External / Unknown"

        if search:
            term = search.lower()
            if term not in c.case_id.lower() and term not in c.account_id.lower() and term not in cust_name.lower():
                continue

        ind_count = len(c.detection_results)
        ev_count = len(c.evidence)

        results.append(CaseListItem(
            case_id=c.case_id,
            account_id=c.account_id,
            customer_name=cust_name,
            risk_score=c.risk_score,
            risk_level=c.risk_level,
            status=c.status,
            assigned_to=getattr(c, "assigned_to", None) or "Shivam Sharma",
            created_at=c.created_at,
            updated_at=c.updated_at,
            indicator_count=ind_count,
            evidence_count=ev_count
        ))

    return results


@router.get("/{case_id}", response_model=CaseDetailResponse)
def get_case_detail(case_id: str, db: Session = Depends(get_db)):
    """Retrieves comprehensive case details, indicators, evidence, and notes."""
    case = db.query(Case).filter(Case.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")

    account = db.query(Account).filter(Account.account_id == case.account_id).first()
    customer = db.query(Customer).filter(Customer.customer_id == account.customer_id).first() if account else None

    # Load indicators
    indicators_data: List[IndicatorResult] = []
    for dr in case.detection_results:
        # Find related evidence
        ev_ids = [e.evidence_id for e in case.evidence if any(tag in e.evidence_id.lower() for tag in dr.indicator_name.split("_")[:2])]
        indicators_data.append(IndicatorResult(
            name=dr.indicator_name,
            score=dr.score,
            explanation=dr.explanation,
            evidence_ids=ev_ids
        ))

    # Load evidence
    evidence_data = [
        EvidenceItemSchema(
            evidence_id=e.evidence_id,
            case_id=e.case_id,
            evidence_type=e.evidence_type,
            source_id=e.source_id,
            description=e.description
        )
        for e in case.evidence
    ]

    # Load notes
    notes_data = [
        InvestigatorNoteResponse(
            note_id=n.note_id,
            case_id=n.case_id,
            note_text=n.note_text,
            created_at=n.created_at
        )
        for n in case.notes
    ]

    has_inv = db.query(Investigation).filter(Investigation.case_id == case_id).count() > 0
    report = db.query(Report).filter(Report.case_id == case_id).first()

    return CaseDetailResponse(
        case_id=case.case_id,
        account_id=case.account_id,
        risk_score=case.risk_score,
        risk_level=case.risk_level,
        status=case.status,
        assigned_to=getattr(case, "assigned_to", None) or "Shivam Sharma",
        created_at=case.created_at,
        updated_at=case.updated_at,
        account=AccountSchema.model_validate(account) if account else None,
        customer=CustomerSchema.model_validate(customer) if customer else None,
        indicators=indicators_data,
        evidence=evidence_data,
        notes=notes_data,
        has_investigation=has_inv,
        has_report=bool(report),
        report_status=report.status if report else None
    )


@router.post("/{case_id}/notes", response_model=InvestigatorNoteResponse)
def add_case_note(
    case_id: str,
    note_in: InvestigatorNoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Appends an investigator note to the case and creates an audit event."""
    case = db.query(Case).filter(Case.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")

    new_note = InvestigatorNote(
        case_id=case_id,
        note_text=note_in.note_text,
        created_at=utcnow()
    )
    db.add(new_note)

    user_role = normalize_role(current_user.role)
    audit = AuditLog(
        case_id=case_id,
        actor_type=user_role,
        actor_id=current_user.name,
        action="NOTE_ADDED",
        details=f"{user_role} {current_user.name} logged an investigative case note.",
        timestamp=utcnow()
    )
    db.add(audit)
    db.commit()

    return InvestigatorNoteResponse(
        note_id=new_note.note_id,
        case_id=new_note.case_id,
        note_text=new_note.note_text,
        created_at=new_note.created_at,
        author_name=current_user.name,
        author_role=user_role
    )


@router.put("/{case_id}/status")
def update_case_status(
    case_id: str,
    update: CaseStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates case lifecycle status with mandatory audit logging."""
    case = db.query(Case).filter(Case.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")

    old_status = case.status
    case.status = update.status.upper()
    case.updated_at = utcnow()

    user_role = normalize_role(current_user.role)
    audit = AuditLog(
        case_id=case_id,
        actor_type=user_role,
        actor_id=current_user.name,
        action="CASE_STATUS_CHANGED",
        details=f"{user_role} {current_user.name} changed status from {old_status} to {case.status}. Reason: {update.reason or 'Investigator action'}",
        timestamp=utcnow()
    )
    db.add(audit)
    db.commit()

    return {"message": f"Case status updated to {case.status}", "case_id": case_id, "status": case.status}


@router.put("/{case_id}/assign")
def assign_case(
    case_id: str,
    assign_req: CaseAssignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_lead_investigator)
):
    """
    LEAD INVESTIGATOR / ADMIN ONLY: Reassigns a case between investigators.
    Enforced at API layer: Regular Investigators receive 403 Forbidden.
    """
    case = db.query(Case).filter(Case.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")

    old_assignee = getattr(case, "assigned_to", None) or "Unassigned"
    case.assigned_to = assign_req.assigned_to.strip()
    case.updated_at = utcnow()

    user_role = normalize_role(current_user.role)
    audit = AuditLog(
        case_id=case_id,
        actor_type=user_role,
        actor_id=current_user.name,
        action="CASE_REASSIGNED",
        details=f"{user_role} {current_user.name} reassigned case from '{old_assignee}' to '{case.assigned_to}'.",
        timestamp=utcnow()
    )
    db.add(audit)
    db.commit()

    return {
        "message": f"Case successfully reassigned to {case.assigned_to}",
        "case_id": case_id,
        "assigned_to": case.assigned_to,
        "reassigned_by": current_user.name
    }
