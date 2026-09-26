#!/usr/bin/env python
"""
Evaluation harness for the Event Horizon routing engine.

Runs every labelled case in data/eval_cases.jsonl through the full production
pipeline (validate -> language detection -> understanding -> ranking ->
Escape Velocity decision) and reports:

  * status accuracy (CLEAR / AMBIGUOUS / UNKNOWN vs expected)
  * top-rule accuracy (expected_rule_id present in the ranked list top-1)
  * department accuracy (clear cases with expected departments)
  * language detection accuracy
  * per-language and per-category accuracy, confusion matrix, failure list

The report is written to data/evaluation_metrics.json and served by
GET /api/evaluation for the frontend evaluation dashboard.

Usage (from backend/):
    python scripts/evaluate.py [--cases data/eval_cases.jsonl]
                               [--output data/evaluation_metrics.json]
                               [--min-accuracy 0.0]

Exit codes: 0 = success, 1 = accuracy below --min-accuracy,
 2 = validation / IO failure (fail fast).
"""

import argparse
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_ROOT))

from app.ai_understanding import (  # noqa: E402
    detect_language,
    normalize_language_hint,
    understand_rti_text,
    validate_rti_input,
)
from app.config import (  # noqa: E402
    DEFAULT_DATA_DIR,
    ENGINE_VERSION,
    EVAL_CASES_FILENAME,
    EVAL_METRICS_FILENAME,
    RULESET_VERSION,
    SUPPORTED_LANGUAGES,
)
from app.escape_velocity import evaluate_decision  # noqa: E402
from app.main import STAR_MAP  # noqa: E402  (loads + validates the Star Map on import)
from app.semantic_match import rank_rules  # noqa: E402

REQUIRED_FIELDS = ("id", "text", "language", "state", "district", "category", "expected_status")
VALID_STATUSES = ("CLEAR", "AMBIGUOUS", "UNKNOWN")


def fail(message: str):
    """Print a diagnostic and abort with exit code 2 (validation/IO failure)."""
    print(f"evaluate: ERROR: {message}")
    raise SystemExit(2)


def load_cases(path: Path) -> list:
    """Load labelled eval cases from a JSONL file with strict validation."""
    if not path.exists():
        fail(f"eval cases not found: {path}")
    cases = []
    try:
        with open(path, "r", encoding="utf-8") as handle:
            for line_no, line in enumerate(handle, start=1):
                line = line.strip()
                if not line:
                    continue
                try:
                    case = json.loads(line)
                except json.JSONDecodeError as exc:
                    fail(f"{path} line {line_no}: invalid JSON ({exc})")
                if not isinstance(case, dict):
                    fail(f"{path} line {line_no}: expected a JSON object")
                missing = [f for f in REQUIRED_FIELDS if f not in case]
                if missing:
                    fail(f"{path} line {line_no}: missing fields {missing}")
                cases.append(case)
    except OSError as exc:
        fail(f"could not read {path}: {exc}")

    if not cases:
        fail(f"{path} contains no evaluation cases")

    errors = []
    seen = set()
    for case in cases:
        cid = case["id"]
        if cid in seen:
            errors.append(f"duplicate case id '{cid}'")
        seen.add(cid)
        if not str(case["text"]).strip():
            errors.append(f"{cid}: empty text")
        if case["language"] not in SUPPORTED_LANGUAGES:
            errors.append(f"{cid}: unsupported language '{case['language']}'")
        if case["expected_status"] not in VALID_STATUSES:
            errors.append(f"{cid}: invalid expected_status '{case['expected_status']}'")
    if errors:
        fail("eval case validation failed:\n  " + "\n  ".join(errors))
    return cases


def run_case(case: dict) -> dict:
    """
    Execute one labelled case through the production pipeline (identical to
    /api/analyze but side-effect free: no audit writes, no HTTP).
    """
    hint = normalize_language_hint(case["language"])
    try:
        cleaned, _ = validate_rti_input(case["text"], language=hint)
        detected = detect_language(cleaned, hint=hint)
        ai = understand_rti_text(cleaned, STAR_MAP, language=detected)
        candidates = rank_rules(
            application_text=cleaned,
            rules=STAR_MAP,
            state=case["state"],
            district=case["district"],
            query_keywords=ai["keywords"],
            detected_subject=ai["detected_subject"],
            language=detected,
            display_language=hint or detected,
        )
        decision = evaluate_decision(
            candidates=candidates,
            detected_subject=ai["detected_subject"],
            is_vague=ai["is_vague"],
            query_district=case["district"],
        )
    except Exception as exc:  # any pipeline crash counts as a failed case
        return {
            "predicted_status": "__ERROR__",
            "predicted_language": None,
            "top_rule": None,
            "department": None,
            "error": f"{type(exc).__name__}: {exc}",
        }

    top_rule = candidates[0].get("star_map_rule_id") if candidates else None
    return {
        "predicted_status": decision["status"],
        "predicted_language": detected,
        "top_rule": top_rule,
        "department": decision.get("department"),
        "confidence": decision.get("confidence"),
        "error": None,
    }


def evaluate_cases(cases: list) -> dict:
    """Run all cases and aggregate metrics."""
    started = time.time()
    failures = []
    confusion: dict = {}
    per_language: dict = {}
    per_category: dict = {}
    status_correct = 0
    lang_correct = 0
    rule_total = rule_correct = 0
    dept_total = dept_correct = 0

    for case in cases:
        result = run_case(case)
        expected_status = case["expected_status"]
        predicted_status = result["predicted_status"]
        status_ok = predicted_status == expected_status
        status_correct += int(status_ok)

        declared_lang = case["language"]
        lang_ok = result["predicted_language"] == declared_lang
        lang_correct += int(lang_ok)

        # Top-rule accuracy: only scored where a rule was expected.
        rule_ok = None
        if case.get("expected_rule_id"):
            rule_total += 1
            rule_ok = result["top_rule"] == case["expected_rule_id"]
            rule_correct += int(rule_ok)

        # Department accuracy: only scored for CLEAR cases with departments.
        dept_ok = None
        expected_depts = case.get("expected_departments") or []
        if expected_status == "CLEAR" and expected_depts:
            dept_total += 1
            dept_ok = result["department"] in expected_depts
            dept_correct += int(dept_ok)

        lang_stats = per_language.setdefault(
            declared_lang, {"rows": 0, "status_correct": 0, "lang_correct": 0}
        )
        lang_stats["rows"] += 1
        lang_stats["status_correct"] += int(status_ok)
        lang_stats["lang_correct"] += int(lang_ok)

        cat_stats = per_category.setdefault(
            case["category"], {"rows": 0, "status_correct": 0}
        )
        cat_stats["rows"] += 1
        cat_stats["status_correct"] += int(status_ok)

        confusion.setdefault(expected_status, {})
        confusion[expected_status][predicted_status] = (
            confusion[expected_status].get(predicted_status, 0) + 1
        )

        if not (status_ok and (rule_ok is not False) and (dept_ok is not False) and lang_ok):
            failures.append(
                {
                    "id": case["id"],
                    "category": case["category"],
                    "language": declared_lang,
                    "expected_status": expected_status,
                    "predicted_status": predicted_status,
                    "expected_rule_id": case.get("expected_rule_id"),
                    "predicted_top_rule": result["top_rule"],
                    "status_ok": status_ok,
                    "rule_ok": rule_ok,
                    "department_ok": dept_ok,
                    "language_ok": lang_ok,
                    "error": result["error"],
                }
            )

    n = len(cases)
    metrics = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "engine_version": ENGINE_VERSION,
        "ruleset_version": RULESET_VERSION,
        "cases_total": n,
        "status_accuracy": round(status_correct / n, 4),
        "language_detection_accuracy": round(lang_correct / n, 4),
        "top_rule_accuracy": round(rule_correct / rule_total, 4) if rule_total else None,
        "department_accuracy": round(dept_correct / dept_total, 4) if dept_total else None,
        "counts": {
            "status_correct": status_correct,
            "language_correct": lang_correct,
            "rule_scored": rule_total,
            "rule_correct": rule_correct,
            "department_scored": dept_total,
            "department_correct": dept_correct,
        },
        "per_language": {
            lang: {
                "rows": s["rows"],
                "status_accuracy": round(s["status_correct"] / s["rows"], 4),
                "language_accuracy": round(s["lang_correct"] / s["rows"], 4),
            }
            for lang, s in sorted(per_language.items())
        },
        "per_category": {
            cat: {
                "rows": s["rows"],
                "status_accuracy": round(s["status_correct"] / s["rows"], 4),
            }
            for cat, s in sorted(per_category.items())
        },
        "confusion_matrix": confusion,
        "failures": failures,
        "duration_seconds": round(time.time() - started, 3),
    }
    return metrics


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Evaluate the routing engine against labelled cases."
    )
    parser.add_argument("--cases", default=str(Path(DEFAULT_DATA_DIR) / EVAL_CASES_FILENAME))
    parser.add_argument("--output", default=str(Path(DEFAULT_DATA_DIR) / EVAL_METRICS_FILENAME))
    parser.add_argument(
        "--min-accuracy",
        type=float,
        default=0.0,
        help="Fail (exit 1) if status accuracy falls below this rate.",
    )
    args = parser.parse_args()

    if not STAR_MAP:
        fail("Star Map failed to load; cannot evaluate")

    cases = load_cases(Path(args.cases))
    print(f"evaluate: loaded {len(cases)} labelled cases from {args.cases}")

    metrics = evaluate_cases(cases)

    output_path = Path(args.output)
    try:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(
            json.dumps(metrics, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )
    except OSError as exc:
        fail(f"could not write metrics to {output_path}: {exc}")

    print(
        f"evaluate: status_accuracy={metrics['status_accuracy']:.2%} | "
        f"language_accuracy={metrics['language_detection_accuracy']:.2%} | "
        f"top_rule={metrics['top_rule_accuracy']} | "
        f"department={metrics['department_accuracy']} | "
        f"{metrics['duration_seconds']}s"
    )
    for lang, m in metrics["per_language"].items():
        print(
            f"  [{lang}] rows={m['rows']} status_accuracy={m['status_accuracy']:.2%} "
            f"language_accuracy={m['language_accuracy']:.2%}"
        )
    for cat, m in metrics["per_category"].items():
        print(f"  [{cat}] rows={m['rows']} status_accuracy={m['status_accuracy']:.2%}")
    for failure in metrics["failures"]:
        print(
            f"  FAIL {failure['id']} ({failure['language']}/{failure['category']}): "
            f"expected {failure['expected_status']}, got {failure['predicted_status']}; "
            f"expected rule {failure['expected_rule_id']}, got {failure['predicted_top_rule']}"
        )
    print(f"evaluate: metrics -> {output_path}")

    if metrics["status_accuracy"] < args.min_accuracy:
        print(
            f"evaluate: ERROR: status accuracy {metrics['status_accuracy']:.2%} "
            f"below required {args.min_accuracy:.2%}"
        )
        return 1
    print("evaluate: OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
