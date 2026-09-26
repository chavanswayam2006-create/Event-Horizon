"""
Pytest bootstrap for Event Horizon.

Isolates the persistent audit store during test runs so that the hundreds of
/api/analyze calls made by the suite never pollute the real audit history, and
isolates the Star Map model artifacts so tests never consume or overwrite a
persisted retrain index.
"""

import os
import tempfile

from app.config import (
    AUDIT_LOG_PATH_ENV,
    DEFAULT_MODEL_DIR,
    TRAINING_INDEX_FILENAME,
)

_TEST_STATE_DIR = tempfile.mkdtemp(prefix="event_horizon_tests_")

# Redirect the append-only audit JSONL store into a throwaway directory.
os.environ.setdefault(
    AUDIT_LOG_PATH_ENV,
    os.path.join(_TEST_STATE_DIR, "audit_history.jsonl"),
)

# Never consume a persisted retrain artifact during tests (deterministic runs).
os.environ["EVENT_HORIZON_IGNORE_MODEL_INDEX"] = "1"
