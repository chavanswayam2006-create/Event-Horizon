import React, { useState } from 'react';

export default function HowItWorksView({ onNavigate }) {
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    {
      num: 1,
      name: 'Submit',
      tag: 'Phase 01',
      icon: 'upload_file',
      title: 'Draft Intake & Text Normalization',
      lead: 'Citizen submits an RTI draft query in natural language or uploads a scanned application notice.',
      details: [
        'Client-side sanitization redacts personal identifying info (PII) before transmission.',
        'Text normalization strips formatting artifacts while retaining statutory Section citations.',
        'Supports Marathi, Hindi, and English regional script inputs.'
      ],
      citation: 'Section 6(1), RTI Act 2005 (Application in Writing)'
    },
    {
      num: 2,
      name: 'Understand',
      tag: 'Phase 02',
      icon: 'psychology',
      title: 'AI Understanding & Entity Extraction',
      lead: 'Lightweight deterministic NLP extracts key noun phrases, municipal landmarks, and subject intent.',
      details: [
        'TF-IDF tokenization isolates civic terms (e.g., potholes, drainage culverts, tenders).',
        'Subject classifier guesses the closest known public administrative cluster.',
        'Eliminates conversational filler and legal preamble noise.'
      ],
      citation: 'Section 4(1)(b) Proactive Information Classification'
    },
    {
      num: 3,
      name: 'Match',
      tag: 'Phase 03',
      icon: 'hub',
      title: 'Star Map Jurisdiction Lookup',
      lead: 'Cross-references extracted subject signals against official gazetted Rules of Business.',
      details: [
        'Filters by administrative level: State Government vs Urban Local Body (ULB).',
        'Evaluates similarity scores against 22+ local jurisdiction records in milliseconds.',
        'Surfaces relevant candidate rules with specific Public Authority designations.'
      ],
      citation: 'Government Allocation of Business Rules & Gazette Charters'
    },
    {
      num: 4,
      name: 'Evaluate',
      tag: 'Phase 04',
      icon: 'speed',
      title: 'Escape Velocity Confidence Engine',
      lead: 'Applies the linear heuristic formula balancing semantic match, Star Map match, and conflict penalty.',
      details: [
        'Calculates R_conf = (S_embed × 0.40) + (M_star × 0.35) + (J_spec × 0.25) - (C_overlap).',
        'Penalizes inter-agency overlap to prevent false-positive misdirection.',
        'Calibrated with false-negative safety bias to prevent citizen runarounds.'
      ],
      citation: 'Algorithmic Neutrality & Section 4(1)(b) Disclosure'
    },
    {
      num: 5,
      name: 'Decide',
      tag: 'Phase 05',
      icon: 'fact_check',
      title: 'Tri-State Statutory Verdict',
      lead: 'Resolves into one of three strict constitutional outcomes: CLEAR, AMBIGUOUS, or UNKNOWN.',
      details: [
        'CLEAR: High concurrence (≥ 0.75), surfaces single responsible Nodal PIO.',
        'AMBIGUOUS: Shared mandate (0.45 to 0.74), surfaces options and requires Human Review.',
        'UNKNOWN: Insufficient data (< 0.45), refuses to hallucinate and prompts manual verification.'
      ],
      citation: 'Section 6(3) Statutory Transfer Avoidance Charter'
    }
  ];

  return (
    <div className="flex flex-col w-full">
      {/* Top Sovereign Header / Breadcrumbs */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="flex items-center gap-2 text-[#43474f] mb-2 text-xs">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-[#002548] font-bold">
            System Architecture
          </span>
          <span className="text-[#c3c6d0]">/</span>
          <span className="font-label-sm text-label-sm text-[#43474f]">Core Explainable Pipeline</span>
          <span className="text-[#c3c6d0]">/</span>
          <span className="font-label-sm text-label-sm bg-[#d6e3ff] text-[#001b3e] px-2 py-0.5 rounded font-bold">
            Protocol v3.4
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#c3c6d0]/40">
          <div className="max-w-3xl">
            <h1 className="font-headline-xl text-headline-xl text-[#002548] tracking-tight font-bold">
              How Event Horizon Works
            </h1>
            <p className="font-body-lg text-body-lg text-[#43474f] mt-1">
              A 5-step explainable pipeline preventing RTI applications from disappearing into administrative dead ends.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#e9edff] text-[#002548] font-label-sm text-label-sm font-bold border border-[#c3c6d0]/40">
              <span className="w-2 h-2 rounded-full bg-[#235eac]" />
              Deterministic Model Core
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#f1f3ff] text-[#43474f] font-label-sm text-label-sm border border-[#c3c6d0]/40">
              Section 6(1) &amp; 6(3) Compliant
            </span>
          </div>
        </div>
      </section>

      {/* Problem Context: The 'RTI Black Hole' Visual Diagnosis */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-[#ffffff] rounded-xl shadow-xs border border-[#c3c6d0]/60 p-6">
          <div className="flex flex-col lg:flex-row items-stretch gap-6">
            {/* Diagnostic Left Narrative */}
            <div className="lg:w-5/12 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#ffdad6] text-[#93000a] font-label-sm text-label-sm mb-2 border border-[#ba1a1a]/20">
                  <span className="material-symbols-outlined text-[14px]">warning</span>
                  <span>The Statutory Gravity Trap</span>
                </div>
                <h2 className="font-headline-lg text-headline-lg text-[#002548] tracking-tight font-bold mb-2">
                  The 'RTI Black Hole' Phenomenon
                </h2>
                <p className="font-body-md text-body-md text-[#43474f] mb-4 leading-relaxed">
                  Every month, thousands of citizen inquiries enter systemic paralysis. Misdirected applications bounce between public authorities under recursive Section 6(3) transfers, extending statutory 30-day limits into 140+ days of ping-pong before being quietly rejected or abandoned.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-[#f1f3ff] p-4 rounded-lg border border-[#c3c6d0]/40">
                <div>
                  <div className="font-headline-lg text-headline-lg font-bold text-[#ba1a1a]">41.8%</div>
                  <div className="font-label-sm text-label-sm text-[#43474f]">
                    Applications suffer inter-agency Section 6(3) transfer bounces
                  </div>
                </div>
                <div>
                  <div className="font-headline-lg text-headline-lg font-bold text-[#235eac]">&lt; 1.2s</div>
                  <div className="font-label-sm text-label-sm text-[#43474f]">
                    Event Horizon automated routing analysis latency
                  </div>
                </div>
              </div>
            </div>

            {/* Diagnostic Right: Graphic Comparative Trajectory */}
            <div className="lg:w-7/12 bg-[#f1f3ff] p-5 rounded-xl border border-[#c3c6d0]/40 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-[#c3c6d0]/30">
                <span className="font-label-md text-label-md font-bold text-[#121b2e] uppercase tracking-wider">
                  Statutory Pathway Comparison
                </span>
                <span className="font-label-sm text-label-sm text-[#737780]">
                  Deterministic Line vs Recursive Transfers
                </span>
              </div>

              {/* Comparative Flow Diagram SVG */}
              <div className="w-full py-2">
                <svg className="w-full h-44" fill="none" viewBox="0 0 680 180" xmlns="http://www.w3.org/2000/svg">
                  <line x1="20" y1="40" x2="660" y2="40" stroke="#c3c6d0" strokeDasharray="2 4" opacity="0.5" />
                  <line x1="20" y1="90" x2="660" y2="90" stroke="#c3c6d0" strokeDasharray="2 4" opacity="0.5" />
                  <line x1="20" y1="140" x2="660" y2="140" stroke="#c3c6d0" strokeDasharray="2 4" opacity="0.5" />

                  {/* Legacy Bouncing Red Path */}
                  <path
                    d="M 40 140 C 130 140, 150 90, 220 90 C 280 90, 260 160, 350 160 C 440 160, 420 80, 500 80 C 560 80, 540 145, 600 145"
                    fill="none"
                    stroke="#ba1a1a"
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                    strokeLinecap="round"
                  />

                  {/* Event Horizon Direct Path */}
                  <path d="M 40 40 L 630 40" stroke="#123b66" strokeWidth="3" strokeLinecap="round" />

                  {/* Legacy Nodes */}
                  <circle cx="40" cy="140" r="5" fill="#ba1a1a" />
                  <circle cx="220" cy="90" r="4" fill="#ba1a1a" />
                  <circle cx="350" cy="160" r="4" fill="#ba1a1a" />
                  <circle cx="500" cy="80" r="4" fill="#ba1a1a" />
                  <circle cx="600" cy="145" r="7" fill="#ba1a1a" />
                  <text x="615" y="149" fill="#ba1a1a" fontSize="11" fontWeight="700">
                    DEAD END (Avg 142 Days)
                  </text>

                  {/* Horizon Nodes */}
                  <circle cx="40" cy="40" r="6" fill="#123b66" />
                  <circle cx="180" cy="40" r="4" fill="#235eac" />
                  <circle cx="330" cy="40" r="4" fill="#235eac" />
                  <circle cx="480" cy="40" r="4" fill="#235eac" />
                  <circle cx="630" cy="40" r="7" fill="#15803d" />
                  <text x="635" y="24" fill="#15803d" fontSize="11" fontWeight="700" textAnchor="end">
                    VALIDATED DISPATCH (Direct to Nodal PIO)
                  </text>

                  {/* Node Markers */}
                  <text x="40" y="24" fill="#121b2e" fontSize="10" fontWeight="600">INTAKE</text>
                  <text x="200" y="115" fill="#737780" fontSize="9">Dept A Rejection</text>
                  <text x="330" y="145" fill="#737780" fontSize="9">Sec 6(3) Bounce</text>
                  <text x="480" y="65" fill="#737780" fontSize="9">Zonal Stall</text>
                </svg>
              </div>

              <div className="flex items-center justify-between text-[#43474f] font-body-sm text-body-sm pt-2 border-t border-[#c3c6d0]/30">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a]" />
                  <span>Traditional Bouncing Loop</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#123b66]" />
                  <span>Event Horizon Deterministic Line</span>
                </span>
                <span className="text-[#235eac] font-label-sm text-label-sm font-bold">
                  Zero Black-Box
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5-Phase Statutory Translation Pipeline */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="mb-6">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="material-symbols-outlined text-[#235eac] text-[20px]">account_tree</span>
            <span className="font-label-md text-label-md uppercase tracking-wider text-[#235eac] font-bold">
              Citizen &amp; Officer Workflow
            </span>
          </div>
          <h2 className="font-headline-lg text-headline-lg text-[#002548] tracking-tight font-bold">
            The Five-Phase Statutory Translation Pipeline
          </h2>
          <p className="font-body-md text-body-md text-[#43474f]">
            Each inquiry traverses our transparent, explainable pipeline in seconds with zero opaque transformations.
          </p>
        </div>

        {/* Step Track Ribbon */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
          {steps.map((st) => {
            const isSelected = activeStep === st.num;
            return (
              <button
                key={st.num}
                type="button"
                onClick={() => setActiveStep(st.num)}
                className={`p-3.5 rounded-xl text-left transition-all flex flex-col justify-between h-28 border relative overflow-hidden ${
                  isSelected
                    ? 'bg-[#002548] text-white border-[#002548] shadow-sm'
                    : 'bg-[#ffffff] text-[#121b2e] border-[#c3c6d0]/60 hover:bg-[#f1f3ff]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-label-sm text-label-sm tracking-wider uppercase font-bold ${
                      isSelected ? 'text-[#ffddb8]' : 'text-[#235eac]'
                    }`}
                  >
                    {st.tag}
                  </span>
                  <span
                    className={`material-symbols-outlined text-[18px] ${
                      isSelected ? 'text-[#ffddb8]' : 'text-[#737780]'
                    }`}
                  >
                    {st.icon}
                  </span>
                </div>
                <div>
                  <div className="font-headline-md text-headline-md font-bold leading-tight">
                    {st.name}
                  </div>
                  <div
                    className={`font-body-sm text-body-sm truncate ${
                      isSelected ? 'text-white/80' : 'text-[#43474f]'
                    }`}
                  >
                    {st.title}
                  </div>
                </div>
                {isSelected && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#ffddb8]" />}
              </button>
            );
          })}
        </div>

        {/* Active Step Detailed Card Presentation */}
        {steps
          .filter((st) => st.num === activeStep)
          .map((st) => (
            <div
              key={st.num}
              className="bg-[#ffffff] rounded-xl p-6 shadow-xs border border-[#c3c6d0]/60 flex flex-col gap-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#c3c6d0]/40">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-[#123b66] text-white flex items-center justify-center font-bold text-base">
                    0{st.num}
                  </span>
                  <div>
                    <span className="font-label-sm text-label-sm uppercase font-bold text-[#235eac]">
                      {st.tag} Detailed Breakdown
                    </span>
                    <h3 className="font-headline-lg text-headline-lg text-[#002548] font-bold">
                      {st.title}
                    </h3>
                  </div>
                </div>

                <div className="px-3 py-1 rounded bg-[#f1f3ff] text-[#002548] font-label-sm text-label-sm border border-[#c3c6d0]/40 w-fit">
                  Statutory Nexus: <strong>{st.citation}</strong>
                </div>
              </div>

              <p className="font-body-lg text-body-lg text-[#121b2e] leading-relaxed">
                {st.lead}
              </p>

              <div className="bg-[#f1f3ff] p-4 rounded-xl border border-[#c3c6d0]/40">
                <span className="font-label-sm text-label-sm font-bold uppercase text-[#002548] block mb-2">
                  Key Pipeline Operational Safeguards:
                </span>
                <ul className="space-y-2">
                  {st.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-[#43474f]">
                      <span className="material-symbols-outlined text-[#15803d] text-[18px] flex-shrink-0 mt-0.5">
                        check_circle
                      </span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={activeStep === 1}
                    onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
                    className="px-3 py-1.5 rounded-lg border border-[#c3c6d0] text-[#43474f] hover:text-[#002548] disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold"
                  >
                    ← Previous Phase
                  </button>
                  <button
                    type="button"
                    disabled={activeStep === 5}
                    onClick={() => setActiveStep((prev) => Math.min(5, prev + 1))}
                    className="px-3 py-1.5 rounded-lg border border-[#c3c6d0] text-[#43474f] hover:text-[#002548] disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold"
                  >
                    Next Phase →
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('home-analyzer')}
                  className="px-5 py-2 bg-[#123b66] hover:bg-[#002548] text-white font-label-md text-label-md font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">bolt</span>
                  <span>Try It in the Analyzer</span>
                </button>
              </div>
            </div>
          ))}
      </section>
    </div>
  );
}
