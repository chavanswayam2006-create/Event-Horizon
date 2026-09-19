"""
Semantic Matching Module for Event Horizon (Day 1 MVP).

Computes TF-IDF vectorization and cosine similarity between user RTI input
and Star Map jurisdiction rules (subject + note). Also computes keyword overlap.
"""

import math
import re
from typing import Any, Dict, List, Optional
from app.ai_understanding import stem_word

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


def _preprocess_text(text: str) -> str:
    """Normalize and stem text for TF-IDF indexing and comparison."""
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


def fallback_tfidf_cosine(query: str, corpus: List[str]) -> List[float]:
    """
    Pure Python lightweight TF-IDF cosine similarity fallback in case
    scikit-learn is not installed or available.
    """
    docs = [query] + corpus
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

    def doc_to_vector(tokens: List[str]) -> Dict[str, float]:
        tf: Dict[str, float] = {}
        for t in tokens:
            tf[t] = tf.get(t, 0.0) + 1.0
        vec = {t: freq * idf.get(t, 1.0) for t, freq in tf.items()}
        norm = math.sqrt(sum(v * v for v in vec.values()))
        if norm > 0:
            return {t: v / norm for t, v in vec.items()}
        return vec

    query_vec = doc_to_vector(tokenized_docs[0])
    similarities: List[float] = []

    for i in range(1, len(tokenized_docs)):
        target_vec = doc_to_vector(tokenized_docs[i])
        dot = sum(query_vec.get(term, 0.0) * val for term, val in target_vec.items())
        similarities.append(max(0.0, min(1.0, float(dot))))

    return similarities


def rank_rules(
    application_text: str,
    rules: List[Dict[str, Any]],
    state: Optional[str] = None,
    district: Optional[str] = None,
    query_keywords: Optional[List[str]] = None,
) -> List[Dict[str, Any]]:
    """
    Ranks Star Map rules based on TF-IDF cosine similarity and keyword overlap.
    """
    if not rules or not application_text.strip():
        return []

    # Prepare corpus: duplicate subject once to give appropriate salience
    corpus_raw = [f"{r.get('subject', '')} {r.get('subject', '')} {r.get('note', '')}" for r in rules]
    proc_corpus = [_preprocess_text(c) for c in corpus_raw]
    proc_query = _preprocess_text(application_text)

    # Compute similarity via scikit-learn or fallback
    if SKLEARN_AVAILABLE:
        try:
            vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words="english")
            tfidf_matrix = vectorizer.fit_transform([proc_query] + proc_corpus)
            sims = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
            raw_similarities = [max(0.0, min(1.0, float(s))) for s in sims]
        except Exception:
            raw_similarities = fallback_tfidf_cosine(proc_query, proc_corpus)
    else:
        raw_similarities = fallback_tfidf_cosine(proc_query, proc_corpus)

    keywords = query_keywords if query_keywords is not None else application_text.split()
    stemmed_query_set = {stem_word(k) for k in keywords}

    candidates: List[Dict[str, Any]] = []
    for idx, rule in enumerate(rules):
        raw_sim = raw_similarities[idx]
        # Calibrate raw cosine similarity for short-query to document length ratio
        sim = min(1.0, raw_sim * 3.5)

        target_tokens = set(proc_corpus[idx].split())
        kw_overlap = compute_keyword_overlap(keywords, target_tokens)

        # Subject alignment: check if rule subject matches query tokens
        subj_tokens = set(_preprocess_text(rule.get("subject", "")).split())
        subj_match_ratio = (
            len(subj_tokens.intersection(stemmed_query_set)) / max(1, len(subj_tokens))
            if subj_tokens
            else 0.0
        )
        subj_bonus = 0.15 if subj_match_ratio >= 0.8 else 0.0

        # District preference bonus
        district_bonus = 0.0
        if district and rule.get("district", "").lower() == district.lower():
            district_bonus = 0.05

        # Combined score calculation
        base_combined = (0.7 * sim) + (0.3 * kw_overlap) + subj_bonus + district_bonus
        combined = min(1.0, max(0.0, base_combined))

        candidates.append({
            "star_map_rule_id": rule.get("id"),
            "subject": rule.get("subject"),
            "state": rule.get("state"),
            "district": rule.get("district"),
            "departments": rule.get("departments", []),
            "jurisdiction": rule.get("jurisdiction", "single"),
            "similarity": round(sim, 4),
            "keyword_overlap": round(kw_overlap, 4),
            "combined_score": round(combined, 4),
            "note": rule.get("note", ""),
            "source": rule.get("source", "MVP / Demonstration Jurisdiction Dataset"),
        })

    candidates.sort(key=lambda c: c["combined_score"], reverse=True)
    return candidates
