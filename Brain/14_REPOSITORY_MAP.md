# 14 - Repository Map

```text
EventHorizon/
├── Brain/                         # Trusted project knowledge layer
│   ├── 00_README.md               # Brain orientation and authority rules
│   ├── 01_PROJECT_CONTEXT.md      # Problem statement & team metadata
│   ├── 02_PRODUCT_REQUIREMENTS.md # Functional requirements & user journey
│   ├── 03_MVP_SCOPE.md            # Day 1 boundaries vs future plans
│   ├── 04_ARCHITECTURE.md         # System flow and data flow diagrams
│   ├── 05_DATA_SCHEMA.md          # JSON schemas for Star Map and APIs
│   ├── 06_AI_BEHAVIOR.md          # Tokenization, stemming, TF-IDF mechanics
│   ├── 07_DECISION_ENGINE.md      # Escape Velocity Engine thresholds
│   ├── 08_STAR_MAP_KNOWLEDGE.md   # Jurisdiction rule coverage (Pune, Nagpur)
│   ├── 09_API_CONTRACTS.md        # FastAPI REST endpoints
│   ├── 10_UI_UX_REQUIREMENTS.md   # UI layout and badge behaviors
│   ├── 11_DEMO_SCENARIOS.md       # The 3 acceptance test cases
│   ├── 12_TESTING_KNOWLEDGE.md    # Automated test commands
│   ├── 13_TECH_STACK.md           # Installed dependencies & runtimes
│   ├── 14_REPOSITORY_MAP.md       # This file tree map
│   ├── 15_DECISIONS.md            # Architecture Decision Records
│   ├── 16_KNOWN_LIMITATIONS.md    # Day 1 boundaries
│   ├── 17_KNOWN_ISSUES.md         # Bug tracking
│   ├── 18_CHANGELOG.md            # Version log
│   ├── 19_AGENT_RULES.md          # Rules for AI coding agents
│   └── source_registry.md         # Evidence provenance registry
├── backend/                       # Python FastAPI backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                # FastAPI entrypoint, CORS, endpoints
│   │   ├── ai_understanding.py    # Keyword & subject extraction
│   │   ├── semantic_match.py      # TF-IDF & cosine similarity ranking
│   │   └── escape_velocity.py     # CLEAR / AMBIGUOUS / UNKNOWN logic
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_acceptance.py     # Acceptance tests for the 3 cases
│   ├── requirements.txt           # Python dependencies
│   └── venv/                      # Python 3.11 virtual environment
├── data/
│   └── star_map.json              # 22 demonstration jurisdiction rules
├── frontend/                      # React Vite SPA
│   ├── src/
│   │   ├── App.jsx                # Single page UI with 1-click test presets
│   │   ├── index.css              # Tailwind CSS imports
│   │   └── main.jsx               # React DOM mount point
│   ├── package.json               # Frontend dependencies
│   ├── vite.config.js             # Vite configuration with Tailwind & proxy
│   └── dist/                      # Production bundle
├── README.md                      # Primary project documentation & run instructions
├── .env.example                   # Environment template
└── .gitignore                     # Git exclusions
```
