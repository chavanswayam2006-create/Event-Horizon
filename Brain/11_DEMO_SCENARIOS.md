# 11 - Demo Scenarios & Acceptance Criteria

## Scenario 1: Confident Single Department (`CLEAR`)
- **Input Text**: `"There are large potholes on my street and the road urgently needs repair."`
- **State/District**: Maharashtra / Pune
- **Expected Subject**: `road repair`
- **Expected Decision**: `CLEAR`
- **Expected Department**: `Municipal Engineering Department`
- **Expected Confidence**: `>= 0.70`
- **Explanation**: Strong semantic match and keyword overlap for local road maintenance with a single designated authority.

## Scenario 2: Structural Shared Jurisdiction (`AMBIGUOUS`)
- **Input Text**: `"The traffic signal at the main chowk has been broken for two weeks and nobody has fixed it."`
- **State/District**: Maharashtra / Pune
- **Expected Subject**: `traffic signals`
- **Expected Decision**: `AMBIGUOUS`
- **Expected Department(s)**: `Traffic Police Department` AND `Municipal Engineering Department`
- **Expected Confidence**: High match for subject, but flagged as AMBIGUOUS due to dual jurisdictional oversight.
- **Explanation**: Traffic signals involve physical infrastructure maintenance (Municipal Engineering) and operational traffic management (Traffic Police).

## Scenario 3: Novel / Unmapped Query (`UNKNOWN`)
- **Input Text**: `"I want records about the new AI surveillance camera project in my area."`
- **State/District**: Maharashtra / Pune
- **Expected Subject**: `""` (no rule exists)
- **Expected Decision**: `UNKNOWN`
- **Expected Confidence**: `< 0.30`
- **Explanation**: The subject is deliberately omitted from the Star Map; system refuses to guess and explicitly returns UNKNOWN.
