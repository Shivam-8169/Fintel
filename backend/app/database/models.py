import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    DateTime,
    ForeignKey,
    Text,
    Enum,
    Index
)
from sqlalchemy.orm import relationship
from app.database.database import Base
from app.utils.datetime_utils import utcnow


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(50), unique=True, index=True, nullable=False, default=lambda: f"USR-{uuid.uuid4().hex[:8].upper()}")
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=True)  # Nullable when invited before setting password
    role = Column(String(50), default="Investigator", nullable=False)  # Admin | Lead Investigator | Investigator
    status = Column(String(50), default="Active", nullable=False)  # Invited | Active | Deactivated
    invited_by = Column(String(100), nullable=True)
    invited_at = Column(DateTime, nullable=True)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)


class Invite(Base):
    __tablename__ = "invites"

    invite_id = Column(String(50), primary_key=True, index=True, default=lambda: f"INV-{uuid.uuid4().hex[:8].upper()}")
    email = Column(String(255), nullable=False, index=True)
    role = Column(String(50), default="Investigator", nullable=False)  # Admin | Lead Investigator | Investigator
    token = Column(String(100), unique=True, index=True, nullable=False)
    status = Column(String(50), default="Pending", nullable=False)  # Pending | Accepted | Expired
    created_by = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)


class Customer(Base):
    __tablename__ = "customers"

    customer_id = Column(String(50), primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    country = Column(String(100), default="IND", nullable=False)
    occupation = Column(String(100), nullable=True)
    risk_level = Column(String(20), default="LOW", nullable=False)  # LOW, MEDIUM, HIGH

    accounts = relationship("Account", back_populates="customer", cascade="all, delete-orphan")


class Account(Base):
    __tablename__ = "accounts"

    account_id = Column(String(50), primary_key=True, index=True)
    customer_id = Column(String(50), ForeignKey("customers.customer_id"), nullable=True)
    account_type = Column(String(50), default="SAVINGS", nullable=False)  # SAVINGS, CURRENT, BUSINESS
    created_at = Column(DateTime, default=utcnow, nullable=False)

    customer = relationship("Customer", back_populates="accounts")
    cases = relationship("Case", back_populates="account")


class Transaction(Base):
    __tablename__ = "transactions"

    transaction_id = Column(String(50), primary_key=True, index=True)
    sender_account = Column(String(50), ForeignKey("accounts.account_id"), index=True, nullable=False)
    receiver_account = Column(String(50), ForeignKey("accounts.account_id"), index=True, nullable=False)
    amount = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=utcnow, index=True, nullable=False)
    transaction_type = Column(String(50), default="WIRE_TRANSFER", nullable=False)

    __table_args__ = (
        Index("ix_tx_sender_receiver", "sender_account", "receiver_account"),
    )


class Case(Base):
    __tablename__ = "cases"

    case_id = Column(String(50), primary_key=True, index=True)
    account_id = Column(String(50), ForeignKey("accounts.account_id"), index=True, nullable=False)
    risk_score = Column(Float, default=0.0, nullable=False)
    risk_level = Column(String(20), default="LOW", nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(50), default="NEW", nullable=False)  # NEW, UNDER_INVESTIGATION, REPORT_DRAFTED, PENDING_REVIEW, APPROVED, REJECTED, CLOSED
    assigned_to = Column(String(100), nullable=True)  # Name or email of assigned investigator
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    account = relationship("Account", back_populates="cases")
    detection_results = relationship("DetectionResult", back_populates="case", cascade="all, delete-orphan")
    evidence = relationship("Evidence", back_populates="case", cascade="all, delete-orphan")
    investigations = relationship("Investigation", back_populates="case", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="case", cascade="all, delete-orphan")
    notes = relationship("InvestigatorNote", back_populates="case", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="case", cascade="all, delete-orphan")


class DetectionResult(Base):
    __tablename__ = "detection_results"

    detection_id = Column(String(50), primary_key=True, index=True, default=lambda: f"DET-{uuid.uuid4().hex[:8].upper()}")
    case_id = Column(String(50), ForeignKey("cases.case_id"), index=True, nullable=False)
    indicator_name = Column(String(100), nullable=False)
    score = Column(Float, default=0.0, nullable=False)
    explanation = Column(Text, nullable=False)

    case = relationship("Case", back_populates="detection_results")


class Evidence(Base):
    __tablename__ = "evidence"

    evidence_id = Column(String(50), primary_key=True, index=True, default=lambda: f"EVD-{uuid.uuid4().hex[:8].upper()}")
    case_id = Column(String(50), ForeignKey("cases.case_id"), index=True, nullable=False)
    evidence_type = Column(String(50), nullable=False)  # TRANSACTION, GRAPH_METRIC, KYC, ANOMALY
    source_id = Column(String(100), nullable=False)  # e.g., TX ID, Account ID, Indicator
    description = Column(Text, nullable=False)

    case = relationship("Case", back_populates="evidence")


class Investigation(Base):
    __tablename__ = "investigations"

    investigation_id = Column(String(50), primary_key=True, index=True, default=lambda: f"INV-{uuid.uuid4().hex[:8].upper()}")
    case_id = Column(String(50), ForeignKey("cases.case_id"), index=True, nullable=False)
    summary = Column(Text, nullable=False)
    suspicious_patterns = Column(Text, nullable=False)  # JSON serialized list of pattern objects
    reasoning = Column(Text, nullable=False)  # JSON serialized list of reasoning steps
    uncertainty = Column(Text, nullable=True)  # JSON serialized list of uncertainties
    created_at = Column(DateTime, default=utcnow, nullable=False)

    case = relationship("Case", back_populates="investigations")


class Report(Base):
    __tablename__ = "reports"

    report_id = Column(String(50), primary_key=True, index=True, default=lambda: f"SAR-{uuid.uuid4().hex[:8].upper()}")
    case_id = Column(String(50), ForeignKey("cases.case_id"), index=True, nullable=False)
    report_content = Column(Text, nullable=False)  # JSON serialized structured SAR report
    status = Column(String(50), default="DRAFT", nullable=False)  # DRAFT, PENDING_REVIEW, APPROVED, REJECTED
    version = Column(String(20), default="1.0", nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    case = relationship("Case", back_populates="reports")


class InvestigatorNote(Base):
    __tablename__ = "investigator_notes"

    note_id = Column(String(50), primary_key=True, index=True, default=lambda: f"NOTE-{uuid.uuid4().hex[:8].upper()}")
    case_id = Column(String(50), ForeignKey("cases.case_id"), index=True, nullable=False)
    note_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    case = relationship("Case", back_populates="notes")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    case_id = Column(String(50), ForeignKey("cases.case_id"), index=True, nullable=True)
    actor_type = Column(String(50), default="INVESTIGATOR", nullable=False)  # INVESTIGATOR, SYSTEM, ADMIN, AI_AGENT
    actor_id = Column(String(100), default="SYSTEM", nullable=False)
    action = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)  # JSON serialized action details
    timestamp = Column(DateTime, default=utcnow, index=True, nullable=False)

    case = relationship("Case", back_populates="audit_logs")
