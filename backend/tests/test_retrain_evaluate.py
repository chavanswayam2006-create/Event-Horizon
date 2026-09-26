"""
Pipeline tests: retrain script (validation, metrics, artifacts), evaluation
script (accuracy thresholds, fail-fast), and TF-IDF index persistence.
"""

import copy
import json
import subprocess
import sys
from pathlib import Path

import pytest

BACKEND_ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = BACKEND_ROOT / "scripts"


def run_script(name, *args):
    return subprocess.run(
        [sys.executable, str(SCRIPTS / name), *args],
        cwd=str(BACKEND_ROOT),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )


# ------------------------------------------------------------------ retrain --

@pytest.fixture(scope="module")
def retrain_result(tmp_path_factory):
    out_dir = tmp_path_factory.mktemp("model")
    return run_script("retrain.py", "--output-dir", str(out_dir)), out_dir


def test_retrain_succeeds_and_writes_artifacts(retrain_result):
    result, out_dir = retrain_result
    assert result.returncode == 0, result.stdout + result.stderr

    index_path = out_dir / "tfidf_index.pkl"
    metrics_path = out_dir / "training_metrics.json"
    assert index_path.exists() and index_path.stat().st_size > 0
    assert metrics_path.exists()

    metrics = json.loads(metrics_path.read_text(encoding="utf-8"))
    assert metrics["rows"] >= 30
    assert metrics["overall"]["hit_at_1"] >= 0.75
    assert metrics["overall"]["mrr"] > 0.8
    assert set(metrics["languages"]) == {"en", "hi", "mr"}
    assert metrics["engine_version"]
    assert metrics["ruleset_version"]
    assert isinstance(metrics["misses"], list)


def test_retrain_fails_fast_on_missing_columns(tmp_path):
    bad = tmp_path / "bad.csv"
    bad.write_text("id,text\nTR-1,only two columns\n", encoding="utf-8")
    result = run_script(
        "retrain.py", "--data", str(bad), "--output-dir", str(tmp_path / "model")
    )
    assert result.returncode == 2
    assert "missing required columns" in (result.stdout + result.stderr)


def test_retrain_fails_fast_on_unknown_rule(tmp_path):
    bad = tmp_path / "bad.csv"
    bad.write_text(
        'id,text,language,state,district,expected_rule_id\n'
        '"TR-9","Some perfectly ordinary English sentence","en","Maharashtra","Pune","EH-999"\n',
        encoding="utf-8",
    )
    result = run_script(
        "retrain.py", "--data", str(bad), "--output-dir", str(tmp_path / "model")
    )
    assert result.returncode == 2
    assert "EH-999" in (result.stdout + result.stderr)


# ---------------------------------------------------------------- evaluate --

def test_evaluate_full_labelled_suite(tmp_path):
    out = tmp_path / "evaluation_metrics.json"
    result = run_script("evaluate.py", "--output", str(out), "--min-accuracy", "0.85")
    assert result.returncode == 0, result.stdout + result.stderr

    metrics = json.loads(out.read_text(encoding="utf-8"))
    assert metrics["cases_total"] >= 30
    assert metrics["status_accuracy"] >= 0.85
    assert metrics["language_detection_accuracy"] >= 0.9
    assert isinstance(metrics["failures"], list)
    assert "CLEAR" in metrics["confusion_matrix"]
    assert metrics["per_language"]["en"]["rows"] > 0
    assert metrics["per_language"]["hi"]["rows"] > 0
    assert metrics["per_language"]["mr"]["rows"] > 0
    assert metrics["per_category"]["ambiguous"]["rows"] > 0
    assert metrics["per_category"]["unknown"]["rows"] > 0


def test_evaluate_fails_fast_on_invalid_cases(tmp_path):
    bad = tmp_path / "cases.jsonl"
    bad.write_text(
        '{"id": "X", "text": "hello world this is fine", "language": "en", '
        '"state": "Maharashtra", "district": "Pune", "category": "clear"}\n',
        encoding="utf-8",
    )
    result = run_script("evaluate.py", "--cases", str(bad), "--output", str(tmp_path / "m.json"))
    assert result.returncode == 2
    assert "missing fields" in (result.stdout + result.stderr)


# ----------------------------------------------------- index persistence ----

def test_index_save_load_roundtrip(tmp_path):
    from app.main import STAR_MAP
    from app.semantic_match import StarMapIndex, load_index, rules_fingerprint, save_index

    index = StarMapIndex(STAR_MAP)
    path = save_index(index, tmp_path / "tfidf_index.pkl")
    assert path.exists()

    restored = load_index(path, STAR_MAP)
    assert restored is not None
    assert set(restored.vectorizers) == set(index.vectorizers)

    query = "There are large potholes on the road and it needs repair"
    original_scores = index.compute_similarities(query, "en")
    restored_scores = restored.compute_similarities(query, "en")
    assert restored_scores == pytest.approx(original_scores)

    # Stale rules must be rejected so a fresh fit happens at startup
    changed = copy.deepcopy(STAR_MAP)
    changed[0]["subject"] = "changed subject"
    assert load_index(path, changed) is None
    # Missing artifact degrades to a fresh build, never an error
    assert load_index(tmp_path / "missing.pkl", STAR_MAP) is None
    assert len(rules_fingerprint(STAR_MAP)) == 64


def test_evaluation_dashboard_endpoint():
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)
    payload = client.get("/api/evaluation").json()
    assert payload["engine_version"]
    assert payload["ruleset_version"]
    assert "evaluation" in payload
    assert "training" in payload
    assert payload["index_artifact"]["exists"] in (True, False)
    assert payload["star_map_rules_count"] == 22
