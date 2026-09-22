from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class CaseInfoSection(BaseModel):
    case_id: str
    filing_type: str = "SUSPICIOUS_ACTIVITY_REPORT_DRAFT"
    watermark: str = "DRAFT — REQUIRES HUMAN REVIEW"
    date_drafted: str
    investigating_entity: str = "Fintel Autonomous AML Engine"
    human_status: str = "UNAPPROVED"


class SubjectInfoSection(BaseModel):
    account_id: str
    account_type: str
    customer_id: str
    customer_name: str
    country: str
    occupation: Optional[str] = "[Information not available]"
    customer_risk_rating: str


class SuspiciousActivitySummarySection(BaseModel):
    narrative_summary: str
    typologies_detected: List[str]
    total_suspicious_volume: float
    timeframe_start: str
    timeframe_end: str


class TransactionAnalysisSection(BaseModel):
    total_transactions_analyzed: int
    rapid_movement_flagged: bool
    high_value_transactions_count: int
    structuring_evidence_count: int
    key_transactions: List[Dict[str, Any]]


class GraphAnalysisSection(BaseModel):
    fan_in_ratio: float
    fan_out_ratio: float
    immediate_counterparties_count: int
    network_role: str
    subgraph_summary: str


class InvestigationFindingsSection(BaseModel):
    core_reasoning_points: List[str]
    factual_observations: List[str]
    analytical_interpretations: List[str]
    uncertainties_and_gaps: List[str]


class RiskIndicatorSection(BaseModel):
    composite_risk_score: float
    risk_level: str
    contributing_indicators: List[Dict[str, Any]]


class SupportingEvidenceSection(BaseModel):
    evidence_table: List[Dict[str, Any]]


class InvestigatorReviewSection(BaseModel):
    reviewer_notes: Optional[str] = None
    approval_status: str = "DRAFT"  # DRAFT, PENDING_REVIEW, APPROVED, REJECTED
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    decision_reasoning: Optional[str] = None


class StructuredSARReport(BaseModel):
    disclaimer: str = "DRAFT — REQUIRES HUMAN REVIEW. Strictly for academic simulation; not an official regulatory filing."
    case_information: CaseInfoSection
    subject_information: SubjectInfoSection
    suspicious_activity_summary: SuspiciousActivitySummarySection
    transaction_analysis: TransactionAnalysisSection
    graph_analysis: GraphAnalysisSection
    investigation_findings: InvestigationFindingsSection
    risk_indicators: RiskIndicatorSection
    supporting_evidence: SupportingEvidenceSection
    investigator_review_section: InvestigatorReviewSection


class ReportResponse(BaseModel):
    report_id: str
    case_id: str
    status: str
    report_content: StructuredSARReport
    created_at: datetime
    updated_at: datetime


class ReportUpdateRequest(BaseModel):
    report_content: StructuredSARReport
    notes: Optional[str] = None


class ReportDecisionRequest(BaseModel):
    decision: str  # APPROVE, REJECT
    notes: Optional[str] = ""
    reviewer_name: str = "Demo Investigator"
