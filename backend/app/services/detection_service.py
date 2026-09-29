"""
Detection Service for Fintel.
Orchestrates graph building, rules evaluation, risk scoring, case creation,
and evidence registration.
"""

import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.database.models import Account, Case, DetectionResult, Evidence, AuditLog, Customer
from app.graph.builder import GraphBuilder
from app.detection.rules import RuleEvaluator
from app.detection.scoring import RiskScorer
from app.schemas.detection import DetectionAnalysisResponse, IndicatorResult, EvidenceItemSchema
from app.utils.datetime_utils import utcnow


class DetectionService:
    """Service to execute full AML detection cycle across accounts."""

    def __init__(self, db: Session):
        self.db = db

    def run_detection_pipeline(self, target_account_id: Optional[str] = None) -> List[DetectionAnalysisResponse]:
        """Runs the detection engine across one or all accounts in the database."""
        graph_builder = GraphBuilder(self.db)
        graph = graph_builder.build_transaction_graph()
        evaluator = RuleEvaluator(self.db, graph)

        if target_account_id:
            accounts_to_check = self.db.query(Account).filter(Account.account_id == target_account_id).all()
        else:
            accounts_to_check = self.db.query(Account).all()

        results: List[DetectionAnalysisResponse] = []

        for acc in accounts_to_check:
            indicators, evidence_items = evaluator.evaluate_account(acc.account_id)
            cust = self.db.query(Customer).filter(Customer.customer_id == acc.customer_id).first()
            base_risk = cust.risk_level if cust else "LOW"

            risk_score, risk_level = RiskScorer.calculate_composite_score(indicators, base_risk)

            case_created = False
            case_id = None

            # Check if risk exceeds threshold to create/update a Case
            if risk_score >= settings.DETECTION_THRESHOLD:
                case = self.db.query(Case).filter(Case.account_id == acc.account_id).first()
                if not case:
                    case_id = f"CASE-{uuid.uuid4().hex[:6].upper()}"
                    case = Case(
                        case_id=case_id,
                        account_id=acc.account_id,
                        risk_score=risk_score,
                        risk_level=risk_level,
                        status="NEW",
                        created_at=utcnow(),
                        updated_at=utcnow()
                    )
                    self.db.add(case)
                    case_created = True

                    # Audit log for case creation
                    audit = AuditLog(
                        case_id=case_id,
                        actor_type="SYSTEM",
                        actor_id="DetectionAgent",
                        action="CASE_CREATED",
                        details=f"Case opened automatically for account {acc.account_id} with score {risk_score} ({risk_level}).",
                        timestamp=utcnow()
                    )
                    self.db.add(audit)
                else:
                    case_id = case.case_id
                    case.risk_score = risk_score
                    case.risk_level = risk_level
                    case.updated_at = utcnow()

                # Flush to get case available
                self.db.flush()

                # Persist detection results (indicators)
                # Clear existing detection results and evidence for this case to avoid duplicates on re-run
                self.db.query(DetectionResult).filter(DetectionResult.case_id == case_id).delete()
                for ind in indicators:
                    det = DetectionResult(
                        detection_id=f"DET-{uuid.uuid4().hex[:8].upper()}",
                        case_id=case_id,
                        indicator_name=ind.name,
                        score=ind.score,
                        explanation=ind.explanation
                    )
                    self.db.add(det)

                # Persist evidence items cleanly for this case
                self.db.query(Evidence).filter(Evidence.case_id == case_id).delete()
                for ev in evidence_items:
                    unique_ev_id = f"{case_id}-{ev.evidence_id}"
                    ev_model = Evidence(
                        evidence_id=unique_ev_id,
                        case_id=case_id,
                        evidence_type=ev.evidence_type,
                        source_id=ev.source_id,
                        description=ev.description
                    )
                    self.db.add(ev_model)

                self.db.commit()
            else:
                # Prune obsolete unreviewed NEW cases if score falls below threshold
                obsolete_case = self.db.query(Case).filter(Case.account_id == acc.account_id, Case.status == "NEW").first()
                if obsolete_case:
                    self.db.delete(obsolete_case)
                    self.db.commit()

            results.append(DetectionAnalysisResponse(
                account_id=acc.account_id,
                risk_score=risk_score,
                risk_level=risk_level,
                indicators=indicators,
                evidence_items=evidence_items,
                case_created=case_created,
                case_id=case_id
            ))

        return results
