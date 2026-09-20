"""
Centralized Configuration for Event Horizon (Day 2 MVP).

Holds all tunable thresholds, signal weights, penalties, limits,
and disclaimer texts. No tuning parameters should be hardcoded elsewhere.
"""

from typing import Dict

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
MAX_INPUT_CHARS: int = 4000
MAX_PDF_BYTES: int = 5 * 1024 * 1024  # 5 MB
MAX_PDF_PAGES: int = 10

# Standardized Disclaimers and Guidance
DISCLAIMER_TEXT: str = "MVP routing confidence score; demonstration data; not legal advice."

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
