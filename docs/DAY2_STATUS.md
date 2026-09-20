# EVENT HORIZON: DAY 2 EXECUTION STATUS & VERIFICATION REPORT

**Hackathon Problem:** CX0107 — "The RTI Black Hole"  
**Domain:** AI / ML  
**Team:** Tensor Float  
**Date:** September 20, 2026  
**Status:** Completed & Fully Verified  

---

## 1. Executive Summary & Mission

Event Horizon is an intelligent RTI routing and jurisdiction arbitration engine designed to eradicate the "RTI Black Hole"—the widespread administrative failure where citizen Right to Information applications vanish or languish because they are routed to the wrong public authority, shuttled indefinitely under RTI Section 6(3), or trapped in overlapping jurisdictional disputes.

Rather than acting as a naive generative AI chatbot that hallucinates plausible-sounding departments, Event Horizon acts as a deterministic, auditable routing gatekeeper. It evaluates application text against a structured jurisdiction knowledge base (the **Star Map**), computes routing confidence using the **Escape Velocity Engine**, and explicitly returns:
- **`CLEAR`**: Confident single-authority match above threshold with clear routing instructions.
- **`AMBIGUOUS`**: Dual or shared jurisdiction / close contention detected. Displays candidate authorities with confidence capped below decision threshold and flags required human PIO intervention.
- **`UNKNOWN`**: Subject unmapped in Star Map or text too vague. Refuses automated routing, surfaces zero hallucinated departments, and provides actionable next-step guidance.

---

## 2. Day 2 Architectural Components

### A. Centralized Configuration (`backend/app/config.py`)
All decision thresholds, signal weights, penalty maximums, and standard disclaimer texts are centralized in `config.py` to prevent magic numbers:
- `CLEAR_THRESHOLD = 0.75`
- `AMBIGUOUS_THRESHOLD = 0.45`
- `CANDIDATE_MIN_SCORE = 0.25`
- `CONFLICT_MARGIN = 0.10`
- `AMBIGUOUS_CONFIDENCE_CAP = 0.74`
- Signal weights: Semantic (0.40), Subject (0.25), Jurisdiction (0.20), Jurisdiction Type (0.15)
- Max penalties: Conflict (0.25), Vagueness (0.15)
- Input limits: 15 min chars, 4000 max chars, 5 MB PDF, 10 max pages

### B. Upgraded Star Map Knowledge Base (`data/star_map.json`)
The jurisdiction database was expanded to 22 verified rules covering municipal, police, state, and shared authorities across Pune and Nagpur districts:
- Every rule contains `id`, `state`, `district`, `subject`, `departments`, `jurisdiction`, `jurisdiction_type` (`single` or `shared`), `aliases`, and `note`.
- Structural shared rules (e.g., `EH-003` Traffic Signals, `EH-006` Drainage Overflow) explicitly define multi-authority responsibility (e.g., Traffic Police + Municipal Engineering Dept).

### C. Pre-Vectorized Semantic Matcher (`backend/app/semantic_match.py`)
- Implemented `StarMapIndex` class that builds TF-IDF vector matrices across all Star Map rules once at startup.
- Fast cosine similarity ranking with graceful token-overlap fallback when TF-IDF dependencies are minimal.
- Zero per-request re-indexing overhead.

### D. AI Understanding Engine (`backend/app/ai_understanding.py`)
- Input validation: Rejects empty requests or text < 15 characters; truncates text > 4000 characters with user warning.
- Linguistic pipeline: Tokenization, suffix stemming, 100+ administrative stopword removal, bigram/trigram extraction.
- Concept & alias matcher: Matches domain terms and colloquial aliases (e.g., "signals", "chowk", "gutter", "khadde").
- Vagueness detector: Identifies generic administrative inquiries (e.g., "Please look into this issue and fix it immediately") and applies vagueness penalty.

### E. Escape Velocity Engine (`backend/app/escape_velocity.py`)
- Multi-signal scoring integrating Semantic, Subject match, District match, and Jurisdiction Type.
- Conflict detection:
  - Detects structural shared jurisdiction (`jurisdiction_type: "shared"`).
  - Detects competitive contention between runner-up candidate authorities within `CONFLICT_MARGIN` (0.10).
- Consistency enforcement:
  - When `AMBIGUOUS`, displayed confidence is strictly capped at `0.74`, mathematically guaranteeing it never exceeds or equals `CLEAR_THRESHOLD` (0.75).
  - When `UNKNOWN` or `AMBIGUOUS`, `department` is strictly `None`.
- Explainability engine: Assembles template-driven bullet points explaining the decision, citing matched rules, signal strengths, and detected conflicts.

### F. PDF Ingestion & Extraction (`POST /api/extract-pdf`)
- Integrated `pypdf` for binary PDF extraction.
- Validates file size (≤ 5MB), MIME type, and page count (≤ 10 pages).
- Handles encrypted PDFs, corrupted streams, and scanned/empty text with structured error responses.

### G. Responsive Dark-Mode Frontend (`frontend/src/App.jsx`)
- Built with React + Vite + Tailwind CSS v4.
- 3-State Hero Card: Distinct visual branding for CLEAR (Emerald), AMBIGUOUS (Amber), and UNKNOWN (Rose).
- Visual Signal Breakdown: Progress bars for Semantic, Subject, Jurisdiction, and Jurisdiction Type signals, plus conflict/vagueness penalty badges.
- Star Map Routing Path: Breadcrumb visualization (`Maharashtra -> Pune -> Subject -> Target Department(s)`).
- 1-Click Demo Presets for all 3 acceptance scenarios + edge cases.
- In-browser Star Map rule inspection drawer.
- File upload UI with instant text extraction preview.
- Mandatory MVP legal disclaimer prominently displayed.

---

## 3. The Three Acceptance Scenarios

| Scenario | Input RTI Summary | Expected Decision | Resulting Department(s) | Verified Confidence | Key Explanation |
|---|---|:---:|---|:---:|---|
| **Case 1: CLEAR** | "There are large potholes on my street and the road urgently needs repair." | `CLEAR` | `Municipal Engineering Department` | 1.00 (≥ 0.75) | Matched rule `EH-001` with single jurisdiction; no competing departments. |
| **Case 2: AMBIGUOUS** | "The traffic signal at the main chowk has been broken for two weeks and nobody has fixed it." | `AMBIGUOUS` | None selected (`Traffic Police Dept` & `Municipal Engineering Dept` surfaced) | 0.74 (capped ≤ 0.74) | Structural shared jurisdiction under rule `EH-003`; automatic routing halted for human PIO review. |
| **Case 3: UNKNOWN** | "I want records about the new AI surveillance camera project in my area." | `UNKNOWN` | None (`null`) | 0.11 (< 0.45) | Subject unmapped in Star Map; zero departments hallucinated; next-step RTI directory guidance returned. |

---

## 4. Test Suite & Invariant Verification

The automated test suite in `backend/tests/` verifies all requirements:

```
backend/tests/
  ├── test_acceptance.py          # 3 acceptance scenarios + Day 2 contract completeness
  ├── test_decision_engine.py      # 15 realistic scenarios in demo_rtis.json + invariants
  └── test_pdf_and_validation.py  # Input validation, PDF extraction, health, and starmap
```

### Key Consistency Invariants Enforced:
1. **Decision Status Invariant:**
   - If `status == "CLEAR"`: `confidence >= 0.75`, `department != None`, `conflicts == []`.
   - If `status == "AMBIGUOUS"`: `confidence <= 0.74`, `department == None`, `candidate_departments >= 2`.
   - If `status == "UNKNOWN"`: `confidence < 0.45`, `department == None`, guidance provided.
2. **Shared Rule Safety Invariant:** Any RTI matching a rule with `jurisdiction_type: "shared"` NEVER yields `CLEAR`.
3. **No Hallucination Invariant:** Unmapped subjects never produce a target department.

Total Tests: **28 passing out of 28**.

---

## 5. How to Run & Verify Locally

### Prerequisites
- Python 3.10+ (tested on Python 3.13)
- Node.js 18+

### 1. Start the Backend Server
```bash
cd backend
venv\Scripts\activate          # Windows
# or: source venv/bin/activate  # Linux/macOS
uvicorn app.main:app --host 127.0.0.1 --port 8000
```
- API Health Check: `http://127.0.0.1:8000/api/health`
- Star Map Rules: `http://127.0.0.1:8000/api/starmap`
- Interactive Swagger Docs: `http://127.0.0.1:8000/docs`

### 2. Start the Frontend Dev Server
```bash
cd frontend
npm run dev
```
Open `http://127.0.0.1:5173/` in your browser. Use the 1-Click Demo Presets to test all three scenarios.

### 3. Run Automated Tests
```bash
cd backend
venv\Scripts\python.exe -m pytest tests/ -v
```

---

## 6. Conclusion & Day 3 Readiness

Event Horizon Day 2 is fully implemented, verified, and consistent with hackathon problem CX0107. The system strictly avoids LLM hallucination, correctly flags jurisdiction conflicts, and transparently exposes its routing reasoning.
