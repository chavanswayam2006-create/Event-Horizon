"""
Escape Velocity Engine Module for Event Horizon (Day 1 MVP).

Determines whether an RTI application has a CLEAR, AMBIGUOUS, or UNKNOWN
department routing decision based on semantic matching scores, Star Map jurisdiction
rules, and explainable fixed thresholds.
"""

from typing import Any, Dict, List


def evaluate_decision(
    candidates: List[Dict[str, Any]],
    detected_subject: str = "",
) -> Dict[str, Any]:
    """
    Evaluates candidate matches according to Day 1 Escape Velocity Engine logic:

      combined_score = 0.7 * top_similarity + 0.3 * keyword_overlap_score

      1. If no Star Map rule matched the subject at all (or combined_score < 0.30)
         -> UNKNOWN (reason: "subject not found in Star Map")
      2. Else if the matched rule's jurisdiction == "shared" OR
         top two candidates' scores are within 0.1 of each other
         -> AMBIGUOUS (reason: "structural shared jurisdiction")
      3. Else if combined_score >= 0.70
         -> CLEAR (reason: "confident single department match")
      4. Else if combined_score >= 0.40
         -> AMBIGUOUS (reason: "low confidence match")
      5. Else
         -> UNKNOWN (reason: "no confident match")
    """
    if not candidates:
        return {
            "decision": "UNKNOWN",
            "confidence": 0.0,
            "reason": "subject not found in Star Map",
            "candidates": [],
        }

    top_candidate = candidates[0]
    top_similarity = top_candidate.get("similarity", 0.0)
    top_combined = top_candidate.get("combined_score", 0.0)
    jurisdiction = top_candidate.get("jurisdiction", "single")

    # Rule 1: No Star Map rule matched the subject at all
    if top_combined < 0.30:
        return {
            "decision": "UNKNOWN",
            "confidence": round(top_combined, 2),
            "reason": "subject not found in Star Map",
            "candidates": candidates[:5],
        }

    # Rule 2: Structural shared jurisdiction or close contention between distinct bodies
    is_shared = jurisdiction == "shared"
    close_contention = False
    if len(candidates) >= 2:
        score_diff = abs(top_combined - candidates[1].get("combined_score", 0.0))
        if score_diff <= 0.10:
            top_deps = set(top_candidate.get("departments", []))
            second_deps = set(candidates[1].get("departments", []))
            if top_deps != second_deps or candidates[1].get("jurisdiction") == "shared":
                close_contention = True

    if is_shared or close_contention:
        return {
            "decision": "AMBIGUOUS",
            "confidence": round(top_combined, 2),
            "reason": "structural shared jurisdiction",
            "candidates": candidates[:5],
        }

    # Rule 3: Confident single match
    if top_combined >= 0.70:
        return {
            "decision": "CLEAR",
            "confidence": round(top_combined, 2),
            "reason": "confident single department match",
            "candidates": candidates[:5],
        }

    # Rule 4: Moderate confidence match
    if top_combined >= 0.40:
        return {
            "decision": "AMBIGUOUS",
            "confidence": round(top_combined, 2),
            "reason": "low confidence match",
            "candidates": candidates[:5],
        }

    # Rule 5: Fallback unknown
    return {
        "decision": "UNKNOWN",
        "confidence": round(top_combined, 2),
        "reason": "no confident match",
        "candidates": candidates[:5],
    }
