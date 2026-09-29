"""
Authentication Router.
Handles login, token issuance, profile retrieval, and invite token acceptance.
No public self-signup allowed — strictly admin-invited accounts.
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import User, Invite, AuditLog
from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    UserResponse,
    ValidateInviteResponse,
    AcceptInviteRequest
)
from app.utils.security import verify_password, hash_password, create_access_token
from app.api.deps import get_current_user, normalize_role
from app.utils.datetime_utils import utcnow

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(creds: LoginRequest, db: Session = Depends(get_db)):
    """Authenticates existing user credentials and returns JWT access token."""
    user = db.query(User).filter(User.email == creds.email).first()
    if not user or not user.password_hash or not verify_password(creds.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Only invited active users may sign in."
        )

    if getattr(user, "status", "Active") == "Deactivated":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact an administrator."
        )

    if getattr(user, "status", "Active") == "Invited":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account setup pending. Please use your invitation link to set your password."
        )

    user.last_login_at = utcnow()
    user_role = normalize_role(user.role)

    # Log login audit event attributed to real user and role
    audit = AuditLog(
        actor_type=user_role,
        actor_id=user.name,
        action="USER_LOGIN",
        details=f"{user_role} {user.name} ({user.email}) logged into Fintel successfully.",
        timestamp=utcnow()
    )
    db.add(audit)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.email)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user_role,
        name=user.name,
        email=user.email,
        user_id=getattr(user, "user_id", None),
        status=getattr(user, "status", "Active")
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Returns profile of currently authenticated user with real role and account metadata."""
    return UserResponse(
        id=current_user.id,
        user_id=getattr(current_user, "user_id", f"USR-{current_user.id}"),
        name=current_user.name,
        email=current_user.email,
        role=normalize_role(current_user.role),
        status=getattr(current_user, "status", "Active"),
        invited_by=getattr(current_user, "invited_by", None),
        invited_at=getattr(current_user, "invited_at", None),
        last_login_at=getattr(current_user, "last_login_at", None),
        created_at=current_user.created_at
    )


@router.get("/validate-invite", response_model=ValidateInviteResponse)
def validate_invite(token: str = Query(..., description="Invitation token to validate"), db: Session = Depends(get_db)):
    """Validates that an invitation token exists, is not already accepted, and has not expired."""
    invite = db.query(Invite).filter(Invite.token == token).first()
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or unrecognized invitation link."
        )

    if invite.status == "Accepted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invitation link has already been accepted. Please sign in with your credentials."
        )

    if invite.expires_at < utcnow() or invite.status == "Expired":
        invite.status = "Expired"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invitation link has expired (7-day validity). Please request a new invite from an Admin."
        )

    # Check if there is an associated pending user record for name hint
    user = db.query(User).filter(User.email == invite.email).first()

    return ValidateInviteResponse(
        valid=True,
        email=invite.email,
        role=normalize_role(invite.role),
        name=user.name if user and user.name != invite.email else None,
        expires_at=invite.expires_at
    )


@router.post("/accept-invite", response_model=TokenResponse)
def accept_invite(req: AcceptInviteRequest, db: Session = Depends(get_db)):
    """
    Validates token, accepts the invitation, creates/activates user account with the
    assigned role, logs an immutable audit event, and returns an access token.
    """
    invite = db.query(Invite).filter(Invite.token == req.token).first()
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid invitation token."
        )

    if invite.status == "Accepted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invitation has already been accepted. Please sign in."
        )

    if invite.expires_at < utcnow():
        invite.status = "Expired"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invitation link has expired."
        )

    assigned_role = normalize_role(invite.role)

    # Check if user already exists (e.g. stub created when invite was sent)
    user = db.query(User).filter(User.email == invite.email).first()
    if user:
        user.name = req.name
        user.password_hash = hash_password(req.password)
        user.role = assigned_role
        user.status = "Active"
        user.last_login_at = utcnow()
    else:
        user = User(
            name=req.name,
            email=invite.email,
            password_hash=hash_password(req.password),
            role=assigned_role,
            status="Active",
            invited_by=invite.created_by,
            invited_at=invite.created_at,
            last_login_at=utcnow(),
            created_at=utcnow()
        )
        db.add(user)

    invite.status = "Accepted"

    # Commit user and invite changes
    db.commit()
    db.refresh(user)

    # Log audit provenance attributed to new user
    audit = AuditLog(
        actor_type=assigned_role,
        actor_id=user.name,
        action="INVITE_ACCEPTED",
        details=f"{user.name} ({user.email}) completed invite onboarding and joined as {assigned_role}. Invited by {invite.created_by}.",
        timestamp=utcnow()
    )
    db.add(audit)
    db.commit()

    token = create_access_token(subject=user.email)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=assigned_role,
        name=user.name,
        email=user.email,
        user_id=getattr(user, "user_id", None),
        status="Active"
    )
