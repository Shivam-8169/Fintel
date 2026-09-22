"""
Authentication Router.
Handles investigator login, token issuance, and profile retrieval.
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import User, AuditLog
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse
from app.utils.security import verify_password, create_access_token
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(creds: LoginRequest, db: Session = Depends(get_db)):
    """Authenticates investigator or admin and returns JWT access token."""
    user = db.query(User).filter(User.email == creds.email).first()
    if not user or not verify_password(creds.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. For academic demo: investigator@fintel.local / investigator123"
        )

    token = create_access_token(subject=user.email)

    # Log login audit event
    audit = AuditLog(
        actor_type=user.role,
        actor_id=user.email,
        action="USER_LOGIN",
        details=f"User {user.name} logged in successfully.",
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user.role,
        name=user.name,
        email=user.email
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Returns profile of currently authenticated investigator."""
    return current_user
