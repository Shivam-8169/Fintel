"""
FastAPI Dependencies: Database sessions and JWT Authentication.
"""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import User
from app.utils.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Validates JWT access token and retrieves active user."""
    # For frictionless local academic testing, allow demo fallback if header omitted
    if not token:
        # Fallback to demo investigator for ease of demonstration if unauthenticated
        demo_user = db.query(User).filter(User.role == "INVESTIGATOR").first()
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
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Ensures caller has ADMIN authorization."""
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required."
        )
    return current_user
