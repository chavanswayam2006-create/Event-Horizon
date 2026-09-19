# 17 - Known Issues

*Currently, there are no unresolved critical bugs blocking Day 1 functionality.*

| ID | Issue | Severity | Status | Workaround / Fix |
|---|---|---|---|---|
| ISSUE-01 | Short queries produce compressed TF-IDF cosine norms | Low | Resolved | Implemented length-adaptive similarity scaling and suffix stemming |
| ISSUE-02 | FastAPI test client required httpx | Low | Resolved | Installed httpx in virtualenv and updated requirements.txt |
