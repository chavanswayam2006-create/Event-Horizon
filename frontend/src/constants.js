export const ACCEPTANCE_PRESETS = [
  {
    label: "Preset 1: Clear Road Repair",
    text: "There are large potholes on my street and the road urgently needs repair.",
    state: "Maharashtra",
    district: "Pune",
    expected: "CLEAR → Municipal Engineering Department",
    decision: "CLEAR"
  },
  {
    label: "Preset 2: Ambiguous Traffic Signal",
    text: "The traffic signal at the main chowk has been broken for two weeks and nobody has fixed it.",
    state: "Maharashtra",
    district: "Pune",
    expected: "AMBIGUOUS → Traffic Police & Municipal Engineering",
    decision: "AMBIGUOUS"
  },
  {
    label: "Preset 3: Unknown Jurisdiction Request",
    text: "I want records about the new AI surveillance camera project in my area.",
    state: "Maharashtra",
    district: "Pune",
    expected: "UNKNOWN → Unmapped / Subject not in Star Map",
    decision: "UNKNOWN"
  }
];
