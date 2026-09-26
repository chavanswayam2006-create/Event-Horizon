"""
Centralized Configuration for Event Horizon (Day 2 MVP).

Holds all tunable thresholds, signal weights, penalties, limits,
and disclaimer texts. No tuning parameters should be hardcoded elsewhere.
"""

import os
from pathlib import Path
from typing import Dict

# Versioning (surfaced through /api/health and every audit record)
ENGINE_VERSION: str = "2.1.0"
RULESET_VERSION: str = "2026.09"

# Supported input languages (English, Hindi, Marathi)
SUPPORTED_LANGUAGES: tuple = ("en", "hi", "mr")
DEFAULT_LANGUAGE: str = "en"

# Decision Thresholds
CLEAR_THRESHOLD: float = 0.75
AMBIGUOUS_THRESHOLD: float = 0.45
CANDIDATE_MIN_SCORE: float = 0.25
CONFLICT_MARGIN: float = 0.10

# Confidence Cap for Overridden Ambiguous Decisions (ensures confidence <= 0.74)
AMBIGUOUS_CONFIDENCE_CAP: float = 0.74

# Signal Weights (sum = 1.0)
WEIGHT_SEMANTIC: float = 0.40
WEIGHT_SUBJECT: float = 0.25
WEIGHT_JURISDICTION: float = 0.20
WEIGHT_JURISDICTION_TYPE: float = 0.15

# Penalty Maximums
MAX_CONFLICT_PENALTY: float = 0.25
MAX_VAGUENESS_PENALTY: float = 0.15

# Jurisdiction Type Signal Scores
JURISDICTION_TYPE_SCORES: Dict[str, float] = {
    "single": 1.0,
    "shared": 0.50,
    "unknown": 0.0,
}

# Input Limits
MIN_INPUT_CHARS: int = 15
# Devanagari conveys more information per character, so the minimum viable
# input length is lower than for Latin script while still filtering noise.
MIN_INPUT_CHARS_DEVANAGARI: int = 10
MAX_INPUT_CHARS: int = 4000
MAX_PDF_BYTES: int = 5 * 1024 * 1024  # 5 MB
MAX_PDF_PAGES: int = 10

# Audit History Persistence (append-only JSONL store)
AUDIT_LOG_PATH_ENV: str = "EVENT_HORIZON_AUDIT_LOG"
AUDIT_LOG_FILENAME: str = "audit_history.jsonl"
AUDIT_MAX_RECORDS: int = 500
AUDIT_DEFAULT_LIMIT: int = 50

# Retrain Pipeline Artifacts
DEFAULT_DATA_DIR: str = str(Path(__file__).resolve().parent.parent / "data")
DEFAULT_MODEL_DIR: str = str(Path(DEFAULT_DATA_DIR) / "model")
TRAINING_DATA_FILENAME: str = "training_data.csv"
TRAINING_INDEX_FILENAME: str = "tfidf_index.pkl"
TRAINING_METRICS_FILENAME: str = "training_metrics.json"
EVAL_CASES_FILENAME: str = "eval_cases.jsonl"
EVAL_METRICS_FILENAME: str = "evaluation_metrics.json"

# Standardized Disclaimers and Guidance
DISCLAIMER_TEXT: str = "Routing confidence (heuristic); demonstration data; not legal advice."

GUIDANCE_CLEAR: str = (
    "Automatic routing recommendation available. Verify target public authority details "
    "before final RTI submission."
)

GUIDANCE_AMBIGUOUS: str = (
    "Shared jurisdiction or conflicting public authorities detected. Manual verification "
    "with the appropriate Public Information Officer (PIO) is required before routing. "
    "Do not rely on automated routing."
)

GUIDANCE_UNKNOWN: str = (
    "Subject not recognized or insufficient confidence in Star Map. Automated routing is disabled. "
    "Please consult official RTI directories or consult the relevant Central/State Public Information Officer."
)
