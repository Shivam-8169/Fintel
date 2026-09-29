from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str
    email: str
    user_id: Optional[str] = None
    status: Optional[str] = "Active"


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "Investigator"


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    user_id: Optional[str] = None
    name: str
    email: str
    role: str
    status: Optional[str] = "Active"
    invited_by: Optional[str] = None
    invited_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None
    created_at: datetime


class InviteCreate(BaseModel):
    email: str
    name: Optional[str] = None
    role: str = "Investigator"


class InviteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    invite_id: str
    email: str
    role: str
    token: str
    status: str
    created_by: str
    created_at: datetime
    expires_at: datetime
    invite_link: Optional[str] = None


class ValidateInviteResponse(BaseModel):
    valid: bool
    email: str
    role: str
    name: Optional[str] = None
    expires_at: datetime


class AcceptInviteRequest(BaseModel):
    token: str
    name: str
    password: str


class UserRoleUpdate(BaseModel):
    role: str


class UserStatusUpdate(BaseModel):
    status: str
