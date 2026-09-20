"""
Escape Velocity Decision Engine Module for Event Horizon (Day 2 MVP).

Evaluates candidate routing scores, computes conflict and vagueness penalties,
determines CLEAR / AMBIGUOUS / UNKNOWN decisions, enforces confidence-status consistency,
and generates deterministic, explainable rationale templates with safe guidance.
"""

from typing import Any, Dict, List, Optional
from app.config import (
    CLEAR_THRESHOLD,
    AMBIGUOUS_THRESHOLD,
    CANDIDATE_MIN_SCORE,
    CONFLICT_MARGIN,
    AMBIGUOUS_CONFIDENCE_CAP,
    MAX_CONFLICT_PENALTY,
    MAX_VAGUENESS_PENALTY,
    DISCLAIMER_TEXT,
    GUIDANCE_CLEAR,
    GUIDANCE_AMBIGUOUS,
    GUIDANCE_UNKNOWN,
)


def evaluate_decision(
    candidates: List[Dict[str, Any]],
    detected_subject: str = "",
    is_vague: bool = False,
    query_district: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Evaluates candidate matches according to Day 2 Escape Velocity Engine specifications:
      1. Signal Aggregation & Penalty Assessment (Spec D, E)
      2. Decision Banding & Overrides (Spec F)
      3. Consistency Enforcement (displayed confidence never contradicts status)
      4. Structured Conflict Reporting (Spec E)
      5. Template Explanation & Safe Action Guidance (Spec H)
    """
    # Empty or zero candidate case
    if not candidates:
        signals = {
            "semantic": 0.0,
            "subject": 0.0,
            "jurisdiction": 0.0,
            "jurisdiction_type": 0.0,
            "conflict_level": "low",
            "conflict_penalty": 0.0,
            "vagueness_penalty": 0.0,
        }
        return {
            "status": "UNKNOWN",
            "decision": "UNKNOWN",
            "department": None,
            "candidate_departments": [],
            "confidence": 0.0,
            "subject": "",
            "star_map_rules": [],
            "jurisdiction_type": "unknown",
            "signals": signals,
            "conflicts": [],
            "explanation": [
                "No jurisdiction rules in the Star Map matched the request.",
                "Automatic routing disabled due to lack of evidence.",
            ],
            "reason": "subject not found in Star Map",
            "recommended_action": "Manual verification required before routing.",
            "guidance": GUIDANCE_UNKNOWN,
            "candidates": [],
            "warnings": [],
            "disclaimer": DISCLAIMER_TEXT,
        }

    top = candidates[0]
    top_rule_id = top.get("star_map_rule_id", "")
    top_subject = top.get("subject", "")
    top_jurisdiction_type = top.get("jurisdiction_type", "single")
    top_departments = top.get("departments", [])
    top_signals = top.get("signals", {
        "semantic": top.get("similarity", 0.0),
        "subject": 0.0,
        "jurisdiction": 0.5,
        "jurisdiction_type": 1.0 if top_jurisdiction_type == "single" else 0.5,
    })

    # Filter rules meeting candidate minimum threshold
    valid_candidates = [c for c in candidates if c.get("combined_score", 0.0) >= CANDIDATE_MIN_SCORE]

    # Conflict Detection (Spec E)
    conflicts: List[Dict[str, Any]] = []
    conflict_level = "low"
    conflict_penalty = 0.0

    # Trigger (a): Matched rule is shared jurisdiction
    is_shared = top_jurisdiction_type == "shared" or len(top_departments) > 1
    if is_shared:
        conflicts.append({
            "reason": "Structural shared jurisdiction defined in Star Map rule.",
            "involved_rule_ids": [top_rule_id],
            "departments": top_departments,
        })
        conflict_level = "medium"
        conflict_penalty = 0.10

    # Trigger (b): Top two candidates belong to distinct departments within CONFLICT_MARGIN
    runner_up_contention = False
    if len(candidates) >= 2:
        runner_up = candidates[1]
        score_diff = abs(top.get("combined_score", 0.0) - runner_up.get("combined_score", 0.0))
        runner_up_score = runner_up.get("combined_score", 0.0)

        if score_diff <= CONFLICT_MARGIN and runner_up_score >= CANDIDATE_MIN_SCORE:
            top_dep_set = set(top_departments)
            runner_dep_set = set(runner_up.get("departments", []))

            if top_dep_set != runner_dep_set:
                runner_up_contention = True
                conflicts.append({
                    "reason": f"Close contention ({score_diff:.2f} margin) between distinct authorities.",
                    "involved_rule_ids": [top_rule_id, runner_up.get("star_map_rule_id", "")],
                    "departments": list(top_dep_set.union(runner_dep_set)),
                })
                conflict_level = "high"
                conflict_penalty = MAX_CONFLICT_PENALTY

    # Trigger (c): Vagueness Penalty
    vagueness_penalty = MAX_VAGUENESS_PENALTY if is_vague else 0.0

    # Calculate final adjusted routing confidence
    raw_score = top.get("combined_score", 0.0)
    adjusted_score = max(0.0, min(1.0, raw_score - conflict_penalty - vagueness_penalty))

    # Assemble candidate departments list
    candidate_departments: List[Dict[str, Any]] = []
    seen_deps = set()
    for c in candidates[:4]:
        c_score = c.get("combined_score", 0.0)
        c_rule_id = c.get("star_map_rule_id", "")
        for d in c.get("departments", []):
            if d not in seen_deps:
                seen_deps.add(d)
                candidate_departments.append({
                    "name": d,
                    "rule_id": c_rule_id,
                    "score": round(c_score, 2),
                })

    # Decision Engine Logic (Spec F)
    # Rule 1: No valid rule above CANDIDATE_MIN_SCORE or adjusted score < AMBIGUOUS_THRESHOLD
    if not valid_candidates or raw_score < AMBIGUOUS_THRESHOLD or adjusted_score < AMBIGUOUS_THRESHOLD:
        status = "UNKNOWN"
        department = None
        confidence = round(adjusted_score, 2)
        reason = "subject not found in Star Map" if raw_score < CANDIDATE_MIN_SCORE else "no confident match"
        recommended_action = "Human verification before routing"
        guidance = GUIDANCE_UNKNOWN
        star_map_rules = [top_rule_id] if raw_score >= CANDIDATE_MIN_SCORE else []

    # Rule 2: Shared jurisdiction or conflict detected -> AMBIGUOUS
    elif is_shared or runner_up_contention or conflicts:
        status = "AMBIGUOUS"
        department = None  # No single department selected for AMBIGUOUS
        # SAFETY OVERRIDE: Capped confidence to never contradict AMBIGUOUS status
        confidence = round(min(adjusted_score, AMBIGUOUS_CONFIDENCE_CAP), 2)
        reason = "structural shared jurisdiction" if is_shared else "contention between candidate authorities"
        recommended_action = "Human review and multi-authority verification"
        guidance = GUIDANCE_AMBIGUOUS
        star_map_rules = [c["star_map_rule_id"] for c in candidates[:2] if c.get("star_map_rule_id")]

    # Rule 3: Clear threshold reached, single jurisdiction, no conflict
    elif adjusted_score >= CLEAR_THRESHOLD and top_jurisdiction_type == "single":
        status = "CLEAR"
        department = top_departments[0] if top_departments else None
        confidence = round(adjusted_score, 2)
        reason = "confident single department match"
        recommended_action = "Automatic routing recommendation available"
        guidance = GUIDANCE_CLEAR
        star_map_rules = [top_rule_id]

    # Rule 4: Moderate confidence without conflict -> AMBIGUOUS
    else:
        status = "AMBIGUOUS"
        department = None
        confidence = round(min(adjusted_score, AMBIGUOUS_CONFIDENCE_CAP), 2)
        reason = "moderate confidence match requires verification"
        recommended_action = "Human review recommended"
        guidance = GUIDANCE_AMBIGUOUS
        star_map_rules = [top_rule_id]

    # Build Explainability Templates (Spec H)
    explanation: List[str] = []

    if status == "CLEAR":
        explanation.append(
            f"Matched Star Map rule {top_rule_id} ('{top_subject}') with high confidence ({confidence:.2f})."
        )
        explanation.append(
            f"Rule specifies single jurisdiction assigned to {department}."
        )
        explanation.append(
            f"No competing or conflicting departments detected within margin ({CONFLICT_MARGIN})."
        )
        explanation.append(
            f"Escape velocity threshold exceeded ({confidence:.2f} >= {CLEAR_THRESHOLD})."
        )

    elif status == "AMBIGUOUS":
        if is_shared:
            explanation.append(
                f"Matched Star Map rule {top_rule_id} ('{top_subject}') with score {raw_score:.2f}."
            )
            explanation.append(
                f"Rule has structural shared jurisdiction across: {', '.join(top_departments)}."
            )
            explanation.append(
                "Confidence capped at 0.74 to reflect dual authority ambiguity; automatic routing stopped."
            )
        elif runner_up_contention:
            explanation.append(
                f"Detected competing authorities: primary candidate {top_rule_id} and runner-up {candidates[1].get('star_map_rule_id')}."
            )
            explanation.append(
                "Score differential is within conflict margin; human adjudication required."
            )
        else:
            explanation.append(
                f"Moderate confidence match ({confidence:.2f}) sits below clear threshold ({CLEAR_THRESHOLD})."
            )
            explanation.append("Automatic single routing withheld for citizen safety.")

    else:  # UNKNOWN
        if raw_score < CANDIDATE_MIN_SCORE:
            explanation.append(
                "The requested topic has no reliable match in the Star Map jurisdiction dataset."
            )
            explanation.append(
                f"Best semantic match score ({raw_score:.2f}) was below minimum candidate score ({CANDIDATE_MIN_SCORE})."
            )
        else:
            explanation.append(
                f"Routing score ({adjusted_score:.2f}) fell below minimum routing threshold ({AMBIGUOUS_THRESHOLD})."
            )
        explanation.append(
            "Event Horizon refuses to guess when evidence is insufficient; automatic routing disabled."
        )

    if not query_district:
        explanation.append("No geographical district was specified in query; neutral location score applied.")

    signals_payload = {
        "semantic": top_signals.get("semantic", 0.0),
        "subject": top_signals.get("subject", 0.0),
        "jurisdiction": top_signals.get("jurisdiction", 0.5),
        "jurisdiction_type": top_signals.get("jurisdiction_type", 1.0),
        "conflict_level": conflict_level,
        "conflict_penalty": round(conflict_penalty, 2),
        "vagueness_penalty": round(vagueness_penalty, 2),
    }

    return {
        "status": status,
        "decision": status,  # Day 1 backward compatibility
        "department": department,
        "candidate_departments": candidate_departments,
        "confidence": confidence,
        "subject": top_subject if status != "UNKNOWN" else "",
        "star_map_rules": star_map_rules,
        "jurisdiction_type": top_jurisdiction_type if status != "UNKNOWN" else "unknown",
        "signals": signals_payload,
        "conflicts": conflicts,
        "explanation": explanation,
        "reason": reason,  # Day 1 backward compatibility
        "recommended_action": recommended_action,
        "guidance": guidance,
        "candidates": candidates[:5],  # Day 1 backward compatibility
        "warnings": [],
        "disclaimer": DISCLAIMER_TEXT,
    }
