# 02 - Product Requirements

## Target User Goal
A citizen or RTI activist enters draft RTI text and district context, and receives clear, honest routing advice with evidence-backed candidate departments.

## User Journey
1. Citizen lands on single-page analyzer.
2. Citizen enters RTI subject matter (e.g. potholes, broken traffic light, novel government program) and chooses State/District (default Maharashtra / Pune).
3. Citizen clicks "Analyze Application".
4. System processes query through NLP pipeline and displays:
   - Routing Decision (`CLEAR`, `AMBIGUOUS`, or `UNKNOWN`) with distinct visual badge.
   - Recommended department(s).
   - Confidence score and plain-English explanation of the decision reason.
   - Candidate breakdown showing similarity scores and Star Map jurisdiction notes.

## Confirmed Day 1 Requirements
- Single-page frontend with responsive layout.
- Star Map static JSON rules loaded in memory.
- Local TF-IDF + cosine similarity + keyword overlap.
- Escape Velocity Engine with explainable thresholds.
- Zero external paid credentials required.
