# 07 - Escape Velocity Decision Engine

## Decision Logic and Precedence

The engine computes an explainable decision with three primary states:
1. **UNKNOWN**
   - Trigger 1: If top candidate similarity < 0.20 and combined_score < 0.25 (unrecognized subject).
   - Reason: `"subject not found in Star Map"`
   - Trigger 2: If combined score < 0.40.
   - Reason: `"no confident match"`

2. **AMBIGUOUS**
   - Trigger 1: If matched rule's jurisdiction is `"shared"` (e.g. traffic signals, drainage, civil hospitals).
   - Reason: `"structural shared jurisdiction"`
   - Trigger 2: If top two candidates' scores are within 0.10 of each other and involve different departments.
   - Reason: `"structural shared jurisdiction"`
   - Trigger 3: If combined score is between 0.40 and 0.69 (moderate match).
   - Reason: `"low confidence match"`

3. **CLEAR**
   - Trigger: Single jurisdiction rule and `combined_score >= 0.70`.
   - Reason: `"confident single department match"`
