from typing import List, Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.detection import IndicatorResult, EvidenceItemSchema
from app.schemas.data import CustomerSchema, AccountSchema, TransactionSchema


class InvestigatorNoteCreate(BaseModel):
    note_text: str


class InvestigatorNoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    note_id: str
    case_id: str
    note_text: str
    created_at: datetime
    author_name: Optional[str] = None
    author_role: Optional[str] = None


class CaseListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    case_id: str
    account_id: str
    customer_name: Optional[str] = "Unknown"
    risk_score: float
    risk_level: str
    status: str
    assigned_to: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    indicator_count: int = 0
    evidence_count: int = 0


class CaseDetailResponse(BaseModel):
    case_id: str
    account_id: str
    risk_score: float
    risk_level: str
    status: str
    assigned_to: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    account: Optional[AccountSchema] = None
    customer: Optional[CustomerSchema] = None
    indicators: List[IndicatorResult] = Field(default_factory=list)
    evidence: List[EvidenceItemSchema] = Field(default_factory=list)
    notes: List[InvestigatorNoteResponse] = Field(default_factory=list)
    has_investigation: bool = False
    has_report: bool = False
    report_status: Optional[str] = None


class CaseStatusUpdate(BaseModel):
    status: str  # NEW, UNDER_INVESTIGATION, REPORT_DRAFTED, PENDING_REVIEW, APPROVED, REJECTED, CLOSED
    reason: Optional[str] = None


class CaseAssignRequest(BaseModel):
    assigned_to: str  # Investigator name or email
