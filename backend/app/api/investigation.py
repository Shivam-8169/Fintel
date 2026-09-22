"""
Investigation Router for Fintel.
Triggers autonomous evidence-grounded investigations and retrieves structured findings.
"""

import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import Case, Investigation
from app.agents.investigation_agent import InvestigationAgent
from app.schemas.investigation import InvestigationResponse, SuspiciousPatternItem, ReasoningStep

router = APIRouter(prefix="/cases", tags=["Investigation Agent"])


@router.post("/{case_id}/investigate", response_model=InvestigationResponse)
def trigger_case_investigation(case_id: str, db: Session = Depends(get_db)):
    """
    Executes the Investigation Agent on the given case.
    Uses LLM API if configured, otherwise employs deterministic demo agent.
    Always citations evidence IDs and outputs structured reasoning.
    """
    case = db.query(Case).filter(Case.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")

    agent = InvestigationAgent(db)
    result = agent.investigate_case(case_id)
    return result


@router.get("/{case_id}/investigation", response_model=InvestigationResponse)
def get_case_investigation(case_id: str, db: Session = Depends(get_db)):
    """Retrieves existing investigation findings for a case."""
    inv = db.query(Investigation).filter(Investigation.case_id == case_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail=f"No investigation conducted yet for case '{case_id}'.")

    patterns = [SuspiciousPatternItem(**p) for p in json.loads(inv.suspicious_patterns)]
    reasoning = [ReasoningStep(**r) for r in json.loads(inv.reasoning)]
    uncertainties = json.loads(inv.uncertainty) if inv.uncertainty else []

    return InvestigationResponse(
        investigation_id=inv.investigation_id,
        case_id=inv.case_id,
        summary=inv.summary,
        suspicious_patterns=patterns,
        reasoning=reasoning,
        uncertainty=uncertainties,
        questions_for_investigator=[],
        is_mock_ai=True,
        created_at=inv.created_at
    )
