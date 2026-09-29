"""
Investigation Agent for Fintel.
Retrieves localized evidence context, orchestrates LLM analysis (or deterministic demo engine),
enforces evidence citations, and generates structured investigative findings.
"""

import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
import httpx
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.database.models import Case, Account, Customer, Evidence, DetectionResult, InvestigatorNote, Investigation, AuditLog
from app.graph.builder import GraphBuilder
from app.graph.analysis import GraphAnalyzer
from app.prompts.investigation_prompts import INVESTIGATION_SYSTEM_PROMPT, INVESTIGATION_USER_PROMPT
from app.schemas.investigation import InvestigationResult, SuspiciousPatternItem, ReasoningStep
from app.utils.datetime_utils import utcnow

logger = logging.getLogger("fintel.investigation_agent")


class InvestigationAgent:
    """Agent that performs automated, evidence-grounded financial crime investigations."""

    def __init__(self, db: Session):
        self.db = db

    def investigate_case(self, case_id: str) -> Dict[str, Any]:
        """Runs the investigation workflow for the specified case."""
        case = self.db.query(Case).filter(Case.case_id == case_id).first()
        if not case:
            raise ValueError(f"Case '{case_id}' not found.")

        account = self.db.query(Account).filter(Account.account_id == case.account_id).first()
        customer = self.db.query(Customer).filter(Customer.customer_id == account.customer_id).first() if account else None
        evidence_records = self.db.query(Evidence).filter(Evidence.case_id == case_id).all()
        indicators = self.db.query(DetectionResult).filter(DetectionResult.case_id == case_id).all()
        notes = self.db.query(InvestigatorNote).filter(InvestigatorNote.case_id == case_id).all()

        # Build graph features for the account
        graph = GraphBuilder(self.db).build_transaction_graph()
        analyzer = GraphAnalyzer(graph)
        graph_feats = analyzer.calculate_graph_features(case.account_id)

        # Build context representations
        indicators_text = "\n".join([f"- {ind.indicator_name} (Score: {ind.score}): {ind.explanation}" for ind in indicators]) or "None"
        evidence_text = "\n".join([f"- [{ev.evidence_id}] ({ev.evidence_type} - {ev.source_id}): {ev.description}" for ev in evidence_records]) or "None on record."
        notes_text = "\n".join([f"- {n.created_at.strftime('%Y-%m-%d')}: {n.note_text}" for n in notes]) or "None."

        user_prompt = INVESTIGATION_USER_PROMPT.format(
            case_id=case.case_id,
            account_id=case.account_id,
            account_type=account.account_type if account else "UNKNOWN",
            customer_name=customer.name if customer else "Unknown",
            customer_country=customer.country if customer else "Unknown",
            customer_risk=customer.risk_level if customer else "LOW",
            risk_score=case.risk_score,
            risk_level=case.risk_level,
            in_degree=graph_feats.get("in_degree", 0),
            out_degree=graph_feats.get("out_degree", 0),
            total_inflow=graph_feats.get("total_incoming_amount", 0.0),
            total_outflow=graph_feats.get("total_outgoing_amount", 0.0),
            counterparties=graph_feats.get("unique_counterparties", 0),
            indicators_text=indicators_text,
            evidence_text=evidence_text,
            notes_text=notes_text
        )

        valid_evidence_ids = {e.evidence_id for e in evidence_records}
        result: Optional[InvestigationResult] = None
        is_mock = True

        # Attempt real LLM call if configured
        if settings.LLM_API_KEY and not settings.DEMO_MODE:
            try:
                result = self._call_llm(user_prompt)
                if result:
                    is_mock = False
                    # Sanitize hallucinated evidence IDs
                    result.evidence_items = [e for e in result.evidence_items if e in valid_evidence_ids]
            except Exception as e:
                logger.warning(f"LLM call failed: {str(e)}. Falling back to deterministic demo investigation.")
                result = None

        if not result:
            result = self._generate_deterministic_investigation(
                case, account, customer, indicators, evidence_records, graph_feats
            )
            is_mock = True

        # Persist Investigation record
        # Remove previous investigation if re-investigating
        self.db.query(Investigation).filter(Investigation.case_id == case_id).delete()

        inv_record = Investigation(
            case_id=case_id,
            summary=result.case_summary,
            suspicious_patterns=json.dumps([p.model_dump() for p in result.suspicious_patterns]),
            reasoning=json.dumps([r.model_dump() for r in result.reasoning]),
            uncertainty=json.dumps(result.uncertainty),
            created_at=utcnow()
        )
        self.db.add(inv_record)

        # Update case status
        case.status = "UNDER_INVESTIGATION"
        case.updated_at = utcnow()

        # Audit log
        audit = AuditLog(
            case_id=case_id,
            actor_type="AI_AGENT",
            actor_id="InvestigationAgent (Mock)" if is_mock else "InvestigationAgent (LLM)",
            action="INVESTIGATION_COMPLETED",
            details=f"Investigation synthesized with {len(result.suspicious_patterns)} patterns and {len(result.reasoning)} reasoning steps.",
            timestamp=utcnow()
        )
        self.db.add(audit)
        self.db.commit()

        return {
            "investigation_id": inv_record.investigation_id,
            "case_id": case_id,
            "summary": result.case_summary,
            "suspicious_patterns": result.suspicious_patterns,
            "reasoning": result.reasoning,
            "uncertainty": result.uncertainty,
            "questions_for_investigator": result.questions_for_investigator,
            "is_mock_ai": is_mock,
            "created_at": inv_record.created_at
        }

    def _call_llm(self, prompt: str) -> Optional[InvestigationResult]:
        """Calls OpenAI-compatible / Gemini endpoint and parses JSON output."""
        base_url = settings.LLM_BASE_URL.rstrip("/") if settings.LLM_BASE_URL else "https://generativelanguage.googleapis.com/v1beta/openai"
        url = f"{base_url}/chat/completions"

        headers = {
            "Authorization": f"Bearer {settings.LLM_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": settings.LLM_MODEL,
            "messages": [
                {"role": "system", "content": INVESTIGATION_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1
        }

        with httpx.Client(timeout=35.0) as client:
            resp = client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            return InvestigationResult(**parsed)

    def _generate_deterministic_investigation(
        self,
        case: Case,
        account: Optional[Account],
        customer: Optional[Customer],
        indicators: List[DetectionResult],
        evidence_records: List[Evidence],
        graph_feats: Dict[str, Any]
    ) -> InvestigationResult:
        """
        Produces a robust, fully evidence-cited investigation narrative
        without needing external LLM API tokens.
        """
        cust_name = customer.name if customer else "Unknown Subject"
        acc_id = case.account_id
        ev_ids = [e.evidence_id for e in evidence_records]

        patterns: List[SuspiciousPatternItem] = []
        reasoning_steps: List[ReasoningStep] = []
        step_counter = 1

        for ind in indicators:
            matching_evs = [
                e.evidence_id for e in evidence_records
                if any(tag in e.evidence_id.lower() for tag in ind.indicator_name.split("_")[:2])
            ]
            if not matching_evs and ev_ids:
                matching_evs = [ev_ids[0]]

            patterns.append(SuspiciousPatternItem(
                pattern_name=ind.indicator_name,
                description=ind.explanation,
                evidence_ids=matching_evs,
                confidence="HIGH" if ind.score >= 25 else "MEDIUM"
            ))

            reasoning_steps.append(ReasoningStep(
                step_number=step_counter,
                observation=f"Subject account {acc_id} exhibits quantifiable deviation in '{ind.indicator_name}' (Score contribution: {ind.score}).",
                analytical_interpretation=f"The transaction velocity and topological flow strongly align with typologies of {ind.indicator_name.replace('_', ' ')}.",
                referenced_evidence_ids=matching_evs
            ))
            step_counter += 1

        summary = (
            f"Case analysis for Subject {cust_name} (Account {acc_id}). "
            f"Automated graph and rule analytics flagged a composite risk score of {case.risk_score} ({case.risk_level}). "
            f"The account processed ${graph_feats.get('total_incoming_amount', 0.0):,.2f} in incoming volume and "
            f"${graph_feats.get('total_outgoing_amount', 0.0):,.2f} in outgoing volume across "
            f"{graph_feats.get('unique_counterparties', 0)} distinct counterparties. "
            f"Key risk drivers include: {', '.join([p.pattern_name.replace('_', ' ') for p in patterns])}."
        )

        uncertainties = [
            "Counterparty beneficial ownership verification pending third-party corporate registry lookup.",
            "Underlying commercial invoices and bills of lading not available in the internal transaction ledger.",
            "Possibility of high-volume seasonal trading activity cannot be completely ruled out without tax returns."
        ]

        questions = [
            "Can the customer provide verified sales agreements explaining the rapid flow of funds?",
            "Are the recipient counterparties associated with known entities in the same trade corridor?",
            "Has the customer declared this level of international wire transfer volume during initial onboarding?"
        ]

        return InvestigationResult(
            case_summary=summary,
            suspicious_patterns=patterns,
            evidence_items=ev_ids,
            reasoning=reasoning_steps,
            uncertainty=uncertainties,
            questions_for_investigator=questions,
            is_mock_ai=True
        )
