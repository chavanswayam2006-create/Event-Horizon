# 06 - AI Behavior and Mechanics

## Natural Language Processing Mechanics
The Day 1 MVP intentionally avoids heavy external neural models and paid API keys:
1. **Tokenization & Stopword Stripping**:
   - Strips common grammatical filler words, punctuation, and generic RTI query words (`"regarding"`, `"application"`, `"records"`).
2. **N-Gram Generation**:
   - Generates unigrams, bigrams, and trigrams to detect multi-word concepts like `"traffic signals"` or `"road repair"`.
3. **TF-IDF + Cosine Similarity**:
   - Fits a `TfidfVectorizer` over the Star Map rules' combined text (`subject` + `note`).
   - Computes cosine similarity between the query vector and rule vectors.
   - Features an automated pure-Python mathematical fallback ensuring high availability without binary lock-in.
4. **Keyword Overlap Weighting**:
   - Intersects non-stopword query tokens with rule text tokens.
   - Combines with TF-IDF:
     `combined_score = 0.7 * similarity + 0.3 * keyword_overlap + district_boost`
