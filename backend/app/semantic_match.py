"""
Semantic Matching Module for Event Horizon (Day 2 MVP).

Vectorizes Star Map rules once at startup using per-language TF-IDF spaces
(English: word n-grams, unchanged from Day 1/2; Hindi/Marathi: word + character
n-grams) and computes cosine similarity with short-text length calibration and
sub-signal extraction.
"""

import hashlib
import json
import math
import os
import pickle
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.ai_understanding import (
    LANGUAGE_STOPWORDS,
    get_localized_aliases,
    get_localized_department,
    get_localized_subject,
    stem_word,
    tokenize,
)
from app.config import (
    DEFAULT_LANGUAGE,
    ENGINE_VERSION,
    JURISDICTION_TYPE_SCORES,
    RULESET_VERSION,
    SUPPORTED_LANGUAGES,
    WEIGHT_SEMANTIC,
    WEIGHT_SUBJECT,
    WEIGHT_JURISDICTION,
    WEIGHT_JURISDICTION_TYPE,
)

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    from sklearn.pipeline import FeatureUnion
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


def _preprocess_text(text: str, language: str = "en") -> str:
    """
    Normalize text for indexing and comparison.

    Latin tokens are stemmed exactly as before (English behaviour unchanged);
    Devanagari tokens are left intact because inflection lives in the trailing
    vowel signs, which character n-grams capture instead.
    """
    words = tokenize(text)
    if language in ("hi", "mr"):
        return " ".join(words)
    return " ".join(stem_word(w) for w in words)


def build_rule_document(rule: Dict[str, Any], language: str = "en") -> str:
    """
    Build the enriched index document for a rule in a specific language.

    The English document is byte-identical to the Day 1/2 corpus so existing
    calibrated scores are preserved. Localized documents contain the localized
    subject (weighted twice) and localized aliases (weighted twice).
    """
    if language == "en":
        subj = rule.get("subject", "")
        aliases = " ".join(rule.get("aliases", []))
        note = rule.get("note", "")
        return f"{subj} {subj} {aliases} {aliases} {note}"

    subj = get_localized_subject(rule, language)
    aliases = " ".join(get_localized_aliases(rule, language))
    return f"{subj} {subj} {aliases} {aliases}"


def compute_keyword_overlap(query_keywords: List[str], target_stemmed_tokens: set) -> float:
    """Compute overlap ratio of query keywords against target stemmed tokens."""
    if not query_keywords:
        return 0.0
    stemmed_query = {stem_word(k) for k in query_keywords}
    if not stemmed_query:
        return 0.0
    intersection = stemmed_query.intersection(target_stemmed_tokens)
    return len(intersection) / len(stemmed_query)


def _build_language_vectorizer(language: str):
    """Create the TF-IDF vectorizer for one language."""
    if language == "en":
        # Day 1/2 configuration is intentionally preserved for calibration.
        return TfidfVectorizer(ngram_range=(1, 2), stop_words="english")
    stopwords = sorted(LANGUAGE_STOPWORDS.get(language, set()))
    return FeatureUnion(
        [
            ("word", TfidfVectorizer(ngram_range=(1, 2), stop_words=stopwords)),
            ("char", TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 4))),
        ]
    )


class StarMapIndex:
    """
    In-memory pre-vectorized Star Map search index with one TF-IDF space per
    language. Fitted ONCE at server startup to adhere to the Performance Rule.
    """

    def __init__(self, rules: List[Dict[str, Any]], languages: tuple = SUPPORTED_LANGUAGES):
        self.rules = rules
        self.languages = tuple(languages)
        self.proc_corpora: Dict[str, List[str]] = {}
        self.vectorizers: Dict[str, Any] = {}
        self.matrices: Dict[str, Any] = {}

        if rules:
            self._build_index()

    def _build_index(self):
        for language in self.languages:
            documents = [build_rule_document(rule, language) for rule in self.rules]
            proc_docs = [_preprocess_text(doc, language) for doc in documents]
            self.proc_corpora[language] = proc_docs

            if not any(doc.strip() for doc in proc_docs):
                # Language not present in the dataset (e.g. translations missing).
                continue
            if not SKLEARN_AVAILABLE:
                continue
            try:
                vectorizer = _build_language_vectorizer(language)
                matrix = vectorizer.fit_transform(proc_docs)
                self.vectorizers[language] = vectorizer
                self.matrices[language] = matrix
            except Exception:
                self.vectorizers.pop(language, None)
                self.matrices.pop(language, None)

    def resolve_language(self, language: Optional[str]) -> str:
        """Map an unsupported/empty language to a language this index has."""
        if language in self.proc_corpora:
            return str(language)
        if DEFAULT_LANGUAGE in self.proc_corpora:
            return DEFAULT_LANGUAGE
        return next(iter(self.proc_corpora), DEFAULT_LANGUAGE)

    def compute_similarities(self, query_text: str, language: str = "en") -> List[float]:
        """Compute cosine similarity against all rules in the language's index."""
        if not self.rules or not query_text.strip():
            return []

        resolved = self.resolve_language(language)
        proc_query = _preprocess_text(query_text, resolved)

        vectorizer = self.vectorizers.get(resolved)
        matrix = self.matrices.get(resolved)
        if SKLEARN_AVAILABLE and vectorizer is not None and matrix is not None:
            try:
                query_vec = vectorizer.transform([proc_query])
                sims = cosine_similarity(query_vec, matrix).flatten()
                return [max(0.0, min(1.0, float(s))) for s in sims]
            except Exception:
                pass

        # Fallback pure-python TF-IDF
        return self._fallback_tfidf(proc_query, resolved)

    def _fallback_tfidf(self, proc_query: str, language: str = "en") -> List[float]:
        docs = [proc_query] + list(self.proc_corpora.get(language, []))
        tokenized_docs = [d.split() for d in docs]
        n_docs = len(docs)

        df: Dict[str, int] = {}
        for doc in tokenized_docs:
            for term in set(doc):
                df[term] = df.get(term, 0) + 1

        idf: Dict[str, float] = {
            term: math.log((1 + n_docs) / (1 + count)) + 1.0
            for term, count in df.items()
        }

        def doc_to_vec(tokens: List[str]) -> Dict[str, float]:
            tf: Dict[str, float] = {}
            for t in tokens:
                tf[t] = tf.get(t, 0.0) + 1.0
            vec = {t: freq * idf.get(t, 1.0) for t, freq in tf.items()}
            norm = math.sqrt(sum(v * v for v in vec.values()))
            if norm > 0:
                return {t: v / norm for t, v in vec.items()}
            return vec

        query_vec = doc_to_vec(tokenized_docs[0])
        sims: List[float] = []
        for i in range(1, len(tokenized_docs)):
            target_vec = doc_to_vec(tokenized_docs[i])
            dot = sum(query_vec.get(term, 0.0) * val for term, val in target_vec.items())
            sims.append(max(0.0, min(1.0, float(dot))))
        return sims


# Global cached index instance
CACHED_INDEX: Optional[StarMapIndex] = None


def rules_fingerprint(rules: List[Dict[str, Any]]) -> str:
    """Stable SHA-256 fingerprint of the rule set, used to validate persisted indexes."""
    payload = json.dumps(rules, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def save_index(index: StarMapIndex, path) -> Path:
    """
    Persist a fitted Star Map index to disk (retrain artifact).

    The artifact embeds the ruleset/engine versions and a fingerprint of the
    rules it was trained on so stale artifacts are rejected on load.
    Raises on I/O failure (retrain scripts treat that as fatal).
    """
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    blob = {
        "format_version": 1,
        "ruleset_version": RULESET_VERSION,
        "engine_version": ENGINE_VERSION,
        "created_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "fingerprint": rules_fingerprint(index.rules),
        "index": index,
    }
    temp_target = target.with_suffix(target.suffix + ".tmp")
    with open(temp_target, "wb") as handle:
        pickle.dump(blob, handle, protocol=pickle.HIGHEST_PROTOCOL)
    os.replace(temp_target, target)
    return target


def load_index(path, rules: List[Dict[str, Any]]) -> Optional[StarMapIndex]:
    """
    Load a persisted index if and only if it matches `rules` exactly.
    Returns None for missing, corrupt, stale, or unreadable artifacts so the
    caller falls back to a fresh build.
    """
    target = Path(path)
    if not target.exists():
        return None
    try:
        with open(target, "rb") as handle:
            blob = pickle.load(handle)
    except Exception as exc:
        print(f"Index restore warning: could not load {target} ({exc})")
        return None
    if not isinstance(blob, dict) or blob.get("format_version") != 1:
        return None
    if blob.get("fingerprint") != rules_fingerprint(rules):
        # Rules changed since the artifact was written: stale, rebuild instead.
        return None
    index = blob.get("index")
    if not isinstance(index, StarMapIndex) or index.rules != rules:
        return None
    if not index.vectorizers:
        return None
    return index


def init_star_map_index(rules: List[Dict[str, Any]], index: Optional[StarMapIndex] = None) -> StarMapIndex:
    """Initialize and cache the Star Map vector index at server startup.

    When `index` is provided (e.g. restored from a retrain artifact) it is used
    directly instead of refitting from scratch.
    """
    global CACHED_INDEX
    CACHED_INDEX = index if index is not None else StarMapIndex(rules)
    return CACHED_INDEX


def rank_rules(
    application_text: str,
    rules: List[Dict[str, Any]],
    state: Optional[str] = None,
    district: Optional[str] = None,
    query_keywords: Optional[List[str]] = None,
    detected_subject: str = "",
    language: str = "en",
    display_language: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Ranks Star Map rules based on hybrid TF-IDF cosine similarity,
    keyword/alias overlap, jurisdiction alignment, and jurisdiction type.
    Extracts explicit sub-signals for the Escape Velocity Engine.

    `language` selects the TF-IDF space used for matching; `display_language`
    (optional) selects which localized labels are attached to candidates.
    """
    global CACHED_INDEX
    if not rules or not application_text.strip():
        return []

    if CACHED_INDEX is None or CACHED_INDEX.rules != rules:
        CACHED_INDEX = StarMapIndex(rules)

    resolved_language = CACHED_INDEX.resolve_language(language)
    resolved_display = display_language if display_language in SUPPORTED_LANGUAGES else resolved_language

    raw_similarities = CACHED_INDEX.compute_similarities(application_text, resolved_language)
    keywords = query_keywords if query_keywords is not None else application_text.split()
    stemmed_query_set = {stem_word(k) for k in keywords}
    app_lower = application_text.lower()

    candidates: List[Dict[str, Any]] = []

    for idx, rule in enumerate(rules):
        raw_sim = raw_similarities[idx] if idx < len(raw_similarities) else 0.0
        # Calibrate raw cosine similarity for short query length ratio
        sim = min(1.0, raw_sim * 3.2)

        # 1. Subject & Alias Signal (localized surface forms for the match language)
        subj_str = rule.get("subject", "")
        subj_variant = get_localized_subject(rule, resolved_language)
        subj_tokens = set(_preprocess_text(subj_variant, resolved_language).split())
        subj_overlap = (
            len(subj_tokens.intersection(stemmed_query_set)) / max(1, len(subj_tokens))
            if subj_tokens
            else 0.0
        )

        # Check alias matches
        alias_matched = False
        for a in get_localized_aliases(rule, resolved_language):
            if a.lower() in app_lower:
                alias_matched = True
                break

        subject_score = min(1.0, subj_overlap * 0.7 + (0.3 if alias_matched else 0.0))
        if detected_subject and detected_subject.lower() == subj_str.lower():
            subject_score = max(subject_score, 0.90)

        # 2. Jurisdiction Alignment Signal
        rule_district = rule.get("district", "")
        rule_state = rule.get("state", "")
        if district and rule_district:
            if district.lower() == rule_district.lower():
                jurisdiction_score = 1.0
            else:
                jurisdiction_score = 0.10
        elif not district:
            # If no location provided, treat neutrally
            jurisdiction_score = 0.50
        else:
            jurisdiction_score = 0.50

        # 3. Jurisdiction Type Signal (single vs shared)
        j_type = rule.get("jurisdiction_type") or rule.get("jurisdiction", "single")
        j_type_score = JURISDICTION_TYPE_SCORES.get(j_type, 0.5)

        # Combined raw score per candidate
        weighted_score = (
            (WEIGHT_SEMANTIC * sim)
            + (WEIGHT_SUBJECT * subject_score)
            + (WEIGHT_JURISDICTION * jurisdiction_score)
            + (WEIGHT_JURISDICTION_TYPE * j_type_score)
        )
        combined = max(0.0, min(1.0, weighted_score))

        target_tokens = set(
            CACHED_INDEX.proc_corpora.get(resolved_language, [""] * (idx + 1))[idx].split()
        )
        kw_overlap = compute_keyword_overlap(keywords, target_tokens)

        departments = rule.get("departments", [])
        candidates.append({
            "star_map_rule_id": rule.get("id"),
            "subject": subj_str,
            "subject_localized": get_localized_subject(rule, resolved_display),
            "state": rule_state,
            "district": rule_district,
            "departments": departments,
            "departments_localized": [
                get_localized_department(rule, dept, resolved_display) for dept in departments
            ],
            "jurisdiction": j_type,
            "jurisdiction_type": j_type,
            "similarity": round(sim, 4),
            "keyword_overlap": round(kw_overlap, 4),
            "signals": {
                "semantic": round(sim, 4),
                "subject": round(subject_score, 4),
                "jurisdiction": round(jurisdiction_score, 4),
                "jurisdiction_type": round(j_type_score, 4),
            },
            "combined_score": round(combined, 4),
            "note": rule.get("note", ""),
            "source": rule.get("source", "MVP / Demonstration Jurisdiction Dataset"),
            "verified": bool(rule.get("verified", False)),
            "last_updated": rule.get("last_updated"),
            "version": rule.get("version"),
            "language": resolved_display,
        })

    candidates.sort(key=lambda c: c["combined_score"], reverse=True)
    return candidates
