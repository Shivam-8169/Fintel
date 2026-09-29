"""
One-Time Root Administrator Account Setup Script for Fintel.
Creates or resets the primary Administrator account from the CLI
without requiring existing user invitation.

Usage:
    python scripts/create_admin.py --email admin@fintel.local --password admin123 --name "System Administrator"
"""

import os
import sys
import argparse

# Setup path so backend app can be imported
workspace_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if workspace_root not in sys.path:
    sys.path.insert(0, workspace_root)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database.database import SessionLocal, init_db_schema
from app.database.models import User, AuditLog
from app.utils.security import hash_password
from app.utils.datetime_utils import utcnow


def create_or_reset_admin(email: str, password: str, name: str):
    init_db_schema()
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email.strip().lower()).first()
        if user:
            print(f"[!] User with email '{email}' already exists. Updating to Administrator...")
            user.name = name
            user.password_hash = hash_password(password)
            user.role = "Admin"
            user.status = "Active"
            action = "ADMIN_RESET"
            details = f"Admin account '{name}' ({email}) was reset via setup script."
        else:
            print(f"[+] Creating brand-new Administrator account for '{email}'...")
            user = User(
                name=name,
                email=email.strip().lower(),
                password_hash=hash_password(password),
                role="Admin",
                status="Active",
                invited_by="CLI Setup Script",
                invited_at=utcnow(),
                created_at=utcnow()
            )
            db.add(user)
            action = "ADMIN_INITIALIZED"
            details = f"Root Administrator '{name}' ({email}) initialized via one-time CLI setup script."

        audit = AuditLog(
            actor_type="Admin",
            actor_id=name,
            action=action,
            details=details,
            timestamp=utcnow()
        )
        db.add(audit)
        db.commit()
        db.refresh(user)

        print("\n=======================================================")
        print("  Fintel Administrator Successfully Configured!")
        print("=======================================================")
        print(f"  User ID : {getattr(user, 'user_id', user.id)}")
        print(f"  Name    : {user.name}")
        print(f"  Email   : {user.email}")
        print(f"  Role    : {user.role}")
        print(f"  Status  : {user.status}")
        print("=======================================================\n")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create or reset primary Fintel Administrator account.")
    parser.add_argument("--email", default="admin@fintel.local", help="Admin email address")
    parser.add_argument("--password", default="admin123", help="Admin password")
    parser.add_argument("--name", default="System Administrator", help="Admin display name")
    args = parser.parse_args()

    create_or_reset_admin(args.email, args.password, args.name)
