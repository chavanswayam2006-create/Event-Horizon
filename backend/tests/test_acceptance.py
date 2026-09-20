"""
Acceptance Test Suite for Event Horizon (Day 2 MVP).

Verifies the 3 core acceptance scenarios:
1. Potholes / road repair -> CLEAR (Municipal Engineering Department)
2. Broken traffic signal -> AMBIGUOUS (Traffic Police & Municipal Engineering Dept, capped confidence)
3. AI surveillance camera -> UNKNOWN (Unmapped subject, department null)

Also validates Day 2 response contract (signals, conflicts, guidance, disclaimer).
"""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.main import app, load_star_map
from app.config import CLEAR_THRESHOLD, AMBIGUOUS_CONFIDENCE_CAP, AMBIGUOUS_THRESHOLD


@pytest.fixture(scope="module", autouse=True)
def setup_app():
    load_star_map()


@pytest.fixture
def client():
    return TestClient(app)


def test_acceptance_case_1_potholes_road_repair(client):
    """
    Case 1:
    Input: "There are large potholes on my street and the road urgently needs repair."
    Expect: status/decision = CLEAR, department = Municipal Engineering Department,
            confidence >= CLEAR_THRESHOLD, no conflicts.
    """
    response = client.post(
        "/api/analyze",
        json={
            "text": "There are large potholes on my street and the road urgently needs repair.",
            "state": "Maharashtra",
            "district": "Pune",
        },
    )
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "CLEAR"
    assert data["decision"] == "CLEAR"
    assert data["confidence"] >= CLEAR_THRESHOLD
    assert data["department"] == "Municipal Engineering Department"
    assert "EH-001" in data["star_map_rules"]
    assert data["jurisdiction_type"] == "single"
    assert "signals" in data
    assert data["signals"]["conflict_level"] == "low"
    assert len(data["explanation"]) > 0
    assert data["disclaimer"] != ""


def test_acceptance_case_2_traffic_signal_ambiguous(client):
    """
    Case 2:
    Input: "The traffic signal at the main chowk has been broken for two weeks and nobody has fixed it."
    Expect: status/decision = AMBIGUOUS, department = null, confidence <= AMBIGUOUS_CONFIDENCE_CAP (0.74),
            both Traffic Police Dept and Municipal Engineering Dept surfaced.
    """
    response = client.post(
        "/api/analyze",
        json={
            "text": "The traffic signal at the main chowk has been broken for two weeks and nobody has fixed it.",
            "state": "Maharashtra",
            "district": "Pune",
        },
    )
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "AMBIGUOUS"
    assert data["decision"] == "AMBIGUOUS"
    assert data["department"] is None  # No single department forced

    # CRITICAL: Displayed confidence must NEVER contradict AMBIGUOUS status
    assert data["confidence"] <= AMBIGUOUS_CONFIDENCE_CAP, (
        f"Ambiguous confidence {data['confidence']} exceeds cap {AMBIGUOUS_CONFIDENCE_CAP}"
    )

    # Surfaced candidate departments
    candidate_names = [d["name"] for d in data.get("candidate_departments", [])]
    has_traffic = any("Traffic Police" in d for d in candidate_names)
    has_municipal = any("Municipal Engineering" in d for d in candidate_names)
    assert has_traffic, f"Traffic Police not in {candidate_names}"
    assert has_municipal, f"Municipal Engineering not in {candidate_names}"

    assert len(data["conflicts"]) > 0
    assert data["guidance"] is not None


def test_acceptance_case_3_ai_surveillance_unknown(client):
    """
    Case 3:
    Input: "I want records about the new AI surveillance camera project in my area."
    Expect: status/decision = UNKNOWN, department = null, confidence < AMBIGUOUS_THRESHOLD.
    """
    response = client.post(
        "/api/analyze",
        json={
            "text": "I want records about the new AI surveillance camera project in my area.",
            "state": "Maharashtra",
            "district": "Pune",
        },
    )
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "UNKNOWN"
    assert data["decision"] == "UNKNOWN"
    assert data["department"] is None
    assert data["confidence"] < AMBIGUOUS_THRESHOLD
    assert "not found" in data["reason"].lower() or "no confident" in data["reason"].lower()
    assert data["guidance"] is not None
