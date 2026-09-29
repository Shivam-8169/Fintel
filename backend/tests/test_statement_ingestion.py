import io
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

SAMPLE_CSV = """Transaction Date,Description,Debit Amount,Credit Amount,Account ID,Counterparty
2026-09-01 10:00:00,Consulting Inflow,,50000.00,ACC-TEST-STMT,ACC-CLIENT-01
2026-09-01 10:15:00,Rapid Pass Outflow 1,16000.00,,ACC-TEST-STMT,ACC-MULE-01
2026-09-01 10:30:00,Rapid Pass Outflow 2,16500.00,,ACC-TEST-STMT,ACC-MULE-02
2026-09-01 10:45:00,Rapid Pass Outflow 3,16500.00,,ACC-TEST-STMT,ACC-MULE-03
"""


def test_statement_parse_preview():
    files = {"file": ("bank_statement.csv", io.BytesIO(SAMPLE_CSV.encode("utf-8")), "text/csv")}
    resp = client.post("/api/data/statement/parse-preview", files=files)
    assert resp.status_code == 200
    data = resp.json()
    assert data["filename"] == "bank_statement.csv"
    assert data["total_rows"] == 4
    assert "Transaction Date" in data["columns"]
    assert "Debit Amount" in data["columns"]
    assert data["suggested_mapping"]["date"] == "Transaction Date"
    assert data["suggested_mapping"]["debit"] == "Debit Amount"
    assert data["suggested_mapping"]["credit"] == "Credit Amount"


def test_statement_analyze_pipeline():
    files = {"file": ("bank_statement.csv", io.BytesIO(SAMPLE_CSV.encode("utf-8")), "text/csv")}
    mapping = {
        "date": "Transaction Date",
        "description": "Description",
        "debit": "Debit Amount",
        "credit": "Credit Amount",
        "account_id": "Account ID",
        "counterparty": "Counterparty"
    }
    form_data = {
        "mapping": '{"date": "Transaction Date", "description": "Description", "debit": "Debit Amount", "credit": "Credit Amount", "account_id": "Account ID", "counterparty": "Counterparty"}',
        "default_account_id": "ACC-TEST-STMT"
    }
    resp = client.post("/api/data/statement/analyze", files=files, data=form_data)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "SUCCESS"
    assert data["transactions_analyzed"] >= 4
    assert len(data["pipeline_stages"]) >= 6
    assert isinstance(data["findings"], list)
