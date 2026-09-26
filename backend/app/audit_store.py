"""
Audit History Persistence for Event Horizon.

Append-only JSONL store on disk so audit history survives page reloads and
server restarts (previously the drawer only held React state). Personal
identifiers are masked before text is written, and the store is capped at
AUDIT_MAX_RECORDS entries to keep the file bounded.

Audit writes must never break analysis: every public function swallows storage
errors and reports them on stdout instead of raising.
"""

import json
import os
import re
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.config import (
    AUDIT_DEFAULT_LIMIT,
    AUDIT_LOG_FILENAME,
    AUDIT_LOG_PATH_ENV,
    AUDIT_MAX_RECORDS,
    ENGINE_VERSION,
    RULESET_VERSION,
)

_LOCK = threading.Lock()

EMAIL_RE = re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b")
# Aadhaar-style 12-digit groups must be masked before the generic digit rule.
GROUPED_ID_RE = re.compile(r"(?<!\d)\d{4}[ -]\d{4}[ -]\d{4}(?!\d)")
PAN_RE = re.compile(r"\b[A-Z]{5}\d{4}[A-Z]\b")
LONG_DIGIT_RE = re.compile(r"(?<!\d)\d{7,}(?!\d)")


def mask_pii(text: Optional[str]) -> str:
    """Mask emails, Aadhaar-style IDs, PAN numbers, and long digit runs."""
    if not text:
        return ""
    masked = EMAIL_RE.sub("[email-redacted]", text)
    masked = GROUPED_ID_RE.sub("[id-redacted]", masked)
    masked = PAN_RE.sub("[id-redacted]", masked)
    masked = LONG_DIGIT_RE.sub("[number-redacted]", masked)
    return masked


def get_audit_log_path() -> Path:
    """Resolve the audit log path (env override wins for deployments/tests)."""
    override = os.environ.get(AUDIT_LOG_PATH_ENV)
    if override:
        return Path(override)
    return Path(__file__).resolve().parent.parent / "data" / AUDIT_LOG_FILENAME


def build_audit_record(
    *,
    original_text: str,
    normalized_text: str,
    input_language: str,
    detected_subject: str,
    star_map_rule_ids: List[str],
    candidate_departments: List[Dict[str, Any]],
    match_score: float,
    jurisdiction_state: Optional[str],
    jurisdiction_type: str,
    decision: str,
    reason: str,
    district: Optional[str] = None,
    display_language: Optional[str] = None,
    snapshot: Optional[Dict[str, Any]] = None,
    analysis_id: Optional[str] = None,
    timestamp: Optional[str] = None,
) -> Dict[str, Any]:
    """Build the canonical audit record documented in Brain/05_DATA_SCHEMA.md."""
    return {
        "analysis_id": analysis_id or str(uuid.uuid4()),
        "timestamp": timestamp or datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "input_language": input_language,
        "display_language": display_language or input_language,
        "original_text": mask_pii(original_text),
        "normalized_text": mask_pii(normalized_text),
        "detected_subject": detected_subject,
        "star_map_rule_ids": list(star_map_rule_ids),
        "candidate_departments": [
            {
                "name": item.get("name"),
                "localized_name": item.get("localized_name"),
                "rule_id": item.get("rule_id"),
                "score": item.get("score"),
            }
            for item in candidate_departments
        ],
        "match_score": match_score,
        "jurisdiction_state": jurisdiction_state,
        "jurisdiction_type": jurisdiction_type,
        "district": district,
        "decision": decision,
        "reason": reason,
        "engine_version": ENGINE_VERSION,
        "ruleset_version": RULESET_VERSION,
        "snapshot": snapshot,
    }


def _trim_if_needed(path: Path) -> None:
    """Keep at most AUDIT_MAX_RECORDS lines, rewriting only when exceeded."""
    try:
        with open(path, "r", encoding="utf-8") as handle:
            lines = handle.readlines()
        if len(lines) <= AUDIT_MAX_RECORDS:
            return
        kept = lines[-AUDIT_MAX_RECORDS:]
        temp_path = path.with_suffix(path.suffix + ".tmp")
        with open(temp_path, "w", encoding="utf-8") as handle:
            handle.writelines(kept)
        os.replace(temp_path, path)
    except Exception as exc:
        print(f"Audit store warning: could not trim audit log ({exc})")


def append_audit_record(record: Dict[str, Any], path: Optional[Path] = None) -> Optional[Dict[str, Any]]:
    """Append one audit record. Returns the record, or None if storage failed."""
    target = Path(path) if path else get_audit_log_path()
    try:
        target.parent.mkdir(parents=True, exist_ok=True)
        with _LOCK:
            with open(target, "a", encoding="utf-8") as handle:
                handle.write(json.dumps(record, ensure_ascii=False) + "\n")
            _trim_if_needed(target)
        return record
    except Exception as exc:
        print(f"Audit store warning: audit record was not persisted ({exc})")
        return None


def list_audit_records(limit: int = AUDIT_DEFAULT_LIMIT, path: Optional[Path] = None) -> List[Dict[str, Any]]:
    """Return the most recent audit records, newest first."""
    target = Path(path) if path else get_audit_log_path()
    if not target.exists():
        return []

    records: List[Dict[str, Any]] = []
    try:
        with _LOCK:
            with open(target, "r", encoding="utf-8") as handle:
                for line in handle:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        records.append(json.loads(line))
                    except json.JSONDecodeError:
                        continue
    except Exception as exc:
        print(f"Audit store warning: could not read audit log ({exc})")
        return []

    try:
        bounded = max(1, min(int(limit), AUDIT_MAX_RECORDS))
    except (TypeError, ValueError):
        bounded = AUDIT_DEFAULT_LIMIT
    return list(reversed(records[-bounded:]))


def count_audit_records(path: Optional[Path] = None) -> int:
    """Count persisted audit records (used by tests and health checks)."""
    target = Path(path) if path else get_audit_log_path()
    if not target.exists():
        return 0
    try:
        with open(target, "r", encoding="utf-8") as handle:
            return sum(1 for line in handle if line.strip())
    except Exception:
        return 0


def clear_audit_records(path: Optional[Path] = None) -> int:
    """Delete all persisted audit records. Returns the number removed."""
    target = Path(path) if path else get_audit_log_path()
    if not target.exists():
        return 0
    deleted = count_audit_records(target)
    try:
        with _LOCK:
            target.unlink()
        return deleted
    except Exception as exc:
        print(f"Audit store warning: could not clear audit log ({exc})")
        return 0
