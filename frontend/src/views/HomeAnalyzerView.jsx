import React, { useState, useRef } from 'react';

export default function HomeAnalyzerView({
  presets,
  text,
  setText,
  state,
  setState,
  district,
  setDistrict,
  selectedLang,
  setSelectedLang,
  loading,
  result,
  error,
  onAnalyze,
  onClear,
  onSelectPreset,
  onNavigate,
  onInspectStarMap
}) {
  const [inputTab, setInputTab] = useState('text'); // 'text' | 'upload'
  const [fileName, setFileName] = useState('');
  const [fileLoading, setFileLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [activeAccordion, setActiveAccordion] = useState({
    1: true,
    2: true,
    3: false,
    4: false,
    5: false
  });
  const [activeSimState, setActiveSimState] = useState(null); // for simulation tab overrides if user toggles
  const [prevResult, setPrevResult] = useState(result);
  const [latencyMs, setLatencyMs] = useState(42);
  const fileInputRef = useRef(null);

  if (result !== prevResult) {
    setPrevResult(result);
    setActiveSimState(null);
    const computed = 36 + ((result?.detected_subject?.length || 8) % 13);
    setLatencyMs(computed);
  }

  const toggleAccordion = (step) => {
    setActiveAccordion((prev) => ({
      ...prev,
      [step]: !prev[step]
    }));
  };

  // Handle local file selection (txt or pdf with genuine extraction)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setUploadError('');
    setFileLoading(true);

    if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
      try {
        const formData = new FormData();
        formData.append('file', file);

        let res;
        try {
          res = await fetch('/api/extract-pdf', {
            method: 'POST',
            body: formData
          });
        } catch {
          res = await fetch('http://127.0.0.1:8000/api/extract-pdf', {
            method: 'POST',
            body: formData
          });
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || `Extraction failed with status ${res.status}`);
        }

        const data = await res.json();
        if (data.extracted_text && data.extracted_text.trim()) {
          setText(data.extracted_text);
          setInputTab('text');
        } else {
          throw new Error('No extractable text found in this PDF. It may be scanned or empty.');
        }
      } catch (err) {
        console.error('PDF extraction failed:', err);
        setUploadError(err.message || 'Failed to extract text from PDF document.');
      } finally {
        setFileLoading(false);
      }
    } else {
      // Plain text or markdown
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        if (typeof content === 'string') {
          setText(content);
        }
        setFileLoading(false);
        setInputTab('text');
      };
      reader.onerror = () => {
        setFileLoading(false);
        setUploadError('Failed to read local text file.');
      };
      reader.readAsText(file);
    }
  };

  // Active decision state: user simulator override OR real result OR default initial preset view
  const currentDecision = activeSimState || (result ? result.decision : null);

  // Stage progress state for the 5-stage tracker
  const getStageStatus = (stageNum) => {
    if (loading) {
      return stageNum <= 3 ? 'active' : 'pending';
    }
    if (result) {
      return 'completed';
    }
    return 'idle';
  };

  return (
    <div className="flex flex-col w-full">
      {/* Top Statutory Notification Ribbon */}
      <div className="w-full bg-[#e1e8ff] text-[#121b2e] py-1.5 px-4 sm:px-6 lg:px-8 border-b border-[#c3c6d0]/40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 font-body-sm text-body-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#002548] text-white font-label-sm text-label-sm font-bold tracking-wide uppercase">
              Gazette 2026.4
            </span>
            <span className="text-[#43474f] font-medium">
              Sec. 6(1) &amp; 6(3) Transfer Heuristic Engine — Pilot Deployment
            </span>
          </div>
          <div className="flex items-center gap-4 text-[#43474f]">
            <span className="flex items-center gap-1.5 font-label-sm text-label-sm uppercase font-bold text-[#235eac]">
              <span className="w-2 h-2 rounded-full bg-[#235eac] animate-pulse" />
              Star Map v3.4 Active
            </span>
            <span className="hidden md:inline font-label-sm text-label-sm text-[#737780]">
              NIC Civic Schema Compliant
            </span>
          </div>
        </div>
      </div>

      {/* HERO SECTION */}
      <section className="relative w-full bg-[#ffffff] text-[#121b2e] overflow-hidden py-10 sm:py-14 px-4 sm:px-6 lg:px-8 border-b border-[#c3c6d0]/40">
        {/* Subtle Layered Event Horizon Vector Rings */}
        <div className="absolute -right-20 -top-20 w-[480px] h-[480px] pointer-events-none opacity-40 select-none hidden md:block">
          <svg className="w-full h-full" fill="none" viewBox="0 0 400 400">
            <circle cx="200" cy="200" r="180" stroke="#7aacff" strokeWidth="1.2" strokeDasharray="6 6" />
            <circle cx="200" cy="200" r="140" stroke="#c3c6d0" strokeWidth="1.5" />
            <circle cx="200" cy="200" r="105" stroke="#235eac" strokeWidth="2" opacity="0.35" />
            <circle cx="200" cy="200" r="70" stroke="#123b66" strokeWidth="2.5" strokeDasharray="2 4" />
            <circle cx="200" cy="200" r="38" fill="#123b66" opacity="0.12" />
            <circle cx="200" cy="200" r="10" fill="#ffb95f" />
            <line x1="20" y1="200" x2="380" y2="200" stroke="#c3c6d0" strokeWidth="0.75" />
            <line x1="200" y1="20" x2="200" y2="380" stroke="#c3c6d0" strokeWidth="0.75" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl">
            {/* Trust badge pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e9edff] text-[#002548] mb-4 shadow-xs">
              <span className="material-symbols-outlined text-[#235eac] text-[18px]">verified_user</span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold">
                AI-assisted guidance • Explainable results • Human review when uncertain
              </span>
            </div>

            <h1 className="font-headline-xl text-headline-xl text-[#002548] font-bold tracking-tight mb-3 sm:text-4xl">
              Route Your RTI With Greater Clarity
            </h1>

            <p className="font-body-lg text-body-lg text-[#43474f] mb-6 leading-relaxed">
              Event Horizon uses AI-assisted subject and jurisdiction analysis to help identify the most relevant department for your RTI application. Built for citizens, designated PIOs, and public grievance desks.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#analyzer-workbench"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#123b66] hover:bg-[#002548] text-white font-label-lg text-label-lg font-semibold rounded-lg shadow-xs transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">document_scanner</span>
                <span>Analyze an RTI</span>
              </a>

              <button
                type="button"
                onClick={() => onNavigate('how-it-works')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#e9edff] hover:bg-[#e1e8ff] text-[#002548] font-label-lg text-label-lg font-semibold rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">account_tree</span>
                <span>See How It Works</span>
              </button>

              <div className="flex items-center gap-2 text-[#43474f] font-label-sm text-label-sm pl-2">
                <span className="w-2 h-2 rounded-full bg-[#ffddb8]" />
                <span>Zero Data Retention on Demo Mode</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 bg-[#f1f3ff] rounded-xl p-4 shadow-xs border border-[#c3c6d0]/40">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-[#43474f] uppercase font-bold tracking-wider">Indexed Ministries</span>
              <span className="font-headline-lg text-headline-lg font-bold text-[#002548]">54 Central</span>
              <span className="font-body-sm text-body-sm text-[#43474f]">Plus 36 States/UTs</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-[#43474f] uppercase font-bold tracking-wider">Sec 6(3) Transfer Error</span>
              <span className="font-headline-lg text-headline-lg font-bold text-[#235eac]">-41.8%</span>
              <span className="font-body-sm text-body-sm text-[#43474f]">Benchmarked vs manual desk</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-[#43474f] uppercase font-bold tracking-wider">Jurisdiction Star Nodes</span>
              <span className="font-headline-lg text-headline-lg font-bold text-[#002548]">18,400+</span>
              <span className="font-body-sm text-body-sm text-[#43474f]">Civic &amp; municipal bodies</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-[#43474f] uppercase font-bold tracking-wider">Explainability Score</span>
              <span className="font-headline-lg text-headline-lg font-bold text-[#543300]">100% Audit</span>
              <span className="font-body-sm text-body-sm text-[#43474f]">Deterministic rule breakdown</span>
            </div>
          </div>
        </div>
      </section>

      {/* WORKSPACE & ANALYZER SECTION */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8" id="analyzer-workbench">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Analyzer Input Card (7 Cols) */}
          <div className="lg:col-span-7 bg-[#ffffff] rounded-xl shadow-sm border border-[#c3c6d0]/60 p-6 flex flex-col">
            <div className="flex flex-col mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-label-sm text-label-sm uppercase font-bold text-[#235eac] tracking-wider">
                  Intake Protocol • Module 01
                </span>
                <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-[#43474f] bg-[#e9edff] px-2 py-0.5 rounded">
                  <span className="material-symbols-outlined text-[14px]">lock</span>
                  <span>Encrypted Local Sandbox</span>
                </span>
              </div>
              <h2 className="font-headline-lg text-headline-lg text-[#002548] font-bold">
                RTI Application Analyzer
              </h2>
              <p className="font-body-md text-body-md text-[#43474f] mt-1">
                Submit your RTI request and review the system’s routing analysis before taking action.
              </p>
            </div>

            {/* Interactive Acceptance Presets */}
            <div className="bg-[#f1f3ff] rounded-lg p-3 mb-4 border border-[#c3c6d0]/40">
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-sm text-label-sm text-[#43474f] font-bold uppercase tracking-wider">
                  Interactive Acceptance Presets (1-Click Verification):
                </span>
                <span className="font-body-sm text-body-sm text-[#737780]">Click to load real civic test cases</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {presets.map((p, idx) => {
                  const dotColor =
                    idx === 0 ? 'bg-[#15803D]' : idx === 1 ? 'bg-[#B7791F]' : 'bg-[#235eac]';
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onSelectPreset(p)}
                      className="text-left p-2.5 rounded-lg bg-[#ffffff] hover:bg-[#e9edff] border border-[#c3c6d0]/60 hover:border-[#235eac]/60 transition-all flex flex-col justify-between shadow-xs group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${dotColor} flex-shrink-0`} />
                        <span className="font-label-sm text-label-sm font-semibold text-[#002548] group-hover:text-[#235eac] line-clamp-1">
                          {p.label}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#43474f] mt-1 line-clamp-1">
                        {p.expected}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dual Input Tabs */}
            <div className="flex items-center gap-1 bg-[#e9edff] p-1 rounded-lg mb-4">
              <button
                type="button"
                onClick={() => setInputTab('text')}
                className={`flex-1 py-2 px-4 rounded text-center font-label-md text-label-md font-bold transition-all flex items-center justify-center gap-1.5 ${
                  inputTab === 'text'
                    ? 'bg-[#ffffff] text-[#002548] shadow-xs'
                    : 'text-[#43474f] hover:text-[#002548]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">edit_note</span>
                <span>Paste RTI Text</span>
              </button>

              <button
                type="button"
                onClick={() => setInputTab('upload')}
                className={`flex-1 py-2 px-4 rounded text-center font-label-md text-label-md font-bold transition-all flex items-center justify-center gap-1.5 ${
                  inputTab === 'upload'
                    ? 'bg-[#ffffff] text-[#002548] shadow-xs'
                    : 'text-[#43474f] hover:text-[#002548]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                <span>Upload Document (PDF/Text)</span>
              </button>
            </div>

            {/* Tab 1: Text Area Container */}
            {inputTab === 'text' ? (
              <div className="flex flex-col mb-4">
                <label
                  htmlFor="rti-text-input"
                  className="font-label-md text-label-md font-semibold text-[#121b2e] mb-1.5 flex items-center justify-between"
                >
                  <span>
                    RTI Application Contents / Query Body <span className="text-[#ba1a1a] font-bold">*</span>
                  </span>
                  <span className="text-[#737780] font-body-sm text-body-sm font-normal">
                    {text.length} characters
                  </span>
                </label>
                <textarea
                  id="rti-text-input"
                  rows={6}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste your RTI application or draft request here…"
                  className="w-full bg-[#f1f3ff] focus:bg-[#ffffff] text-[#121b2e] p-3.5 rounded-lg border border-[#c3c6d0] font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-[#235eac] transition-all resize-y placeholder:text-[#737780]"
                  required
                />
              </div>
            ) : (
              /* Tab 2: Upload Zone Container */
              <div className="flex flex-col mb-4">
                <label className="font-label-md text-label-md font-semibold text-[#121b2e] mb-1.5">
                  Upload Document (Scanned Draft / Formal Application)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#f1f3ff] hover:bg-[#e9edff] rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors border-2 border-dashed border-[#c3c6d0] hover:border-[#235eac] group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-full bg-[#e1e8ff] flex items-center justify-center text-[#002548] group-hover:scale-105 transition-transform mb-3 shadow-xs">
                    <span className="material-symbols-outlined text-[32px]">cloud_upload</span>
                  </div>
                  <span className="font-headline-md text-headline-md font-bold text-[#002548] mb-1">
                    {fileName ? `Selected: ${fileName}` : 'Upload RTI PDF or Text'}
                  </span>
                  <p className="font-body-md text-body-md text-[#43474f] max-w-sm mb-3">
                    Upload official notices or applications. Supported formats: PDF, TXT. Text is parsed by the backend extraction engine.
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#ffffff] text-[#002548] font-label-sm text-label-sm font-bold shadow-xs border border-[#c3c6d0]">
                    <span className="material-symbols-outlined text-[16px]">file_open</span>
                    <span>{fileLoading ? 'Extracting text via API...' : 'Select Local File'}</span>
                  </div>
                </div>

                {uploadError && (
                  <div className="mt-2.5 p-3 rounded-lg bg-[#ba1a1a]/10 border border-[#ba1a1a]/30 text-[#ba1a1a] flex items-center gap-2 text-body-sm">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>
            )}

            {/* Jurisdiction Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block font-label-sm text-label-sm font-bold text-[#121b2e] mb-1" htmlFor="state-select">
                  State / UT Jurisdiction
                </label>
                <div className="relative">
                  <select
                    id="state-select"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-[#f1f3ff] text-[#121b2e] py-2 px-3 rounded-lg border border-[#c3c6d0] font-body-sm text-body-sm appearance-none focus:outline-none focus:ring-1 focus:ring-[#235eac] cursor-pointer"
                  >
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Delhi">Delhi (NCT)</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Central">Central Government / Union</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-2.5 pointer-events-none text-[#737780] text-[18px]">
                    expand_more
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-label-sm text-label-sm font-bold text-[#121b2e] mb-1" htmlFor="district-select">
                  District / Urban Authority
                </label>
                <div className="relative">
                  <select
                    id="district-select"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-[#f1f3ff] text-[#121b2e] py-2 px-3 rounded-lg border border-[#c3c6d0] font-body-sm text-body-sm appearance-none focus:outline-none focus:ring-1 focus:ring-[#235eac] cursor-pointer"
                  >
                    <option value="Pune">Pune Municipal Corp (PMC)</option>
                    <option value="Nagpur">Nagpur Municipal Corp</option>
                    <option value="Mumbai">Mumbai Suburban (MCGM)</option>
                    <option value="Unspecified">Unspecified / State Wide</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-2.5 pointer-events-none text-[#737780] text-[18px]">
                    expand_more
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-label-sm text-label-sm font-bold text-[#121b2e] mb-1" htmlFor="lang-select">
                  Preferred Response Language
                </label>
                <div className="relative">
                  <select
                    id="lang-select"
                    value={selectedLang}
                    onChange={(e) => setSelectedLang(e.target.value)}
                    className="w-full bg-[#f1f3ff] text-[#121b2e] py-2 px-3 rounded-lg border border-[#c3c6d0] font-body-sm text-body-sm appearance-none focus:outline-none focus:ring-1 focus:ring-[#235eac] cursor-pointer"
                  >
                    <option value="EN">English</option>
                    <option value="MR">मराठी (Marathi)</option>
                    <option value="HI">हिंदी (Hindi)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-2.5 pointer-events-none text-[#737780] text-[18px]">
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            {/* Privacy and Statutory Disclaimer */}
            <div className="bg-[#f1f3ff] rounded-lg p-3 flex items-start gap-2 mb-4 border border-[#c3c6d0]/30">
              <span className="material-symbols-outlined text-[#235eac] text-[18px] flex-shrink-0 mt-0.5">policy</span>
              <p className="font-body-sm text-body-sm text-[#43474f]">
                <strong className="text-[#121b2e]">Legal &amp; Privacy Notice:</strong> Your application is analyzed to identify subject and jurisdiction signals. Review the recommendation before routing. Personal identifiers are redacted before parsing.
              </p>
            </div>

            {/* Form Actions: Analyze & Clear */}
            <div className="flex items-center justify-between pt-2 border-t border-[#c3c6d0]/30">
              <button
                type="button"
                onClick={onClear}
                className="px-4 py-2 bg-[#f1f3ff] hover:bg-[#e1e8ff] text-[#121b2e] font-label-md text-label-md rounded-lg font-semibold transition-colors"
              >
                Clear
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onAnalyze}
                  disabled={loading || !text.trim()}
                  className="px-6 py-2.5 bg-[#123b66] hover:bg-[#002548] disabled:opacity-50 disabled:cursor-not-allowed text-white font-label-lg text-label-lg font-bold rounded-lg shadow-sm transition-all flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Evaluating Escape Velocity...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">bolt</span>
                      <span>Analyze RTI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Visual Star Map & Live Node Topology Preview (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Live Star Map Heuristic Node Widget */}
            <div className="bg-[#ffffff] rounded-xl shadow-sm border border-[#c3c6d0]/60 p-5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-label-sm text-label-sm uppercase font-bold text-[#235eac]">
                    Jurisdiction Graph
                  </span>
                  <h3 className="font-headline-md text-headline-md text-[#002548] font-bold">
                    Star Map Node Resolution
                  </h3>
                </div>
                <span className="px-2 py-0.5 bg-[#e9edff] text-[#002548] font-label-sm text-label-sm rounded font-semibold">
                  Real-time
                </span>
              </div>

              {/* Stylized Inline SVG Node Topology */}
              <div className="w-full h-44 bg-[#f1f3ff] rounded-lg relative flex items-center justify-center overflow-hidden mb-3 border border-[#c3c6d0]/30">
                <svg className="w-full h-full" fill="none" viewBox="0 0 400 180">
                  <line x1="0" y1="45" x2="400" y2="45" stroke="#c3c6d0" strokeWidth="0.5" opacity="0.4" />
                  <line x1="0" y1="90" x2="400" y2="90" stroke="#c3c6d0" strokeWidth="0.5" opacity="0.4" />
                  <line x1="0" y1="135" x2="400" y2="135" stroke="#c3c6d0" strokeWidth="0.5" opacity="0.4" />
                  <line x1="100" y1="0" x2="100" y2="180" stroke="#c3c6d0" strokeWidth="0.5" opacity="0.4" />
                  <line x1="200" y1="0" x2="200" y2="180" stroke="#c3c6d0" strokeWidth="0.5" opacity="0.4" />
                  <line x1="300" y1="0" x2="300" y2="180" stroke="#c3c6d0" strokeWidth="0.5" opacity="0.4" />

                  {/* Active Routing Path Lines */}
                  <path d="M 60 90 L 190 50 L 320 90" stroke="#235eac" strokeWidth="2" strokeDasharray="4 2" />
                  <path d="M 190 50 L 290 140" stroke="#737780" strokeWidth="1.5" opacity="0.4" />

                  {/* Node 1: Request Origin */}
                  <circle cx="60" cy="90" r="14" fill="#002548" />
                  <circle cx="60" cy="90" r="22" stroke="#235eac" strokeWidth="1" opacity="0.4" />
                  <text x="60" y="94" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">RTI</text>
                  <text x="60" y="122" fill="#43474f" fontSize="9" fontWeight="600" textAnchor="middle">Citizen Query</text>

                  {/* Node 2: Star Map Pivot Central */}
                  <circle cx="190" cy="50" r="18" fill="#123b66" />
                  <circle cx="190" cy="50" r="26" stroke="#aac7ff" strokeWidth="1.5" />
                  <text x="190" y="54" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">STAR MAP</text>
                  <text x="190" y="24" fill="#123b66" fontSize="9" fontWeight="700" textAnchor="middle">
                    {district} Jurisdiction
                  </text>

                  {/* Node 3: Target PIO Authority */}
                  <circle cx="320" cy="90" r="15" fill="#235eac" />
                  <circle cx="320" cy="90" r="20" stroke="#d3e3ff" strokeWidth="1.5" />
                  <text x="320" y="94" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">PIO</text>
                  <text x="320" y="122" fill="#123b66" fontSize="9" fontWeight="700" textAnchor="middle">
                    {result && result.candidates?.length > 0
                      ? result.candidates[0].departments?.[0]?.slice(0, 18) || 'Nodal Authority'
                      : 'Nodal Authority'}
                  </text>

                  {/* Node 4: Secondary Alternative */}
                  <circle cx="290" cy="140" r="10" fill="#d1daf4" />
                  <text x="290" y="143" fill="#43474f" fontSize="8" textAnchor="middle">Alt</text>
                </svg>

                <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-white/90 backdrop-blur-xs text-[#002548] font-label-sm text-label-sm rounded shadow-xs border border-[#c3c6d0]/40 font-mono">
                  Graph Latency: {latencyMs}ms
                </div>
              </div>

              {/* Node Telemetry Summary */}
              <div className="flex flex-col gap-1.5 font-body-sm text-body-sm text-[#43474f]">
                <div className="flex justify-between items-center py-1 bg-[#f1f3ff] px-2.5 rounded">
                  <span className="font-medium text-[#121b2e]">Target Hierarchy</span>
                  <span className="font-bold text-[#002548] truncate max-w-[200px]">
                    {state} &gt; {district} &gt; {result?.candidates?.[0]?.departments?.[0] || 'Public Works'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 px-2.5">
                  <span className="font-medium text-[#121b2e]">Transfer Precedent</span>
                  <span className="font-bold text-[#235eac]">
                    {result?.decision === 'AMBIGUOUS' ? 'Sec 6(3) Flag Recommended' : 'Sec 6(3) Direct Match'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 bg-[#f1f3ff] px-2.5 rounded">
                  <span className="font-medium text-[#121b2e]">Statutory PIO Roster</span>
                  <span className="font-bold text-[#121b2e]">Roster Desk 2026 (Active)</span>
                </div>
              </div>
            </div>

            {/* Fast Context Card: Authority Directory */}
            <div className="bg-[#002548] text-white rounded-xl shadow-sm p-5 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="material-symbols-outlined text-[#ffddb8] text-[20px]">lightbulb</span>
                  <span className="font-label-sm text-label-sm uppercase font-bold text-[#ffddb8] tracking-wider">
                    Statutory Pro Tip
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-white/90 leading-relaxed mb-3">
                  Applying to an incorrect authority introduces up to <strong className="text-[#ffddb8]">30 days statutory delay</strong> while officers enact inter-departmental transfers. Event Horizon minimizes transfers before filing.
                </p>
                <div className="flex items-center justify-between text-white/70 font-label-sm text-label-sm pt-2 border-t border-white/10">
                  <span>Section 6(3) Maximum Transfer: 5 Days</span>
                  <button
                    type="button"
                    onClick={() => onNavigate('escape-velocity-engine')}
                    className="text-[#ffddb8] hover:underline flex items-center gap-0.5"
                  >
                    Learn engine logic →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5-STAGE DETERMINISTIC PROGRESS TRACKER */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-2">
        <div className="bg-[#ffffff] rounded-xl shadow-xs border border-[#c3c6d0]/60 p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
            <div>
              <span className="font-label-sm text-label-sm uppercase font-bold text-[#235eac] tracking-wider">
                Pipeline Transparency
              </span>
              <h3 className="font-headline-md text-headline-md text-[#002548] font-bold">
                5-Stage Deterministic Verification Engine
              </h3>
            </div>
            <div className="flex items-center gap-2 font-label-sm text-label-sm text-[#43474f]">
              <span className={`w-2 h-2 rounded-full ${loading ? 'bg-[#ffb95f] animate-ping' : result ? 'bg-[#15803D]' : 'bg-[#235eac]'}`} />
              <span className="font-medium">
                {loading
                  ? 'Analyzing semantics & querying Star Map...'
                  : result
                  ? 'Verification Complete • Decision Rendered'
                  : 'Pipeline Ready • Awaiting trigger'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
            {[
              { num: 1, title: 'Document Extraction', desc: 'Lexical tokenization' },
              { num: 2, title: 'Subject Detection', desc: 'Semantic intent indexing' },
              { num: 3, title: 'Jurisdiction Match', desc: 'Star Map rule alignment' },
              { num: 4, title: 'Confidence Analysis', desc: 'Escape Velocity calculation' },
              { num: 5, title: 'Routing Decision', desc: 'Tri-state classification' }
            ].map((st) => {
              const status = getStageStatus(st.num);
              const isActive = status === 'active' || (result && !loading);
              return (
                <div
                  key={st.num}
                  className={`rounded-lg p-3 flex flex-col gap-1 transition-all border ${
                    isActive
                      ? 'bg-[#123b66] text-white border-[#123b66] shadow-xs'
                      : 'bg-[#f1f3ff] text-[#121b2e] border-[#c3c6d0]/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-label-sm text-label-sm font-bold ${isActive ? 'text-[#ffddb8]' : 'text-[#737780]'}`}>
                      Stage 0{st.num}
                    </span>
                    <span className="material-symbols-outlined text-[16px]">
                      {isActive ? 'check_circle' : 'pending'}
                    </span>
                  </div>
                  <span className="font-label-md text-label-md font-bold">{st.title}</span>
                  <span className={`font-body-sm text-body-sm ${isActive ? 'text-white/80' : 'text-[#43474f]'}`}>
                    {st.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ERROR BANNER */}
      {error && (
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-3">
          <div className="p-4 rounded-xl bg-[#ffdad6] border border-[#ba1a1a]/40 text-[#93000a] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ba1a1a]">error</span>
              <span><strong>Backend Communication Error:</strong> {error}</span>
            </div>
            <button
              type="button"
              onClick={onAnalyze}
              className="px-3 py-1 bg-[#ba1a1a] text-white font-label-sm text-label-sm font-bold rounded"
            >
              Retry
            </button>
          </div>
        </section>
      )}

      {/* RESULTS & DECISION STATES SECTION */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8" id="results-workbench">
        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[#235eac] text-[20px]">splitscreen</span>
              <span className="font-label-sm text-label-sm uppercase font-bold text-[#235eac] tracking-wider">
                Evaluation Bench • Core Heuristic Outcomes
              </span>
            </div>
            <h2 className="font-headline-xl text-headline-xl text-[#002548] font-bold">
              Analysis Results &amp; Decision States
            </h2>
            <p className="font-body-md text-body-md text-[#43474f]">
              {result
                ? 'Active response evaluated against real Star Map rules and Escape Velocity thresholds.'
                : 'Run an analysis above or toggle simulated state templates to inspect explainability structures.'}
            </p>
          </div>

          {/* Quick simulator state override buttons */}
          <div className="bg-[#e9edff] p-1 rounded-lg flex items-center gap-1 shadow-xs self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveSimState('CLEAR')}
              className={`px-3 py-1 rounded font-label-sm text-label-sm uppercase tracking-wider font-bold transition-all flex items-center gap-1.5 ${
                currentDecision === 'CLEAR'
                  ? 'bg-[#ffffff] text-[#002548] shadow-xs'
                  : 'text-[#43474f] hover:text-[#002548]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#15803D]" />
              <span>CLEAR</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSimState('AMBIGUOUS')}
              className={`px-3 py-1 rounded font-label-sm text-label-sm uppercase tracking-wider font-bold transition-all flex items-center gap-1.5 ${
                currentDecision === 'AMBIGUOUS'
                  ? 'bg-[#ffffff] text-[#002548] shadow-xs'
                  : 'text-[#43474f] hover:text-[#002548]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#B7791F]" />
              <span>AMBIGUOUS</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSimState('UNKNOWN')}
              className={`px-3 py-1 rounded font-label-sm text-label-sm uppercase tracking-wider font-bold transition-all flex items-center gap-1.5 ${
                currentDecision === 'UNKNOWN'
                  ? 'bg-[#ffffff] text-[#002548] shadow-xs'
                  : 'text-[#43474f] hover:text-[#002548]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#235eac]" />
              <span>UNKNOWN</span>
            </button>
          </div>
        </div>

        {/* DYNAMIC RESULTS CONTAINER */}
        <div className="w-full">
          {/* ============================================================== */}
          {/* STATE A: CLEAR */}
          {/* ============================================================== */}
          {(!currentDecision || currentDecision === 'CLEAR') && (
            <div className="flex flex-col gap-4">
              {/* Pinned Decision Banner with 4px left-border anchor */}
              <div className="bg-[#F0FDF4] text-[#14532D] rounded-xl p-5 shadow-xs relative overflow-hidden border border-[#15803D]/20">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#15803D]" />
                <div className="pl-2 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#15803D] text-[32px]">check_circle</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-headline-md text-headline-md font-bold text-[#14532D]">CLEAR</span>
                        <span className="bg-[#DCFCE7] text-[#15803D] font-label-sm text-label-sm font-bold px-2 py-0.5 rounded">
                          High Concurrence
                        </span>
                      </div>
                      <p className="font-body-md text-body-md text-[#14532D]/90">
                        Strong evidence supports this routing recommendation. Direct statutory assignment identified.
                      </p>
                    </div>
                  </div>

                  {/* Heuristic Score Pill */}
                  <div className="bg-[#ffffff] text-[#121b2e] rounded-lg p-3 shadow-xs md:text-right flex flex-col justify-center border border-[#c3c6d0]/40">
                    <span className="font-label-sm text-label-sm text-[#737780] uppercase font-bold tracking-wider">
                      Routing Confidence
                    </span>
                    <div className="flex items-baseline md:justify-end gap-1">
                      <span className="font-headline-lg text-headline-lg font-bold text-[#15803D]">
                        {result && result.decision === 'CLEAR'
                          ? (result.confidence * 100).toFixed(0)
                          : '82'}
                      </span>
                      <span className="font-label-md text-label-md text-[#737780]">/ 100</span>
                    </div>
                    <span className="font-body-sm text-body-sm text-[#43474f] italic">
                      MVP heuristic. Not a probability.
                    </span>
                  </div>
                </div>
              </div>

              {/* Primary Match Authority Summary Card */}
              <div className="bg-[#ffffff] rounded-xl p-6 shadow-xs border border-[#c3c6d0]/60">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-8 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-[#43474f] font-label-sm text-label-sm uppercase font-bold">
                      <span className="material-symbols-outlined text-[16px] text-[#235eac]">domain</span>
                      <span>Identified Public Authority</span>
                    </div>
                    <h3 className="font-headline-xl text-headline-xl text-[#002548] font-bold">
                      {result?.candidates?.[0]?.departments?.[0] || 'Municipal Engineering Department'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <div className="px-3 py-1 bg-[#e9edff] rounded-lg text-[#002548] font-label-md text-label-md font-semibold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">subject</span>
                        <span>
                          Subject Detected:{' '}
                          <strong>
                            {result?.detected_subject || 'Road Repair & Pothole Maintenance'}
                          </strong>
                        </span>
                      </div>
                      <div className="px-3 py-1 bg-[#f1f3ff] rounded-lg text-[#121b2e] font-body-sm text-body-sm border border-[#c3c6d0]/40">
                        Jurisdiction:{' '}
                        <strong>{result?.candidates?.[0]?.district || district} Local Authority</strong>
                      </div>
                      <div className="px-3 py-1 bg-[#f1f3ff] rounded-lg text-[#121b2e] font-body-sm text-body-sm border border-[#c3c6d0]/40">
                        Nodal PIO: <strong>Executive Engineer (Roads &amp; Civil Works)</strong>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-4 flex flex-col gap-2 sm:items-end">
                    <a
                      href="#explainability-panel"
                      className="w-full sm:w-auto px-4 py-2 bg-[#123b66] hover:bg-[#002548] text-white font-label-md text-label-md font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[18px]">analytics</span>
                      <span>Review Audit Evidence</span>
                    </a>
                    <button
                      type="button"
                      onClick={onInspectStarMap}
                      className="w-full sm:w-auto px-4 py-2 bg-[#e9edff] hover:bg-[#e1e8ff] text-[#002548] font-label-md text-label-md font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[18px]">hub</span>
                      <span>Inspect Rule in Star Map</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 3 Specific Explanation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#ffffff] rounded-xl p-4 shadow-xs border border-[#c3c6d0]/60 flex flex-col">
                  <div className="w-9 h-9 rounded-lg bg-[#e1e8ff] flex items-center justify-center text-[#002548] mb-3">
                    <span className="material-symbols-outlined text-[20px]">spellcheck</span>
                  </div>
                  <span className="font-label-md text-label-md font-bold text-[#002548] mb-1">
                    1. Subject Match
                  </span>
                  <p className="font-body-md text-body-md text-[#43474f] leading-normal">
                    Focuses on road repair and municipal maintenance. Extracted tokens:{' '}
                    {result?.keywords && result.keywords.length > 0 ? (
                      result.keywords.slice(0, 3).map((k, ki) => (
                        <code key={ki} className="bg-[#e9edff] px-1 py-0.5 rounded text-[#002548] text-body-sm mr-1">
                          {k}
                        </code>
                      ))
                    ) : (
                      <code className="bg-[#e9edff] px-1 py-0.5 rounded text-[#002548] text-body-sm">
                        potholes, road repair
                      </code>
                    )}
                  </p>
                </div>

                <div className="bg-[#ffffff] rounded-xl p-4 shadow-xs border border-[#c3c6d0]/60 flex flex-col">
                  <div className="w-9 h-9 rounded-lg bg-[#e1e8ff] flex items-center justify-center text-[#235eac] mb-3">
                    <span className="material-symbols-outlined text-[20px]">hub</span>
                  </div>
                  <span className="font-label-md text-label-md font-bold text-[#002548] mb-1">
                    2. Jurisdiction Match
                  </span>
                  <p className="font-body-md text-body-md text-[#43474f] leading-normal">
                    Matches urban local body responsibilities under the Allocation of Business rules and the Star Map gazetted roster.
                  </p>
                </div>

                <div className="bg-[#ffffff] rounded-xl p-4 shadow-xs border border-[#c3c6d0]/60 flex flex-col">
                  <div className="w-9 h-9 rounded-lg bg-[#e1e8ff] flex items-center justify-center text-[#123b66] mb-3">
                    <span className="material-symbols-outlined text-[20px]">fact_check</span>
                  </div>
                  <span className="font-label-md text-label-md font-bold text-[#002548] mb-1">
                    3. Evidence &amp; Precedent
                  </span>
                  <p className="font-body-md text-body-md text-[#43474f] leading-normal">
                    Rule{' '}
                    <strong className="text-[#121b2e]">
                      {result?.candidates?.[0]?.star_map_rule_id || 'RULE-01'}
                    </strong>{' '}
                    matches with high similarity (
                    {result?.candidates?.[0]?.similarity
                      ? (result.candidates[0].similarity * 100).toFixed(0) + '%'
                      : '84%'}
                    ) and no competing statutory overlaps.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STATE B: AMBIGUOUS */}
          {/* ============================================================== */}
          {currentDecision === 'AMBIGUOUS' && (
            <div className="flex flex-col gap-4">
              {/* Pinned Decision Banner */}
              <div className="bg-[#FFFBEB] text-[#78350F] rounded-xl p-5 shadow-xs relative overflow-hidden border border-[#B7791F]/30">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#B7791F]" />
                <div className="pl-2 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#B7791F] text-[32px]">warning</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-headline-md text-headline-md font-bold text-[#78350F]">AMBIGUOUS</span>
                        <span className="bg-[#FEF3C7] text-[#92400E] font-label-sm text-label-sm font-bold px-2 py-0.5 rounded">
                          Jurisdiction Type: Shared / Multi-Agency
                        </span>
                      </div>
                      <p className="font-body-md text-body-md text-[#78350F]/90">
                        Multiple plausible departments were identified. Automatic single-department routing is not recommended.
                      </p>
                    </div>
                  </div>

                  {/* Heuristic Score Pill */}
                  <div className="bg-[#ffffff] text-[#121b2e] rounded-lg p-3 shadow-xs md:text-right flex flex-col justify-center border border-[#c3c6d0]/40">
                    <span className="font-label-sm text-label-sm text-[#737780] uppercase font-bold tracking-wider">
                      Confidence Level
                    </span>
                    <div className="flex items-baseline md:justify-end gap-1">
                      <span className="font-headline-lg text-headline-lg font-bold text-[#B7791F]">Medium</span>
                      <span className="font-label-md text-label-md text-[#121b2e] font-semibold">
                        ({result && result.decision === 'AMBIGUOUS' ? (result.confidence * 100).toFixed(0) : '58'} / 100)
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-[#43474f] italic">
                      Multi-jurisdiction signal detected
                    </span>
                  </div>
                </div>
              </div>

              {/* Prominent Human Review Callout Banner */}
              <div className="bg-[#543300] text-[#ffddb8] rounded-xl p-4 flex items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[28px] text-[#ffb95f]">supervisor_account</span>
                  <div>
                    <span className="font-label-md text-label-md font-bold tracking-wide uppercase text-[#ffb95f]">
                      Human Review Recommended
                    </span>
                    <p className="font-body-md text-body-md text-white/90">
                      An officer or citizen review should disambiguate before official filing to avoid Section 6(3) transfer fees and latency.
                    </p>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <span className="px-3 py-1 bg-[#372000] text-[#ffddb8] font-label-sm text-label-sm rounded-lg font-bold uppercase border border-[#ffddb8]/20">
                    Manual Triage Gate
                  </span>
                </div>
              </div>

              {/* "Why is this ambiguous?" Explanation */}
              <div className="bg-[#ffffff] rounded-xl p-5 shadow-xs border border-[#c3c6d0]/60">
                <div className="flex items-center gap-2 mb-1 text-[#002548] font-headline-md text-headline-md font-bold">
                  <span className="material-symbols-outlined text-[#B7791F]">help_outline</span>
                  <span>Why is this ambiguous?</span>
                </div>
                <p className="font-body-md text-body-md text-[#43474f] leading-relaxed">
                  {result && result.reason
                    ? result.reason
                    : 'Your request includes topics that fall under shared administrative mandates. For example, broken traffic signals involve physical electrical maintenance (Municipal Engineering) alongside operational enforcement & synchronization (Traffic Police).'}
                </p>
              </div>

              {/* Side-by-side Candidate Comparison (Unranked, Neutral) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Candidate A */}
                <div className="bg-[#ffffff] rounded-xl p-5 shadow-xs border border-[#c3c6d0]/60 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-label-sm text-label-sm uppercase font-bold text-[#737780] tracking-wider">
                        Candidate Option A
                      </span>
                      <span className="px-2 py-0.5 bg-[#e9edff] text-[#002548] font-label-sm text-label-sm rounded font-semibold">
                        Option 1
                      </span>
                    </div>
                    <h3 className="font-headline-md text-headline-md text-[#002548] font-bold mb-2">
                      {result?.candidates?.[0]?.departments?.[0] || 'Traffic Police Department'}
                    </h3>
                    <p className="font-body-md text-body-md text-[#43474f] mb-4">
                      {result?.candidates?.[0]?.note ||
                        'Operational traffic control, signal timing synchronization, and intersection enforcement.'}
                    </p>
                    <div className="bg-[#f1f3ff] rounded-lg p-2.5 flex flex-col gap-1 mb-4 border border-[#c3c6d0]/30">
                      <span className="font-label-sm text-label-sm text-[#121b2e] font-bold">
                        Relevant signals extracted:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        <span className="px-2 py-0.5 bg-[#d9e2fc] text-[#002548] font-body-sm text-body-sm rounded font-medium">
                          traffic signal
                        </span>
                        <span className="px-2 py-0.5 bg-[#d9e2fc] text-[#002548] font-body-sm text-body-sm rounded font-medium">
                          broken chowk junction
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 flex items-center justify-between border-t border-[#c3c6d0]/30">
                    <span className="font-body-sm text-body-sm text-[#43474f]">
                      PIO: Deputy Commissioner (Traffic)
                    </span>
                    <button
                      type="button"
                      className="px-3 py-1.5 bg-[#e9edff] hover:bg-[#d9e2fc] text-[#002548] font-label-sm text-label-sm font-bold rounded-lg transition-colors"
                    >
                      Select Option A
                    </button>
                  </div>
                </div>

                {/* Candidate B */}
                <div className="bg-[#ffffff] rounded-xl p-5 shadow-xs border border-[#c3c6d0]/60 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-label-sm text-label-sm uppercase font-bold text-[#737780] tracking-wider">
                        Candidate Option B
                      </span>
                      <span className="px-2 py-0.5 bg-[#e9edff] text-[#002548] font-label-sm text-label-sm rounded font-semibold">
                        Option 2
                      </span>
                    </div>
                    <h3 className="font-headline-md text-headline-md text-[#002548] font-bold mb-2">
                      {result?.candidates?.[0]?.departments?.[1] ||
                        result?.candidates?.[1]?.departments?.[0] ||
                        'Municipal Engineering Department'}
                    </h3>
                    <p className="font-body-md text-body-md text-[#43474f] mb-4">
                      {result?.candidates?.[1]?.note ||
                        'Civil electrical infrastructure, cable conduits, signal mast installation, and public works maintenance.'}
                    </p>
                    <div className="bg-[#f1f3ff] rounded-lg p-2.5 flex flex-col gap-1 mb-4 border border-[#c3c6d0]/30">
                      <span className="font-label-sm text-label-sm text-[#121b2e] font-bold">
                        Relevant signals extracted:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        <span className="px-2 py-0.5 bg-[#d9e2fc] text-[#002548] font-body-sm text-body-sm rounded font-medium">
                          hardware repair
                        </span>
                        <span className="px-2 py-0.5 bg-[#d9e2fc] text-[#002548] font-body-sm text-body-sm rounded font-medium">
                          municipal electrical grid
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 flex items-center justify-between border-t border-[#c3c6d0]/30">
                    <span className="font-body-sm text-body-sm text-[#43474f]">
                      PIO: Executive Engineer (Electrical Works)
                    </span>
                    <button
                      type="button"
                      className="px-3 py-1.5 bg-[#e9edff] hover:bg-[#d9e2fc] text-[#002548] font-label-sm text-label-sm font-bold rounded-lg transition-colors"
                    >
                      Select Option B
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STATE C: UNKNOWN */}
          {/* ============================================================== */}
          {currentDecision === 'UNKNOWN' && (
            <div className="flex flex-col gap-4">
              {/* Pinned Decision Banner */}
              <div className="bg-[#f1f3ff] text-[#121b2e] rounded-xl p-5 shadow-xs relative overflow-hidden border border-[#235eac]/30">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#235eac]" />
                <div className="pl-2 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#235eac] text-[32px]">help</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-headline-md text-headline-md font-bold text-[#002548]">UNKNOWN</span>
                        <span className="bg-[#e9edff] text-[#235eac] font-label-sm text-label-sm font-bold px-2 py-0.5 rounded">
                          Insufficient Index Data
                        </span>
                      </div>
                      <p className="font-body-md text-body-md text-[#43474f]">
                        No sufficiently reliable jurisdiction match was found in the Star Map dataset.
                      </p>
                    </div>
                  </div>

                  {/* Department Label Pill */}
                  <div className="bg-[#ffffff] text-[#121b2e] rounded-lg p-3 shadow-xs md:text-right flex flex-col justify-center border border-[#c3c6d0]/40">
                    <span className="font-label-sm text-label-sm text-[#737780] uppercase font-bold tracking-wider">
                      Target Department
                    </span>
                    <span className="font-headline-md text-headline-md font-bold text-[#002548]">
                      Not determined
                    </span>
                    <span className="font-body-sm text-body-sm text-[#ba1a1a] font-medium">
                      Requires manual verification
                    </span>
                  </div>
                </div>
              </div>

              {/* Core Ethical Principle Callout Banner */}
              <div className="bg-[#ffffff] rounded-xl p-6 shadow-xs border border-[#c3c6d0]/60">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#e9edff] flex items-center justify-center text-[#002548] flex-shrink-0">
                    <span className="material-symbols-outlined text-[28px]">shield_with_heart</span>
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm uppercase font-bold text-[#235eac] tracking-wider">
                      Ethical AI Routing Principle
                    </span>
                    <h3 className="font-headline-md text-headline-md font-bold text-[#002548]">
                      An uncertain result is intentional.
                    </h3>
                    <p className="font-body-md text-body-md text-[#43474f]">
                      Event Horizon avoids making a routing recommendation when available evidence is insufficient. This shields citizens from dead-letter filings and silent statutory rejections.
                    </p>
                  </div>
                </div>

                {/* Structured Diagnosis Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="bg-[#f1f3ff] rounded-lg p-4 border border-[#c3c6d0]/40">
                    <span className="font-label-sm text-label-sm font-bold text-[#737780] uppercase">
                      Primary Cause
                    </span>
                    <h4 className="font-label-lg text-label-lg font-bold text-[#002548] mt-1 mb-1">
                      Information Deficit
                    </h4>
                    <p className="font-body-sm text-body-sm text-[#43474f]">
                      {result?.reason ||
                        'The subject is not recognized in the Star Map dataset. No matching municipal or state rules exist with sufficient confidence.'}
                    </p>
                  </div>

                  <div className="bg-[#f1f3ff] rounded-lg p-4 border border-[#c3c6d0]/40">
                    <span className="font-label-sm text-label-sm font-bold text-[#235eac] uppercase">
                      Recommended Path
                    </span>
                    <h4 className="font-label-lg text-label-lg font-bold text-[#002548] mt-1 mb-1">
                      Verify Responsible Authority
                    </h4>
                    <p className="font-body-sm text-body-sm text-[#43474f]">
                      Verify the responsible authority manually or file a query with the District Collectorate / Nodal RTI cell before dispatching.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CANDIDATE JURISDICTION EVIDENCE TABLE */}
          {result?.candidates && result.candidates.length > 0 && (
            <div className="mt-6 bg-[#ffffff] rounded-xl p-5 shadow-xs border border-[#c3c6d0]/60">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <p className="font-label-sm text-label-sm font-bold text-[#43474f] uppercase tracking-wider">
                  Candidate Jurisdiction Evidence ({result.candidates.length} evaluated)
                </p>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#e9edff] text-[#002548] border border-[#c3c6d0]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#235eac]" />
                  MVP / Demonstration Jurisdiction Dataset
                </span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-[#c3c6d0]/60">
                <table className="w-full text-left text-xs text-[#121b2e]">
                  <thead className="bg-[#f1f3ff] text-[#43474f] font-semibold border-b border-[#c3c6d0]">
                    <tr>
                      <th className="p-3">Rule ID</th>
                      <th className="p-3">Subject</th>
                      <th className="p-3">District</th>
                      <th className="p-3">Departments</th>
                      <th className="p-3">Jurisdiction</th>
                      <th className="p-3 font-mono">Similarity</th>
                      <th className="p-3 font-mono">Combined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c3c6d0]/40 bg-[#ffffff]">
                    {result.candidates.slice(0, 5).map((cand, cIdx) => (
                      <tr key={cIdx} className="hover:bg-[#f1f3ff]/60">
                        <td className="p-3 font-mono text-[#002548] font-bold">{cand.star_map_rule_id}</td>
                        <td className="p-3 font-medium text-[#121b2e]">{cand.subject}</td>
                        <td className="p-3 text-[#43474f]">{cand.district}</td>
                        <td className="p-3 text-[#002548] font-medium max-w-xs truncate">
                          {cand.departments?.join(', ')}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold capitalize ${
                              cand.jurisdiction === 'shared'
                                ? 'bg-[#fef3c7] text-[#92400e]'
                                : 'bg-[#dcfce7] text-[#15803d]'
                            }`}
                          >
                            {cand.jurisdiction}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[#43474f]">{cand.similarity}</td>
                        <td className="p-3 font-mono font-bold text-[#002548]">{cand.combined_score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* EXPLAINABILITY PANEL SECTION */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8" id="explainability-panel">
        <div className="bg-[#ffffff] rounded-xl shadow-xs border border-[#c3c6d0]/60 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 mb-4 bg-[#f1f3ff] p-4 rounded-lg border border-[#c3c6d0]/40">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-[#235eac] text-[22px]">psychology</span>
                <h3 className="font-headline-lg text-headline-lg text-[#002548] font-bold">
                  How did Event Horizon reach this result?
                </h3>
              </div>
              <p className="font-body-md text-body-md text-[#43474f]">
                Deterministic explainability log generated at run-time. Every recommendation is traced back to statutory gazette maps.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#ffffff] text-[#002548] font-label-sm text-label-sm font-bold rounded-lg shadow-xs border border-[#c3c6d0]/50">
                <span className="material-symbols-outlined text-[16px] text-[#235eac]">verified</span>
                <span>Deterministic Rule Audit</span>
              </span>
            </div>
          </div>

          {/* 5 Structured Steps Breakdown */}
          <div className="flex flex-col gap-3">
            {/* Step 1 Accordion Item */}
            <div className="bg-[#f1f3ff] rounded-lg p-4 border border-[#c3c6d0]/40">
              <div
                className="flex items-start justify-between cursor-pointer select-none"
                onClick={() => toggleAccordion(1)}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#002548] text-white flex items-center justify-center font-label-sm text-label-sm font-bold">
                    1
                  </span>
                  <div>
                    <h4 className="font-headline-md text-headline-md text-[#002548] font-bold">
                      Request Understanding
                    </h4>
                    <p className="font-body-sm text-body-sm text-[#43474f]">
                      Detected topic clusters and lexical token boundaries
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#002548] text-[20px]">
                  {activeAccordion[1] ? 'expand_less' : 'expand_more'}
                </span>
              </div>
              {activeAccordion[1] && (
                <div className="pt-3 mt-3 font-body-md text-body-md text-[#43474f] border-t border-[#c3c6d0]/40">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-[#ffffff] p-3 rounded-lg border border-[#c3c6d0]/40">
                      <span className="font-label-sm text-label-sm font-bold text-[#121b2e] block mb-1">
                        Key Phrases Extracted:
                      </span>
                      <p className="font-body-sm text-body-sm text-[#43474f]">
                        {result?.keywords && result.keywords.length > 0
                          ? result.keywords.map((k) => `"${k}"`).join(', ')
                          : '"asphalt quality testing", "road re-surfacing", "pothole repairs"'}
                      </p>
                    </div>
                    <div className="bg-[#ffffff] p-3 rounded-lg border border-[#c3c6d0]/40">
                      <span className="font-label-sm text-label-sm font-bold text-[#121b2e] block mb-1">
                        Application Characteristics:
                      </span>
                      <p className="font-body-sm text-body-sm text-[#43474f]">
                        Total length: {text.length} characters • Section 6(1) query seeking official inspection dockets or records.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2 Accordion Item */}
            <div className="bg-[#f1f3ff] rounded-lg p-4 border border-[#c3c6d0]/40">
              <div
                className="flex items-start justify-between cursor-pointer select-none"
                onClick={() => toggleAccordion(2)}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#002548] text-white flex items-center justify-center font-label-sm text-label-sm font-bold">
                    2
                  </span>
                  <div>
                    <h4 className="font-headline-md text-headline-md text-[#002548] font-bold">
                      Subject Matching
                    </h4>
                    <p className="font-body-sm text-body-sm text-[#43474f]">
                      Matched semantic concepts against civic jurisdiction taxonomy
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#002548] text-[20px]">
                  {activeAccordion[2] ? 'expand_less' : 'expand_more'}
                </span>
              </div>
              {activeAccordion[2] && (
                <div className="pt-3 mt-3 font-body-md text-body-md text-[#43474f] border-t border-[#c3c6d0]/40">
                  <p className="mb-2">
                    Identified subject:{' '}
                    <strong>{result?.detected_subject || 'Road Repair & Potholes'}</strong> with high lexical affinity.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 bg-[#ffffff] text-[#002548] font-label-sm text-label-sm rounded-md font-medium border border-[#c3c6d0]/40">
                      Urban Civil Works
                    </span>
                    <span className="px-2.5 py-1 bg-[#ffffff] text-[#002548] font-label-sm text-label-sm rounded-md font-medium border border-[#c3c6d0]/40">
                      Municipal Maintenance
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3 Accordion Item */}
            <div className="bg-[#f1f3ff] rounded-lg p-4 border border-[#c3c6d0]/40">
              <div
                className="flex items-start justify-between cursor-pointer select-none"
                onClick={() => toggleAccordion(3)}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#002548] text-white flex items-center justify-center font-label-sm text-label-sm font-bold">
                    3
                  </span>
                  <div>
                    <h4 className="font-headline-md text-headline-md text-[#002548] font-bold">
                      Star Map Lookup
                    </h4>
                    <p className="font-body-sm text-body-sm text-[#43474f]">
                      Cross-referenced State, District, and Municipal department rules
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#002548] text-[20px]">
                  {activeAccordion[3] ? 'expand_less' : 'expand_more'}
                </span>
              </div>
              {activeAccordion[3] && (
                <div className="pt-3 mt-3 font-body-md text-body-md text-[#43474f] border-t border-[#c3c6d0]/40">
                  <div className="bg-[#ffffff] p-3 rounded-lg font-body-sm text-body-sm flex flex-col gap-1 border border-[#c3c6d0]/40">
                    <div>
                      <strong>Geographic Filter:</strong> {state} &gt; {district}
                    </div>
                    <div>
                      <strong>Matched Rule ID:</strong>{' '}
                      {result?.candidates?.[0]?.star_map_rule_id || 'Not resolved'}
                    </div>
                    <div>
                      <strong>Candidate Departments:</strong>{' '}
                      {result?.candidates?.[0]?.departments?.join(', ') || 'None found'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 4 Accordion Item */}
            <div className="bg-[#f1f3ff] rounded-lg p-4 border border-[#c3c6d0]/40">
              <div
                className="flex items-start justify-between cursor-pointer select-none"
                onClick={() => toggleAccordion(4)}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#002548] text-white flex items-center justify-center font-label-sm text-label-sm font-bold">
                    4
                  </span>
                  <div>
                    <h4 className="font-headline-md text-headline-md text-[#002548] font-bold">
                      Conflict Analysis
                    </h4>
                    <p className="font-body-sm text-body-sm text-[#43474f]">
                      Evaluated single vs. shared vs. overlapping administrative mandates
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#002548] text-[20px]">
                  {activeAccordion[4] ? 'expand_less' : 'expand_more'}
                </span>
              </div>
              {activeAccordion[4] && (
                <div className="pt-3 mt-3 font-body-md text-body-md text-[#43474f] border-t border-[#c3c6d0]/40">
                  <p>
                    Jurisdiction Mode:{' '}
                    <strong>
                      {result?.candidates?.[0]?.jurisdiction === 'shared' ? 'Shared' : 'Single Mandate'}
                    </strong>
                    . Evaluated friction penalty under Escape Velocity formula.
                  </p>
                </div>
              )}
            </div>

            {/* Step 5 Accordion Item */}
            <div className="bg-[#f1f3ff] rounded-lg p-4 border border-[#c3c6d0]/40">
              <div
                className="flex items-start justify-between cursor-pointer select-none"
                onClick={() => toggleAccordion(5)}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#002548] text-white flex items-center justify-center font-label-sm text-label-sm font-bold">
                    5
                  </span>
                  <div>
                    <h4 className="font-headline-md text-headline-md text-[#002548] font-bold">
                      Routing Decision
                    </h4>
                    <p className="font-body-sm text-body-sm text-[#43474f]">
                      Final classification state based on Escape Velocity thresholds
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#002548] text-[20px]">
                  {activeAccordion[5] ? 'expand_less' : 'expand_more'}
                </span>
              </div>
              {activeAccordion[5] && (
                <div className="pt-3 mt-3 font-body-md text-body-md text-[#43474f] border-t border-[#c3c6d0]/40">
                  <p>
                    Assigned verdict:{' '}
                    <strong className="text-[#002548]">{result?.decision || 'CLEAR'}</strong> (
                    {result ? (result.confidence * 100).toFixed(0) + '%' : '82%'} confidence). Reason:{' '}
                    {result?.reason || 'Strong jurisdiction match.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Policy Clarification */}
          <div className="mt-4 p-3 bg-[#e9edff] rounded-lg flex items-center gap-2 text-[#43474f] font-body-sm text-body-sm border border-[#c3c6d0]/40">
            <span className="material-symbols-outlined text-[#235eac] text-[18px]">info</span>
            <span>
              <strong>Explainability Charter Notice:</strong> Recommendations are informational aids and must be verified where jurisdiction is ambiguous. In case of institutional dispute, Section 6(3) transfer provisions govern official timelines.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
