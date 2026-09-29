"""
Unit tests for Investigation Agent and Reporting Agent.
"""

import pytest
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database.database import Base
from app.database.models import Account, Case, DetectionResult, Evidence, Customer
from app.agents.investigation_agent import InvestigationAgent
from app.agents.reporting_agent import ReportingAgent
from app.utils.datetime_utils import utcnow


@pytest.fixture
def agent_db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()

    cust = Customer(customer_id="CUST-1", name="Vikram Enterprises", country="IND", risk_level="HIGH")
    acc = Account(account_id="ACC-VIKRAM", customer_id="CUST-1", account_type="BUSINESS", created_at=utcnow())
    case = Case(case_id="CASE-AGENT-TEST", account_id="ACC-VIKRAM", risk_score=85.0, risk_level="HIGH", status="NEW")

    det = DetectionResult(case_id="CASE-AGENT-TEST", indicator_name="rapid_fund_movement", score=30.0, explanation="Rapid pass-through observed")
    ev = Evidence(evidence_id="EVD-TX-101", case_id="CASE-AGENT-TEST", evidence_type="TRANSACTION", source_id="TX-101", description="Inbound $50,000 swiftly transferred out.")

    session.add_all([cust, acc, case, det, ev])
    session.commit()

    yield session
    session.close()


def test_investigation_agent_generates_grounded_findings(agent_db):
    agent = InvestigationAgent(agent_db)
    result = agent.investigate_case("CASE-AGENT-TEST")

    assert result["case_id"] == "CASE-AGENT-TEST"
    assert len(result["suspicious_patterns"]) > 0
    assert len(result["reasoning"]) > 0
    # Confirm evidence citation
    first_step = result["reasoning"][0]
    assert len(first_step.referenced_evidence_ids) > 0


def test_reporting_agent_generates_sar_draft_with_required_sections(agent_db):
    inv_agent = InvestigationAgent(agent_db)
    inv_agent.investigate_case("CASE-AGENT-TEST")

    rep_agent = ReportingAgent(agent_db)
    report_dict = rep_agent.generate_draft_report("CASE-AGENT-TEST")

    content = report_dict["report_content"]
    assert content.case_information.watermark == "DRAFT — REQUIRES HUMAN REVIEW"
    assert content.subject_information.account_id == "ACC-VIKRAM"
    assert content.risk_indicators.composite_risk_score == 85.0
    assert content.investigator_review_section.approval_status == "DRAFT"
