from typing import List, Optional
from pydantic import BaseModel, Field


class EvidenceItemSchema(BaseModel):
    evidence_id: str
    case_id: Optional[str] = None
    evidence_type: str  # TRANSACTION, GRAPH_METRIC, KYC, ANOMALY
    source_id: str
    description: str

    class Config:
        from_attributes = True


class IndicatorResult(BaseModel):
    name: str
    score: float
    explanation: str
    evidence_ids: List[str] = Field(default_factory=list)
    relevant_transactions: List[str] = Field(default_factory=list)
    graph_features: dict = Field(default_factory=dict)


class DetectionAnalysisResponse(BaseModel):
    account_id: str
    risk_score: float
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    indicators: List[IndicatorResult]
    evidence_items: List[EvidenceItemSchema] = Field(default_factory=list)
    case_created: bool = False
    case_id: Optional[str] = None
