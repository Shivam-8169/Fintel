"""
API Integration Tests using FastAPI TestClient.
Tests Health, Authentication, Cases, Investigation, SAR Draft, and Human Approval.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert "services" in data
    assert data["services"]["human_in_the_loop_approval"] == "ENFORCED"


def test_auth_login_and_me():
    # Login with seeded demo credentials
    resp = client.post("/api/auth/login", json={
        "email": "investigator@fintel.local",
        "password": "investigator123"
    })
    assert resp.status_code == 200
    token_data = resp.json()
    assert "access_token" in token_data
    token = token_data["access_token"]

    # Call /auth/me with Bearer token
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["email"] == "investigator@fintel.local"
    assert me_data["role"] == "INVESTIGATOR"


def test_dashboard_summary():
    resp = client.get("/api/dashboard/summary")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_cases" in data
    assert "critical_cases" in data


def test_cases_listing_and_detail():
    resp = client.get("/api/cases")
    assert resp.status_code == 200
    cases = resp.json()
    assert isinstance(cases, list)

    if cases:
        first_case_id = cases[0]["case_id"]
        detail_resp = client.get(f"/api/cases/{first_case_id}")
        assert detail_resp.status_code == 200
        detail = detail_resp.json()
        assert detail["case_id"] == first_case_id
        assert "indicators" in detail
        assert "evidence" in detail


def test_complete_investigation_and_approval_workflow():
    # 1. Fetch first available case
    cases_resp = client.get("/api/cases")
    cases = cases_resp.json()
    if not cases:
        pytest.skip("No cases found to test workflow.")

    test_case_id = cases[0]["case_id"]

    # 2. Trigger Investigation Agent
    inv_resp = client.post(f"/api/cases/{test_case_id}/investigate")
    assert inv_resp.status_code == 200
    inv_data = inv_resp.json()
    assert inv_data["case_id"] == test_case_id

    # 3. Trigger Reporting Agent
    rep_resp = client.post(f"/api/cases/{test_case_id}/generate-report")
    assert rep_resp.status_code == 200
    rep_data = rep_resp.json()
    assert rep_data["report_content"]["case_information"]["watermark"] == "DRAFT — REQUIRES HUMAN REVIEW"

    # 4. Human Approval Action
    appr_resp = client.post(f"/api/cases/{test_case_id}/approve", json={
        "decision": "APPROVE",
        "notes": "Verified against trade documentation. Approved for internal compliance review.",
        "reviewer_name": "Lead Investigator"
    })
    assert appr_resp.status_code == 200
    assert appr_resp.json()["status"] == "APPROVED"

    # 5. Check Audit Trail contains approval record
    audit_resp = client.get(f"/api/cases/{test_case_id}/audit")
    assert audit_resp.status_code == 200
    audit_events = audit_resp.json()
    actions = [a["action"] for a in audit_events]
    assert "REPORT_APPROVED" in actions
