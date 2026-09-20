import React, { useState, useRef } from 'react';

const API_BASE = "";
const API_FALLBACK = "http://127.0.0.1:8000";

async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${path}`, options);
    if (res.ok) return res;
  } catch {}
  return fetch(`${API_FALLBACK}${path}`, options);
}

const PRESETS = [
  { label: "Road Potholes", tag: "CLEAR", text: "There are large potholes on my street and the road urgently needs repair.", district: "Pune" },
  { label: "Water Supply", tag: "CLEAR", text: "The drinking water supply pipeline in our area has had zero water pressure for three consecutive days.", district: "Pune" },
  { label: "Traffic Signals", tag: "AMBIGUOUS", text: "The traffic signal at the main chowk has been broken for two weeks and nobody has fixed it.", district: "Pune" },
  { label: "Drainage Overflow", tag: "AMBIGUOUS", text: "The underground storm water drainage and sewage gutter has overflowed onto the public road.", district: "Pune" },
  { label: "AI Surveillance", tag: "UNKNOWN", text: "I want records about the new AI surveillance camera project in my area.", district: "Pune" },
  { label: "Vague Request", tag: "UNKNOWN", text: "Please look into this issue and fix it immediately as it is causing trouble.", district: "Pune" },
];

const LOADING_STEPS = [
  "Reading request…",
  "Finding subject…",
  "Checking Star Map…",
  "Evaluating jurisdiction…",
  "Calculating routing confidence…",
];

const STATUS_STYLES = {
  CLEAR:     { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/40", shadow: "shadow-emerald-500/10", icon: "✓", label: "Automatic routing recommendation available." },
  AMBIGUOUS: { bg: "bg-amber-500/15",   text: "text-amber-400",   border: "border-amber-500/40",   shadow: "shadow-amber-500/10",   icon: "⚠", label: "Human review recommended." },
  UNKNOWN:   { bg: "bg-rose-500/15",    text: "text-rose-400",    border: "border-rose-500/40",     shadow: "shadow-rose-500/10",     icon: "✕", label: "No reliable department found. Automatic routing disabled." },
};

function SignalBar({ label, value, color }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-28 text-slate-400 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%`, transition: "width 0.6s ease" }} />
      </div>
      <span className="w-10 text-right text-slate-300 font-mono">{pct}%</span>
    </div>
  );
}

function StarMapPath({ result }) {
  if (!result || !result.candidates || result.candidates.length === 0) return null;
  const top = result.candidates[0];
  const depts = result.status === "UNKNOWN" ? [] :
    result.status === "AMBIGUOUS" ? [...new Set((result.candidate_departments || []).map(d => d.name))] :
    result.department ? [result.department] : top.departments || [];
  const nodes = [top.state || "Maharashtra", top.district || "—", top.subject || "—"];
  return (
    <div className="flex flex-wrap items-center gap-1 text-xs">
      {nodes.map((n, i) => (
        <React.Fragment key={i}>
          <span className="px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium">{n}</span>
          <span className="text-slate-600">→</span>
        </React.Fragment>
      ))}
      {depts.length === 0 ? (
        <span className="px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 italic">No department</span>
      ) : depts.map((d, i) => (
        <span key={i} className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium">{d}</span>
      ))}
    </div>
  );
}

export default function App() {
  const [text, setText] = useState(PRESETS[0].text);
  const [state, setState] = useState("Maharashtra");
  const [district, setDistrict] = useState("Pune");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [showStarMap, setShowStarMap] = useState(false);
  const [starMapRules, setStarMapRules] = useState([]);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfPreview, setPdfPreview] = useState("");
  const fileRef = useRef(null);

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setLoadingStep(0);
    const stepTimer = setInterval(() => setLoadingStep(s => Math.min(s + 1, LOADING_STEPS.length - 1)), 400);
    try {
      const res = await apiFetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, state, district }),
      });
      clearInterval(stepTimer);
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || `API error: ${res.status}`);
      }
      setResult(await res.json());
    } catch (err) {
      clearInterval(stepTimer);
      setError(err.message || "Failed to communicate with backend service.");
    } finally {
      setLoading(false);
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfUploading(true);
    setPdfPreview("");
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await apiFetch("/api/extract-pdf", { method: "POST", body: form });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || "PDF extraction failed.");
      }
      const data = await res.json();
      setText(data.text);
      setPdfPreview(data.text.slice(0, 500));
    } catch (err) {
      setError(err.message || "PDF extraction failed.");
    } finally {
      setPdfUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleFetchStarMap = async () => {
    if (starMapRules.length > 0) { setShowStarMap(!showStarMap); return; }
    try {
      const res = await apiFetch("/api/starmap");
      if (res.ok) { setStarMapRules(await res.json()); setShowStarMap(true); }
    } catch {}
  };

  const st = result ? STATUS_STYLES[result.status] || STATUS_STYLES.UNKNOWN : null;
  const signals = result?.signals || {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="w-full max-w-4xl mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <span>MUSA CodeX 2026</span><span>•</span><span>Team Tensor Float</span><span>•</span><span>PS No. CX0107</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
          Event Horizon
        </h1>
        <p className="mt-2 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
          AI-assisted routing for Right to Information applications. Prevents the "RTI Black Hole" by saying{" "}
          <span className="text-rose-400 font-semibold">UNKNOWN</span> or{" "}
          <span className="text-amber-400 font-semibold">AMBIGUOUS</span> instead of hallucinating.
        </p>
      </header>

      <main className="w-full max-w-4xl space-y-6">
        {/* Scenario Presets */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Demo Presets (1-Click)</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PRESETS.map((p, idx) => (
              <button key={idx} type="button"
                onClick={() => { setText(p.text); setDistrict(p.district); setResult(null); setError(""); setPdfPreview(""); }}
                className="text-left p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-indigo-500/50 transition flex flex-col justify-between text-xs group">
                <span className="font-semibold text-slate-200 group-hover:text-indigo-300">{p.label}</span>
                <span className={`text-[11px] mt-1 ${p.tag === "CLEAR" ? "text-emerald-400" : p.tag === "AMBIGUOUS" ? "text-amber-400" : "text-rose-400"}`}>{p.tag}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleAnalyze} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div>
            <label htmlFor="rti-text" className="block text-sm font-medium text-slate-300 mb-2">RTI Application Text</label>
            <textarea id="rti-text" rows={4} value={text} onChange={(e) => setText(e.target.value)}
              placeholder="Paste or write the draft RTI application text here..."
              className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 p-4 text-sm placeholder-slate-500 transition resize-none outline-none"
              required />
          </div>

          {/* PDF Upload */}
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs cursor-pointer transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              {pdfUploading ? "Extracting…" : "Upload PDF"}
              <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} disabled={pdfUploading} />
            </label>
            <span className="text-xs text-slate-500">or paste text above</span>
          </div>
          {pdfPreview && (
            <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20 text-xs text-indigo-300">
              <p className="font-semibold mb-1">Extracted PDF Preview:</p>
              <p className="text-slate-400 whitespace-pre-wrap line-clamp-4">{pdfPreview}{pdfPreview.length >= 500 ? "…" : ""}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="state-select" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">State</label>
              <select id="state-select" value={state} onChange={(e) => setState(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 text-slate-200 p-2.5 text-sm outline-none focus:border-indigo-500">
                <option value="Maharashtra">Maharashtra</option>
              </select>
            </div>
            <div>
              <label htmlFor="district-select" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">District / Jurisdiction</label>
              <select id="district-select" value={district} onChange={(e) => setDistrict(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 text-slate-200 p-2.5 text-sm outline-none focus:border-indigo-500">
                <option value="Pune">Pune</option>
                <option value="Nagpur">Nagpur</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button type="button" onClick={handleFetchStarMap} className="text-xs text-slate-400 hover:text-slate-200 underline transition">
              {showStarMap ? "Hide Star Map Dataset" : "Inspect Star Map Rules"}
            </button>
            <button type="submit" disabled={loading || !text.trim()}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-indigo-600/20">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                  {LOADING_STEPS[loadingStep]}
                </span>
              ) : "Analyze Application →"}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
            <strong>Analysis Failed:</strong> {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">

            {/* Status Hero */}
            <div className={`rounded-xl p-5 border ${st.border} ${st.bg} shadow-lg ${st.shadow}`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className={`inline-flex items-center gap-2 text-2xl font-bold ${st.text}`}>
                    <span>{st.icon}</span> {result.status}
                  </span>
                  <p className="text-sm text-slate-300 mt-1">{st.label}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">MVP Routing Confidence</p>
                  <p className={`text-3xl font-extrabold ${st.text}`}>{(result.confidence * 100).toFixed(0)}%</p>
                </div>
              </div>
              {/* Department Display */}
              <div className="mt-4">
                {result.status === "CLEAR" && result.department && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Target Department:</span>
                    <span className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-sm font-semibold">{result.department}</span>
                  </div>
                )}
                {result.status === "AMBIGUOUS" && result.candidate_departments?.length > 0 && (
                  <div>
                    <span className="text-xs text-slate-400 block mb-1.5">Candidate Departments (Human Review Required):</span>
                    <div className="flex flex-wrap gap-2">
                      {result.candidate_departments.map((d, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm font-medium">
                          {d.name} <span className="text-amber-400/60 text-xs ml-1">({(d.score * 100).toFixed(0)}%)</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {result.status === "UNKNOWN" && (
                  <p className="text-sm text-rose-300/80 italic">No responsible department identified. The subject is not recognized in the Star Map dataset.</p>
                )}
              </div>
            </div>

            {/* Star Map Path Visualization */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Star Map Routing Path</p>
              <StarMapPath result={result} />
            </div>

            {/* Analysis Evidence Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Detected Subject</p>
                <p className="text-sm font-medium text-slate-300 mt-0.5">
                  {result.subject || result.detected_subject || <span className="text-slate-500 italic">None detected</span>}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Star Map Rule(s)</p>
                <p className="text-sm font-mono text-indigo-300 mt-0.5">
                  {result.star_map_rules?.length > 0 ? result.star_map_rules.join(", ") : "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Jurisdiction Type</p>
                <span className={`inline-flex px-2 py-0.5 rounded text-xs mt-0.5 ${result.jurisdiction_type === "shared" ? "bg-amber-500/15 text-amber-300" : result.jurisdiction_type === "single" ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-700 text-slate-400"}`}>
                  {result.jurisdiction_type || "unknown"}
                </span>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Keywords</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {result.keywords?.length > 0 ? result.keywords.map((k, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs">{k}</span>
                  )) : <span className="text-slate-500 text-xs italic">No keywords</span>}
                </div>
              </div>
            </div>

            {/* Signal Breakdown */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Signal Breakdown</p>
              <SignalBar label="Semantic" value={signals.semantic || 0} color="bg-blue-500" />
              <SignalBar label="Subject" value={signals.subject || 0} color="bg-indigo-500" />
              <SignalBar label="Jurisdiction" value={signals.jurisdiction || 0} color="bg-cyan-500" />
              <SignalBar label="Juris. Type" value={signals.jurisdiction_type || 0} color="bg-teal-500" />
              <div className="flex gap-4 pt-1 text-xs text-slate-400 border-t border-slate-800 mt-2">
                <span>Conflict: <span className={signals.conflict_level === "high" ? "text-rose-400 font-semibold" : signals.conflict_level === "medium" ? "text-amber-400" : "text-emerald-400"}>{signals.conflict_level || "low"}</span></span>
                {(signals.conflict_penalty > 0) && <span>Penalty: <span className="text-rose-400">-{(signals.conflict_penalty * 100).toFixed(0)}%</span></span>}
                {(signals.vagueness_penalty > 0) && <span>Vagueness: <span className="text-amber-400">-{(signals.vagueness_penalty * 100).toFixed(0)}%</span></span>}
              </div>
            </div>

            {/* Explanation */}
            {result.explanation?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Why did Event Horizon decide this?</p>
                <ul className="space-y-1.5 text-sm text-slate-300">
                  {result.explanation.map((e, i) => (
                    <li key={i} className="flex gap-2"><span className="text-indigo-400 mt-0.5">•</span><span>{e}</span></li>
                  ))}
                </ul>
              </div>
            )}

            {/* Conflicts */}
            {result.conflicts?.length > 0 && (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Detected Conflicts</p>
                {result.conflicts.map((c, i) => (
                  <div key={i} className="text-sm text-amber-200 mb-1">
                    <span className="text-amber-400 mr-1">⚠</span>
                    {c.reason} <span className="text-amber-400/60 text-xs">({c.involved_rule_ids?.join(", ")})</span>
                  </div>
                ))}
              </div>
            )}

            {/* Guidance / What To Do Next */}
            {(result.status === "AMBIGUOUS" || result.status === "UNKNOWN") && result.guidance && (
              <div className={`rounded-xl p-4 border ${result.status === "UNKNOWN" ? "bg-rose-500/5 border-rose-500/20" : "bg-amber-500/5 border-amber-500/20"}`}>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">What to do next</p>
                <p className="text-sm text-slate-300">{result.guidance}</p>
                {result.recommended_action && (
                  <p className="text-sm font-medium mt-2 text-indigo-300">Recommended: {result.recommended_action}</p>
                )}
              </div>
            )}

            {/* Warnings */}
            {result.warnings?.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                {result.warnings.map((w, i) => <p key={i} className="text-xs text-amber-300">{w}</p>)}
              </div>
            )}

            {/* Candidate Evidence Table */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Candidate Jurisdiction Evidence ({result.candidates?.length || 0} evaluated)
              </p>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Rule ID</th><th className="p-3">Subject</th><th className="p-3">District</th>
                      <th className="p-3">Departments</th><th className="p-3">Jurisdiction</th>
                      <th className="p-3">Similarity</th><th className="p-3">Combined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                    {result.candidates?.length > 0 ? result.candidates.slice(0, 5).map((cand, i) => (
                      <tr key={i} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono text-slate-400">{cand.star_map_rule_id}</td>
                        <td className="p-3 font-medium text-slate-200">{cand.subject}</td>
                        <td className="p-3">{cand.district}</td>
                        <td className="p-3 text-slate-300 max-w-xs">{cand.departments?.join(", ")}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] ${cand.jurisdiction === "shared" ? "bg-amber-500/15 text-amber-300" : "bg-emerald-500/15 text-emerald-300"}`}>
                            {cand.jurisdiction}
                          </span>
                        </td>
                        <td className="p-3 font-mono">{cand.similarity}</td>
                        <td className="p-3 font-mono font-bold text-slate-100">{cand.combined_score}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={7} className="p-4 text-center text-slate-500">No candidates found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MVP Disclaimer */}
            <div className="text-center p-3 rounded-lg bg-slate-800/30 border border-slate-800">
              <p className="text-xs text-slate-500 italic">{result.disclaimer}</p>
            </div>
          </div>
        )}

        {/* Star Map Drawer */}
        {showStarMap && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-200">Star Map Jurisdiction Rules ({starMapRules.length} loaded)</h3>
              <button onClick={() => setShowStarMap(false)} className="text-xs text-slate-400 hover:text-slate-200">Close</button>
            </div>
            <div className="overflow-x-auto max-h-96 rounded-lg border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold sticky top-0">
                  <tr>
                    <th className="p-2.5">ID</th><th className="p-2.5">District</th><th className="p-2.5">Subject</th>
                    <th className="p-2.5">Departments</th><th className="p-2.5">Jurisdiction</th><th className="p-2.5">Note</th>
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

      <footer className="mt-12 text-center text-xs text-slate-500 space-y-1">
        <p>Event Horizon • Problem Statement CX0107 • MUSA CodeX 2026 • Day 2 MVP</p>
        <p className="italic">MVP routing confidence score; demonstration data; not legal advice.</p>
      </footer>
    </div>
  );
}
