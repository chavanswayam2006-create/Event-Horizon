# 03 - MVP Scope (Day 1 vs Future)

## In Day 1 MVP Scope
- FastAPI backend with CORS enabled for `http://localhost:5173`.
- React + Vite + Tailwind frontend single-page interface with sample scenario presets.
- Flat `star_map.json` dataset (22 rules across Pune and Nagpur).
- Lightweight AI text understanding (keyword & n-gram extraction).
- TF-IDF + Cosine similarity semantic matching with keyword overlap scoring.
- Escape Velocity Engine with fixed, explainable thresholds:
  - `CLEAR` (single confident match >= 0.70)
  - `AMBIGUOUS` (structural shared jurisdiction or moderate confidence 0.40 - 0.69)
  - `UNKNOWN` (unrecognized subject, no match, or combined score < 0.40)
- The 3 mandatory acceptance test cases verified.

## Explicitly Out of Scope (Do NOT Build)
- Production microservices, Docker compose, or Kubernetes.
- Graph databases (Neo4j, Memgraph).
- Custom deep learning model training / fine-tuning.
- Real government RTI portal integration or automated submission.
- User authentication, JWT, or database-backed login.
- Production administrative dashboards.
- Full multilingual machine translation pipelines.
- Automated legal document / affidavit generation.

## Future Roadmap (Days 2 and 3)
- Day 2: Persistent database storage, feedback capture, advanced calibration.
- Day 3: Multilingual UI, speech-to-text, and visual department hierarchy map.
