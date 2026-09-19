# 18 - Changelog

## [0.1.0] - 2026-09-20 (Day 1 MVP Milestone)
### Added
- Created 22-rule `data/star_map.json` covering Pune and Nagpur municipal/state departments.
- Implemented `backend/app/ai_understanding.py` with suffix stemming and token overlap.
- Implemented `backend/app/semantic_match.py` with Scikit-learn TF-IDF, cosine ranking, and pure-Python fallback.
- Implemented `backend/app/escape_velocity.py` with CLEAR / AMBIGUOUS / UNKNOWN logic.
- Built FastAPI application (`backend/app/main.py`) with `/api/analyze`, `/api/starmap`, `/api/health`.
- Added automated acceptance tests (`backend/tests/test_acceptance.py`) verifying the 3 core cases.
- Scaffolded React + Vite + Tailwind CSS frontend with 1-click test scenario presets.
- Established full `Brain/` knowledge base (20 structured files).
