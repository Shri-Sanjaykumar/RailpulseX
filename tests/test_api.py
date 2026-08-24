"""
RailPulse-X — FastAPI Integration Tests
Tests all core REST endpoints specified in Sections 20 & 21.
"""
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

BASE = Path(__file__).parent.parent
sys.path.insert(0, str(BASE))

from backend.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "RailPulse-X" in data["service"]


def test_eta_endpoint():
    response = client.get("/trains/12673/eta?current_delay=15.0&station_id=MAS")
    assert response.status_code == 200
    data = response.json()
    assert data["train_id"] == "12673"
    assert data["predicted_delay_p50"] == 15.0
    assert data["predicted_delay_p90"] > data["predicted_delay_p50"]
    assert data["predicted_delay_p10"] < data["predicted_delay_p50"]


def test_network_state_endpoint():
    response = client.get("/network/state")
    assert response.status_code == 200


def test_disruption_and_full_workflow():
    # 1. Inject disruption
    disrupt_req = {"train_id": "12673", "station_id": "MAS", "delay_minutes": 15.0}
    disrupt_res = client.post("/network/disruption", json=disrupt_req)
    assert disrupt_res.status_code == 200
    disrupt_data = disrupt_res.json()
    incident_id = disrupt_data["incident_id"]
    assert incident_id is not None

    # 2. Simulate 7 scenarios
    sim_req = {"incident_id": incident_id, "scenarios": "ALL"}
    sim_res = client.post("/simulate", json=sim_req)
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    run_id = sim_data["run_id"]
    assert len(sim_data["scenarios"]) == 7

    # 3. Get recommendation
    rec_res = client.get(f"/recommendation/{run_id}")
    assert rec_res.status_code == 200
    rec_data = rec_res.json()
    assert "recommended_action" in rec_data
    assert rec_data["avoided_disruption"] > 0

    # 4. Apply recommendation
    apply_res = client.post(f"/recommendation/{run_id}/apply")
    assert apply_res.status_code == 200
    assert apply_res.json()["status"] == "APPLIED"

    # 5. Closed-loop reforecast
    reforecast_res = client.post(f"/reforecast/{run_id}")
    assert reforecast_res.status_code == 200
    reforecast_data = reforecast_res.json()
    assert reforecast_data["avoided_disruption"] > 0
    assert reforecast_data["verification_status"] == "VERIFIED"
