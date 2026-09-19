import React, { useState } from 'react';

const PRESETS = [
  {
    label: "Scenario 1: Road Potholes (CLEAR)",
    text: "There are large potholes on my street and the road urgently needs repair.",
    district: "Pune",
    expected: "CLEAR → Municipal Engineering Department",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
  },
  {
    label: "Scenario 2: Traffic Signals (AMBIGUOUS)",
    text: "The traffic signal at the main chowk has been broken for two weeks and nobody has fixed it.",
    district: "Pune",
    expected: "AMBIGUOUS → Traffic Police & Municipal Engineering",
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30"
  },
  {
    label: "Scenario 3: AI Surveillance (UNKNOWN)",
    text: "I want records about the new AI surveillance camera project in my area.",
    district: "Pune",
    expected: "UNKNOWN → Unmapped / Subject not in Star Map",
    badgeColor: "bg-rose-500/20 text-rose-400 border-rose-500/30"
  }
];

export default function App() {
  const [text, setText] = useState(PRESETS[0].text);
  const [state, setState] = useState("Maharashtra");
  const [district, setDistrict] = useState("Pune");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [showStarMap, setShowStarMap] = useState(false);
  const [starMapRules, setStarMapRules] = useState([]);

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    const payload = { text, state, district };

    try {
      // Try local proxy first, then direct backend port 8000 fallback
      let res;
      try {
        res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } catch {
        res = await fetch("http://127.0.0.1:8000/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to communicate with backend service.");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchStarMap = async () => {
    if (starMapRules.length > 0) {
      setShowStarMap(!showStarMap);
      return;
    }
    try {
      let res;
      try {
        res = await fetch("/api/starmap");
      } catch {
        res = await fetch("http://127.0.0.1:8000/api/starmap");
      }
      if (res.ok) {
        const data = await res.json();
        setStarMapRules(data);
        setShowStarMap(true);
      }
    } catch (err) {
      console.error("Failed to load star map rules", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="w-full max-w-4xl mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <span>MUSA CodeX 2026</span>
          <span>•</span>
          <span>Team Tensor Float</span>
          <span>•</span>
          <span>PS No. CX0107</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
          Event Horizon
        </h1>
        <p className="mt-2 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
          AI-assisted routing for Right to Information applications. Prevents the "RTI Black Hole" by saying <span className="text-rose-400 font-semibold">UNKNOWN</span> or <span className="text-amber-400 font-semibold">AMBIGUOUS</span> instead of hallucinating.
        </p>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-4xl space-y-6">
        
        {/* Scenario Presets */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Acceptance Test Presets (1-Click Demo)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setText(p.text);
                  setDistrict(p.district);
                  setResult(null);
                  setError("");
                }}
                className="text-left p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-indigo-500/50 transition flex flex-col justify-between text-xs group"
              >
                <span className="font-semibold text-slate-200 group-hover:text-indigo-300">{p.label}</span>
                <span className="text-slate-400 text-[11px] mt-1 line-clamp-1">{p.expected}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleAnalyze} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div>
            <label htmlFor="rti-text" className="block text-sm font-medium text-slate-300 mb-2">
              RTI Application Text
            </label>
            <textarea
              id="rti-text"
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste or write the draft RTI application text here..."
              className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 p-4 text-sm placeholder-slate-500 transition resize-none outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="state-select" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                State
              </label>
              <select
                id="state-select"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 text-slate-200 p-2.5 text-sm outline-none focus:border-indigo-500"
              >
                <option value="Maharashtra">Maharashtra</option>
              </select>
            </div>

            <div>
              <label htmlFor="district-select" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                District / Jurisdiction
              </label>
              <select
                id="district-select"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 text-slate-200 p-2.5 text-sm outline-none focus:border-indigo-500"
              >
                <option value="Pune">Pune</option>
                <option value="Nagpur">Nagpur</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleFetchStarMap}
              className="text-xs text-slate-400 hover:text-slate-200 underline transition"
            >
              {showStarMap ? "Hide Star Map Dataset" : "Inspect Star Map Rules (22)"}
            </button>

            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-indigo-600/20"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Evaluating Escape Velocity...
                </span>
              ) : (
                "Analyze Application →"
              )}
            </button>
          </div>
        </form>

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
            <strong>Analysis Failed:</strong> {error}
          </div>
        )}

        {/* Results Card */}
        {result && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Decision Engine State
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span
                    className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold border ${
                      result.decision === "CLEAR"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-500/20"
                        : result.decision === "AMBIGUOUS"
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm shadow-amber-500/20"
                        : "bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-sm shadow-rose-500/20"
                    }`}
                  >
                    ● {result.decision}
                  </span>
                  <span className="text-xs text-slate-400">
                    Confidence: <strong className="text-slate-200">{(result.confidence * 100).toFixed(0)}%</strong>
                  </span>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Reason Code
                </p>
                <p className="text-sm text-slate-200 font-medium capitalize mt-1">
                  {result.reason}
                </p>
              </div>
            </div>

            {/* Target Department(s) Surfaced */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Recommended Department(s)
              </p>
              {result.decision === "UNKNOWN" ? (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 text-sm italic">
                  No responsible department identified. The subject is not recognized in the Star Map dataset.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {/* Extract departments from top candidates */}
                  {Array.from(
                    new Set(
                      (result.candidates.length > 0
                        ? result.candidates[0].departments
                        : []
                      ).concat(
                        result.decision === "AMBIGUOUS" && result.candidates.length > 1
                          ? result.candidates[1].departments
                          : []
                      )
                    )
                  ).map((dept, dIdx) => (
                    <span
                      key={dIdx}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-200 text-sm font-semibold flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      {dept}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* AI Understanding Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Detected Subject
                </p>
                <p className="text-sm font-medium text-slate-300 mt-0.5">
                  {result.detected_subject || <span className="text-slate-500 italic">None detected</span>}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Salient Extracted Keywords
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {result.keywords && result.keywords.length > 0 ? (
                    result.keywords.map((k, kidx) => (
                      <span key={kidx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs">
                        {k}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 text-xs italic">No keywords</span>
                  )}
                </div>
              </div>
            </div>

            {/* Candidate Rules Table */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Candidate Jurisdiction Evidence ({result.candidates?.length || 0} evaluated)
              </p>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Rule ID</th>
                      <th className="p-3">Subject</th>
                      <th className="p-3">District</th>
                      <th className="p-3">Departments</th>
                      <th className="p-3">Jurisdiction</th>
                      <th className="p-3">Similarity</th>
                      <th className="p-3">Combined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                    {result.candidates && result.candidates.length > 0 ? (
                      result.candidates.slice(0, 5).map((cand, cIdx) => (
                        <tr key={cIdx} className="hover:bg-slate-800/40">
                          <td className="p-3 font-mono text-slate-400">{cand.star_map_rule_id}</td>
                          <td className="p-3 font-medium text-slate-200">{cand.subject}</td>
                          <td className="p-3">{cand.district}</td>
                          <td className="p-3 text-slate-300 max-w-xs">{cand.departments?.join(", ")}</td>
                          <td className="p-3 capitalize">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] ${
                                cand.jurisdiction === "shared"
                                  ? "bg-amber-500/15 text-amber-300"
                                  : "bg-emerald-500/15 text-emerald-300"
                              }`}
                            >
                              {cand.jurisdiction}
                            </span>
                          </td>
                          <td className="p-3 font-mono">{cand.similarity}</td>
                          <td className="p-3 font-mono font-bold text-slate-100">{cand.combined_score}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-slate-500">
                          No candidates found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Star Map Inspection Drawer */}
        {showStarMap && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-200">
                Star Map Jurisdiction Rules ({starMapRules.length} loaded)
              </h3>
              <button
                onClick={() => setShowStarMap(false)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Close
              </button>
            </div>
            <div className="overflow-x-auto max-h-96 rounded-lg border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold sticky top-0">
                  <tr>
                    <th className="p-2.5">ID</th>
                    <th className="p-2.5">District</th>
                    <th className="p-2.5">Subject</th>
                    <th className="p-2.5">Departments</th>
                    <th className="p-2.5">Jurisdiction</th>
                    <th className="p-2.5">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/30">
                  {starMapRules.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/30">
                      <td className="p-2.5 font-mono text-slate-400">{r.id}</td>
                      <td className="p-2.5">{r.district}</td>
                      <td className="p-2.5 font-medium text-slate-200">{r.subject}</td>
                      <td className="p-2.5">{r.departments?.join(", ")}</td>
                      <td className="p-2.5 capitalize">{r.jurisdiction}</td>
                      <td className="p-2.5 text-slate-400 max-w-sm">{r.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-slate-500">
        Event Horizon • Problem Statement CX0107 • MUSA CodeX 2026 • Day 1 Skeleton
      </footer>
    </div>
  );
}
