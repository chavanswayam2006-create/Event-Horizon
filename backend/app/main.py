"""
Main FastAPI Application for Event Horizon (Day 2 MVP).

Provides endpoints for RTI application text analysis, Star Map inspection,
stateless PDF text extraction, and health checks with CORS enabled for Vite frontend.
"""

import io
import json
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Dict, List, Optional
<<<<<<< HEAD
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
=======

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
>>>>>>> 428d356a5c70d6673781b819ee199aa6bdb9d6d4
from pydantic import BaseModel, Field
from pypdf import PdfReader

import pypdf

from app.ai_understanding import understand_rti_text, validate_rti_input
from app.config import (
    DISCLAIMER_TEXT,
    MAX_PDF_BYTES,
    MAX_PDF_PAGES,
)
from app.escape_velocity import evaluate_decision
from app.semantic_match import init_star_map_index, rank_rules

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


def validate_star_map(rules: List[Dict[str, Any]]):
    """Validate loaded Star Map rules according to Spec B."""
    required_fields = ["id", "state", "district", "subject", "departments", "note"]
    for idx, rule in enumerate(rules):
        for f in required_fields:
            if f not in rule:
                raise ValueError(
                    f"Star Map rule at index {idx} (ID: {rule.get('id', 'unknown')}) missing required field: '{f}'"
                )
        # Verify demo source tagging
        if "source" not in rule:
            rule["source"] = "MVP / Demonstration Jurisdiction Dataset"


def load_star_map():
    """Load, validate, and index Star Map once at startup."""
    global STAR_MAP
    map_file = find_star_map_path()
    if map_file.exists():
        with open(map_file, "r", encoding="utf-8") as f:
            STAR_MAP = json.load(f)
        validate_star_map(STAR_MAP)
        # Pre-compute TF-IDF vectors once at startup (Performance Rule)
        init_star_map_index(STAR_MAP)
        print(f"Successfully loaded and indexed {len(STAR_MAP)} Star Map rules from {map_file}")
    else:
        print(f"Warning: Star Map file not found at {map_file}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_star_map()
    yield


# Initial load on import for test clients and scripts
load_star_map()

app = FastAPI(
    title="Event Horizon API",
    description="AI-assisted RTI jurisdiction routing system (Day 2 MVP)",
    version="2.0.0",
    lifespan=lifespan,
)

# Enable CORS for local frontend development
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


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(
        status_code=400,
        content={
            "detail": str(exc),
            "error_type": "validation_error",
            "disclaimer": DISCLAIMER_TEXT,
        },
    )


# Pydantic Schemas (Spec G)
class AnalyzeRequest(BaseModel):
    text: str = Field(..., description="Raw text of the RTI application")
    state: Optional[str] = Field("Maharashtra", description="State name")
    district: Optional[str] = Field("Pune", description="District or city name")


class CandidateDepartment(BaseModel):
    name: str
    rule_id: str
    score: float


class SignalsDetail(BaseModel):
    semantic: float = 0.0
    subject: float = 0.0
    jurisdiction: float = 0.0
    jurisdiction_type: float = 0.0
    conflict_level: str = "low"
    conflict_penalty: float = 0.0
    vagueness_penalty: float = 0.0


class ConflictItem(BaseModel):
    reason: str
    involved_rule_ids: List[str]
    departments: List[str]


class CandidateItem(BaseModel):
    star_map_rule_id: Optional[str] = None
    subject: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    departments: List[str] = []
    jurisdiction: str = "single"
    jurisdiction_type: Optional[str] = "single"
    similarity: float = 0.0
    keyword_overlap: float = 0.0
    combined_score: float = 0.0
    note: Optional[str] = None
    source: Optional[str] = None


class AnalyzeResponse(BaseModel):
    # Day 2 Contract Fields (Spec G)
    status: str
    department: Optional[str] = None
    candidate_departments: List[CandidateDepartment] = []
    confidence: float
    subject: str = ""
    keywords: List[str] = []
    star_map_rules: List[str] = []
    jurisdiction_type: str = "single"
    signals: SignalsDetail
    conflicts: List[ConflictItem] = []
    explanation: List[str] = []
    recommended_action: str = ""
    guidance: Optional[str] = None
    warnings: List[str] = []
    disclaimer: str = DISCLAIMER_TEXT

    # Day 1 Backward Compatibility Fields
    decision: str
    detected_subject: str = ""
    reason: str = ""
    candidates: List[CandidateItem] = []


class PdfExtractResponse(BaseModel):
    text: str
    pages: int
    filename: str


@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "Event Horizon API",
        "version": "2.0.0",
        "star_map_rules_count": len(STAR_MAP),
        "disclaimer": DISCLAIMER_TEXT,
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
    """Return the entire in-memory Star Map array for inspection and path visualization."""
    return STAR_MAP


@app.post("/api/extract-pdf", response_model=PdfExtractResponse)
async def extract_pdf(file: UploadFile = File(...)):
    """
    Stateless PDF text extraction endpoint (Spec J):
      1. Validates file extension, Content-Type, and %PDF magic bytes.
      2. Validates MAX_PDF_BYTES and MAX_PDF_PAGES limits.
      3. Extracts readable text without OCR.
      4. Returns text to populate user's review box before analysis.
    """
    filename = file.filename or "uploaded.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload a valid PDF document.",
        )

    content = await file.read()

    # Size check
    if len(content) > MAX_PDF_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"PDF file size exceeds maximum limit of {MAX_PDF_BYTES // (1024 * 1024)} MB.",
        )

    # Magic byte check
    if not content.startswith(b"%PDF"):
        raise HTTPException(
            status_code=400,
            detail="Invalid or corrupt PDF file: Missing '%PDF' file header.",
        )

    try:
        pdf_stream = io.BytesIO(content)
        reader = pypdf.PdfReader(pdf_stream)
        if reader.is_encrypted:
            try:
                reader.decrypt("")
            except Exception:
                raise HTTPException(
                    status_code=400,
                    detail="Password-protected PDF files cannot be processed. Please upload an unprotected PDF.",
                )
        page_count = len(reader.pages)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to parse PDF document. The file may be corrupt or invalid. ({str(e)})",
        )
    if page_count > MAX_PDF_PAGES:
        raise HTTPException(
            status_code=400,
            detail=f"PDF exceeds the maximum allowed length of {MAX_PDF_PAGES} pages (found {page_count} pages).",
        )

    extracted_pages: List[str] = []
    for page_idx, page in enumerate(reader.pages):
        try:
            text = page.extract_text() or ""
            if text.strip():
                extracted_pages.append(text.strip())
        except Exception:
            continue

    combined_text = "\n\n".join(extracted_pages).strip()
    if not combined_text:
        raise HTTPException(
            status_code=400,
            detail="PDF text could not be extracted. Please paste the RTI text manually.",
        )

    return PdfExtractResponse(
        text=combined_text,
        pages=page_count,
        filename=filename,
    )


@app.post("/api/analyze", response_model=AnalyzeResponse)
def analyze_rti(request: AnalyzeRequest):
    """
    Analyzes raw RTI application text:
      1. Validates input bounds & truncation (Spec I)
      2. AI Understanding: extracted keywords, concepts, subject detection (Spec C)
      3. Semantic Matching: similarity scores against cached Star Map index (Spec C)
      4. Escape Velocity Engine: decision, conflict resolution, capped confidence, explainability (Spec D, E, F, H)
    """
    # 1. Input Validation
    cleaned_text, input_warnings = validate_rti_input(request.text)

    # 2. AI Understanding
    ai_result = understand_rti_text(cleaned_text, STAR_MAP)
    detected_subject = ai_result["detected_subject"]
    keywords = ai_result["keywords"]
    is_vague = ai_result["is_vague"]

    # 3. Semantic Ranking against cached Star Map
    candidates = rank_rules(
        application_text=cleaned_text,
        rules=STAR_MAP,
        state=request.state,
        district=request.district,
        query_keywords=keywords,
        detected_subject=detected_subject,
    )

    # 4. Escape Velocity Decision Engine
    eval_result = evaluate_decision(
        candidates=candidates,
        detected_subject=detected_subject,
        is_vague=is_vague,
        query_district=request.district,
    )

    # Combine input warnings with result warnings
    all_warnings = input_warnings + eval_result.get("warnings", [])

    return AnalyzeResponse(
        status=eval_result["status"],
        decision=eval_result["status"],
        department=eval_result["department"],
        candidate_departments=eval_result["candidate_departments"],
        confidence=eval_result["confidence"],
        subject=eval_result["subject"] or detected_subject,
        detected_subject=eval_result["subject"] or detected_subject,
        keywords=keywords,
        star_map_rules=eval_result["star_map_rules"],
        jurisdiction_type=eval_result["jurisdiction_type"],
        signals=eval_result["signals"],
        conflicts=eval_result["conflicts"],
        explanation=eval_result["explanation"],
        reason=eval_result["reason"],
        recommended_action=eval_result["recommended_action"],
        guidance=eval_result["guidance"],
        candidates=eval_result["candidates"],
        warnings=all_warnings,
        disclaimer=eval_result["disclaimer"],
    )


# Serve built frontend in unified deployment mode if dist directory exists
dist_path = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if dist_path.exists():
    app.mount("/", StaticFiles(directory=str(dist_path), html=True), name="frontend")
