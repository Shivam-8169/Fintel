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
    assert me_data["role"] in ("Lead Investigator", "Investigator", "INVESTIGATOR")


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


def test_pdf_and_docx_report_export():
    import pymupdf

    cases_resp = client.get("/api/cases")
    cases = cases_resp.json()
    assert len(cases) > 0
    case_id = cases[0]["case_id"]

    # 1. Test GET /api/cases/{case_id}/report/pdf
    pdf_resp = client.get(f"/api/cases/{case_id}/report/pdf")
    assert pdf_resp.status_code == 200
    assert pdf_resp.headers["content-type"] == "application/pdf"
    assert "FINTEL_" in pdf_resp.headers["content-disposition"]
    assert pdf_resp.headers["content-disposition"].endswith('.pdf"')

    # 2. Verify PDF integrity and 15 sections via PyMuPDF
    doc = pymupdf.open(stream=pdf_resp.content, filetype="pdf")
    assert len(doc) >= 1
    all_text = "\n".join(page.get_text() for page in doc)
    assert "FINTEL" in all_text
    assert "1. Executive Summary" in all_text
    assert "2. Case Information" in all_text
    assert "3. Risk Overview" in all_text
    assert "4. Why This Case Was Flagged" in all_text
    assert "5. Detected Suspicious Patterns" in all_text
    assert "6. Suspicious Transactions" in all_text
    assert "7. Transaction / Relationship Analysis" in all_text
    assert "8. Transaction Graph" in all_text
    assert "9. AI Investigation Findings" in all_text
    assert "10. Supporting Evidence" in all_text
    assert "11. Investigation Timeline" in all_text
    assert "12. Uncertainty & Limitations" in all_text
    assert "13. Investigator Notes" in all_text
    assert "14. Human Review" in all_text
    assert "15. Report Metadata" in all_text

    # 3. Test POST /api/cases/{case_id}/report/export
    post_export_resp = client.post(f"/api/cases/{case_id}/report/export", json={"format": "pdf"})
    assert post_export_resp.status_code == 200
    assert post_export_resp.headers["content-type"] == "application/pdf"

    # 4. Test GET /api/cases/{case_id}/report/docx
    docx_resp = client.get(f"/api/cases/{case_id}/report/docx")
    assert docx_resp.status_code == 200
    assert "application/vnd.openxmlformats" in docx_resp.headers["content-type"]

    # 5. Test that report edits are reflected in generated PDF
    get_rep = client.get(f"/api/cases/{case_id}/report")
    assert get_rep.status_code == 200
    rep_json = get_rep.json()
    rep_content = rep_json["report_content"]

    custom_narrative = "CONFIDENTIAL TEST: Special investigator review notes for ground truth validation."
    rep_content["suspicious_activity_summary"]["narrative_summary"] = custom_narrative
    update_resp = client.put(f"/api/cases/{case_id}/report", json={"report_content": rep_content, "notes": "Test edit"})
    assert update_resp.status_code == 200
    assert update_resp.json()["version"] is not None

    # Re-download PDF and verify custom edit is present
    pdf_updated = client.get(f"/api/cases/{case_id}/report/pdf")
    assert pdf_updated.status_code == 200
    doc_updated = pymupdf.open(stream=pdf_updated.content, filetype="pdf")
    updated_text = "\n".join(page.get_text() for page in doc_updated)
    assert custom_narrative in updated_text


def test_rbac_and_team_management_flow():
    import uuid
    dynamic_email = f"sarah.{uuid.uuid4().hex[:6]}@fintel.local"

    # 1. Admin login
    admin_login = client.post("/api/auth/login", json={
        "email": "admin@fintel.local",
        "password": "admin123"
    })
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Regular Investigator login
    inv_login = client.post("/api/auth/login", json={
        "email": "priya.patel@fintel.local",
        "password": "investigator123"
    })
    assert inv_login.status_code == 200
    inv_token = inv_login.json()["access_token"]
    inv_headers = {"Authorization": f"Bearer {inv_token}"}

    # 3. Non-admin forbidden from Team Management
    forbidden_resp = client.get("/api/team/users", headers=inv_headers)
    assert forbidden_resp.status_code == 403

    # 4. Admin accesses Team Management directory
    users_resp = client.get("/api/team/users", headers=admin_headers)
    assert users_resp.status_code == 200
    users = users_resp.json()
    assert len(users) >= 3

    # 5. Admin invites new investigator
    invite_resp = client.post("/api/team/invite", headers=admin_headers, json={
        "name": "Sarah Connor",
        "email": dynamic_email,
        "role": "Investigator"
    })
    assert invite_resp.status_code == 200
    invite_data = invite_resp.json()
    assert "token" in invite_data
    token = invite_data["token"]

    # 6. Validate invitation link
    val_resp = client.get(f"/api/auth/validate-invite?token={token}")
    assert val_resp.status_code == 200
    assert val_resp.json()["email"] == dynamic_email

    # 7. Accept invitation and set password
    accept_resp = client.post("/api/auth/accept-invite", json={
        "token": token,
        "name": "Sarah Connor",
        "password": "securepassword123"
    })
    assert accept_resp.status_code == 200
    assert accept_resp.json()["role"] == "Investigator"

    # 8. Sarah Connor can now log in
    sarah_login = client.post("/api/auth/login", json={
        "email": dynamic_email,
        "password": "securepassword123"
    })
    assert sarah_login.status_code == 200
    sarah_token = sarah_login.json()["access_token"]
    sarah_headers = {"Authorization": f"Bearer {sarah_token}"}

    # 9. Verify Sarah (regular investigator) CANNOT reassign cases
    cases_resp = client.get("/api/cases")
    cases = cases_resp.json()
    if cases:
        case_id = cases[0]["case_id"]
        # Sarah attempts reassign -> 403 Forbidden
        sarah_reassign = client.put(f"/api/cases/{case_id}/assign", headers=sarah_headers, json={
            "assigned_to": "Sarah Connor"
        })
        assert sarah_reassign.status_code == 403

        # Lead Investigator CAN reassign cases
        lead_login = client.post("/api/auth/login", json={
            "email": "investigator@fintel.local",
            "password": "investigator123"
        })
        lead_token = lead_login.json()["access_token"]
        lead_headers = {"Authorization": f"Bearer {lead_token}"}

        lead_reassign = client.put(f"/api/cases/{case_id}/assign", headers=lead_headers, json={
            "assigned_to": "Sarah Connor"
        })
        assert lead_reassign.status_code == 200
        assert lead_reassign.json()["assigned_to"] == "Sarah Connor"

    # 10. Admin deactivates Sarah Connor -> Login is blocked
    deact_resp = client.put(f"/api/team/users/{dynamic_email}/status", headers=admin_headers, json={
        "status": "Deactivated"
    })
    assert deact_resp.status_code == 200
    assert deact_resp.json()["status"] == "Deactivated"

    blocked_login = client.post("/api/auth/login", json={
        "email": dynamic_email,
        "password": "securepassword123"
    })
    assert blocked_login.status_code == 403

    # Reactivate Sarah Connor
    react_resp = client.put(f"/api/team/users/{dynamic_email}/status", headers=admin_headers, json={
        "status": "Active"
    })
    assert react_resp.status_code == 200

    # 11. Verify Audit Trail contains named provenance for these actions
    audit_resp = client.get("/api/audit?limit=20")
    assert audit_resp.status_code == 200
    actions = [a["action"] for a in audit_resp.json()]
    assert "USER_INVITED" in actions
    assert "INVITE_ACCEPTED" in actions
    assert "USER_DEACTIVATED" in actions

