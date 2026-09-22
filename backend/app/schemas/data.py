from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


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
    customer_id: str
    name: str
    country: str = "IND"
    occupation: Optional[str] = None
    risk_level: str = "LOW"

    class Config:
        from_attributes = True


class AccountSchema(BaseModel):
    account_id: str
    customer_id: Optional[str] = None
    account_type: str = "SAVINGS"
    created_at: datetime

    class Config:
        from_attributes = True


class TransactionSchema(BaseModel):
    transaction_id: str
    sender_account: str
    receiver_account: str
    amount: float
    timestamp: datetime
    transaction_type: str = "WIRE_TRANSFER"

    class Config:
        from_attributes = True
