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


def test_health_endpoints(client):
    """Verify both /health and /api/health return status ok and 22 rules."""
    for path in ["/health", "/api/health"]:
        response = client.get(path)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "Event Horizon API"
        assert data["star_map_rules_count"] == 22


def test_extract_pdf_endpoint(client):
    """Verify genuine PDF text extraction via POST /api/extract-pdf."""
    import io

    # Valid PDF with machine-readable text
    raw_pdf = b"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 55 >> stream
BT /F1 12 Tf 72 712 Td (Road repair RTI draft application) Tj ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000350 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
426
%%EOF"""

    response = client.post(
        "/api/extract-pdf",
        files={"file": ("rti_query.pdf", io.BytesIO(raw_pdf), "application/pdf")},
    )
    assert response.status_code == 200
    data = response.json()
    assert "Road repair" in data["extracted_text"]
    assert data["pages_count"] == 1
    assert data["filename"] == "rti_query.pdf"

    # Non-PDF rejection
    response_invalid = client.post(
        "/api/extract-pdf",
        files={"file": ("notice.txt", io.BytesIO(b"Hello world"), "text/plain")},
    )
    assert response_invalid.status_code == 400
