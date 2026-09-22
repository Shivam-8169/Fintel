from typing import Generic, TypeVar, List, Optional
from pydantic import BaseModel

T = TypeVar("T")


class MessageResponse(BaseModel):
    message: str
    success: bool = True
    details: Optional[dict] = None


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int
