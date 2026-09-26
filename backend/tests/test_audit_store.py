"""
Persistent audit store tests: PII masking, JSONL round-trip, trimming,
API history endpoints, and the guarantee that audit failures never break analysis.
"""

import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.audit_store import (
    append_audit_record,
    build_audit_record,
    clear_audit_records,
    count_audit_records,
    list_audit_records,
    mask_pii,
)
from app.config import (
    AUDIT_LOG_PATH_ENV,
    AUDIT_MAX_RECORDS,
    ENGINE_VERSION,
    RULESET_VERSION,
)
from app.main import app, load_star_map

load_star_map()


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def audit_path(tmp_path, monkeypatch):
    """Point the audit store at a throwaway file for the duration of a test."""
    path = tmp_path / "audit_history.jsonl"
    monkeypatch.setenv(AUDIT_LOG_PATH_ENV, str(path))
    return path


def _record(**overrides):
    payload = {
        "original_text": "Please repair the road.",
        "normalized_text": "Please repair the road.",
        "input_language": "en",
        "detected_subject": "road repair",
        "star_map_rule_ids": ["EH-001"],
        "candidate_departments": [{"name": "Municipal Engineering Department", "score": 0.9}],
        "match_score": 0.91,
        "jurisdiction_state": "Maharashtra",
        "jurisdiction_type": "single",
        "decision": "CLEAR",
        "reason": "confident single department match",
    }
    payload.update(overrides)
    return build_audit_record(**payload)


def test_mask_pii():
    text = "Contact me at citizen@example.com or 98765 43210; Aadhaar 1234 5678 9012, PAN ABCDE1234F, ref 987654321098."
    masked = mask_pii(text)
    assert "citizen@example.com" not in masked
    assert "1234 5678 9012" not in masked
    assert "ABCDE1234F" not in masked
    assert "987654321098" not in masked
    # Devanagari content must survive masking untouched
    assert mask_pii("सड़क की मरम्मत कराएं") == "सड़क की मरम्मत कराएं"


def test_append_list_count_clear_roundtrip(audit_path):
    assert count_audit_records() == 0
    assert list_audit_records() == []

    append_audit_record(_record(original_text="Mail: a@b.com about the road"))
    append_audit_record(_record(input_language="hi"))

    assert count_audit_records() == 2
    records = list_audit_records(limit=1)
    assert len(records) == 1
    assert records[0]["input_language"] == "hi"  # newest first
    assert records[0]["engine_version"] == ENGINE_VERSION
    assert records[0]["ruleset_version"] == RULESET_VERSION

    deleted = clear_audit_records()
    assert deleted == 2
    assert count_audit_records() == 0


def test_store_never_raises_on_unwritable_path(tmp_path, monkeypatch):
    blocker = tmp_path / "not_a_directory"
    blocker.write_text("x", encoding="utf-8")
    monkeypatch.setenv(AUDIT_LOG_PATH_ENV, str(blocker / "audit.jsonl"))
    # append/list/count/clear all swallow storage errors instead of raising
    assert append_audit_record(_record()) is None
    assert list_audit_records() == []
    assert count_audit_records() == 0
    assert clear_audit_records() == 0


def test_trim_keeps_store_bounded(audit_path):
    for i in range(AUDIT_MAX_RECORDS + 5):
        append_audit_record(_record(original_text=f"row {i}"))
    assert count_audit_records() == AUDIT_MAX_RECORDS


def test_api_audit_history_endpoints(client):
    # Two analyses → two persisted records (store isolated via conftest env)
    before = client.get("/api/audit/history").json()["count"]
    for lang_text in (
        "There are large potholes on the road near my house. Please repair it.",
        "मेरे मोहल्ले की सड़क में बहुत बड़े गड्ढे हैं, कृपया मरम्मत कराएं।",
    ):
        response = client.post(
            "/api/analyze",
            json={"text": lang_text, "state": "Maharashtra", "district": "Pune"},
        )
        assert response.status_code == 200

    payload = client.get("/api/audit/history").json()
    assert payload["count"] == before + 2
    record = payload["records"][0]
    for key in (
        "analysis_id", "timestamp", "input_language", "original_text",
        "detected_subject", "decision", "match_score", "engine_version",
        "ruleset_version", "star_map_rule_ids", "candidate_departments",
    ):
        assert key in record, f"audit record missing {key}"

    cleared = client.delete("/api/audit/history").json()
    assert cleared["deleted"] >= 2
    assert client.get("/api/audit/history").json()["count"] == 0


def test_pii_masked_in_persisted_records(client):
    response = client.post(
        "/api/analyze",
        json={
            "text": "There are potholes on the road, write to me at ravi@example.com for details.",
            "state": "Maharashtra",
            "district": "Pune",
        },
    )
    assert response.status_code == 200
    record = client.get("/api/audit/history").json()["records"][0]
    assert "ravi@example.com" not in record["original_text"]
    assert "[email-redacted]" in record["original_text"]


def test_analysis_survives_audit_write_failure(client, tmp_path, monkeypatch):
    """An unwritable audit path must never fail the analysis request."""
    blocker = tmp_path / "blocked"
    blocker.write_text("file where a directory is needed", encoding="utf-8")
    monkeypatch.setenv(AUDIT_LOG_PATH_ENV, str(blocker / "audit.jsonl"))
    response = client.post(
        "/api/analyze",
        json={
            "text": "There are large potholes on the road near my house in Pune.",
            "state": "Maharashtra",
            "district": "Pune",
        },
    )
    assert response.status_code == 200
    assert response.json()["decision"] == "CLEAR"
