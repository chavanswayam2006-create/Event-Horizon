# 19 - Agent Rules for Future Development

1. **Read Brain First**: Inspect `Brain/00_README.md`, `Brain/01_PROJECT_CONTEXT.md`, and `Brain/03_MVP_SCOPE.md` before making architectural modifications.
2. **Implementation is Authoritative**: When code and notes conflict, trust verified working code and tests, then update Brain.
3. **Preserve Safety Guardrails**: Never remove or bypass the `UNKNOWN` / `AMBIGUOUS` routing states to fabricate an artificially high confidence score.
4. **Zero Paid Keys**: Do not introduce dependencies on OpenAI, Anthropic, or paid cloud APIs unless explicitly directed by the project lead.
5. **Mark Sample Data Clearly**: Always ensure demonstration dataset entries retain `"source": "MVP / Demonstration Jurisdiction Dataset"`.
6. **Smallest Working Patch**: Make targeted, minimal modifications that fulfill the task without unnecessary refactoring.
7. **Verify Acceptance Tests**: Always run `backend/venv/Scripts/python -m pytest backend/tests/test_acceptance.py -v` before declaring any task complete.
