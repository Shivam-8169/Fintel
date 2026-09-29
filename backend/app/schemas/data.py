from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class IngestionWarning(BaseModel):
    row: int
    field: str
    message: str
    rejected: bool = False


class IngestionSummary(BaseModel):
    dataset_name: str
    records_received: int
    records_valid: int
    records_rejected: int
    warnings: List[IngestionWarning] = Field(default_factory=list)
    customers_added: int = 0
    accounts_added: int = 0
    transactions_added: int = 0


class CustomerSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    customer_id: str
    name: str
    country: str = "IND"
    occupation: Optional[str] = None
    risk_level: str = "LOW"


class AccountSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    account_id: str
    customer_id: Optional[str] = None
    account_type: str = "SAVINGS"
    created_at: datetime


class TransactionSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    transaction_id: str
    sender_account: str
    receiver_account: str
    amount: float
    timestamp: datetime
    transaction_type: str = "WIRE_TRANSFER"


class StatementColumnMapping(BaseModel):
    date: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[str] = None
    debit: Optional[str] = None
    credit: Optional[str] = None
    account_id: Optional[str] = None
    counterparty: Optional[str] = None
    balance: Optional[str] = None


class StatementPreviewResponse(BaseModel):
    filename: str
    file_size_bytes: int
    total_rows: int
    columns: List[str]
    sample_rows: List[dict]
    suggested_mapping: dict


class SuspiciousFinding(BaseModel):
    finding_id: str
    case_id: Optional[str] = None
    account_id: str
    typology: str
    risk_level: str
    risk_score: float
    explanation: str
    triggers: List[str] = Field(default_factory=list)
    supporting_evidence_ids: List[str] = Field(default_factory=list)
    key_metrics: dict = Field(default_factory=dict)


class StatementAnalysisResult(BaseModel):
    status: str = "SUCCESS"
    transactions_analyzed: int
    potentially_suspicious_transactions: int
    potentially_suspicious_accounts: int
    cases_generated: int
    evidence_items: int
    pipeline_stages: List[dict] = Field(default_factory=list)
    findings: List[SuspiciousFinding] = Field(default_factory=list)
    generated_case_ids: List[str] = Field(default_factory=list)

