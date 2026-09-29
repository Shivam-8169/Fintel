from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AuditLogCreate(BaseModel):
    case_id: Optional[str] = None
    actor_type: str = "INVESTIGATOR"  # INVESTIGATOR, SYSTEM, ADMIN, AI_AGENT
    actor_id: str = "SYSTEM"
    action: str
    details: Optional[str] = None


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    case_id: Optional[str] = None
    actor_type: str
    actor_id: str
    action: str
    details: Optional[str] = None
    timestamp: datetime
