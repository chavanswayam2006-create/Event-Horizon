# Event Horizon — Day 1 MVP

> **Problem Statement**: "The RTI Black Hole" (PS No. CX0107)  
> **Team**: Tensor Float  
> **Hackathon**: MUSA CodeX 2026  
> **Domain**: Artificial Intelligence and Machine Learning  

---

## Overview

RTI (Right to Information) applications in India routinely get lost or delayed because citizens submit them to the wrong government department. **Event Horizon** is an AI-assisted routing engine that analyzes application text, maps it to the proper public authority, and — critically — returns **UNKNOWN** or **AMBIGUOUS** instead of hallucinating when it is unsure or when jurisdiction is shared.

### Zero Paid Credentials
> [!NOTE]
> **No paid API keys (no OpenAI key, etc.) are required.**
> The Day 1 MVP uses local TF-IDF vectorization and cosine similarity via Scikit-learn (with automated pure-Python fallback) coupled with the rule-based Escape Velocity Engine.

---

## Architecture (Day 1)

```text
RTI Application Text + District
         │
         ▼
[AI Understanding] (app/ai_understanding.py)
  └── Suffix stemming, stopword removal, n-gram keyword extraction
         │
         ▼
[Semantic Matching] (app/semantic_match.py)
  └── TF-IDF + Cosine similarity against Star Map rules (subject + note)
         │
         ▼
[Star Map Lookup] (data/star_map.json)
  └── Flat JSON dataset with 22 demonstration jurisdiction rules
         │
         ▼
[Escape Velocity Engine] (app/escape_velocity.py)
  └── Fixed explainable decision thresholds:
      ├── CLEAR (single confident department match, score >= 0.70)
      ├── AMBIGUOUS (structural shared jurisdiction or moderate score 0.40 - 0.69)
      └── UNKNOWN (unmapped subject or low confidence < 0.40)
         │
         ▼
[FastAPI Backend] ──(REST / JSON)──► [React + Vite + Tailwind Frontend]
```

---

## Quickstart & Local Setup

### Prerequisites
- Python 3.11+ installed
- Node.js v18+ and npm installed

---

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (cmd):
.\venv\Scripts\activate.bat
# Linux/macOS:
source venv/bin/activate

# Install dependencies (zero paid packages)
pip install -r requirements.txt

# Start the FastAPI server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Backend will be live at `http://127.0.0.1:8000`.  
Interactive API docs (Swagger): `http://127.0.0.1:8000/docs`.

---

### 2. Frontend Setup

In a separate terminal:

```bash
# Navigate to the frontend directory
cd frontend

# Install npm dependencies
npm install

# Start the Vite development server
npm run dev
```
Frontend will be running at `http://localhost:5173`.

---

## How to Test

### Automated Test Suite
Run the 3 required acceptance scenarios directly with pytest:
```bash
# From the repository root (using backend venv)
backend\venv\Scripts\python -m pytest backend/tests/test_acceptance.py -v
```

### Manual Acceptance Testing

You can use the frontend preset buttons or curl/PowerShell:

#### Test 1: CLEAR (Road Potholes)
- **Input**: `"There are large potholes on my street and the road urgently needs repair."`
- **Expected Decision**: `CLEAR`
- **Expected Department**: `Municipal Engineering Department`
- **cURL**:
  ```bash
  curl -X POST http://127.0.0.1:8000/api/analyze \
    -H "Content-Type: application/json" \
    -d '{"text": "There are large potholes on my street and the road urgently needs repair.", "state": "Maharashtra", "district": "Pune"}'
  ```

#### Test 2: AMBIGUOUS (Broken Traffic Signal)
- **Input**: `"The traffic signal at the main chowk has been broken for two weeks and nobody has fixed it."`
- **Expected Decision**: `AMBIGUOUS`
- **Expected Departments**: `Traffic Police Department` AND `Municipal Engineering Department`
- **cURL**:
  ```bash
  curl -X POST http://127.0.0.1:8000/api/analyze \
    -H "Content-Type: application/json" \
    -d '{"text": "The traffic signal at the main chowk has been broken for two weeks and nobody has fixed it.", "state": "Maharashtra", "district": "Pune"}'
  ```

#### Test 3: UNKNOWN (Novel AI Surveillance Query)
- **Input**: `"I want records about the new AI surveillance camera project in my area."`
- **Expected Decision**: `UNKNOWN` (deliberately not in Star Map)
- **cURL**:
  ```bash
  curl -X POST http://127.0.0.1:8000/api/analyze \
    -H "Content-Type: application/json" \
    -d '{"text": "I want records about the new AI surveillance camera project in my area.", "state": "Maharashtra", "district": "Pune"}'
  ```

---

## API Endpoints

- `POST /api/analyze`: Submits RTI text and district; returns `{ detected_subject, keywords, candidates, decision, confidence, reason }`.
- `GET /api/starmap`: Returns the in-memory array of Star Map rules.
- `GET /api/health`: Health status and active Star Map count.

---

## Dataset Notice
All 22 jurisdiction rules in `data/star_map.json` are demonstration data tagged `"source": "MVP / Demonstration Jurisdiction Dataset"`. They are designed to showcase single, shared, and unknown routing mechanics for the hackathon prototype.
