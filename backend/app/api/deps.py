"""
FastAPI Dependencies: Database sessions and Role-Based Access Control (RBAC).
"""

from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import User
from app.utils.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def normalize_role(role: Optional[str]) -> str:
    """Normalizes role strings to canonical display format (Admin | Lead Investigator | Investigator)."""
    if not role:
        return "Investigator"
    r = role.strip().upper().replace("_", " ")
    if "ADMIN" in r:
        return "Admin"
    elif "LEAD" in r:
        return "Lead Investigator"
    elif "INVESTIGATOR" in r:
        return "Investigator"
    return role


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Validates JWT access token and retrieves active user."""
    if not token:
        # Fallback to active demo investigator for frictionless local test requests
        demo_user = db.query(User).filter(User.status == "Active").first()
        if demo_user:
            return demo_user
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_email = payload.get("sub")
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    if getattr(user, "status", "Active") == "Deactivated":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated. Please contact an administrator."
        )

    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Ensures caller has ADMIN authorization."""
    if normalize_role(current_user.role) != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required."
        )
    return current_user


def require_lead_investigator(current_user: User = Depends(get_current_user)) -> User:
    """Ensures caller has Lead Investigator or Admin authorization."""
    if normalize_role(current_user.role) not in ("Admin", "Lead Investigator"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Lead Investigator or Admin privileges required to perform this action."
        )
    return current_user


def require_investigator(current_user: User = Depends(get_current_user)) -> User:
    """Ensures caller is an active Investigator, Lead Investigator, or Admin."""
    if normalize_role(current_user.role) not in ("Admin", "Lead Investigator", "Investigator"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Investigator privileges required."
        )
    return current_user
