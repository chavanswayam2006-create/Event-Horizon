# 04 - Implemented Architecture

## System Overview
```text
RTI Application Text + District
         │
         ▼
[AI Understanding] (backend/app/ai_understanding.py)
  ├── Tokenization & stopword removal
  ├── N-gram generation (1-3 words)
  └── Candidate subject guess & keyword extraction
         │
         ▼
[Semantic Matcher] (backend/app/semantic_match.py)
  ├── TF-IDF Vectorization over Star Map (subject + note)
  ├── Cosine similarity calculation
  └── Keyword overlap scoring (Jaccard-like)
         │
         ▼
[Star Map Rules] (data/star_map.json)
  └── Flat JSON in-memory jurisdiction definitions (Pune & Nagpur)
         │
         ▼
[Escape Velocity Engine] (backend/app/escape_velocity.py)
  ├── Combined Score = 0.7 * similarity + 0.3 * keyword_overlap (+ district bonus)
  ├── Threshold & Contention Evaluation:
  │     ├── Shared Jurisdiction -> AMBIGUOUS
  │     ├── Combined Score >= 0.70 -> CLEAR
  │     ├── Combined Score >= 0.40 -> AMBIGUOUS
  │     └── Lower / No Match -> UNKNOWN
  └── Explainable reason string generation
         │
         ▼
[FastAPI Endpoints] (backend/app/main.py)
  └── POST /api/analyze, GET /api/starmap, GET /api/health
         │
         ▼
[React + Vite + Tailwind Frontend] (frontend/src/App.jsx)
  └── Single-page responsive UI with status badges & evidence inspection
```
