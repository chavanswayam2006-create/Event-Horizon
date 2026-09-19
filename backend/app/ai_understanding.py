"""
AI Understanding Module for Event Horizon (Day 1 MVP).

Performs lightweight tokenization, suffix stemming, stopword removal,
and keyword/n-gram matching against known Star Map subjects.
"""

import re
from typing import Dict, List, Set

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
    "application", "information", "details", "records", "project", "new", "area"
}


def stem_word(word: str) -> str:
    """Lightweight suffix stemmer for English inflections."""
    w = word.lower()
    for s in ("ing", "ies", "es", "s", "ed"):
        if w.endswith(s) and len(w) > len(s) + 2:
            return w[:-len(s)]
    return w


def clean_and_tokenize(text: str) -> List[str]:
    """Normalize text and return lowercased alphanumeric tokens."""
    return re.findall(r"[a-zA-Z0-9]+", text.lower())


def extract_keywords(tokens: List[str]) -> List[str]:
    """Extract salient keywords excluding stopwords."""
    seen = set()
    keywords: List[str] = []
    for t in tokens:
        if t not in STOPWORDS and len(t) > 2 and t not in seen:
            seen.add(t)
            keywords.append(t)
    return keywords


def understand_rti_text(text: str, known_subjects: List[str]) -> Dict:
    """
    Extract keywords and attempt an initial subject guess by token overlap
    against known Star Map subjects.
    """
    tokens = clean_and_tokenize(text)
    keywords = extract_keywords(tokens)
    stemmed_tokens = [stem_word(t) for t in tokens]
    stemmed_token_set = set(stemmed_tokens)

    subject_guess = ""
    best_score = 0.0

    text_lower = text.lower()
    for subj in known_subjects:
        subj_tokens = clean_and_tokenize(subj)
        subj_stemmed = [stem_word(st) for st in subj_tokens]

        if subj.lower() in text_lower:
            score = len(subj_tokens) * 2.0
            if score > best_score:
                best_score = score
                subject_guess = subj
        else:
            # Check overlap of stemmed subject tokens
            overlap = len(set(subj_stemmed).intersection(stemmed_token_set))
            # Require at least 80% coverage of subject tokens to avoid false positives
            ratio = overlap / max(1, len(subj_stemmed))
            if ratio >= 0.8:
                score = overlap * 1.5
                if score > best_score:
                    best_score = score
                    subject_guess = subj

    return {
        "subject_guess": subject_guess,
        "keywords": keywords,
    }
