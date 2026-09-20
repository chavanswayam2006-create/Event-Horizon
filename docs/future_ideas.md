# Day 4 / Future Ideas Log

Per the **Feature Freeze** policy on Day 3, no new feature development is permitted during stabilization. Valuable ideas noted during repository auditing and testing are cataloged here for post-hackathon iteration.

---

### Ingestion & Processing
1. **Multimodal OCR Pipeline:** Integrate an offline OCR engine (e.g., Tesseract or lightweight Surya OCR) for scanned, non-searchable physical RTI petitions in regional Indian scripts.
2. **Citizen Audio Intake:** Speech-to-text transcription for vernacular spoken RTI complaints (Marathi, Hindi, Kannada, Tamil).

### Knowledge Base & Ontology
3. **Dynamic Star Map Graph Database:** Migrate flat `star_map.json` into a graph database (e.g. Neo4j or Memgraph) to model complex inter-departmental delegation hierarchies and parent-ministry nodal dependencies.
4. **Historical CIC Precedent Ingestion:** Automatically ingest and index Central Information Commission (CIC) appeal rulings to refine transfer friction penalties ($C_{\text{overlap}}$).

### Administrative Workflow
5. **Direct Citizen Portal Dispatch:** Integrate authenticated OAuth2 / API submission directly into state RTI portals (e.g. Maharashtra RTI Online) with auto-filled Section 6(1) and Section 6(3) transfer caveat forms.
6. **PIO Triage Dashboard:** Dedicated interface for Public Information Officers to quickly review incoming applications, inspect evidence tokens, and accept or initiate 5-day transfers.
