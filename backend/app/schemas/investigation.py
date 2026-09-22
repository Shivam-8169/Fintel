from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class SuspiciousPatternItem(BaseModel):
    pattern_name: str
    description: str
    evidence_ids: List[str] = Field(default_factory=list)
    confidence: str = "HIGH"  # HIGH, MEDIUM, LOW


class ReasoningStep(BaseModel):
    step_number: int
    observation: str
    analytical_interpretation: str
    referenced_evidence_ids: List[str] = Field(default_factory=list)


class InvestigationResult(BaseModel):
    case_summary: str
    suspicious_patterns: List[SuspiciousPatternItem] = Field(default_factory=list)
    evidence_items: List[str] = Field(default_factory=list)
    reasoning: List[ReasoningStep] = Field(default_factory=list)
    uncertainty: List[str] = Field(default_factory=list)
    questions_for_investigator: List[str] = Field(default_factory=list)
    is_mock_ai: bool = False


class InvestigationResponse(BaseModel):
    investigation_id: str
    case_id: str
    summary: str
    suspicious_patterns: List[SuspiciousPatternItem]
    reasoning: List[ReasoningStep]
    uncertainty: List[str]
    questions_for_investigator: List[str]
    is_mock_ai: bool
    created_at: datetime
