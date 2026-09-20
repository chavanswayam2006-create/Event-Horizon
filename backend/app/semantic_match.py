"""
Semantic Matching Module for Event Horizon (Day 2 MVP).

Vectorizes Star Map rules once at startup using TF-IDF and computes cosine similarity
with short-text length calibration and sub-signal extraction.
"""

import math
import re
from typing import Any, Dict, List, Optional
from app.ai_understanding import stem_word
from app.config import (
    JURISDICTION_TYPE_SCORES,
    WEIGHT_SEMANTIC,
    WEIGHT_SUBJECT,
    WEIGHT_JURISDICTION,
    WEIGHT_JURISDICTION_TYPE,
)

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


def _preprocess_text(text: str) -> str:
    """Normalize and stem text for indexing and comparison."""
    words = re.findall(r"[a-zA-Z0-9]+", text.lower())
    return " ".join(stem_word(w) for w in words)


def compute_keyword_overlap(query_keywords: List[str], target_stemmed_tokens: set) -> float:
    """Compute overlap ratio of query keywords against target stemmed tokens."""
    if not query_keywords:
        return 0.0
    stemmed_query = {stem_word(k) for k in query_keywords}
    if not stemmed_query:
        return 0.0
    intersection = stemmed_query.intersection(target_stemmed_tokens)
    return len(intersection) / len(stemmed_query)


class StarMapIndex:
    """
    In-memory pre-vectorized Star Map search index.
    Fitted ONCE at server startup to adhere to the Performance Rule.
    """

    def __init__(self, rules: List[Dict[str, Any]]):
        self.rules = rules
        self.corpus_raw: List[str] = []
        self.proc_corpus: List[str] = []
        self.vectorizer: Optional[Any] = None
        self.tfidf_matrix: Optional[Any] = None

        if rules:
            self._build_index()

    def _build_index(self):
        # Build enriched rule representation including subject, aliases, and notes
        for r in self.rules:
            subj = r.get("subject", "")
            aliases = " ".join(r.get("aliases", []))
            note = r.get("note", "")
            # Give weight to subject and aliases
            doc = f"{subj} {subj} {aliases} {aliases} {note}"
            self.corpus_raw.append(doc)
            self.proc_corpus.append(_preprocess_text(doc))

        if SKLEARN_AVAILABLE:
            try:
                self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words="english")
                self.tfidf_matrix = self.vectorizer.fit_transform(self.proc_corpus)
            except Exception:
                self.vectorizer = None
                self.tfidf_matrix = None

    def compute_similarities(self, query_text: str) -> List[float]:
        """Compute cosine similarity against all rules in the index."""
        if not self.rules or not query_text.strip():
            return []

        proc_query = _preprocess_text(query_text)

        if SKLEARN_AVAILABLE and self.vectorizer is not None and self.tfidf_matrix is not None:
            try:
                query_vec = self.vectorizer.transform([proc_query])
                sims = cosine_similarity(query_vec, self.tfidf_matrix).flatten()
                return [max(0.0, min(1.0, float(s))) for s in sims]
            except Exception:
                pass

        # Fallback pure-python TF-IDF
        return self._fallback_tfidf(proc_query)

    def _fallback_tfidf(self, proc_query: str) -> List[float]:
        docs = [proc_query] + self.proc_corpus
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


def init_star_map_index(rules: List[Dict[str, Any]]) -> StarMapIndex:
    """Initialize and cache the Star Map vector index at server startup."""
    global CACHED_INDEX
    CACHED_INDEX = StarMapIndex(rules)
    return CACHED_INDEX


def rank_rules(
    application_text: str,
    rules: List[Dict[str, Any]],
    state: Optional[str] = None,
    district: Optional[str] = None,
    query_keywords: Optional[List[str]] = None,
    detected_subject: str = "",
) -> List[Dict[str, Any]]:
    """
    Ranks Star Map rules based on hybrid TF-IDF cosine similarity,
    keyword/alias overlap, jurisdiction alignment, and jurisdiction type.
    Extracts explicit sub-signals for the Escape Velocity Engine.
    """
    global CACHED_INDEX
    if not rules or not application_text.strip():
        return []

    if CACHED_INDEX is None or CACHED_INDEX.rules != rules:
        CACHED_INDEX = StarMapIndex(rules)

    raw_similarities = CACHED_INDEX.compute_similarities(application_text)
    keywords = query_keywords if query_keywords is not None else application_text.split()
    stemmed_query_set = {stem_word(k) for k in keywords}
    app_lower = application_text.lower()

    candidates: List[Dict[str, Any]] = []

    for idx, rule in enumerate(rules):
        raw_sim = raw_similarities[idx] if idx < len(raw_similarities) else 0.0
        # Calibrate raw cosine similarity for short query length ratio
        sim = min(1.0, raw_sim * 3.2)

        # 1. Subject & Alias Signal
        subj_str = rule.get("subject", "")
        subj_tokens = set(_preprocess_text(subj_str).split())
        subj_overlap = (
            len(subj_tokens.intersection(stemmed_query_set)) / max(1, len(subj_tokens))
            if subj_tokens
            else 0.0
        )
        
        # Check alias matches
        alias_matched = False
        for a in rule.get("aliases", []):
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

        target_tokens = set(CACHED_INDEX.proc_corpus[idx].split())
        kw_overlap = compute_keyword_overlap(keywords, target_tokens)

        candidates.append({
            "star_map_rule_id": rule.get("id"),
            "subject": subj_str,
            "state": rule_state,
            "district": rule_district,
            "departments": rule.get("departments", []),
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
        })

    candidates.sort(key=lambda c: c["combined_score"], reverse=True)
    return candidates
