"""
Reporting and Human-in-the-Loop Review Router.
Handles SAR draft generation, edits, human approval, rejection, and audit trails.
"""

import json
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import PlainTextResponse
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
from app.api.deps import get_current_user, normalize_role
from app.utils.datetime_utils import utcnow
from app.services.report_export_service import generate_pdf_report, generate_docx_report

logger = logging.getLogger(__name__)

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
        version=getattr(report, 'version', None) or "1.0",
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

    # Increment report version on update
    try:
        curr_v = float(getattr(report, 'version', None) or "1.0")
        report.version = f"{curr_v + 0.1:.1f}"
    except Exception:
        report.version = "1.1"

    report.report_content = update_req.report_content.model_dump_json()
    report.updated_at = utcnow()

    # Create audit log
    actor_role = normalize_role(current_user.role)
    audit = AuditLog(
        case_id=case_id,
        actor_type=actor_role,
        actor_id=current_user.name,
        action="REPORT_EDITED",
        details=f"{actor_role} {current_user.name} edited the SAR report draft (Version {report.version}). Notes: {update_req.notes or 'None'}",
        timestamp=utcnow()
    )
    db.add(audit)
    db.commit()

    return ReportResponse(
        report_id=report.report_id,
        case_id=report.case_id,
        status=report.status,
        version=report.version,
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
    parsed["investigator_review_section"]["reviewed_at"] = utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    parsed["investigator_review_section"]["decision_reasoning"] = decision.notes or "Investigator approved draft report."
    parsed["case_information"]["human_status"] = "APPROVED_BY_INVESTIGATOR"

    report.report_content = json.dumps(parsed)
    report.status = "APPROVED"
    report.version = "2.0"
    report.updated_at = utcnow()

    case.status = "APPROVED"
    case.updated_at = utcnow()

    actor_role = normalize_role(current_user.role)
    audit = AuditLog(
        case_id=case_id,
        actor_type=actor_role,
        actor_id=current_user.name,
        action="REPORT_APPROVED",
        details=f"{actor_role} {current_user.name} approved the SAR report. Justification: {decision.notes or 'None provided'}",
        timestamp=utcnow()
    )
    db.add(audit)
    db.commit()

    return {
        "message": "Report successfully approved by human investigator.",
        "case_id": case_id,
        "status": "APPROVED",
        "reviewed_by": current_user.name,
        "reviewed_at": utcnow().isoformat()
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
    parsed["investigator_review_section"]["reviewed_at"] = utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    parsed["investigator_review_section"]["decision_reasoning"] = decision.notes or "Investigator rejected report."
    parsed["case_information"]["human_status"] = "REJECTED_BY_INVESTIGATOR"

    report.report_content = json.dumps(parsed)
    report.status = "REJECTED"
    report.updated_at = utcnow()

    case.status = "REJECTED"
    case.updated_at = utcnow()

    audit = AuditLog(
        case_id=case_id,
        actor_type=actor_role,
        actor_id=current_user.name,
        action="REPORT_REJECTED",
        details=f"{actor_role} {current_user.name} rejected/returned the report. Remarks: {decision.notes}",
        timestamp=utcnow()
    )
    db.add(audit)
    db.commit()

    return {
        "message": "Report rejected / returned by human investigator.",
        "case_id": case_id,
        "status": "REJECTED",
        "reviewed_by": current_user.name
    }


@router.post("/{case_id}/send-back")
def send_back_report(
    case_id: str,
    decision: ReportDecisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Alias for reject_report to satisfy /send-back endpoint requirement."""
    return reject_report(case_id, decision, db, current_user)


# Standalone router for /reports
reports_router = APIRouter(prefix="/reports", tags=["SAR Reports Listing & Retrieval"])


@reports_router.get("")
def list_all_reports(db: Session = Depends(get_db)):
    """Lists all structured SAR reports currently generated in the platform."""
    reports = db.query(Report).order_by(Report.updated_at.desc()).all()
    results = []
    for r in reports:
        case = db.query(Case).filter(Case.case_id == r.case_id).first()
        customer_name = "Unknown"
        account_id = case.account_id if case else "N/A"
        risk_score = case.risk_score if case else 0.0
        risk_level = case.risk_level if case else "LOW"
        summary_text = "SAR Draft Generated"
        try:
            parsed = json.loads(r.report_content)
            customer_name = parsed.get("subject_information", {}).get("customer_name", "Unknown")
            summary_text = parsed.get("suspicious_activity_summary", {}).get("narrative_summary", summary_text)
        except Exception:
            pass

        results.append({
            "report_id": r.report_id,
            "case_id": r.case_id,
            "account_id": account_id,
            "customer_name": customer_name,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "status": r.status,
            "summary": summary_text[:180] + "..." if len(summary_text) > 180 else summary_text,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "updated_at": r.updated_at.isoformat() if r.updated_at else None,
        })
    return results


@reports_router.get("/{report_id}")
def get_report_by_id(report_id: str, db: Session = Depends(get_db)):
    """Retrieves single report by its report_id."""
    report = db.query(Report).filter(Report.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found.")

    structured_content = StructuredSARReport.model_validate_json(report.report_content)
    return ReportResponse(
        report_id=report.report_id,
        case_id=report.case_id,
        status=report.status,
        report_content=structured_content,
        created_at=report.created_at,
        updated_at=report.updated_at
    )


@router.get("/{case_id}/report/markdown", response_class=PlainTextResponse)
def export_report_markdown(case_id: str, db: Session = Depends(get_db)):
    """Exports structured SAR draft report in institutional Markdown format."""
    report = db.query(Report).filter(Report.case_id == case_id).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"Report not found for case '{case_id}'.")

    data = json.loads(report.report_content)
    case_info = data.get("case_information", {})
    sub = data.get("subject_identification", {})
    fin = data.get("suspicious_financial_activity", {})
    narrative = data.get("narrative_explanation", {})
    rev = data.get("investigator_review_section", {})

    lines = [
        f"# SUSPICIOUS ACTIVITY REPORT (SAR) — {case_info.get('watermark', 'DRAFT')}",
        f"**Report ID**: {case_info.get('report_id')}  ",
        f"**Case Reference**: {case_info.get('case_id')}  ",
        f"**Draft Date**: {case_info.get('date_drafted')}  ",
        f"**Filing Status**: {case_info.get('human_status')}  ",
        "",
        "---",
        "",
        "## 1. Subject Identification",
        f"- **Primary Subject**: {sub.get('primary_subject_name')}",
        f"- **Customer ID**: {sub.get('customer_id')}",
        f"- **Account Number**: {sub.get('account_number')} ({sub.get('account_type')})",
        f"- **Jurisdiction**: {sub.get('country')}",
        f"- **Occupation / Industry**: {sub.get('occupation')}",
        f"- **Base KYC Risk**: {sub.get('kyc_risk_level')}",
        "",
        "## 2. Suspicious Financial Activity Overview",
        f"- **Timeframe**: {fin.get('timeframe_start')} to {fin.get('timeframe_end')}",
        f"- **Total Inbound Flow**: ${fin.get('total_inbound_amount', 0):,.2f}",
        f"- **Total Outbound Flow**: ${fin.get('total_outbound_amount', 0):,.2f}",
        f"- **Net Fund Delta**: ${fin.get('net_flow_amount', 0):,.2f}",
        f"- **Distinct Counterparties**: {fin.get('distinct_counterparties', 0)}",
        f"- **Primary Typologies**: {', '.join(fin.get('primary_typologies', []))}",
        "",
        "## 3. Executive Summary Narrative",
        narrative.get("executive_summary", ""),
        "",
        "## 4. Chronological Flow & Reasoning",
    ]

    for item in narrative.get("chronological_flow", []):
        lines.append(f"### {item.get('step')}. {item.get('title')}")
        lines.append(f"- **Observation**: {item.get('observation')}")
        lines.append(f"- **Interpretation**: {item.get('interpretation')}")
        lines.append(f"- **Cited Evidence**: {', '.join(item.get('cited_evidence_ids', []))}")
        lines.append("")

    lines.extend([
        "## 5. Uncertainties & Data Gaps",
        *[f"- {u}" for u in narrative.get("uncertainties_and_gaps", [])],
        "",
        "## 6. Recommended Next Actions",
        *[f"- {a}" for a in narrative.get("recommended_actions", [])],
        "",
        "## 7. Human Review Sign-Off",
        f"- **Approval Status**: {rev.get('approval_status')}",
        f"- **Reviewed By**: {rev.get('reviewed_by') or 'Pending Review'}",
        f"- **Review Date**: {rev.get('reviewed_at') or 'N/A'}",
        f"- **Decision Notes**: {rev.get('decision_reasoning') or 'None'}",
        "",
        "---",
        f"*{case_info.get('watermark')}*"
    ])

    return "\n".join(lines)


@router.get("/{case_id}/report/pdf")
def export_report_pdf(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Exports institutional-grade A4 PDF SAR investigation report.
    Includes case summary, plain-language detections, risk meter,
    suspicious transactions, ego-network visualizer, evidence lineage,
    mandatory uncertainty disclosure, investigator notes, and human review status.
    """
    case = db.query(Case).filter(Case.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")

    try:
        pdf_bytes, filename = generate_pdf_report(case_id, db, current_user.email)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition",
                "X-Report-Filename": filename
            }
        )
    except Exception as e:
        logger.error(f"Failed to generate PDF for case '{case_id}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Unable to generate the report. Please try again.")


@router.get("/{case_id}/report/docx")
def export_report_docx(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Exports institutional Microsoft Word (.docx) investigation report document.
    """
    case = db.query(Case).filter(Case.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")

    try:
        docx_bytes, filename = generate_docx_report(case_id, db, current_user.email)
        return Response(
            content=docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition",
                "X-Report-Filename": filename
            }
        )
    except Exception as e:
        logger.error(f"Failed to generate DOCX for case '{case_id}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Unable to generate the report. Please try again.")


@router.post("/{case_id}/report/export")
def export_report_post(
    case_id: str,
    payload: Optional[Dict[str, Any]] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Exports institutional SAR investigation report in PDF or DOCX format via POST.
    Payload: {"format": "pdf" | "docx"} (default: "pdf")
    """
    fmt = "pdf"
    if payload and isinstance(payload, dict):
        fmt = payload.get("format", "pdf").lower()

    if fmt == "docx":
        return export_report_docx(case_id, db, current_user)
    return export_report_pdf(case_id, db, current_user)


@reports_router.get("/{report_id}/pdf")
def export_single_report_pdf(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Downloads PDF for report by its report_id."""
    report = db.query(Report).filter(Report.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found.")
    return export_report_pdf(report.case_id, db, current_user)


@reports_router.get("/{report_id}/docx")
def export_single_report_docx(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Downloads DOCX for report by its report_id."""
    report = db.query(Report).filter(Report.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found.")
    return export_report_docx(report.case_id, db, current_user)

