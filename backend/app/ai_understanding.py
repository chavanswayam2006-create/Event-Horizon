"""
AI Understanding Module for Event Horizon (Day 2 MVP).

Performs lightweight tokenization, suffix stemming, stopword removal,
n-gram generation, alias matching, and input validation.
"""

import re
from typing import Any, Dict, List, Optional, Set, Tuple
from app.config import MIN_INPUT_CHARS, MAX_INPUT_CHARS

STOPWORDS: Set[str] = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
    "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't",
    "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during",
    "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't",
    "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here",
    "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i",
    "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's",
    "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself",
    "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought",
    "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she",
    "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such",
    "than", "that", "that's", "the", "their", "theirs", "them", "themselves",
    "then", "there", "there's", "these", "they", "they'd", "they'll", "they're",
    "they've", "this", "those", "through", "to", "too", "under", "until", "up",
    "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were",
    "weren't", "what", "what's", "when", "when's", "where", "where's", "which",
    "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would",
    "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours",
    "yourself", "yourselves", "want", "please", "kindly", "urgently", "regarding",
    "application", "information", "details", "records", "project", "new", "area",
    "give", "provide", "request", "sir", "madam", "officer", "department"
}


def validate_rti_input(raw_text: Optional[str]) -> Tuple[str, List[str]]:
    """
    Validates user input according to Spec I.
    Raises ValueError with user-friendly messages for invalid input.
    Returns sanitized text and any applicable warnings.
    """
    if raw_text is None or not raw_text.strip():
        raise ValueError("Please enter an RTI application.")

    cleaned = raw_text.strip()
    if len(cleaned) < MIN_INPUT_CHARS:
        raise ValueError("This request is too short to produce a reliable routing analysis.")

    warnings: List[str] = []
    if len(cleaned) > MAX_INPUT_CHARS:
        cleaned = cleaned[:MAX_INPUT_CHARS]
        warnings.append(
            f"input_truncated: Request exceeded {MAX_INPUT_CHARS} characters. "
            f"Analyzed the first {MAX_INPUT_CHARS} characters."
        )

    return cleaned, warnings


def stem_word(word: str) -> str:
    """Lightweight suffix stemmer for English inflections."""
    w = word.lower()
    for s in ("ing", "ies", "es", "s", "ed", "tion", "ment"):
        if w.endswith(s) and len(w) > len(s) + 2:
            return w[:-len(s)]
    return w


def clean_and_tokenize(text: str) -> List[str]:
    """Normalize text and return lowercased alphanumeric tokens."""
    return re.findall(r"[a-zA-Z0-9]+", text.lower())


def extract_ngrams(tokens: List[str], n: int = 2) -> List[str]:
    """Generate n-grams from a list of tokens."""
    if len(tokens) < n:
        return []
    return [" ".join(tokens[i : i + n]) for i in range(len(tokens) - n + 1)]


def extract_keywords(tokens: List[str]) -> List[str]:
    """Extract salient keywords excluding stopwords."""
    seen = set()
    keywords: List[str] = []
    for t in tokens:
        if t not in STOPWORDS and len(t) > 2 and t not in seen:
            seen.add(t)
            keywords.append(t)
    return keywords


def extract_concepts(text: str, rules: List[Dict[str, Any]]) -> List[str]:
    """Extract key domain concepts and alias matches from text."""
    text_lower = text.lower()
    concepts: List[str] = []
    for r in rules:
        subject = r.get("subject", "")
        if subject and subject.lower() in text_lower:
            if subject not in concepts:
                concepts.append(subject)
        for alias in r.get("aliases", []):
            if alias.lower() in text_lower and alias not in concepts:
                concepts.append(alias)
    return concepts[:5]


def understand_rti_text(
    text: str,
    rules: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Analyzes RTI application text using lightweight hybrid understanding:
      1. Tokenization & stemming
      2. Salient keyword & n-gram extraction
      3. Overlap with known subjects and aliases
      4. Vagueness evaluation
    """
    tokens = clean_and_tokenize(text)
    keywords = extract_keywords(tokens)
    stemmed_tokens = [stem_word(t) for t in tokens]
    stemmed_token_set = set(stemmed_tokens)

    bigrams = extract_ngrams(tokens, 2)
    trigrams = extract_ngrams(tokens, 3)
    phrase_set = set(bigrams + trigrams)

    text_lower = text.lower()
    best_subject = ""
    best_score = 0.0

    # Collect unique subjects across rules
    subjects_map: Dict[str, Dict[str, Any]] = {}
    for r in rules:
        subj = r.get("subject", "")
        if subj:
            if subj not in subjects_map:
                subjects_map[subj] = {
                    "subject": subj,
                    "aliases": set(),
                }
            for a in r.get("aliases", []):
                subjects_map[subj]["aliases"].add(a.lower())

    for subj, info in subjects_map.items():
        subj_tokens = clean_and_tokenize(subj)
        subj_stemmed = [stem_word(st) for st in subj_tokens]

        score = 0.0
        # Exact subject in text
        if subj.lower() in text_lower:
            score += 3.0 * len(subj_tokens)

        # Subject tokens overlap
        overlap = len(set(subj_stemmed).intersection(stemmed_token_set))
        coverage = overlap / max(1, len(subj_stemmed))
        if coverage >= 0.7:
            score += coverage * 2.0

        # Check aliases
        for alias in info["aliases"]:
            if alias in text_lower or alias in phrase_set:
                score += 2.5
            else:
                alias_tokens = clean_and_tokenize(alias)
                alias_stemmed = [stem_word(at) for at in alias_tokens]
                alias_overlap = len(set(alias_stemmed).intersection(stemmed_token_set))
                if alias_overlap == len(alias_tokens) and len(alias_tokens) > 0:
                    score += 1.8

        if score > best_score:
            best_score = score
            best_subject = subj

    # Minimum threshold for subject detection to avoid hallucinating unrelated subjects
    detected_subject = best_subject if best_score >= 1.5 else ""
    concepts = extract_concepts(text, rules)

    # Vagueness check: if text has very few keywords or generic inquiry words only
    is_vague = len(keywords) <= 1 or (len(keywords) <= 2 and best_score < 1.0)

    return {
        "detected_subject": detected_subject,
        "keywords": keywords,
        "concepts": concepts,
        "is_vague": is_vague,
        "tokens": tokens,
        "best_subject_score": best_score,
    }
