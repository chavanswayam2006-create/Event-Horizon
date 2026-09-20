# Day 3 Bug & Risk Inventory

Live inventory tracking issues, severity, and resolution status during the Day 3 stabilization sprint.

| # | Severity | Area | Description | Status | Verification & Resolution Note |
|---|----------|------|-------------|--------|--------------------------------|
| 1 | HIGH | Ingestion / PDF Path | PDF document upload uses hardcoded canned string instead of real text extraction | **Resolved** | Integrated `pypdf>=4.0.0` with `POST /api/extract-pdf`. Verified with unit test `test_extract_pdf_endpoint` and live multipart PDF upload. |
| 2 | MEDIUM | API Routing | `GET /health` endpoint returns 404 (only `/api/health` mapped) | **Resolved** | Added `@app.get("/health")` alias in `backend/app/main.py`. Verified via curl and unit test `test_health_endpoints` returning HTTP 200. |
| 3 | MEDIUM | Compliance / UX | Star Map UI does not visibly display "MVP / Demonstration Jurisdiction Dataset" | **Resolved** | Added explicit `"MVP / Demonstration Jurisdiction Dataset"` badges on Candidate Evidence table in `HomeAnalyzerView.jsx` and Star Map view banner & rules table header. |
| 4 | MEDIUM | Deployment | No deployment configuration exists for cloud hosting | **Resolved** | Created `render.yaml` (unified fullstack web service), `backend/Procfile` (standard Uvicorn runner), `frontend/vercel.json` (Vite SPA rewrites), and mounted `frontend/dist` on FastAPI root. |
| 5 | LOW | Documentation | `docs/` folder missing from repo root | **Resolved** | Created `docs/day3_risk_inventory.md` and `docs/future_ideas.md` with full tracking and Day 4 backlogs. |

## Severity Legend
- **CRITICAL**: Demo will not work at all (app won't start, core endpoint 500s, decision logic crashes on canonical test inputs).
- **HIGH**: Major feature broken or visibly wrong output (e.g. AMBIGUOUS never triggers, PDF upload silently fails).
- **MEDIUM**: Works but could confuse a judge (unclear decision reasoning, missing health probe, missing dataset attribution).
- **LOW**: Cosmetic only (spacing, color shade, copy tweaks).

## Automated Acceptance Test Run (Pass Rate: 100%)
- `test_acceptance_case_1_potholes_road_repair`: **PASSED** (CLEAR → Municipal Engineering Department)
- `test_acceptance_case_2_traffic_signal_ambiguous`: **PASSED** (AMBIGUOUS → Traffic Police Dept & Municipal Engineering Dept)
- `test_acceptance_case_3_ai_surveillance_unknown`: **PASSED** (UNKNOWN → No star map match)
- `test_health_endpoints`: **PASSED** (`/health` & `/api/health` return HTTP 200)
- `test_extract_pdf_endpoint`: **PASSED** (real PDF extracted, non-PDF rejected)
