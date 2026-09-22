"""
Reporting Agent for Fintel.
Generates structured, human-readable, SAR-style draft reports
strictly watermarked with 'DRAFT — REQUIRES HUMAN REVIEW'.
"""

import json
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.database.models import Case, Account, Customer, Evidence, DetectionResult, Investigation, Report, AuditLog
from app.graph.builder import GraphBuilder
from app.graph.analysis import GraphAnalyzer
from app.schemas.report import (
    StructuredSARReport,
    CaseInfoSection,
    SubjectInfoSection,
    SuspiciousActivitySummarySection,
    TransactionAnalysisSection,
    GraphAnalysisSection,
    InvestigationFindingsSection,
    RiskIndicatorSection,
    SupportingEvidenceSection,
    InvestigatorReviewSection
)


class ReportingAgent:
    """Agent that synthesizes detection, graph, and investigation findings into a SAR draft."""

    def __init__(self, db: Session):
        self.db = db

    def generate_draft_report(self, case_id: str) -> Dict[str, Any]:
        """Generates or updates the structured SAR draft report for the given case."""
        case = self.db.query(Case).filter(Case.case_id == case_id).first()
        if not case:
            raise ValueError(f"Case '{case_id}' not found.")

        account = self.db.query(Account).filter(Account.account_id == case.account_id).first()
        customer = self.db.query(Customer).filter(Customer.customer_id == account.customer_id).first() if account else None
        evidence_records = self.db.query(Evidence).filter(Evidence.case_id == case_id).all()
        indicators = self.db.query(DetectionResult).filter(DetectionResult.case_id == case_id).all()
        investigation = self.db.query(Investigation).filter(Investigation.case_id == case_id).first()

        # Topological graph features
        graph = GraphBuilder(self.db).build_transaction_graph()
        analyzer = GraphAnalyzer(graph)
        graph_feats = analyzer.calculate_graph_features(case.account_id)

        # 1. Case Info
        case_info = CaseInfoSection(
            case_id=case.case_id,
            filing_type="SUSPICIOUS_ACTIVITY_REPORT_DRAFT",
            watermark="DRAFT — REQUIRES HUMAN REVIEW",
            date_drafted=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            investigating_entity="Fintel Autonomous AML Engine",
            human_status="UNAPPROVED"
        )

        # 2. Subject Info
        subject_info = SubjectInfoSection(
            account_id=case.account_id,
            account_type=account.account_type if account else "[Information not available]",
            customer_id=customer.customer_id if customer else "[Information not available]",
            customer_name=customer.name if customer else "[Information not available]",
            country=customer.country if customer else "[Information not available]",
            occupation=(customer.occupation if (customer and customer.occupation) else "[Information not available]"),
            customer_risk_rating=customer.risk_level if customer else "LOW"
        )

        # 3. Suspicious Activity Summary
        typologies = [ind.indicator_name for ind in indicators]
        total_vol = max(graph_feats.get("total_incoming_amount", 0.0), graph_feats.get("total_outgoing_amount", 0.0))
        summary_text = (
            investigation.summary if investigation
            else f"Subject {case.account_id} flagged with composite risk score {case.risk_score}."
        )
        suspicious_summary = SuspiciousActivitySummarySection(
            narrative_summary=summary_text,
            typologies_detected=typologies,
            total_suspicious_volume=total_vol,
            timeframe_start="2026-08-01 00:00:00",
            timeframe_end=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        )

        # 4. Transaction Analysis
        key_txs = []
        for ev in evidence_records:
            if ev.evidence_type == "TRANSACTION":
                key_txs.append({"evidence_id": ev.evidence_id, "detail": ev.description})

        tx_analysis = TransactionAnalysisSection(
            total_transactions_analyzed=graph_feats.get("in_degree", 0) + graph_feats.get("out_degree", 0),
            rapid_movement_flagged=any("rapid" in t.lower() for t in typologies),
            high_value_transactions_count=len([ev for ev in evidence_records if "HV" in ev.evidence_id]),
            structuring_evidence_count=len([ev for ev in evidence_records if "STRUCT" in ev.evidence_id]),
            key_transactions=key_txs[:10]
        )

        # 5. Graph Analysis
        network_role = "Transshipment / Intermediary Node" if graph_feats.get("pass_through_ratio", 0) > 0.6 else "Origin / End Beneficiary"
        graph_analysis = GraphAnalysisSection(
            fan_in_ratio=graph_feats.get("fan_in_ratio", 0.0),
            fan_out_ratio=graph_feats.get("fan_out_ratio", 0.0),
            immediate_counterparties_count=graph_feats.get("unique_counterparties", 0),
            network_role=network_role,
            subgraph_summary=f"Ego network demonstrates {graph_feats.get('in_degree', 0)} incoming lines and {graph_feats.get('out_degree', 0)} outgoing paths."
        )

        # 6. Investigation Findings
        reasoning_points = []
        observations = []
        interpretations = []
        uncertainties = []

        if investigation:
            try:
                reasoning_list = json.loads(investigation.reasoning)
                for r in reasoning_list:
                    observations.append(r.get("observation", ""))
                    interpretations.append(r.get("analytical_interpretation", ""))
                    ref_ev = ", ".join(r.get("referenced_evidence_ids", []))
                    reasoning_points.append(f"[Step {r.get('step_number')}] {r.get('observation')} -> {r.get('analytical_interpretation')} (Evidence: {ref_ev})")
                uncertainties = json.loads(investigation.uncertainty)
            except Exception:
                pass

        if not reasoning_points:
            reasoning_points = ["Automated algorithmic analysis conducted without manual override."]

        inv_findings = InvestigationFindingsSection(
            core_reasoning_points=reasoning_points,
            factual_observations=observations,
            analytical_interpretations=interpretations,
            uncertainties_and_gaps=uncertainties
        )

        # 7. Risk Indicators
        risk_indicators = RiskIndicatorSection(
            composite_risk_score=case.risk_score,
            risk_level=case.risk_level,
            contributing_indicators=[
                {"indicator": ind.indicator_name, "score": ind.score, "explanation": ind.explanation}
                for ind in indicators
            ]
        )

        # 8. Supporting Evidence
        evidence_table = [
            {"evidence_id": ev.evidence_id, "type": ev.evidence_type, "source": ev.source_id, "description": ev.description}
            for ev in evidence_records
        ]
        supporting_evidence = SupportingEvidenceSection(evidence_table=evidence_table)

        # 9. Review Section
        review_section = InvestigatorReviewSection(
            reviewer_notes=None,
            approval_status="DRAFT",
            reviewed_by=None,
            reviewed_at=None,
            decision_reasoning=None
        )

        sar_report = StructuredSARReport(
            disclaimer="DRAFT — REQUIRES HUMAN REVIEW. Strictly for academic simulation; not an official regulatory filing.",
            case_information=case_info,
            subject_information=subject_info,
            suspicious_activity_summary=suspicious_summary,
            transaction_analysis=tx_analysis,
            graph_analysis=graph_analysis,
            investigation_findings=inv_findings,
            risk_indicators=risk_indicators,
            supporting_evidence=supporting_evidence,
            investigator_review_section=review_section
        )

        # Persist report
        existing_report = self.db.query(Report).filter(Report.case_id == case_id).first()
        report_json = sar_report.model_dump_json()

        if existing_report:
            existing_report.report_content = report_json
            existing_report.status = "DRAFT"
            existing_report.updated_at = datetime.utcnow()
            report_id = existing_report.report_id
        else:
            report_id = f"SAR-{case.case_id.replace('CASE-', '')}"
            new_report = Report(
                report_id=report_id,
                case_id=case_id,
                report_content=report_json,
                status="DRAFT",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            self.db.add(new_report)

        case.status = "REPORT_DRAFTED"
        case.updated_at = datetime.utcnow()

        audit = AuditLog(
            case_id=case_id,
            actor_type="AI_AGENT",
            actor_id="ReportingAgent",
            action="REPORT_DRAFTED",
            details=f"SAR draft {report_id} compiled with 9 standard sections watermarked for human review.",
            timestamp=datetime.utcnow()
        )
        self.db.add(audit)
        self.db.commit()

        return {
            "report_id": report_id,
            "case_id": case_id,
            "status": "DRAFT",
            "report_content": sar_report,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
