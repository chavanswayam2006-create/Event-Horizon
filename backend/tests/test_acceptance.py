"""
Acceptance Test Suite for Event Horizon (Day 1 MVP).

Verifies the 3 required acceptance test inputs:
1. Potholes / road repair -> CLEAR (Municipal Engineering Department)
2. Broken traffic signal -> AMBIGUOUS (Traffic Police Dept & Municipal Engineering Dept)
3. AI surveillance camera -> UNKNOWN
"""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.main import app, load_star_map


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
    Expect: decision = CLEAR, department = Municipal Engineering Department
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

    assert data["decision"] == "CLEAR", f"Expected CLEAR, got {data['decision']}"
    assert data["confidence"] >= 0.65
    assert len(data["candidates"]) > 0

    top_candidate = data["candidates"][0]
    departments = top_candidate["departments"]
    assert any("Municipal Engineering" in dep for dep in departments), (
        f"Expected Municipal Engineering Department in {departments}"
    )


def test_acceptance_case_2_traffic_signal_ambiguous(client):
    """
    Case 2:
    Input: "The traffic signal at the main chowk has been broken for two weeks and nobody has fixed it."
    Expect: decision = AMBIGUOUS, both Traffic Police Dept and Municipal Engineering Dept surfaced
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

    assert data["decision"] == "AMBIGUOUS", f"Expected AMBIGUOUS, got {data['decision']}"
    assert len(data["candidates"]) > 0

    # Check that both Traffic Police and Municipal Engineering are surfaced among candidates
    all_surfaced_departments = []
    for cand in data["candidates"]:
        all_surfaced_departments.extend(cand.get("departments", []))

    has_traffic_police = any("Traffic Police" in d for d in all_surfaced_departments)
    has_municipal_eng = any("Municipal Engineering" in d for d in all_surfaced_departments)

    assert has_traffic_police, f"Traffic Police Dept not found in {all_surfaced_departments}"
    assert has_municipal_eng, f"Municipal Engineering Dept not found in {all_surfaced_departments}"


def test_acceptance_case_3_ai_surveillance_unknown(client):
    """
    Case 3:
    Input: "I want records about the new AI surveillance camera project in my area."
    Expect: decision = UNKNOWN (this subject deliberately has no Star Map rule)
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

    assert data["decision"] == "UNKNOWN", f"Expected UNKNOWN, got {data['decision']}"
    assert "not found" in data["reason"].lower() or "no confident" in data["reason"].lower()
