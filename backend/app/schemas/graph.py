from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class GraphNode(BaseModel):
    id: str
    label: str
    is_focal: bool = False
    is_suspicious: bool = False
    account_type: str = "SAVINGS"
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    risk_level: Optional[str] = "LOW"
    risk_score: Optional[float] = 0.0
    in_degree: int = 0
    out_degree: int = 0
    total_in: float = 0.0
    total_out: float = 0.0


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    amount: float
    timestamp: str
    transaction_type: str = "WIRE_TRANSFER"
    is_suspicious: bool = False


class GraphDataResponse(BaseModel):
    account_id: str
    k_hops: int
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    total_nodes: int
    total_edges: int
    metrics: Dict[str, Any] = Field(default_factory=dict)
