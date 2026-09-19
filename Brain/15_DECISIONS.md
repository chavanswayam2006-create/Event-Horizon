# 15 - Architectural Decisions (ADR)

### ADR 001: Local TF-IDF + Cosine Similarity with Scikit-learn & Fallback
- **Date**: 2026-09-20
- **Context**: Hackathon Day 1 requires dependency-light, reliable semantic matching without paid API keys or large model weights.
- **Decision**: Implemented TF-IDF cosine similarity via `scikit-learn` with suffix stemming, combined with an automated pure-Python math fallback.
- **Impact**: Zero external cost, deterministic performance, runs entirely offline in milliseconds.
- **Status**: Implemented & Verified.

### ADR 002: In-Memory Static JSON for Star Map
- **Date**: 2026-09-20
- **Context**: Need fast jurisdiction lookup for Day 1 without database installation overhead.
- **Decision**: Loaded `data/star_map.json` into memory on FastAPI startup.
- **Impact**: Instant lookup, zero database setup friction.
- **Status**: Implemented & Verified.

### ADR 003: Fixed Threshold Escape Velocity Engine
- **Date**: 2026-09-20
- **Context**: Need transparent, explainable decision boundaries for CLEAR, AMBIGUOUS, and UNKNOWN.
- **Decision**: Used fixed combined score thresholds (CLEAR >= 0.70, AMBIGUOUS 0.40 - 0.69 or structural shared jurisdiction, UNKNOWN < 0.40 or unrecognized).
- **Impact**: Completely transparent and predictable for hackathon judges.
- **Status**: Implemented & Verified.
