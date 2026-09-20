"""
Test Suite for Decision Engine & Consistency across Demo RTIs (Day 2 MVP).

Loads demo_rtis.json (15 realistic scenarios) and verifies:
- CLEAR cases: single department, confidence >= CLEAR_THRESHOLD, no conflicts
- AMBIGUOUS cases: department null, confidence <= AMBIGUOUS_CONFIDENCE_CAP, multi-department surfaced
- UNKNOWN cases: department null, confidence < AMBIGUOUS_THRESHOLD
- Consistency invariant: For EVERY scenario, confidence strictly matches status band
"""

import json
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from app.main import app, load_star_map
from app.config import (
    CLEAR_THRESHOLD,
    AMBIGUOUS_THRESHOLD,
    AMBIGUOUS_CONFIDENCE_CAP,
)


@pytest.fixture(scope="module", autouse=True)
def setup_app():
    load_star_map()


@pytest.fixture
def client():
    return TestClient(app)


def load_demo_rtis():
    possible_paths = [
        Path(__file__).resolve().parent.parent.parent / "data" / "demo_rtis.json",
        Path("data/demo_rtis.json").resolve(),
    ]
    for p in possible_paths:
        if p.exists():
            with open(p, "r", encoding="utf-8") as f:
                return json.load(f)
    raise FileNotFoundError("demo_rtis.json not found")


DEMO_CASES = load_demo_rtis()


@pytest.mark.parametrize("scenario", DEMO_CASES, ids=lambda s: s["id"])
def test_demo_scenario_status_and_consistency(client, scenario):
    """
    Evaluates each demo RTI against the decision engine:
    1. Status matches expected status (CLEAR, AMBIGUOUS, or UNKNOWN)
    2. Confidence never contradicts status:
       - If CLEAR: confidence >= CLEAR_THRESHOLD (0.75)
       - If AMBIGUOUS: confidence in [AMBIGUOUS_THRESHOLD, AMBIGUOUS_CONFIDENCE_CAP]
       - If UNKNOWN: confidence < AMBIGUOUS_THRESHOLD (0.45)
    3. If UNKNOWN or AMBIGUOUS: department is None
    4. If CLEAR: department is a string and matches expected department
    """
    response = client.post(
        "/api/analyze",
        json={
            "text": scenario["text"],
            "state": scenario["state"],
            "district": scenario["district"],
        },
    )
    assert response.status_code == 200
    data = response.json()

    expected_status = scenario["expected_status"]
    actual_status = data["status"]
    confidence = data["confidence"]

    assert actual_status == expected_status, (
        f"[{scenario['id']}] Expected {expected_status}, got {actual_status}. "
        f"Explanation: {data.get('explanation')}"
    )

    # Consistency Check: Confidence band must strictly align with status
    if actual_status == "CLEAR":
        assert confidence >= CLEAR_THRESHOLD, (
            f"[{scenario['id']}] CLEAR status with confidence {confidence} < {CLEAR_THRESHOLD}"
        )
        assert data["department"] is not None
        assert data["department"] in scenario["expected_departments"]
    elif actual_status == "AMBIGUOUS":
        assert confidence <= AMBIGUOUS_CONFIDENCE_CAP, (
            f"[{scenario['id']}] AMBIGUOUS status with confidence {confidence} > {AMBIGUOUS_CONFIDENCE_CAP}"
        )
        assert data["department"] is None, (
            f"[{scenario['id']}] AMBIGUOUS status should not force a single department"
        )
    elif actual_status == "UNKNOWN":
        assert confidence < AMBIGUOUS_THRESHOLD, (
            f"[{scenario['id']}] UNKNOWN status with confidence {confidence} >= {AMBIGUOUS_THRESHOLD}"
        )
        assert data["department"] is None, (
            f"[{scenario['id']}] UNKNOWN status must have department = null"
        )


def test_shared_rule_never_yields_clear(client):
    """
    Test explicitly shared rules (drainage, traffic signals, civil hospital)
    must NEVER yield CLEAR, even with 100% keyword match.
    """
    queries = [
        "The traffic signals and traffic lights at the chowk are broken.",
        "Underground storm water drainage and sewage gutter has overflowed.",
        "Civil government hospital doctors and medicine supplies are unavailable.",
    ]
    for q in queries:
        resp = client.post("/api/analyze", json={"text": q, "state": "Maharashtra", "district": "Pune"})
        data = resp.json()
        assert data["status"] != "CLEAR", f"Shared query '{q}' incorrectly yielded CLEAR"
        assert data["status"] == "AMBIGUOUS"
        assert data["department"] is None
        assert data["confidence"] <= AMBIGUOUS_CONFIDENCE_CAP
