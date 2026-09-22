from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str
    email: str


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "INVESTIGATOR"


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True
