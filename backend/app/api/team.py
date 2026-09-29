"""
Team Management Router.
Handles team member directory, role assignment, user activation/deactivation,
and investigator invitation workflows.
Enforced strictly at the API layer: Admin privileges required for all operations.
"""

import secrets
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.database import get_db
from app.database.models import User, Invite, AuditLog
from app.schemas.auth import (
    UserResponse,
    InviteCreate,
    InviteResponse,
    UserRoleUpdate,
    UserStatusUpdate
)
from app.api.deps import require_admin, normalize_role
from app.utils.datetime_utils import utcnow

router = APIRouter(prefix="/team", tags=["Team Management"])

VALID_ROLES = ["Admin", "Lead Investigator", "Investigator"]


@router.get("/users", response_model=List[UserResponse])
def list_team_members(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    ADMIN ONLY: Retrieves list of all institutional users, roles, statuses, and login activity.
    """
    users = db.query(User).order_by(desc(User.created_at)).all()
    results = []
    for u in users:
        results.append(UserResponse(
            id=u.id,
            user_id=getattr(u, "user_id", f"USR-{u.id}"),
            name=u.name,
            email=u.email,
            role=normalize_role(u.role),
            status=getattr(u, "status", "Active"),
            invited_by=getattr(u, "invited_by", None),
            invited_at=getattr(u, "invited_at", None),
            last_login_at=getattr(u, "last_login_at", None),
            created_at=u.created_at
        ))
    return results


@router.post("/invite", response_model=InviteResponse)
def invite_user(
    req: InviteCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    ADMIN ONLY: Creates a new invitation record with a secure 7-day token
    and returns a copyable onboarding link.
    """
    email_clean = req.email.strip().lower()
    target_role = normalize_role(req.role)
    if target_role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{req.role}'. Must be one of: {', '.join(VALID_ROLES)}"
        )

    # Check if an active user already exists
    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user and getattr(existing_user, "status", "Active") == "Active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A user with email '{email_clean}' is already an active team member."
        )

    # Check for existing pending invite; if found, revoke it by expiring it
    existing_invite = db.query(Invite).filter(Invite.email == email_clean, Invite.status == "Pending").first()
    if existing_invite:
        existing_invite.status = "Expired"

    # Generate cryptographically secure token
    token = secrets.token_urlsafe(32)
    now = utcnow()
    expires = now + timedelta(days=7)

    invite = Invite(
        email=email_clean,
        role=target_role,
        token=token,
        status="Pending",
        created_by=admin.name,
        created_at=now,
        expires_at=expires
    )
    db.add(invite)

    # If user record doesn't exist, create an 'Invited' placeholder
    if not existing_user:
        invited_user = User(
            name=req.name.strip() if req.name and req.name.strip() else email_clean.split('@')[0].replace('.', ' ').title(),
            email=email_clean,
            password_hash="*INVITED_PENDING_PASSWORD*",
            role=target_role,
            status="Invited",
            invited_by=admin.name,
            invited_at=now,
            created_at=now
        )
        db.add(invited_user)
    else:
        existing_user.role = target_role
        existing_user.status = "Invited"
        existing_user.invited_by = admin.name
        existing_user.invited_at = now
        if req.name and req.name.strip():
            existing_user.name = req.name.strip()

    # Log audit event with acting admin's real name and role
    audit = AuditLog(
        actor_type=normalize_role(admin.role),
        actor_id=admin.name,
        action="USER_INVITED",
        details=f"{normalize_role(admin.role)} {admin.name} generated an invitation for {email_clean} as {target_role} (Expires in 7 days).",
        timestamp=now
    )
    db.add(audit)
    db.commit()
    db.refresh(invite)

    return InviteResponse(
        invite_id=invite.invite_id,
        email=invite.email,
        role=invite.role,
        token=invite.token,
        status=invite.status,
        created_by=invite.created_by,
        created_at=invite.created_at,
        expires_at=invite.expires_at,
        invite_link=f"/accept-invite?token={invite.token}"
    )


@router.get("/invites", response_model=List[InviteResponse])
def list_invites(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """ADMIN ONLY: Lists all invitation records and their statuses."""
    invites = db.query(Invite).order_by(desc(Invite.created_at)).all()
    now = utcnow()
    results = []
    for inv in invites:
        # Auto-update status if expired
        if inv.status == "Pending" and inv.expires_at < now:
            inv.status = "Expired"
        results.append(InviteResponse(
            invite_id=inv.invite_id,
            email=inv.email,
            role=normalize_role(inv.role),
            token=inv.token,
            status=inv.status,
            created_by=inv.created_by,
            created_at=inv.created_at,
            expires_at=inv.expires_at,
            invite_link=f"/accept-invite?token={inv.token}"
        ))
    db.commit()
    return results


@router.put("/users/{identifier}/role", response_model=UserResponse)
def update_user_role(
    identifier: str,
    req: UserRoleUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    ADMIN ONLY: Updates a user's role with mandatory audit trail logging.
    """
    new_role = normalize_role(req.role)
    if new_role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{req.role}'. Must be one of: {', '.join(VALID_ROLES)}"
        )

    # Lookup by user_id string, integer id, or email
    user = (
        db.query(User).filter(User.user_id == identifier).first() or
        db.query(User).filter(User.email == identifier).first()
    )
    if not user and identifier.isdigit():
        user = db.query(User).filter(User.id == int(identifier)).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    old_role = normalize_role(user.role)

    # Guard: prevent removing the last Admin in the system
    if old_role == "Admin" and new_role != "Admin":
        admin_count = db.query(User).filter(User.role.in_(["Admin", "ADMIN"]), User.status == "Active").count()
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot demote the last remaining active Administrator in the system."
            )

    user.role = new_role

    audit = AuditLog(
        actor_type=normalize_role(admin.role),
        actor_id=admin.name,
        action="USER_ROLE_CHANGED",
        details=f"{normalize_role(admin.role)} {admin.name} updated role for {user.name} ({user.email}) from {old_role} to {new_role}.",
        timestamp=utcnow()
    )
    db.add(audit)
    db.commit()
    db.refresh(user)

    return UserResponse(
        id=user.id,
        user_id=getattr(user, "user_id", f"USR-{user.id}"),
        name=user.name,
        email=user.email,
        role=new_role,
        status=getattr(user, "status", "Active"),
        invited_by=getattr(user, "invited_by", None),
        invited_at=getattr(user, "invited_at", None),
        last_login_at=getattr(user, "last_login_at", None),
        created_at=user.created_at
    )


@router.put("/users/{identifier}/status", response_model=UserResponse)
def update_user_status(
    identifier: str,
    req: UserStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    ADMIN ONLY: Activates or deactivates a user (soft-delete).
    Historical audit logs are preserved; deactivated users are blocked from logging in.
    """
    target_status = req.status.strip().title()
    if target_status not in ["Active", "Deactivated", "Invited"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be 'Active' or 'Deactivated'."
        )

    user = (
        db.query(User).filter(User.user_id == identifier).first() or
        db.query(User).filter(User.email == identifier).first()
    )
    if not user and identifier.isdigit():
        user = db.query(User).filter(User.id == int(identifier)).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # Guard: admin cannot deactivate themselves
    if user.email == admin.email and target_status == "Deactivated":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators cannot deactivate their own active account."
        )

    old_status = getattr(user, "status", "Active")
    user.status = target_status

    action_label = "USER_DEACTIVATED" if target_status == "Deactivated" else "USER_REACTIVATED"
    audit = AuditLog(
        actor_type=normalize_role(admin.role),
        actor_id=admin.name,
        action=action_label,
        details=f"{normalize_role(admin.role)} {admin.name} changed account status for {user.name} ({user.email}) from {old_status} to {target_status}.",
        timestamp=utcnow()
    )
    db.add(audit)
    db.commit()
    db.refresh(user)

    return UserResponse(
        id=user.id,
        user_id=getattr(user, "user_id", f"USR-{user.id}"),
        name=user.name,
        email=user.email,
        role=normalize_role(user.role),
        status=user.status,
        invited_by=getattr(user, "invited_by", None),
        invited_at=getattr(user, "invited_at", None),
        last_login_at=getattr(user, "last_login_at", None),
        created_at=user.created_at
    )
