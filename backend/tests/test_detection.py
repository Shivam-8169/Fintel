"""
Unit tests for Detection Rules and Risk Scoring Engine.
"""

import pytest
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database.database import Base
from app.database.models import Account, Transaction, Customer
from app.graph.builder import GraphBuilder
from app.detection.rules import RuleEvaluator
from app.detection.scoring import RiskScorer
from app.schemas.detection import IndicatorResult


@pytest.fixture
def detection_db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()

    # Create account with rapid movement and high value
    acc_target = Account(account_id="ACC-TARGET", account_type="CURRENT", created_at=datetime.utcnow())
    acc_src = Account(account_id="ACC-SRC", account_type="SAVINGS", created_at=datetime.utcnow())
    acc_dst = Account(account_id="ACC-DST", account_type="SAVINGS", created_at=datetime.utcnow())
    session.add_all([acc_target, acc_src, acc_dst])

    t0 = datetime(2026, 8, 1, 10, 0, 0)
    txs = [
        # Inbound high value $65,000
        Transaction(transaction_id="TX-IN", sender_account="ACC-SRC", receiver_account="ACC-TARGET", amount=65000.0, timestamp=t0),
        # Outbound rapid transfer $63,000 within 2 hours
        Transaction(transaction_id="TX-OUT", sender_account="ACC-TARGET", receiver_account="ACC-DST", amount=63000.0, timestamp=t0 + timedelta(hours=2))
    ]
    session.add_all(txs)
    session.commit()

    yield session
    session.close()


def test_rule_evaluator_flags_rapid_and_high_value(detection_db):
    graph = GraphBuilder(detection_db).build_transaction_graph()
    evaluator = RuleEvaluator(detection_db, graph)

    indicators, evidence = evaluator.evaluate_account("ACC-TARGET")
    indicator_names = [ind.name for ind in indicators]

    assert "high_value_transfers" in indicator_names
    assert "rapid_fund_movement" in indicator_names
    assert len(evidence) >= 2


def test_composite_risk_scorer():
    ind1 = IndicatorResult(name="high_value_transfers", score=25.0, explanation="High value transfer")
    ind2 = IndicatorResult(name="rapid_fund_movement", score=30.0, explanation="Rapid movement")

    score, level = RiskScorer.calculate_composite_score([ind1, ind2], base_risk_level="HIGH")
    assert score >= 55.0
    assert level in ("HIGH", "CRITICAL")
