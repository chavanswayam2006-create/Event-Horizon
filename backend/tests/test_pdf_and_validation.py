"""
Test Suite for PDF Text Extraction, Input Validation, and Edge Cases (Day 2 MVP).
"""

import io
import pypdf
import pytest
from fastapi.testclient import TestClient

from app.main import app, load_star_map
from app.config import MAX_INPUT_CHARS


@pytest.fixture(scope="module", autouse=True)
def setup_app():
    load_star_map()


@pytest.fixture
def client():
    return TestClient(app)


def test_input_validation_empty(client):
    """Empty RTI application should return user-friendly 400 error."""
    resp = client.post("/api/analyze", json={"text": "   ", "state": "Maharashtra", "district": "Pune"})
    assert resp.status_code == 400
    data = resp.json()
    assert "detail" in data
    assert "please enter an rti application" in data["detail"].lower()


def test_input_validation_too_short(client):
    """RTI text below MIN_INPUT_CHARS (15 chars) should return 400."""
    resp = client.post("/api/analyze", json={"text": "road fix", "state": "Maharashtra", "district": "Pune"})
    assert resp.status_code == 400
    data = resp.json()
    assert "too short" in data["detail"].lower()


def test_input_validation_oversized_truncation(client):
    """Oversized inputs (> 4000 chars) are safely truncated with warning and analyzed without crashing."""
    long_text = "There are deep potholes on the main road and urgent repair is needed. " * 70
    assert len(long_text) > MAX_INPUT_CHARS

    resp = client.post("/api/analyze", json={"text": long_text, "state": "Maharashtra", "district": "Pune"})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["warnings"]) > 0
    assert any("input_truncated" in w for w in data["warnings"])
    assert data["status"] == "CLEAR"


def test_api_health_endpoint(client):
    """Check /api/health response format."""
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["star_map_rules_count"] == 22
    assert "version" in data


def test_api_starmap_endpoint(client):
    """Check /api/starmap returns all 22 rules with required fields."""
    resp = client.get("/api/starmap")
    assert resp.status_code == 200
    rules = resp.json()
    assert len(rules) == 22
    first_rule = rules[0]
    assert "id" in first_rule
    assert "subject" in first_rule
    assert "departments" in first_rule
    assert "jurisdiction_type" in first_rule
    assert "aliases" in first_rule


def test_pdf_extraction_valid(client):
    """Tests text extraction from a valid minimal PDF."""
    pdf_bytes = b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 52 >>
stream
BT
/F1 12 Tf
72 712 Td
(Drinking water pipeline burst) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000318 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
438
%%EOF
"""

    resp = client.post(
        "/api/extract-pdf",
        files={"file": ("water_pipeline.pdf", pdf_bytes, "application/pdf")},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "Drinking water pipeline burst" in data["text"]
    assert data["pages"] == 1


def test_pdf_extraction_empty_text(client):
    """Blank/scanned PDF without extractable text returns friendly 400 fallback message."""
    writer = pypdf.PdfWriter()
    writer.add_blank_page(width=100, height=100)
    buf = io.BytesIO()
    writer.write(buf)

    resp = client.post(
        "/api/extract-pdf",
        files={"file": ("blank.pdf", buf.getvalue(), "application/pdf")},
    )
    assert resp.status_code == 400
    data = resp.json()
    assert "pdf text could not be extracted" in data["detail"].lower()


def test_pdf_extraction_corrupt_file(client):
    """Corrupted or non-PDF binary payload returns friendly 400 error."""
    resp = client.post(
        "/api/extract-pdf",
        files={"file": ("corrupt.pdf", b"This is random junk data without pdf header", "application/pdf")},
    )
    assert resp.status_code == 400
    data = resp.json()
    assert "invalid or corrupt pdf" in data["detail"].lower()


def test_pdf_extraction_unsupported_file_extension(client):
    """Uploading a non-PDF file extension produces a friendly 400 error."""
    resp = client.post(
        "/api/extract-pdf",
        files={"file": ("document.docx", b"PK...", "application/octet-stream")},
    )
    assert resp.status_code == 400
    data = resp.json()
    assert "unsupported file type" in data["detail"].lower()
