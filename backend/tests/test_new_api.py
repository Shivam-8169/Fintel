"""
Integration tests for newly added platform endpoints:
/api/detection/results, /api/agents/status, /api/settings/status,
/api/evaluation/metrics, /api/reports, /api/data/demo
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_detection_results_endpoint():
    res = client.get("/api/detection/results")
    assert res.status_code == 200
    data = res.json()
    assert "typology_breakdown" in data
    assert "engine_parameters" in data
    assert "indicators" in data


def test_agents_status_endpoint():
    res = client.get("/api/agents/status")
    assert res.status_code == 200
    data = res.json()
    assert data["pipeline_status"] == "OPERATIONAL"
    assert len(data["agents"]) == 5


def test_settings_status_endpoint():
    res = client.get("/api/settings/status")
    assert res.status_code == 200
    data = res.json()
    assert data["platform_name"] == "Fintel"
    assert "llm_configuration" in data
    assert "database_configuration" in data
    assert "detection_thresholds" in data


def test_evaluation_metrics_endpoint():
    res = client.get("/api/evaluation/metrics")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "VALIDATED"
    assert "detection_metrics" in data
    assert "workflow_efficiency" in data


def test_reports_listing_endpoint():
    res = client.get("/api/reports")
    assert res.status_code == 200
    assert isinstance(res.json(), list)
