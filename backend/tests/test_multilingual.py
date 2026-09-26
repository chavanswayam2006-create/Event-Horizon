"""
Multilingual (English / Hindi / Marathi) behaviour tests.

Covers language detection, Devanagari input validation, localized response
fields (subject/department), localized candidate evidence, and the i18n
content baked into both Star Map copies.
"""

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.ai_understanding import detect_language, normalize_language_hint, validate_rti_input
from app.main import app, find_star_map_path, load_star_map

load_star_map()


@pytest.fixture
def client():
    return TestClient(app)


# ---------------------------------------------------------------- detection --

def test_detect_language_basic():
    assert detect_language("There are potholes on the road near my house in Pune.") == "en"
    assert detect_language("मेरे मोहल्ले की सड़क में गड्ढे हैं।") == "hi"
    assert detect_language("नळांमधून पाणी गळत आहे आणि गटार अडकलेली आहे.") == "mr"


def test_detect_language_hint_breaks_ties():
    # Devanagari with no marker words: hint decides; default is Hindi.
    neutral = "कककककककककककक"  # deliberate markerless Devanagari
    assert detect_language(neutral, hint="mr") == "mr"
    assert detect_language(neutral, hint="hi") == "hi"
    assert detect_language(neutral) == "hi"


def test_normalize_language_hint():
    assert normalize_language_hint("EN") == "en"
    assert normalize_language_hint("mr") == "mr"
    assert normalize_language_hint("xx") is None
    assert normalize_language_hint(None) is None


def test_devanagari_minimum_length_enforced():
    with pytest.raises(ValueError):
        validate_rti_input("छोटा", language="hi")  # below MIN_INPUT_CHARS_DEVANAGARI
    cleaned, warnings = validate_rti_input("सड़क में गड्ढे हैं, मरम्मत कराएं।", language="hi")
    assert "गड्ढे" in cleaned
    assert warnings == []


# ------------------------------------------------------------- API behaviour --

def test_analyze_hindi_clear(client):
    response = client.post(
        "/api/analyze",
        json={
            "text": "मेरे मोहल्ले की सड़क में बहुत बड़े गड्ढे हैं, कृपया सड़क की मरम्मत कराएं।",
            "state": "Maharashtra",
            "district": "Pune",
            "language": "hi",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["language"] == "hi"
    assert data["display_language"] == "hi"
    assert data["decision"] == "CLEAR"
    assert data["department"] == "Municipal Engineering Department"
    # Localized labels are Devanagari, not English
    assert data["department_localized"] == "नगरपालिका अभियांत्रिकी विभाग"
    assert data["subject_localized"] == "सड़क मरम्मत"


def test_analyze_marathi_clear_without_hint(client):
    response = client.post(
        "/api/analyze",
        json={
            "text": "पुण्यात नळांमधून पाणी गळत आहे आणि पाणीपुरवठा बंद आहे.",
            "state": "Maharashtra",
            "district": "Pune",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["language"] == "mr"  # detected without a hint
    assert data["decision"] == "CLEAR"
    assert data["department"] == "Water Supply Department"
    assert data["department_localized"] == "पाणीपुरवठा विभाग"


def test_analyze_english_unchanged(client):
    response = client.post(
        "/api/analyze",
        json={
            "text": "There are large potholes on the road near my house in Pune. Please repair the road.",
            "state": "Maharashtra",
            "district": "Pune",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["language"] == "en"
    assert data["decision"] == "CLEAR"
    assert data["confidence"] >= 0.75
    assert data["department_localized"] == data["department"]  # no translation → English


def test_candidates_carry_localized_evidence(client):
    response = client.post(
        "/api/analyze",
        json={
            "text": "पुण्यात गटार अडकली आहे आणि गंदे पाणी नाल्यांमधून सांडत आहे.",
            "state": "Maharashtra",
            "district": "Pune",
            "language": "mr",
        },
    )
    data = response.json()
    assert data["candidates"], "expected ranked candidates"
    top = data["candidates"][0]
    assert top["verified"] is not None
    assert top["version"] == "2026.09"
    assert top["subject_localized"]
    if top["departments_localized"]:
        assert all(name for name in top["departments_localized"])


# ------------------------------------------------------------- i18n content --

def test_star_map_rules_have_i18n_fields():
    with open(find_star_map_path(), "r", encoding="utf-8") as handle:
        rules = json.load(handle)
    assert len(rules) == 22
    for rule in rules:
        i18n = rule.get("subject_i18n") or {}
        assert i18n.get("hi"), f"{rule['id']} missing Hindi subject"
        assert i18n.get("mr"), f"{rule['id']} missing Marathi subject"
        aliases = rule.get("aliases_i18n") or {}
        assert aliases.get("hi"), f"{rule['id']} missing Hindi aliases"
        assert aliases.get("mr"), f"{rule['id']} missing Marathi aliases"
        depts = rule.get("departments_i18n") or {}
        for dept in rule["departments"]:
            assert depts.get(dept), f"{rule['id']} missing department translation for {dept}"
        assert rule.get("version") == "2026.09"


def test_both_star_map_copies_are_identical():
    root = Path(__file__).resolve().parents[2]
    backend_copy = root / "backend" / "data" / "star_map.json"
    root_copy = root / "data" / "star_map.json"
    assert json.loads(backend_copy.read_text(encoding="utf-8")) == json.loads(
        root_copy.read_text(encoding="utf-8")
    )


def test_health_exposes_supported_languages(client):
    data = client.get("/api/health").json()
    assert data["supported_languages"] == ["en", "hi", "mr"]
    assert data["engine_version"]
    assert data["ruleset_version"]
    assert data["audit_records_count"] >= 0
