"""
Unit tests for database models and relationships.
"""

import pytest
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database.database import Base
from app.database.models import User, Customer, Account, Transaction, Case, Evidence, DetectionResult, AuditLog
from app.utils.security import hash_password, verify_password
from app.utils.datetime_utils import utcnow


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()


def test_password_hashing():
    pwd = "secretpassword123"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("wrongpassword", hashed) is False


def test_customer_account_relationship(db_session):
    cust = Customer(
        customer_id="CUST-TEST-1",
        name="Test Customer",
        country="IND",
        occupation="Engineer",
        risk_level="LOW"
    )
    acc = Account(
        account_id="ACC-TEST-1",
        customer_id="CUST-TEST-1",
        account_type="SAVINGS",
        created_at=utcnow()
    )
    db_session.add_all([cust, acc])
    db_session.commit()

    retrieved = db_session.query(Customer).filter_by(customer_id="CUST-TEST-1").first()
    assert retrieved is not None
    assert len(retrieved.accounts) == 1
    assert retrieved.accounts[0].account_id == "ACC-TEST-1"


def test_case_evidence_cascade(db_session):
    acc = Account(account_id="ACC-T-2", account_type="SAVINGS", created_at=utcnow())
    case = Case(case_id="CASE-T-1", account_id="ACC-T-2", risk_score=85.0, risk_level="HIGH", status="NEW")
    ev = Evidence(evidence_id="EVD-T-1", case_id="CASE-T-1", evidence_type="TRANSACTION", source_id="TX-1", description="Test evidence")

    db_session.add_all([acc, case, ev])
    db_session.commit()

    retrieved_case = db_session.query(Case).filter_by(case_id="CASE-T-1").first()
    assert len(retrieved_case.evidence) == 1
    assert retrieved_case.evidence[0].evidence_id == "EVD-T-1"
