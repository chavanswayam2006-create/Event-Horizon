# Event Horizon - Brain Folder Creation Prompt

## Purpose

Use this prompt in Claude Code (or another coding agent) to create a **Brain** folder that acts as the project's structured knowledge and project-memory layer.

The goal is to reduce hallucination, repeated discovery work, accidental contradictions, and unnecessary context usage while making future AI-agent work more consistent.

---

# MASTER PROMPT

You are a **senior software architect, AI-agent workflow engineer, information architect, and repository maintainer**.

Your task is to create a **Brain** folder inside the Event Horizon repository.

The Brain folder will act as the project's **trusted working knowledge base** for AI coding agents.

It is NOT an AI model, vector database, or autonomous memory system. It is a structured repository of project facts, decisions, requirements, architecture, data contracts, conventions, known limitations, and validated implementation notes.

The purpose is to let future AI agents quickly understand the project without repeatedly scanning the entire repository.

---

# 1. FIRST INSPECT THE REPOSITORY

Before creating anything:

1. Inspect the current project structure.
2. Identify the frontend.
3. Identify the backend.
4. Identify AI/ML code.
5. Identify datasets.
6. Identify configuration files.
7. Identify documentation.
8. Identify tests.
9. Identify existing README files.
10. Identify duplicate or conflicting documentation.

Do not blindly overwrite useful existing files.

---

# 2. CREATE THIS STRUCTURE

Create:

```text
Brain/
├── 00_README.md
├── 01_PROJECT_CONTEXT.md
├── 02_PRODUCT_REQUIREMENTS.md
├── 03_MVP_SCOPE.md
├── 04_ARCHITECTURE.md
├── 05_DATA_SCHEMA.md
├── 06_AI_BEHAVIOR.md
├── 07_DECISION_ENGINE.md
├── 08_STAR_MAP_KNOWLEDGE.md
├── 09_API_CONTRACTS.md
├── 10_UI_UX_REQUIREMENTS.md
├── 11_DEMO_SCENARIOS.md
├── 12_TESTING_KNOWLEDGE.md
├── 13_TECH_STACK.md
├── 14_REPOSITORY_MAP.md
├── 15_DECISIONS.md
├── 16_KNOWN_LIMITATIONS.md
├── 17_KNOWN_ISSUES.md
├── 18_CHANGELOG.md
├── 19_AGENT_RULES.md
└── source_registry.md
```

Create additional subfolders only when genuinely needed.

---

# 3. WHAT EACH FILE MEANS

## 00_README.md

Explain:

- what Brain is
- why it exists
- how AI agents should use it
- which files are authoritative for which questions
- how to update it safely

---

## 01_PROJECT_CONTEXT.md

Store stable project identity:

- Event Horizon
- The RTI Black Hole
- CX0107
- Tensor Float
- AI/ML domain
- core problem
- core solution
- central product principle

---

## 02_PRODUCT_REQUIREMENTS.md

Store the actual product requirements:

- user goal
- user journey
- core features
- output states
- explainability requirements
- human-review behavior

Separate confirmed requirements from future ideas.

---

## 03_MVP_SCOPE.md

Clearly separate:

### In MVP
### Not in MVP
### Future roadmap

This file must protect the project from scope creep.

---

## 04_ARCHITECTURE.md

Document the actual implemented architecture after inspecting the repository.

Include:

- frontend
- backend
- AI engine
- Star Map
- Escape Velocity Engine
- data flow
- major modules
- integration points

Do not invent components that do not exist.

---

## 05_DATA_SCHEMA.md

Document actual data shapes used by the repository.

Include:

- Star Map schema
- RTI input schema
- analysis output schema
- confidence fields
- decision states
- provenance fields

Copy exact field names from working code whenever possible.

---

## 06_AI_BEHAVIOR.md

Document exactly how the AI layer behaves.

Include:

- subject detection
- semantic matching
- keyword extraction
- confidence calculation
- fallback behavior
- unknown behavior
- ambiguity behavior
- limitations

Do not describe hypothetical AI behavior as if it were implemented.

---

## 07_DECISION_ENGINE.md

Document:

- CLEAR logic
- AMBIGUOUS logic
- UNKNOWN logic
- thresholds
- rule precedence
- tie handling
- shared jurisdiction handling
- human-review behavior

Keep the actual thresholds synchronized with code.

---

## 08_STAR_MAP_KNOWLEDGE.md

Document the current Star Map knowledge source.

Include:

- dataset file location
- schema
- supported subjects
- supported states/districts
- single-jurisdiction examples
- shared-jurisdiction examples
- unknown handling
- data provenance
- warning that MVP data is demonstration data unless verified otherwise

---

## 09_API_CONTRACTS.md

Document actual backend APIs.

For each endpoint:

- method
- path
- request body
- response
- validation
- error behavior

---

## 10_UI_UX_REQUIREMENTS.md

Document the interface requirements that other agents must preserve.

Include:

- home
- analyzer
- processing state
- results
- CLEAR
- AMBIGUOUS
- UNKNOWN
- evidence panel
- Star Map evidence
- human override
- demo scenarios

---

## 11_DEMO_SCENARIOS.md

Store the known demo inputs and expected outputs.

For every case include:

- input
- expected subject
- expected department(s)
- expected decision state
- expected confidence range, if applicable
- explanation requirements

---

## 12_TESTING_KNOWLEDGE.md

Store validated tests and known expected behavior.

Include:

- unit tests
- API tests
- integration tests
- demo cases
- regression cases

---

## 13_TECH_STACK.md

Document the actual installed technology stack.

Do not merely list desired technologies. Verify the repository.

---

## 14_REPOSITORY_MAP.md

Create a concise map of important files and directories.

Example:

```text
frontend/              -> user interface
backend/               -> FastAPI backend
ai/                    -> routing / semantic logic
data/                  -> Star Map / demo data
tests/                 -> automated tests
```

Use exact paths from the repository.

---

## 15_DECISIONS.md

Record important technical/product decisions.

For each decision use:

```text
Decision:
Date:
Reason:
Alternatives considered:
Impact:
Status:
```

Never silently rewrite a previous decision. Add a new entry when a decision changes.

---

## 16_KNOWN_LIMITATIONS.md

Record known limitations such as:

- demonstration jurisdiction data
- limited language support
- heuristic confidence thresholds
- non-production legal workflow
- missing real government integrations

Never hide limitations from future agents.

---

## 17_KNOWN_ISSUES.md

Track actual bugs and unresolved problems.

Use:

```text
ID:
Issue:
Severity:
Where:
Reproduction:
Workaround:
Status:
```

---

## 18_CHANGELOG.md

Track meaningful implementation changes.

Avoid logging every tiny code edit.

---

## 19_AGENT_RULES.md

Define how future AI agents should work with the repository.

Include rules such as:

1. Read Brain before changing architecture.
2. Treat implementation as more authoritative than old notes when code and notes disagree, then update Brain.
3. Never invent missing requirements.
4. Never invent government jurisdiction facts.
5. Never treat demo data as official data.
6. Preserve the CLEAR / AMBIGUOUS / UNKNOWN safety behavior.
7. Prefer the smallest change that solves the task.
8. Run relevant tests before declaring completion.
9. Update Brain after meaningful architectural changes.
10. Do not duplicate information unnecessarily.

---

# 4. SOURCE REGISTRY

Create:

`Brain/source_registry.md`

For every important knowledge item, record where it came from.

Example:

```text
Knowledge Item: CLEAR threshold
Source: backend/ai/decision_engine.py
Verified: 2026-09-20
Status: Implemented
Notes: Do not treat threshold as a validated probability.
```

This provenance layer is important for reducing hallucinations.

---

# 5. AUTHORITY MODEL

Brain must use an explicit source hierarchy.

### Highest authority

1. Running/implemented source code
2. Automated tests and verified outputs
3. Current schemas / API contracts
4. Current project documentation
5. Brain notes derived from those sources
6. Older planning documents
7. Agent assumptions

When two sources disagree:

- do not invent a compromise
- identify the conflict
- inspect the highest-authority source
- update Brain to match reality
- log the change in Decisions or Changelog when meaningful

---

# 6. ANTI-HALLUCINATION RULES

Brain must explicitly instruct future agents:

- Do not infer missing requirements from the project name.
- Do not fabricate datasets.
- Do not fabricate legal or government facts.
- Do not claim an AI score is a validated probability unless it has been evaluated as such.
- Do not claim a feature exists because it is planned.
- Do not treat sample data as production data.
- Do not create files just because another framework typically uses them.
- Verify paths and functions before editing them.
- When information is missing, say it is unknown and inspect the repository before guessing.

---

# 7. KEEP BRAIN SMALL AND USEFUL

Brain is not a copy of the whole repository.

Do NOT dump source code into Brain.

Do NOT duplicate full README files.

Do NOT store large datasets unless specifically required.

Brain should store **summaries, contracts, decisions, verified facts, and pointers to source files**.

Use links/paths to detailed implementation instead of copying large content.

---

# 8. MAINTENANCE RULE

After creating Brain:

1. Check for duplicate information.
2. Verify every important fact against the repository.
3. Mark uncertain information explicitly.
4. Record source paths.
5. Make sure no Brain file claims unimplemented features are complete.
6. Ensure the folder is easy for an AI agent to scan quickly.

---

# 9. FINAL DELIVERABLE

The task is complete only when:

- `Brain/` exists
- all core files are created
- repository-specific information has been verified
- source references are recorded
- limitations are explicit
- agent rules exist
- no fabricated facts were added
- Brain can be used by another AI agent without needing to scan the entire repository first

At the end, output a concise summary of:

- files created
- files populated from verified repository data
- uncertain items that remain
- recommended future Brain updates
