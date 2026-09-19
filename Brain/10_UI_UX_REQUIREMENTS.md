# 10 - UI / UX Requirements

## Core Layout (Single Page)
- **Header**: Project title "Event Horizon", problem statement CX0107, team Tensor Float.
- **RTI Textarea**: Large input box for citizen query.
- **Context Filters**: State & District dropdowns (defaulting to Maharashtra / Pune).
- **Preset Scenarios**: 3 quick-click demo buttons matching the acceptance criteria:
  1. Road Potholes (`CLEAR`)
  2. Broken Traffic Light (`AMBIGUOUS`)
  3. AI Surveillance Camera (`UNKNOWN`)
- **Analyze Action**: Clear submit button with loading spinner state.
- **Results Card**:
  - Decision Status Badge:
    - `CLEAR`: Green badge
    - `AMBIGUOUS`: Amber/Yellow badge
    - `UNKNOWN`: Red badge
  - Target Department(s) pill tags.
  - Confidence metric progress/score indicator.
  - Reason statement.
  - Collapsible Candidate Evidence list showing Star Map rule ID, similarity, keyword overlap, and notes.
