"""
AI Understanding Module for Event Horizon (Day 2 MVP).

Performs lightweight multilingual tokenization (English / Hindi / Marathi),
Unicode NFKC normalization, suffix stemming (English only), per-language
stopword removal, n-gram generation, alias matching, language detection,
and input validation.
"""

import re
import unicodedata
from typing import Any, Dict, List, Optional, Set, Tuple
from app.config import (
    MIN_INPUT_CHARS,
    MIN_INPUT_CHARS_DEVANAGARI,
    MAX_INPUT_CHARS,
    SUPPORTED_LANGUAGES,
    DEFAULT_LANGUAGE,
)

# Devanagari token range: letters, combining signs, and digits, but NOT the
# danda (U+0964), double danda (U+0965), or abbreviation sign (U+0970) so that
# sentence punctuation never glues itself onto tokens.
DEVANAGARI_TOKEN_RANGE = "\u0900-\u0963\u0966-\u096F\u0971-\u097F"
DEVANAGARI_RE = re.compile(r"[\u0900-\u097F]")
TOKEN_RE = re.compile(rf"[a-zA-Z0-9{DEVANAGARI_TOKEN_RANGE}]+")
# Zero-width joiners/non-joiners are dropped so conjuncts tokenize as one word.
ZERO_WIDTH_RE = re.compile("[\u200b\u200c\u200d\ufeff]")
# Marathi-specific letters used as a tie-breaker during language detection.
MARATHI_SPECIFIC_RE = re.compile(r"[\u0933\u0931]")

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

# Hindi stopwords (Devanagari). Mirrors the English list's intent: function
# words plus low-signal RTI boilerplate such as "जानकारी" (information).
HINDI_STOPWORDS: Set[str] = {
    "के", "का", "की", "को", "में", "से", "पर", "है", "हैं", "था", "थी", "थे",
    "और", "या", "एवं", "तथा", "नहीं", "न", "भी", "ही", "तो", "कि", "जो", "यह",
    "वह", "ये", "वे", "इस", "उस", "इन", "उन", "मैं", "मुझे", "मेरा", "मेरी",
    "मेरे", "हम", "हमारा", "हमारी", "हमें", "आप", "आपका", "आपकी", "कर",
    "करना", "करने", "किया", "किए", "गया", "गई", "गए", "हो", "होता", "होती",
    "होते", "हुआ", "हुई", "हुए", "चाहिए", "चाहता", "चाहती", "कृपया", "लिए",
    "बारे", "विषय", "संबंध", "जानकारी", "सूचना", "आवेदन", "विवरण", "रिकॉर्ड",
    "परियोजना", "नया", "नई", "नए", "क्षेत्र", "दें", "प्रदान", "अनुरोध",
    "निवेदन", "विभाग", "अधिकारी", "महोदय", "प्रति",
}

# Marathi stopwords (Devanagari).
MARATHI_STOPWORDS: Set[str] = {
    "आहे", "आहेत", "होते", "होता", "होती", "नाही", "आणि", "व", "चा", "ची",
    "चे", "च्या", "ला", "ने", "मध्ये", "पासून", "साठी", "वर", "खाली", "मला",
    "माझे", "माझा", "माझी", "माझ्या", "आम्ही", "आमचा", "आमची", "तुम्ही",
    "तुमचा", "हे", "हा", "ही", "ते", "तो", "ती", "या", "त्या", "किंवा",
    "पण", "परंतु", "तर", "म्हणून", "करा", "करून", "केले", "केली", "झाले",
    "झाली", "झाला", "असे", "असते", "पाहिजे", "कृपया", "बद्दल", "विषयी",
    "माहिती", "तपशील", "अर्ज", "विनंती", "प्रकल्प", "नवीन", "नव्या",
    "क्षेत्र", "द्या", "पुरवा", "विभाग", "अधिकारी", "महोदय", "प्रति",
}

LANGUAGE_STOPWORDS: Dict[str, Set[str]] = {
    "en": STOPWORDS,
    "hi": HINDI_STOPWORDS,
    "mr": MARATHI_STOPWORDS,
}

# Language marker words used by detect_language(). Devanagari is shared by
# Hindi and Marathi, so distinctive function/content words decide the split.
HINDI_MARKERS: Set[str] = {
    "है", "हैं", "नहीं", "और", "में", "करना", "चाहिए", "मुझे", "मेरा", "मेरे",
    "मेरी", "हमारा", "हमारी", "सड़क", "गड्ढे", "नाली", "यातायात", "स्कूल",
    "भूमि", "निर्माण", "नगरपालिका", "अस्पताल", "कचरा", "बिजली", "संपत्ति",
    "शिकायत", "करें", "जल्दी", "समस्या", "प्रमाण", "रिपोर्ट", "पुलिस", "पानी",
    "बिल", "खराब", "ठीक", "किए",
}
MARATHI_MARKERS: Set[str] = {
    "आहे", "आहेत", "नाही", "आणि", "मध्ये", "करा", "पाहिजे", "झाले", "मला",
    "तुम्ही", "आम्ही", "साठी", "खड्डे", "रस्ता", "पाणी", "गटार", "वाहतूक",
    "शाळा", "जमीन", "बांधकाम", "महापालिका", "रुग्णालय", "कचरा", "वीज",
    "मालमत्ता", "तक्रार", "बिघडलेला", "दुरुस्ती", "माहिती", "पावती", "नाले",
    "दिवे", "झाली", "केले",
}

# Vagueness signals per language (kept language-local; English unchanged).
VAGUE_PHRASES_BY_LANGUAGE: Dict[str, List[str]] = {
    "en": [
        "look into this", "fix it", "action required", "take action",
        "causing trouble", "resolve this", "do the needful", "problem and fix",
        "immediately as it is", "look into this issue", "fix it immediately",
    ],
    "hi": [
        "ध्यान दें", "कार्रवाई करें", "तुरंत ठीक करें", "जल्दी ठीक करें",
        "हल करें", "जल्दी करें", "समस्या है",
    ],
    "mr": [
        "कारवाई करा", "तात्काळ दुरुस्त करा", "तातडीने दुरुस्त करा",
        "निकाल करा", "लक्ष द्या", "समस्या आहे",
    ],
}

VAGUE_WORDS_BY_LANGUAGE: Dict[str, Set[str]] = {
    "en": {
        "issue", "problem", "matter", "concern", "trouble", "action", "step",
        "steps", "needful", "immediate", "immediately", "urgent", "urgently",
        "fix", "resolve", "help", "look", "causing",
    },
    "hi": {
        "समस्या", "मामला", "चिंता", "परेशानी", "कार्रवाई", "तुरंत", "जल्दी",
        "जरूरी", "ठीक", "करें", "हल", "ध्यान",
    },
    "mr": {
        "समस्या", "प्रश्न", "कारवाई", "तातडीने", "तात्काळ", "दुरुस्त",
        "करा", "हल", "लक्ष", "त्रास",
    },
}


def normalize_language_hint(hint: Optional[str]) -> Optional[str]:
    """Normalize a caller-provided language hint ('EN', 'hi', ...) to a code."""
    if not hint:
        return None
    code = hint.strip().lower()
    if len(code) > 2:
        code = code[:2]
    return code if code in SUPPORTED_LANGUAGES else None


def normalize_text(raw_text: str) -> str:
    """
    Unicode NFKC normalization plus whitespace tidy-up.

    Devanagari matras and vowel signs are preserved; zero-width joiners are
    removed so conjuncts survive tokenization as single tokens.
    """
    if not raw_text:
        return ""
    text = unicodedata.normalize("NFKC", raw_text)
    text = ZERO_WIDTH_RE.sub("", text)
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()


def detect_language(text: str, hint: Optional[str] = None) -> str:
    """
    Detect the language of the input text: 'en' | 'hi' | 'mr'.

    - Latin-script-only text is English.
    - Devanagari text is scored against Hindi and Marathi marker words.
    - On a tie, Marathi-specific letters decide, then the caller's hint,
      then Hindi as the default Devanagari language.
    """
    normalized = normalize_text(text)
    if not DEVANAGARI_RE.search(normalized):
        return "en"

    tokens = set(tokenize(normalized))
    hi_score = len(tokens & HINDI_MARKERS)
    mr_score = len(tokens & MARATHI_MARKERS)

    if mr_score > hi_score:
        return "mr"
    if hi_score > mr_score:
        return "hi"
    if MARATHI_SPECIFIC_RE.search(normalized):
        return "mr"
    resolved_hint = normalize_language_hint(hint)
    if resolved_hint in ("hi", "mr"):
        return resolved_hint
    return "hi"


def validate_rti_input(raw_text: Optional[str], language: Optional[str] = None) -> Tuple[str, List[str]]:
    """
    Validates user input according to Spec I.

    Applies Unicode NFKC normalization first so that Devanagari and Latin text
    are compared on the same normalized form the pipeline uses downstream.
    Raises ValueError with user-friendly messages for invalid input.
    Returns normalized text and any applicable warnings.
    """
    if raw_text is None or not raw_text.strip():
        raise ValueError("Please enter an RTI application.")

    cleaned = normalize_text(raw_text)
    if not cleaned:
        raise ValueError("Please enter an RTI application.")

    resolved = language if language in SUPPORTED_LANGUAGES else None
    uses_devanagari = bool(DEVANAGARI_RE.search(cleaned))
    min_chars = MIN_INPUT_CHARS_DEVANAGARI if (uses_devanagari or resolved in ("hi", "mr")) else MIN_INPUT_CHARS
    if len(cleaned) < min_chars:
        raise ValueError("This request is too short to produce a reliable routing analysis.")

    warnings: List[str] = []
    if cleaned != raw_text.strip():
        warnings.append(
            "input_normalized: Text was Unicode-normalized (NFKC) and whitespace-tidied before analysis; "
            "the original text is preserved for reference."
        )
    if len(cleaned) > MAX_INPUT_CHARS:
        cleaned = cleaned[:MAX_INPUT_CHARS]
        warnings.append(
            f"input_truncated: Request exceeded {MAX_INPUT_CHARS} characters. "
            f"Analyzed the first {MAX_INPUT_CHARS} characters."
        )

    return cleaned, warnings


def stem_word(word: str) -> str:
    """Lightweight suffix stemmer for English inflections (Devanagari untouched)."""
    w = word.lower()
    if DEVANAGARI_RE.search(w):
        return w
    for s in ("ing", "ies", "es", "s", "ed", "tion", "ment"):
        if w.endswith(s) and len(w) > len(s) + 2:
            return w[:-len(s)]
    return w


def tokenize(text: str) -> List[str]:
    """Normalize text and return lowercased Latin/Devanagari alphanumeric tokens."""
    return TOKEN_RE.findall(normalize_text(text).lower())


def clean_and_tokenize(text: str) -> List[str]:
    """Backward-compatible alias for tokenize()."""
    return tokenize(text)


def extract_ngrams(tokens: List[str], n: int = 2) -> List[str]:
    """Generate n-grams from a list of tokens."""
    if len(tokens) < n:
        return []
    return [" ".join(tokens[i : i + n]) for i in range(len(tokens) - n + 1)]


def extract_keywords(tokens: List[str], language: str = "en") -> List[str]:
    """Extract salient keywords excluding the stopword list for the language."""
    stopwords = LANGUAGE_STOPWORDS.get(language, STOPWORDS)
    min_len = 1 if language in ("hi", "mr") else 2
    seen = set()
    keywords: List[str] = []
    for t in tokens:
        if t not in stopwords and len(t) > min_len and t not in seen:
            seen.add(t)
            keywords.append(t)
    return keywords


def get_localized_subject(rule: Dict[str, Any], language: str) -> str:
    """Return the subject label for a language, falling back to English."""
    if language == "en":
        return rule.get("subject", "")
    i18n = rule.get("subject_i18n") or {}
    localized = i18n.get(language)
    if localized:
        return localized
    return i18n.get("en") or rule.get("subject", "")


def get_localized_aliases(rule: Dict[str, Any], language: str) -> List[str]:
    """Return alias surface forms for a language (English aliases for 'en')."""
    if language == "en":
        return list(rule.get("aliases", []))
    i18n = rule.get("aliases_i18n") or {}
    return list(i18n.get(language, []))


def get_localized_department(rule: Dict[str, Any], department: str, language: str) -> str:
    """Return a department label for a language, falling back to English."""
    if language == "en":
        return department
    dept_i18n = (rule.get("departments_i18n") or {}).get(department) or {}
    return dept_i18n.get(language) or dept_i18n.get("en") or department


def extract_concepts(text: str, rules: List[Dict[str, Any]], language: str = "en") -> List[str]:
    """Extract key domain concepts and alias matches from text."""
    text_lower = text.lower()
    concepts: List[str] = []
    for r in rules:
        subject_variants = [
            r.get("subject", ""),
            get_localized_subject(r, language),
        ]
        for subject in subject_variants:
            if subject and subject.lower() in text_lower and subject not in concepts:
                concepts.append(subject)
        for alias in list(r.get("aliases", [])) + get_localized_aliases(r, language):
            if alias.lower() in text_lower and alias not in concepts:
                concepts.append(alias)
    return concepts[:5]


def understand_rti_text(
    text: str,
    rules: List[Dict[str, Any]],
    language: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Analyzes RTI application text using lightweight hybrid understanding:
      1. Tokenization & stemming (language-aware)
      2. Salient keyword & n-gram extraction
      3. Overlap with known subjects and aliases (English + localized variants)
      4. Vagueness evaluation (per-language signals)

    Returns the canonical (English) subject key so downstream decision logic and
    API contracts remain stable across languages.
    """
    resolved_language = language if language in SUPPORTED_LANGUAGES else detect_language(text, hint=language)
    if resolved_language is None:
        resolved_language = DEFAULT_LANGUAGE
    tokens = clean_and_tokenize(text)
    keywords = extract_keywords(tokens, resolved_language)
    stemmed_token_set = {stem_word(t) for t in tokens}

    bigrams = extract_ngrams(tokens, 2)
    trigrams = extract_ngrams(tokens, 3)
    phrase_set = set(bigrams + trigrams)

    text_lower = text.lower()
    best_subject = ""
    best_score = 0.0

    # Collect unique canonical subjects across rules, keeping the English
    # surface form plus the localized variant for the active language.
    subjects_map: Dict[str, Dict[str, Any]] = {}
    for r in rules:
        canonical = r.get("subject", "")
        if not canonical:
            continue
        if canonical not in subjects_map:
            subjects_map[canonical] = {
                "subject": canonical,
                "variants": [],
                "aliases": set(),
            }
        entry = subjects_map[canonical]
        for variant in (canonical, get_localized_subject(r, resolved_language)):
            if variant and variant not in entry["variants"]:
                entry["variants"].append(variant)
        for alias in list(r.get("aliases", [])) + get_localized_aliases(r, resolved_language):
            if alias:
                entry["aliases"].add(alias.lower())

    for subj, info in subjects_map.items():
        # Best-scoring surface variant (English or localized) decides the score.
        variant_scores: List[float] = []
        for variant in info["variants"]:
            subj_tokens = clean_and_tokenize(variant)
            subj_stemmed = [stem_word(st) for st in subj_tokens]
            score = 0.0
            # Exact subject phrase present in text
            if variant.lower() in text_lower:
                score += 3.0 * len(subj_tokens)
            # Subject token overlap
            overlap = len(set(subj_stemmed).intersection(stemmed_token_set))
            coverage = overlap / max(1, len(subj_stemmed))
            if coverage >= 0.7:
                score += coverage * 2.0
            variant_scores.append(score)
        score = max(variant_scores) if variant_scores else 0.0

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
    concepts = extract_concepts(text, rules, resolved_language)

    # Vagueness check: detects RTI applications that are too generic to route
    vague_phrases = VAGUE_PHRASES_BY_LANGUAGE.get(resolved_language, VAGUE_PHRASES_BY_LANGUAGE["en"])
    vague_words = VAGUE_WORDS_BY_LANGUAGE.get(resolved_language, VAGUE_WORDS_BY_LANGUAGE["en"])

    has_vague_phrase = any(p in text_lower for p in vague_phrases)
    vague_keyword_count = sum(1 for k in keywords if k in vague_words)
    vague_ratio = vague_keyword_count / max(1, len(keywords))

    is_vague = (
        (has_vague_phrase and best_score < 1.0)
        or (vague_ratio >= 0.5 and best_score < 1.0)
        or len(keywords) <= 1
        or (len(keywords) <= 2 and best_score < 1.0)
    )

    return {
        "detected_subject": detected_subject,
        "keywords": keywords,
        "concepts": concepts,
        "is_vague": is_vague,
        "tokens": tokens,
        "best_subject_score": best_score,
        "language": resolved_language,
    }

