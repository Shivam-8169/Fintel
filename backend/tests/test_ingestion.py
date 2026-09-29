"""
Unit tests for Data Ingestion Agent.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database.database import Base
from app.agents.ingestion_agent import IngestionAgent
from app.database.models import Customer, Account, Transaction


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()


def test_ingest_customers_valid_and_invalid(db_session):
    agent = IngestionAgent(db_session)
    csv_data = (
        "customer_id,name,country,occupation,risk_level\n"
        "CUST-001,John Doe,USA,Analyst,LOW\n"
        ",Empty ID,IND,Trader,HIGH\n"
        "CUST-002,Jane Smith,GBR,Doctor,MEDIUM\n"
        "CUST-001,Duplicate ID,IND,Engineer,LOW\n"
    ).encode("utf-8")

    summary = agent.ingest_customers_csv(csv_data, "customers.csv")
    assert summary.records_received == 4
    assert summary.records_valid == 2
    assert summary.records_rejected == 2
    assert db_session.query(Customer).count() == 2


def test_ingest_transactions_normalizes_amounts(db_session):
    agent = IngestionAgent(db_session)
    csv_data = (
        'transaction_id,sender_account,receiver_account,amount,timestamp,transaction_type\n'
        'TX-01,ACC-A,ACC-B,"$12,500.50",2026-08-01 10:00:00,WIRE_TRANSFER\n'
        'TX-02,ACC-B,ACC-C,-500.00,2026-08-01 11:00:00,ACH\n'
        'TX-03,ACC-A,ACC-A,1000.00,2026-08-01 12:00:00,UPI\n'
    ).encode("utf-8")

    summary = agent.ingest_transactions_csv(csv_data, "transactions.csv")
    assert summary.records_received == 3
    assert summary.records_valid == 1
    assert summary.records_rejected == 2  # Negative amount rejected, self-transfer rejected

    tx = db_session.query(Transaction).filter_by(transaction_id="TX-01").first()
    assert tx is not None
    assert tx.amount == 12500.50


def test_ingest_accounts_handles_relationships_and_defaults(db_session):
    agent = IngestionAgent(db_session)
    # First create a customer
    cust_data = "customer_id,name\nCUST-100,Alice Smith\n".encode("utf-8")
    agent.ingest_customers_csv(cust_data)

    csv_data = (
        "account_id,customer_id,account_type\n"
        "ACC-001,CUST-100,CHECKING\n"
        "ACC-002,NON_EXISTENT,SAVINGS\n"  # Auto-provisions customer or sets None with warning
        "ACC-003,,SAVINGS\n"
        ",CUST-100,SAVINGS\n"  # Empty account_id rejected
    ).encode("utf-8")

    summary = agent.ingest_accounts_csv(csv_data, "accounts.csv")
    assert summary.records_received == 4
    assert summary.records_valid == 3
    assert summary.records_rejected == 1
    assert db_session.query(Account).count() == 3

