"""
Main FastAPI Application for Event Horizon (Day 1 MVP).

Provides endpoints for RTI application text analysis, Star Map inspection,
and health checks with CORS enabled for the React Vite frontend.
"""

import io
import json
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from pypdf import PdfReader

from app.ai_understanding import understand_rti_text
from app.semantic_match import rank_rules
from app.escape_velocity import evaluate_decision

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_star_map()
    yield

app = FastAPI(
    title="Event Horizon API",
    description="AI-assisted RTI jurisdiction routing system (Day 1 MVP)",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for local frontend development (Vite default is http://localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory Star Map storage
STAR_MAP: List[Dict[str, Any]] = []


def find_star_map_path() -> Path:
    """Locate star_map.json relative to project directories."""
    possible_paths = [
        Path(__file__).resolve().parent.parent.parent / "data" / "star_map.json",
        Path(__file__).resolve().parent.parent / "data" / "star_map.json",
        Path("data/star_map.json").resolve(),
    ]
    for p in possible_paths:
        if p.exists():
            return p
    return possible_paths[0]


def load_star_map():
    global STAR_MAP
    map_file = find_star_map_path()
    if map_file.exists():
        with open(map_file, "r", encoding="utf-8") as f:
            STAR_MAP = json.load(f)
        print(f"Loaded {len(STAR_MAP)} jurisdiction rules from {map_file}")
    else:
        print(f"Warning: Star Map file not found at {map_file}")


class AnalyzeRequest(BaseModel):
    text: str = Field(..., description="Raw text of the RTI application")
    state: Optional[str] = Field("Maharashtra", description="State name")
    district: Optional[str] = Field("Pune", description="District or city name")


class CandidateItem(BaseModel):
    star_map_rule_id: Optional[str] = None
    subject: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    departments: List[str] = []
    jurisdiction: str = "single"
    similarity: float = 0.0
    keyword_overlap: float = 0.0
    combined_score: float = 0.0
    note: Optional[str] = None
    source: Optional[str] = None


class AnalyzeResponse(BaseModel):
    detected_subject: str
    keywords: List[str]
    candidates: List[CandidateItem]
    decision: str
    confidence: float
    reason: str


@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "Event Horizon API",
        "star_map_rules_count": len(STAR_MAP),
    }


@app.post("/api/extract-pdf")
async def extract_pdf(file: UploadFile = File(...)):
    """Extract plain text from an uploaded RTI PDF document."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Uploaded file must have a .pdf extension")
    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Uploaded PDF file is empty")
        
        reader = PdfReader(io.BytesIO(content))
        extracted_text = ""
        for page in reader.pages:
            t = page.extract_text()
            if t:
                extracted_text += t + "\n"
        
        extracted_text = extracted_text.strip()
        if not extracted_text:
            raise HTTPException(
                status_code=422,
                detail="No machine-readable text found in PDF. Scanned images require OCR."
            )
        
        return {
            "filename": file.filename,
            "extracted_text": extracted_text,
            "pages_count": len(reader.pages),
            "char_count": len(extracted_text)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract PDF text: {str(e)}")


@app.get("/api/starmap", response_model=List[Dict[str, Any]])
def get_star_map():
    """Return the entire in-memory Star Map array for inspection/demo."""
    return STAR_MAP


@app.post("/api/analyze", response_model=AnalyzeResponse)
def analyze_rti(request: AnalyzeRequest):
    """
    Analyzes raw RTI application text:
      1. AI Understanding (extracts subject guess & keywords)
      2. Semantic Matching (computes similarity against Star Map rules)
      3. Escape Velocity Engine (CLEAR / AMBIGUOUS / UNKNOWN evaluation)
    """
    raw_text = request.text.strip()
    if not raw_text:
        raise HTTPException(status_code=400, detail="RTI text cannot be empty")

    # Collect known subjects from Star Map
    known_subjects = list({r.get("subject", "") for r in STAR_MAP if r.get("subject")})

    # Step 1: AI Understanding
    ai_result = understand_rti_text(raw_text, known_subjects)
    detected_subject = ai_result["subject_guess"]
    keywords = ai_result["keywords"]

    # Step 2: Semantic Matching
    candidates = rank_rules(
        application_text=raw_text,
        rules=STAR_MAP,
        state=request.state,
        district=request.district,
        query_keywords=keywords,
    )

    # Step 3: Escape Velocity Engine
    eval_result = evaluate_decision(candidates, detected_subject=detected_subject)

    # If detected_subject is recognized from Star Map, populate it
    if not detected_subject and candidates and eval_result["decision"] != "UNKNOWN":
        detected_subject = candidates[0].get("subject", "")

    return AnalyzeResponse(
        detected_subject=detected_subject if eval_result["decision"] != "UNKNOWN" else "",
        keywords=keywords,
        candidates=eval_result["candidates"],
        decision=eval_result["decision"],
        confidence=eval_result["confidence"],
        reason=eval_result["reason"],
    )


# Serve built frontend in unified deployment mode if dist directory exists
dist_path = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if dist_path.exists():
    app.mount("/", StaticFiles(directory=str(dist_path), html=True), name="frontend")
