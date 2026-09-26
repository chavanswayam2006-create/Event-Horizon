#!/usr/bin/env python
"""
Retrain pipeline for the Event Horizon TF-IDF Star Map index.

Usage (from backend/):
    python scripts/retrain.py [--data data/training_data.csv]
                              [--output-dir data/model]
                              [--min-hit-rate 0.75]

Steps (fail-fast):
  1. Load and validate training_data.csv (schema + row-level checks).
  2. Rebuild the per-language TF-IDF index from the current Star Map rules.
  3. Score every training row through the production ranking path (rank_rules).
  4. Persist the fitted index (tfidf_index.pkl) and training_metrics.json.

Exit codes: 0 = success, 1 = hit rate below --min-hit-rate,
 2 = validation / IO failure (fail fast).
"""

import argparse
import csv
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_ROOT))

from app.ai_understanding import understand_rti_text  # noqa: E402
from app.config import (  # noqa: E402
    DEFAULT_DATA_DIR,
    DEFAULT_MODEL_DIR,
    ENGINE_VERSION,
    RULESET_VERSION,
    SUPPORTED_LANGUAGES,
    TRAINING_DATA_FILENAME,
    TRAINING_INDEX_FILENAME,
    TRAINING_METRICS_FILENAME,
)
from app.main import STAR_MAP  # noqa: E402  (loads + validates the Star Map on import)
from app.semantic_match import (  # noqa: E402
    SKLEARN_AVAILABLE,
    StarMapIndex,
    init_star_map_index,
    rank_rules,
    save_index,
)

REQUIRED_COLUMNS = ("id", "text", "language", "state", "district", "expected_rule_id")


def fail(message: str):
    """Print a diagnostic and abort with exit code 2 (validation/IO failure)."""
    print(f"retrain: ERROR: {message}")
    raise SystemExit(2)


def load_training_rows(path: Path) -> list:
    if not path.exists():
        fail(f"training data not found: {path}")
    try:
        with open(path, "r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            if reader.fieldnames is None:
                fail(f"{path} has no header row")
            missing = [c for c in REQUIRED_COLUMNS if c not in reader.fieldnames]
            if missing:
                fail(f"{path} missing required columns: {missing}")
            rows = [dict(row) for row in reader]
    except OSError as exc:
        fail(f"could not read {path}: {exc}")
    if not rows:
        fail(f"{path} contains no training rows")
    return rows


def validate_rows(rows: list, rule_ids: set) -> list:
    """Row-level validation; aborts with exit code 2 on the first failed pass."""
    errors = []
    seen = set()
    for line_no, row in enumerate(rows, start=2):  # header is line 1
        rid = (row.get("id") or "").strip()
        text = (row.get("text") or "").strip()
        lang = (row.get("language") or "").strip().lower()
        expected = (row.get("expected_rule_id") or "").strip()
        if not rid:
            errors.append(f"line {line_no}: missing id")
            continue
        if rid in seen:
            errors.append(f"line {line_no}: duplicate id '{rid}'")
        seen.add(rid)
        if len(text) < 10:
            errors.append(f"{rid}: text too short")
        if lang not in SUPPORTED_LANGUAGES:
            errors.append(f"{rid}: unsupported language '{lang}'")
        if expected not in rule_ids:
            errors.append(f"{rid}: unknown expected_rule_id '{expected}'")
        if not (row.get("state") or "").strip() or not (row.get("district") or "").strip():
            errors.append(f"{rid}: state and district are required")
    if errors:
        fail("training data validation failed:\n  " + "\n  ".join(errors))
    return rows



def score_rows(rows: list, rules: list):
    """
    Rank every training row through the production ranking path and compute
    hit@1 / hit@3 / MRR overall and per language.
    """
    index = StarMapIndex(rules)
    init_star_map_index(rules, index=index)

    per_language: dict = {}
    misses: list = []
    total_hit1 = total_hit3 = 0
    total_rr = 0.0

    for row in rows:
        lang = row["language"].strip().lower()
        text = row["text"].strip()
        expected = row["expected_rule_id"].strip()

        ai = understand_rti_text(text, rules, language=lang)
        candidates = rank_rules(
            application_text=text,
            rules=rules,
            state=row["state"].strip(),
            district=row["district"].strip(),
            query_keywords=ai["keywords"],
            detected_subject=ai["detected_subject"],
            language=lang,
            display_language=lang,
        )
        ordered = [c.get("star_map_rule_id") for c in candidates]
        rank = (ordered.index(expected) + 1) if expected in ordered else None
        hit1 = rank == 1
        hit3 = rank is not None and rank <= 3
        rr = (1.0 / rank) if rank else 0.0
        total_hit1 += int(hit1)
        total_hit3 += int(hit3)
        total_rr += rr

        stats = per_language.setdefault(
            lang, {"rows": 0, "hit_at_1": 0, "hit_at_3": 0, "rr": 0.0}
        )
        stats["rows"] += 1
        stats["hit_at_1"] += int(hit1)
        stats["hit_at_3"] += int(hit3)
        stats["rr"] += rr

        if not hit1:
            misses.append(
                {
                    "id": row["id"],
                    "language": lang,
                    "expected": expected,
                    "predicted": ordered[0] if ordered else None,
                    "rank": rank,
                }
            )

    n = len(rows)
    language_metrics = {
        lang: {
            "rows": s["rows"],
            "hit_at_1": round(s["hit_at_1"] / s["rows"], 4),
            "hit_at_3": round(s["hit_at_3"] / s["rows"], 4),
            "mrr": round(s["rr"] / s["rows"], 4),
        }
        for lang, s in sorted(per_language.items())
    }
    overall = {
        "rows": n,
        "hit_at_1": round(total_hit1 / n, 4),
        "hit_at_3": round(total_hit3 / n, 4),
        "mrr": round(total_rr / n, 4),
    }
    return index, overall, language_metrics, misses



def main() -> int:
    parser = argparse.ArgumentParser(description="Rebuild and validate the Star Map TF-IDF index.")
    parser.add_argument("--data", default=str(Path(DEFAULT_DATA_DIR) / TRAINING_DATA_FILENAME))
    parser.add_argument("--output-dir", default=DEFAULT_MODEL_DIR)
    parser.add_argument(
        "--min-hit-rate",
        type=float,
        default=0.75,
        help="Fail (exit 1) if overall hit@1 falls below this rate.",
    )
    args = parser.parse_args()

    if not STAR_MAP:
        fail("Star Map failed to load; cannot retrain")
    if not SKLEARN_AVAILABLE:
        fail("scikit-learn is unavailable; cannot fit the TF-IDF index")

    rule_ids = {r.get("id") for r in STAR_MAP}
    rows = validate_rows(load_training_rows(Path(args.data)), rule_ids)
    print(f"retrain: validated {len(rows)} training rows from {args.data}")

    started = time.time()
    index, overall, language_metrics, misses = score_rows(rows, STAR_MAP)
    duration = round(time.time() - started, 3)

    out_dir = Path(args.output_dir)
    try:
        out_dir.mkdir(parents=True, exist_ok=True)
        index_path = save_index(index, out_dir / TRAINING_INDEX_FILENAME)
    except OSError as exc:
        fail(f"could not persist index: {exc}")

    metrics = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "engine_version": ENGINE_VERSION,
        "ruleset_version": RULESET_VERSION,
        "data_file": str(Path(args.data)),
        "rows": overall["rows"],
        "languages": language_metrics,
        "overall": overall,
        "misses": misses,
        "sklearn_available": SKLEARN_AVAILABLE,
        "index_artifact": str(index_path),
        "index_bytes": index_path.stat().st_size,
        "duration_seconds": duration,
    }
    metrics_path = out_dir / TRAINING_METRICS_FILENAME
    metrics_path.write_text(
        json.dumps(metrics, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    print(
        f"retrain: {overall['rows']} rows | hit@1={overall['hit_at_1']:.2%} | "
        f"hit@3={overall['hit_at_3']:.2%} | mrr={overall['mrr']:.4f} | {duration}s"
    )
    for lang, m in language_metrics.items():
        print(
            f"  [{lang}] rows={m['rows']} hit@1={m['hit_at_1']:.2%} "
            f"hit@3={m['hit_at_3']:.2%} mrr={m['mrr']:.4f}"
        )
    print(f"retrain: index    -> {index_path}")
    print(f"retrain: metrics  -> {metrics_path}")

    if overall["hit_at_1"] < args.min_hit_rate:
        print(
            f"retrain: ERROR: hit@1 {overall['hit_at_1']:.2%} "
            f"below required {args.min_hit_rate:.2%}"
        )
        return 1
    print("retrain: OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
