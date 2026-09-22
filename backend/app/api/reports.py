"""
Reporting and Human-in-the-Loop Review Router.
Handles SAR draft generation, edits, human approval, rejection, and audit trails.
"""

import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import Case, Report, User, AuditLog
from app.agents.reporting_agent import ReportingAgent
from app.schemas.report import (
    ReportResponse,
    StructuredSARReport,
    ReportUpdateRequest,
    ReportDecisionRequest
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/cases", tags=["SAR Reports & Human Review"])


@router.post("/{case_id}/generate-report", response_model=ReportResponse)
def generate_sar_report(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Synthesizes detection and investigation evidence into a SAR-style draft report.
    Watermarked strictly with 'DRAFT — REQUIRES HUMAN REVIEW'.
    """
    case = db.query(Case).filter(Case.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")

    agent = ReportingAgent(db)
    result = agent.generate_draft_report(case_id)
    return result


@router.get("/{case_id}/report", response_model=ReportResponse)
def get_sar_report(case_id: str, db: Session = Depends(get_db)):
    """Retrieves existing SAR draft report for a case."""
    report = db.query(Report).filter(Report.case_id == case_id).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"Report not found for case '{case_id}'.")

    structured_content = StructuredSARReport.model_validate_json(report.report_content)
    return ReportResponse(
        report_id=report.report_id,
        case_id=report.case_id,
        status=report.status,
        report_content=structured_content,
        created_at=report.created_at,
        updated_at=report.updated_at
    )


@router.put("/{case_id}/report", response_model=ReportResponse)
def update_sar_report(
    case_id: str,
    update_req: ReportUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Allows the human investigator to edit and update any section of the SAR report draft.
    Logs every edit explicitly in the audit trail.
    """
    report = db.query(Report).filter(Report.case_id == case_id).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"Report not found for case '{case_id}'.")

    report.report_content = update_req.report_content.model_dump_json()
    report.updated_at = datetime.utcnow()

    # Create audit log
    audit = AuditLog(
        case_id=case_id,
        actor_type=current_user.role,
        actor_id=current_user.email,
        action="REPORT_EDITED",
        details=f"Investigator {current_user.name} edited the SAR report draft. Notes: {update_req.notes or 'None'}",
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()

    return ReportResponse(
        report_id=report.report_id,
        case_id=report.case_id,
        status=report.status,
        report_content=update_req.report_content,
        created_at=report.created_at,
        updated_at=report.updated_at
    )


@router.post("/{case_id}/approve")
def approve_report(
    case_id: str,
    decision: ReportDecisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    MANDATORY HUMAN ACTION: Explicit human approval of the SAR report.
    Advances case and report status to APPROVED and writes immutable audit record.
    """
    case = db.query(Case).filter(Case.case_id == case_id).first()
    report = db.query(Report).filter(Report.case_id == case_id).first()

    if not case or not report:
        raise HTTPException(status_code=404, detail="Case or Report record not found.")

    # Update review section inside report content
    parsed = json.loads(report.report_content)
    parsed["investigator_review_section"]["approval_status"] = "APPROVED"
    parsed["investigator_review_section"]["reviewed_by"] = current_user.name
    parsed["investigator_review_section"]["reviewed_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    parsed["investigator_review_section"]["decision_reasoning"] = decision.notes or "Investigator approved draft report."
    parsed["case_information"]["human_status"] = "APPROVED_BY_INVESTIGATOR"

    report.report_content = json.dumps(parsed)
    report.status = "APPROVED"
    report.updated_at = datetime.utcnow()

    case.status = "APPROVED"
    case.updated_at = datetime.utcnow()

    audit = AuditLog(
        case_id=case_id,
        actor_type=current_user.role,
        actor_id=current_user.email,
        action="REPORT_APPROVED",
        details=f"Investigator {current_user.name} approved the SAR report. Justification: {decision.notes or 'None provided'}",
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()

    return {
        "message": "Report successfully approved by human investigator.",
        "case_id": case_id,
        "status": "APPROVED",
        "reviewed_by": current_user.name,
        "reviewed_at": datetime.utcnow().isoformat()
    }


@router.post("/{case_id}/reject")
def reject_report(
    case_id: str,
    decision: ReportDecisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    MANDATORY HUMAN ACTION: Explicit human rejection / send-back of SAR report.
    Returns case status to REJECTED or UNDER_INVESTIGATION.
    """
    case = db.query(Case).filter(Case.case_id == case_id).first()
    report = db.query(Report).filter(Report.case_id == case_id).first()

    if not case or not report:
        raise HTTPException(status_code=404, detail="Case or Report record not found.")

    parsed = json.loads(report.report_content)
    parsed["investigator_review_section"]["approval_status"] = "REJECTED"
    parsed["investigator_review_section"]["reviewed_by"] = current_user.name
    parsed["investigator_review_section"]["reviewed_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    parsed["investigator_review_section"]["decision_reasoning"] = decision.notes or "Investigator rejected report."
    parsed["case_information"]["human_status"] = "REJECTED_BY_INVESTIGATOR"

    report.report_content = json.dumps(parsed)
    report.status = "REJECTED"
    report.updated_at = datetime.utcnow()

    case.status = "REJECTED"
    case.updated_at = datetime.utcnow()

    audit = AuditLog(
        case_id=case_id,
        actor_type=current_user.role,
        actor_id=current_user.email,
        action="REPORT_REJECTED",
        details=f"Investigator {current_user.name} rejected/returned the report. Remarks: {decision.notes}",
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()

    return {
        "message": "Report rejected / returned by human investigator.",
        "case_id": case_id,
        "status": "REJECTED",
        "reviewed_by": current_user.name
    }
