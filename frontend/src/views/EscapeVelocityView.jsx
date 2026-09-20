import React, { useState } from 'react';

export default function EscapeVelocityView() {
  // Simulator state parameters
  const [sEmbed, setSEmbed] = useState(0.82);
  const [mStar, setMStar] = useState(0.78);
  const [jSpec, setJSpec] = useState(0.90);
  const [cOverlap, setCOverlap] = useState(0.05);

  // Compute confidence: R_conf = (sEmbed * 0.40) + (mStar * 0.35) + (jSpec * 0.25) - cOverlap
  const rawScore = sEmbed * 0.40 + mStar * 0.35 + jSpec * 0.25 - cOverlap;
  const confidence = Math.min(1.0, Math.max(0.0, rawScore));

  // Determine state
  let simState = 'CLEAR';
  let simStateDesc = 'Direct statutory routing recommended. High evidence threshold reached.';
  let badgeColor = 'bg-[#dcfce7] text-[#15803d] border-[#15803d]/30';
  let progressColor = 'bg-[#15803d]';

  if (confidence < 0.45) {
    simState = 'UNKNOWN';
    simStateDesc = 'Evidence insufficient. Routing suppressed to prevent misdirection.';
    badgeColor = 'bg-[#d6e3ff] text-[#235eac] border-[#235eac]/30';
    progressColor = 'bg-[#235eac]';
  } else if (confidence < 0.75) {
    simState = 'AMBIGUOUS';
    simStateDesc = 'Multi-agency overlap detected. Human review recommended before filing.';
    badgeColor = 'bg-[#fef3c7] text-[#92400e] border-[#b7791f]/30';
    progressColor = 'bg-[#b7791f]';
  }

  const handleReset = () => {
    setSEmbed(0.82);
    setMStar(0.78);
    setJSpec(0.90);
    setCOverlap(0.05);
  };

  return (
    <div className="flex flex-col w-full">
      {/* Top Statutory Context Bar */}
      <div className="w-full bg-[#e1e8ff] text-[#121b2e] py-1.5 px-4 sm:px-6 lg:px-8 border-b border-[#c3c6d0]/40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 font-label-sm text-label-sm text-[#43474f]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#235eac]" />
            <span className="font-bold tracking-wider uppercase">
              Algorithmic Explainability &amp; Statutory Neutrality Audit
            </span>
            <span className="text-[#c3c6d0]">/</span>
            <span>Version 3.4-alpha (2026 Release)</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-[#235eac]">
              <span className="material-symbols-outlined text-[15px]">verified_user</span>
              <span>Section 4(1)(b) Disclosure</span>
            </span>
            <span className="text-[#c3c6d0]">|</span>
            <span className="text-[#002548] font-bold">Zero Black-Box Protocol</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8">
        {/* Hero / Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#e9edff] rounded-lg font-label-sm text-label-sm text-[#002548] mb-2 shadow-xs">
              <span className="material-symbols-outlined text-[16px] text-[#235eac]">tune</span>
              <span className="font-bold uppercase tracking-wider">Heuristic Routing Engine</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-[#002548] font-bold tracking-tight">
              Escape Velocity Engine
            </h1>
            <p className="font-headline-md text-headline-md text-[#235eac] font-semibold mt-1">
              Decision logic for confidence-aware RTI routing.
            </p>
            <p className="font-body-lg text-body-lg text-[#43474f] mt-2 leading-relaxed">
              How Event Horizon calculates routing confidence, detects institutional overlap, and enforces transparent human-review thresholds before statutory transmission under the RTI Act, 2005.
            </p>
          </div>

          {/* Quick Metrics Pill */}
          <div className="bg-[#ffffff] p-4 rounded-xl shadow-xs border border-[#c3c6d0]/60 flex items-center gap-6">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-[#43474f] uppercase font-bold">
                Fallback Bias
              </span>
              <span className="font-headline-md text-headline-md text-[#002548] font-bold">
                False-Negative Safe
              </span>
            </div>
            <div className="w-px h-8 bg-[#c3c6d0]/60" />
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-[#43474f] uppercase font-bold">
                Deterministic Model
              </span>
              <span className="font-headline-md text-headline-md text-[#002548] font-bold">
                Explicit Linear Heuristic
              </span>
            </div>
          </div>
        </div>

        {/* The Formula & Mathematical Breakdown Card */}
        <div className="w-full bg-[#ffffff] rounded-xl p-6 shadow-xs border border-[#c3c6d0]/60 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-6 bg-[#f1f3ff] p-4 rounded-lg border border-[#c3c6d0]/40">
            <div>
              <span className="font-label-sm text-label-sm text-[#235eac] uppercase font-bold tracking-wider">
                Formal Algorithmic Expression
              </span>
              <h2 className="font-headline-md text-headline-md text-[#002548] mt-0.5 font-bold">
                Confidence Resolution Formula
              </h2>
            </div>
            <div className="mt-2 md:mt-0 inline-flex items-center gap-1.5 px-3 py-1 bg-[#ffffff] text-[#121b2e] font-label-sm text-label-sm font-bold rounded-lg border border-[#c3c6d0]/60">
              <span className="material-symbols-outlined text-[14px] text-[#235eac]">functions</span>
              <span>Bounded Interval: [0.00, 1.00]</span>
            </div>
          </div>

          {/* Formula Equation Block */}
          <div className="bg-[#002548] text-white rounded-xl p-6 mb-6 shadow-inner overflow-x-auto">
            <div className="min-w-[620px] flex items-center justify-center font-headline-md text-headline-md tracking-wide py-1 text-center select-all">
              <span className="text-[#ffddb8] font-bold">R</span>
              <sub className="text-xs text-[#ffddb8]/80 mr-2">conf</sub>
              <span className="text-white/60 mx-2">=</span>
              <span className="text-white font-semibold">( S</span>
              <sub className="text-xs text-white/80">embed</sub>
              <span className="text-[#d6e3ff] mx-1">× 0.40</span>
              <span className="text-white">)</span>
              <span className="text-white/60 mx-2">+</span>
              <span className="text-white font-semibold">( M</span>
              <sub className="text-xs text-white/80">star</sub>
              <span className="text-[#d6e3ff] mx-1">× 0.35</span>
              <span className="text-white">)</span>
              <span className="text-white/60 mx-2">+</span>
              <span className="text-white font-semibold">( J</span>
              <sub className="text-xs text-white/80">spec</sub>
              <span className="text-[#d6e3ff] mx-1">× 0.25</span>
              <span className="text-white">)</span>
              <span className="text-[#ffdad6] mx-2 font-bold">−</span>
              <span className="text-[#ffdad6] font-semibold">( C</span>
              <sub className="text-xs text-[#ffdad6]/80">overlap</sub>
              <span className="text-[#ffdad6] font-semibold">)</span>
            </div>
          </div>

          {/* 4 Core Heuristic Components (Bento Style Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Component 1 */}
            <div className="bg-[#f1f3ff] rounded-lg p-4 flex flex-col justify-between border border-[#c3c6d0]/40 hover:bg-[#e9edff] transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-8 h-8 rounded bg-[#123b66] text-white flex items-center justify-center font-bold text-xs">
                    01
                  </span>
                  <span className="font-label-md text-label-md font-bold text-[#235eac]">Weight: 40%</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-[#002548] font-bold">
                  Semantic Similarity
                </h3>
                <span className="font-label-sm text-label-sm text-[#737780] font-semibold">
                  S_embed Vector Kernel
                </span>
                <p className="font-body-sm text-body-sm text-[#43474f] mt-2 leading-relaxed">
                  High-dimensional embedding alignment against verified historical RTI dockets, Central Information Commission (CIC) orders, and subject classifications.
                </p>
              </div>
              <div className="mt-3 pt-1 bg-white/70 rounded px-2 py-1 border border-[#c3c6d0]/30">
                <span className="font-label-sm text-label-sm text-[#121b2e] font-semibold">
                  Key Metric: TF-IDF / Cosine Similarity
                </span>
              </div>
            </div>

            {/* Component 2 */}
            <div className="bg-[#f1f3ff] rounded-lg p-4 flex flex-col justify-between border border-[#c3c6d0]/40 hover:bg-[#e9edff] transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-8 h-8 rounded bg-[#123b66] text-white flex items-center justify-center font-bold text-xs">
                    02
                  </span>
                  <span className="font-label-md text-label-md font-bold text-[#235eac]">Weight: 35%</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-[#002548] font-bold">
                  Star Map Subject Match
                </h3>
                <span className="font-label-sm text-label-sm text-[#737780] font-semibold">
                  M_star Deterministic Graph
                </span>
                <p className="font-body-sm text-body-sm text-[#43474f] mt-2 leading-relaxed">
                  Direct ontological match against the Government Allocation of Business (AoB) Rules 1961 and statutory department transaction schedules.
                </p>
              </div>
              <div className="mt-3 pt-1 bg-white/70 rounded px-2 py-1 border border-[#c3c6d0]/30">
                <span className="font-label-sm text-label-sm text-[#121b2e] font-semibold">
                  Key Metric: Allocation of Business
                </span>
              </div>
            </div>

            {/* Component 3 */}
            <div className="bg-[#f1f3ff] rounded-lg p-4 flex flex-col justify-between border border-[#c3c6d0]/40 hover:bg-[#e9edff] transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-8 h-8 rounded bg-[#123b66] text-white flex items-center justify-center font-bold text-xs">
                    03
                  </span>
                  <span className="font-label-md text-label-md font-bold text-[#235eac]">Weight: 25%</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-[#002548] font-bold">
                  Jurisdiction Specificity
                </h3>
                <span className="font-label-sm text-label-sm text-[#737780] font-semibold">
                  J_spec Spatial Matrix
                </span>
                <p className="font-body-sm text-body-sm text-[#43474f] mt-2 leading-relaxed">
                  Administrative tier calibration identifying Union, State, District Collectorate, Municipal Corporation, or Local Gram Panchayat competency.
                </p>
              </div>
              <div className="mt-3 pt-1 bg-white/70 rounded px-2 py-1 border border-[#c3c6d0]/30">
                <span className="font-label-sm text-label-sm text-[#121b2e] font-semibold">
                  Key Metric: Administrative Tier
                </span>
              </div>
            </div>

            {/* Component 4 */}
            <div className="bg-[#f1f3ff] rounded-lg p-4 flex flex-col justify-between border border-[#c3c6d0]/40 hover:bg-[#e9edff] transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-8 h-8 rounded bg-[#ba1a1a] text-white flex items-center justify-center font-bold text-xs">
                    04
                  </span>
                  <span className="font-label-md text-label-md font-bold text-[#ba1a1a]">Dynamic Penalty</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-[#002548] font-bold">
                  Conflict Signals
                </h3>
                <span className="font-label-sm text-label-sm text-[#737780] font-semibold">
                  C_overlap Friction Factor
                </span>
                <p className="font-body-sm text-body-sm text-[#43474f] mt-2 leading-relaxed">
                  Direct subtraction applied when multiple public authorities claim co-mandate or cross-functional overlap, triggering mandatory Section 6(3) caution.
                </p>
              </div>
              <div className="mt-3 pt-1 bg-[#ffdad6]/60 rounded px-2 py-1 border border-[#ba1a1a]/20">
                <span className="font-label-sm text-label-sm text-[#93000a] font-semibold">
                  Key Metric: Inter-Agency Conflict
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Decision Thresholds & Confidence Architecture */}
        <div className="mb-8">
          <div className="mb-4">
            <span className="font-label-sm text-label-sm text-[#235eac] uppercase font-bold tracking-wider">
              Statutory Tri-State Architecture
            </span>
            <h2 className="font-headline-lg text-headline-lg text-[#002548] font-bold">
              Decision Thresholds
            </h2>
            <p className="font-body-md text-body-md text-[#43474f]">
              The system resolves calculated confidence into three deterministic postures.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* State A: CLEAR */}
            <div className="bg-[#ffffff] rounded-xl p-5 shadow-xs border border-[#c3c6d0]/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded font-label-sm text-label-sm font-bold bg-[#dcfce7] text-[#15803d]">
                    STATE A
                  </span>
                  <span className="font-label-sm text-label-sm font-bold text-[#43474f]">
                    Conf ≥ 0.75
                  </span>
                </div>
                <div className="flex items-center gap-2 my-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#15803d]" />
                  <h3 className="font-headline-md text-headline-md text-[#002548] font-bold">CLEAR</h3>
                </div>
                <div className="w-full bg-[#f1f3ff] rounded-full h-2.5 mb-2 overflow-hidden flex border border-[#c3c6d0]/30">
                  <div className="h-full bg-[#15803d] w-full" />
                </div>
                <div className="flex justify-between font-label-sm text-label-sm text-[#43474f] mb-3">
                  <span>0.75 Cutoff</span>
                  <span className="font-bold text-[#15803d]">Target: 1.00</span>
                </div>
                <div className="space-y-2 text-xs text-[#43474f]">
                  <p>
                    <strong className="text-[#121b2e]">Autonomous Single PIO Match:</strong> Designates the exact Public Authority with full statutory dockets.
                  </p>
                  <p>
                    <strong className="text-[#121b2e]">Evidentiary Citations:</strong> Displays subject gazette notifications confirming jurisdiction.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-2 bg-[#f1f3ff] p-2.5 rounded text-xs border border-[#c3c6d0]/30">
                <span className="text-[#737780] block uppercase font-bold text-[10px]">Dispatch Workflow</span>
                <span className="text-[#002548] font-semibold">Immediate PDF Generation &amp; Direct Dispatch</span>
              </div>
            </div>

            {/* State B: AMBIGUOUS */}
            <div className="bg-[#ffffff] rounded-xl p-5 shadow-xs border border-[#c3c6d0]/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded font-label-sm text-label-sm font-bold bg-[#fef3c7] text-[#92400e]">
                    STATE B
                  </span>
                  <span className="font-label-sm text-label-sm font-bold text-[#43474f]">
                    0.45 ≤ Conf &lt; 0.75
                  </span>
                </div>
                <div className="flex items-center gap-2 my-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#b7791f]" />
                  <h3 className="font-headline-md text-headline-md text-[#002548] font-bold">AMBIGUOUS</h3>
                </div>
                <div className="w-full bg-[#f1f3ff] rounded-full h-2.5 mb-2 overflow-hidden flex border border-[#c3c6d0]/30">
                  <div className="h-full bg-[#b7791f] w-[65%]" />
                </div>
                <div className="flex justify-between font-label-sm text-label-sm text-[#43474f] mb-3">
                  <span>0.45 Lower</span>
                  <span className="font-bold text-[#b7791f]">0.74 Boundary</span>
                </div>
                <div className="space-y-2 text-xs text-[#43474f]">
                  <p>
                    <strong className="text-[#121b2e]">Split Mandate Presentation:</strong> Surfaces candidate public authorities side-by-side with zero automated bias.
                  </p>
                  <p>
                    <strong className="text-[#121b2e]">Sec 6(3) Transfer Clause:</strong> Equips application with statutory transfer caveat for receiving PIOs.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-2 bg-[#f1f3ff] p-2.5 rounded text-xs border border-[#c3c6d0]/30">
                <span className="text-[#737780] block uppercase font-bold text-[10px]">Dispatch Workflow</span>
                <span className="text-[#002548] font-semibold">Citizen Selection Required or Multi-Filing</span>
              </div>
            </div>

            {/* State C: UNKNOWN */}
            <div className="bg-[#ffffff] rounded-xl p-5 shadow-xs border border-[#c3c6d0]/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded font-label-sm text-label-sm font-bold bg-[#e9edff] text-[#235eac]">
                    STATE C
                  </span>
                  <span className="font-label-sm text-label-sm font-bold text-[#43474f]">
                    Conf &lt; 0.45
                  </span>
                </div>
                <div className="flex items-center gap-2 my-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#737780]" />
                  <h3 className="font-headline-md text-headline-md text-[#002548] font-bold">UNKNOWN</h3>
                </div>
                <div className="w-full bg-[#f1f3ff] rounded-full h-2.5 mb-2 overflow-hidden flex border border-[#c3c6d0]/30">
                  <div className="h-full bg-[#737780] w-[30%]" />
                </div>
                <div className="flex justify-between font-label-sm text-label-sm text-[#43474f] mb-3">
                  <span>0.00 Floor</span>
                  <span className="font-bold text-[#737780]">0.44 Sub-Critical</span>
                </div>
                <div className="space-y-2 text-xs text-[#43474f]">
                  <p>
                    <strong className="text-[#121b2e]">Automated Rejection of Guesswork:</strong> Halts speculative filing to prevent applicant misdirection.
                  </p>
                  <p>
                    <strong className="text-[#121b2e]">Verification Guidance:</strong> Prompts applicant to clarify district jurisdiction or attach tender info.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-2 bg-[#f1f3ff] p-2.5 rounded text-xs border border-[#c3c6d0]/30">
                <span className="text-[#737780] block uppercase font-bold text-[10px]">Dispatch Workflow</span>
                <span className="text-[#ba1a1a] font-semibold">Routing Suppressed • Manual Verification Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Essential Statutory Disclaimer Box */}
        <div className="w-full bg-[#ffffff] rounded-xl p-6 shadow-xs border border-[#c3c6d0]/60 mb-8 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#e9edff] text-[#002548] flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[28px]">shield_with_heart</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-[#235eac]">
                  Statutory Policy &amp; Fail-Safe Charter
                </span>
              </div>
              <p className="font-headline-md text-headline-md text-[#002548] font-semibold mb-2">
                “These thresholds are configurable MVP heuristics and are not scientifically validated probabilities. The system is designed to prefer ‘Unknown’ or ‘Ambiguous’ over a false-positive misdirection, preventing citizens from getting trapped in bureaucratic RTI black holes.”
              </p>
              <p className="font-body-sm text-body-sm text-[#43474f] leading-relaxed">
                In democratic information retrieval, a false routing confirmation wastes the statutory 30-day decision period guaranteed under Section 7(1) of the RTI Act. When misrouted to an unrelated authority, applicants routinely face statutory abandonment or erroneous rejection. Event Horizon deliberately penalizes ambiguity to guarantee that routing occurs strictly upon defensible administrative nexus.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Test Sandbox Simulator */}
        <div className="w-full bg-[#ffffff] rounded-xl p-6 shadow-sm border border-[#c3c6d0]/60 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-6 bg-[#f1f3ff] p-4 rounded-lg border border-[#c3c6d0]/40">
            <div>
              <span className="font-label-sm text-label-sm text-[#235eac] uppercase font-bold tracking-wider">
                Algorithmic Sandbox
              </span>
              <h2 className="font-headline-md text-headline-md text-[#002548] mt-0.5 font-bold">
                Interactive Decision Simulator
              </h2>
              <p className="font-body-sm text-body-sm text-[#43474f]">
                Adjust parameters in real time to observe the heuristic state transitions.
              </p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="mt-2 md:mt-0 px-3 py-1.5 bg-[#ffffff] hover:bg-[#e9edff] text-[#002548] font-label-sm text-label-sm font-bold rounded-lg border border-[#c3c6d0]/60 transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              <span>Reset Defaults</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Controls (Left 7 Cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {/* Slider 1: Semantic Embeddings */}
              <div className="bg-[#f1f3ff] p-4 rounded-lg border border-[#c3c6d0]/40">
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="semantic-slider" className="font-label-md text-label-md text-[#002548] font-bold">
                    Semantic Embedding Alignment (S_embed)
                  </label>
                  <span className="font-label-md text-label-md font-bold text-[#235eac]">
                    {sEmbed.toFixed(2)}
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-[#43474f] mb-2">
                  Closeness of citizen query language to past RTI dockets (Weight: 40%).
                </p>
                <input
                  id="semantic-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={sEmbed}
                  onChange={(e) => setSEmbed(parseFloat(e.target.value))}
                  className="w-full accent-[#002548] h-2 bg-[#d9e2fc] rounded-lg cursor-pointer"
                />
              </div>

              {/* Slider 2: Subject Match */}
              <div className="bg-[#f1f3ff] p-4 rounded-lg border border-[#c3c6d0]/40">
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="subject-slider" className="font-label-md text-label-md text-[#002548] font-bold">
                    Subject &amp; Statutory Match (M_star)
                  </label>
                  <span className="font-label-md text-label-md font-bold text-[#235eac]">
                    {mStar.toFixed(2)}
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-[#43474f] mb-2">
                  Literal match with statutory allocation of business schedules (Weight: 35%).
                </p>
                <input
                  id="subject-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={mStar}
                  onChange={(e) => setMStar(parseFloat(e.target.value))}
                  className="w-full accent-[#002548] h-2 bg-[#d9e2fc] rounded-lg cursor-pointer"
                />
              </div>

              {/* Slider 3: Jurisdiction Specificity */}
              <div className="bg-[#f1f3ff] p-4 rounded-lg border border-[#c3c6d0]/40">
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="jurisdiction-slider" className="font-label-md text-label-md text-[#002548] font-bold">
                    Jurisdiction Specificity (J_spec)
                  </label>
                  <span className="font-label-md text-label-md font-bold text-[#235eac]">
                    {jSpec.toFixed(2)}
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-[#43474f] mb-2">
                  Precision of administrative tier (Union vs State vs Municipal) (Weight: 25%).
                </p>
                <input
                  id="jurisdiction-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={jSpec}
                  onChange={(e) => setJSpec(parseFloat(e.target.value))}
                  className="w-full accent-[#002548] h-2 bg-[#d9e2fc] rounded-lg cursor-pointer"
                />
              </div>

              {/* Slider 4: Conflict Penalty */}
              <div className="bg-[#f1f3ff] p-4 rounded-lg border border-[#c3c6d0]/40">
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="conflict-slider" className="font-label-md text-label-md text-[#ba1a1a] font-bold">
                    Inter-Agency Mandate Conflict Penalty (C_overlap)
                  </label>
                  <span className="font-label-md text-label-md font-bold text-[#ba1a1a]">
                    {cOverlap.toFixed(2)}
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-[#43474f] mb-2">
                  Direct confidence deduction caused by overlapping public mandates.
                </p>
                <input
                  id="conflict-slider"
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.01"
                  value={cOverlap}
                  onChange={(e) => setCOverlap(parseFloat(e.target.value))}
                  className="w-full accent-[#ba1a1a] h-2 bg-[#ffdad6] rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Real-Time Output Cockpit (Right 5 Cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-[#f1f3ff] p-6 rounded-xl border border-[#c3c6d0]/60 h-full">
              <div>
                <span className="font-label-sm text-label-sm text-[#43474f] uppercase font-bold tracking-wider">
                  Simulated Decision Output
                </span>

                {/* Result Gauge */}
                <div className="mt-3 bg-[#ffffff] p-4 rounded-lg shadow-xs border border-[#c3c6d0]/40">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="font-body-sm text-body-sm text-[#43474f] font-medium">
                      Computed Confidence (R_conf)
                    </span>
                    <span className="font-headline-xl text-headline-xl text-[#002548] font-bold">
                      {confidence.toFixed(2)}
                    </span>
                  </div>

                  <div className="w-full bg-[#e9edff] h-3.5 rounded-full overflow-hidden flex mb-2 border border-[#c3c6d0]/30">
                    <div
                      className={`${progressColor} h-full transition-all duration-200`}
                      style={{ width: `${(confidence * 100).toFixed(0)}%` }}
                    />
                  </div>

                  <div className="flex justify-between font-label-sm text-label-sm text-[#737780]">
                    <span>0.00 (Unknown)</span>
                    <span>0.45 (Ambiguous)</span>
                    <span>0.75 (Clear)</span>
                    <span>1.00</span>
                  </div>
                </div>

                {/* Resulting Decision State Card */}
                <div className="mt-4 p-4 rounded-lg bg-[#ffffff] border border-[#c3c6d0]/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#737780] uppercase font-bold">Resolved Verdict</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-bold border ${badgeColor}`}>
                      ● {simState}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-[#43474f]">{simStateDesc}</p>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-[#c3c6d0]/40 text-xs text-[#737780]">
                Interactive evaluation sandbox for algorithmic transparency audits under Section 4(1)(b).
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
