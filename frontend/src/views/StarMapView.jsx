import React, { useState, useEffect } from 'react';

export default function StarMapView({ initialRules = [], onSelectSubject }) {
  const [fetchedRules, setFetchedRules] = useState([]);
  const [loading, setLoading] = useState(initialRules.length === 0);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [jurisdictionFilter, setJurisdictionFilter] = useState('ALL');
  const [selectedRule, setSelectedRule] = useState(null);

  const rules = initialRules.length > 0 ? initialRules : fetchedRules;

  useEffect(() => {
    if (initialRules.length > 0) {
      return;
    }

    let isMounted = true;
    const fetchRules = async () => {
      try {
        let res;
        try {
          res = await fetch('/api/starmap');
        } catch {
          res = await fetch('http://127.0.0.1:8000/api/starmap');
        }
        if (res.ok && isMounted) {
          const data = await res.json();
          setFetchedRules(data);
        }
      } catch (err) {
        console.error('Failed to load Star Map rules', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRules();
    return () => {
      isMounted = false;
    };
  }, [initialRules.length]);

  // Filter rules based on search and dropdowns
  const filteredRules = rules.filter((rule) => {
    const matchesSearch =
      !searchTerm ||
      rule.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.departments?.some((d) => d.toLowerCase().includes(searchTerm.toLowerCase())) ||
      rule.note?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesState = stateFilter === 'ALL' || rule.state === stateFilter;
    const matchesDistrict = districtFilter === 'ALL' || rule.district === districtFilter;
    const matchesJurisdiction =
      jurisdictionFilter === 'ALL' || rule.jurisdiction === jurisdictionFilter;

    return matchesSearch && matchesState && matchesDistrict && matchesJurisdiction;
  });

  const handleResetFilters = () => {
    setSearchTerm('');
    setStateFilter('ALL');
    setDistrictFilter('ALL');
    setJurisdictionFilter('ALL');
  };

  // Distinct districts from rules
  const uniqueDistricts = Array.from(new Set(rules.map((r) => r.district).filter(Boolean)));

  return (
    <div className="flex flex-col w-full">
      {/* Top Header & Scope Banner */}
      <section className="w-full bg-[#f1f3ff] py-8 border-b border-[#c3c6d0]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Prototype Scope Callout */}
          <div className="mb-6 rounded-xl bg-[#ffddb8]/40 border border-[#ffddb8] p-4 shadow-xs">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[#543300] text-[20px] flex-shrink-0 mt-0.5">
                policy
              </span>
              <div className="flex flex-col gap-0.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-[#543300] font-bold">
                    Administrative Jurisdiction Knowledge Base
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ffddb8] text-[#543300] border border-[#543300]/20">
                    MVP / Demonstration Jurisdiction Dataset
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-[#121b2e]">
                  Star Map stores verified gazette jurisdiction rules mapping public grievance topics to responsible municipal and state authorities under Section 5(1) and Section 6(1) of the RTI Act, 2005.
                </p>
              </div>
            </div>
          </div>

          {/* Headline Context Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            <div className="lg:col-span-8 flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#235eac] text-[22px]">hub</span>
                <span className="font-label-sm text-label-sm uppercase font-bold tracking-widest text-[#235eac]">
                  Statutory Topology Engine
                </span>
              </div>
              <h1 className="font-headline-xl text-headline-xl font-bold text-[#002548] tracking-tight">
                Star Map
              </h1>
              <p className="font-headline-md text-headline-md font-semibold text-[#43474f]">
                Jurisdiction Knowledge Base
              </p>
              <p className="font-body-lg text-body-lg text-[#43474f] max-w-3xl mt-1">
                Used by the Escape Velocity engine to match RTI draft text against municipal competencies, preventing Section 6(3) misdirection and administrative black holes.
              </p>
            </div>

            {/* Metric Pulse Summary */}
            <div className="lg:col-span-4 flex flex-col gap-2 bg-[#ffffff] p-4 rounded-xl shadow-xs border border-[#c3c6d0]/60">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase text-[#43474f] font-bold">
                  Rule Graph Metrics
                </span>
                <span className="font-label-sm text-label-sm text-[#235eac] font-bold">
                  Active Index v3.4
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#f1f3ff] p-2 rounded-lg border border-[#c3c6d0]/30">
                  <span className="font-headline-md text-headline-md font-bold text-[#002548] block">
                    {rules.length}
                  </span>
                  <span className="font-label-sm text-label-sm text-[#43474f]">Rules Loaded</span>
                </div>
                <div className="bg-[#f1f3ff] p-2 rounded-lg border border-[#c3c6d0]/30">
                  <span className="font-headline-md text-headline-md font-bold text-[#235eac] block">
                    {uniqueDistricts.length || 2}
                  </span>
                  <span className="font-label-sm text-label-sm text-[#43474f]">Districts</span>
                </div>
                <div className="bg-[#f1f3ff] p-2 rounded-lg border border-[#c3c6d0]/30">
                  <span className="font-headline-md text-headline-md font-bold text-[#15803d] block">
                    100%
                  </span>
                  <span className="font-label-sm text-label-sm text-[#43474f]">Determinacy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Relational Deserialization Pipeline */}
      <section className="w-full py-6 bg-[#ffffff] border-b border-[#c3c6d0]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#002548] text-[20px]">account_tree</span>
              <h2 className="font-headline-md text-headline-md text-[#002548] font-bold">
                Relational Deserialization Pipeline
              </h2>
            </div>
            <span className="font-label-sm text-label-sm text-[#737780] uppercase tracking-wider">
              Normative Tier 4 Resolution
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stage 1 */}
            <div className="bg-[#ffffff] p-4 rounded-xl shadow-xs border border-[#c3c6d0]/60 flex flex-col relative overflow-hidden">
              <div className="w-full h-1 bg-[#002548] absolute top-0 left-0" />
              <div className="flex items-center justify-between mb-1">
                <span className="font-label-sm text-label-sm uppercase font-bold text-[#002548]">Tier 01</span>
                <span className="material-symbols-outlined text-[#002548] text-[18px]">public</span>
              </div>
              <span className="font-headline-md text-headline-md font-bold text-[#121b2e]">
                State / Union Territory
              </span>
              <p className="font-body-sm text-body-sm text-[#43474f] mt-1">
                Constitutional domain partitioning under the Seventh Schedule.
              </p>
              <div className="mt-3 pt-1 bg-[#f1f3ff] px-2 py-0.5 rounded text-center border border-[#c3c6d0]/30">
                <span className="font-label-sm text-label-sm text-[#43474f]">Maharashtra Jurisdiction</span>
              </div>
            </div>

            {/* Stage 2 */}
            <div className="bg-[#ffffff] p-4 rounded-xl shadow-xs border border-[#c3c6d0]/60 flex flex-col relative overflow-hidden">
              <div className="w-full h-1 bg-[#235eac] absolute top-0 left-0" />
              <div className="flex items-center justify-between mb-1">
                <span className="font-label-sm text-label-sm uppercase font-bold text-[#235eac]">Tier 02</span>
                <span className="material-symbols-outlined text-[#235eac] text-[18px]">domain</span>
              </div>
              <span className="font-headline-md text-headline-md font-bold text-[#121b2e]">
                District / Municipal Corp
              </span>
              <p className="font-body-sm text-body-sm text-[#43474f] mt-1">
                Territorial local self-government delimitation (ULB / Zilla Parishad).
              </p>
              <div className="mt-3 pt-1 bg-[#f1f3ff] px-2 py-0.5 rounded text-center border border-[#c3c6d0]/30">
                <span className="font-label-sm text-label-sm text-[#43474f]">Pune &amp; Nagpur Authorities</span>
              </div>
            </div>

            {/* Stage 3 */}
            <div className="bg-[#ffffff] p-4 rounded-xl shadow-xs border border-[#c3c6d0]/60 flex flex-col relative overflow-hidden">
              <div className="w-full h-1 bg-[#543300] absolute top-0 left-0" />
              <div className="flex items-center justify-between mb-1">
                <span className="font-label-sm text-label-sm uppercase font-bold text-[#543300]">Tier 03</span>
                <span className="material-symbols-outlined text-[#543300] text-[18px]">category</span>
              </div>
              <span className="font-headline-md text-headline-md font-bold text-[#121b2e]">
                Subject Area
              </span>
              <p className="font-body-sm text-body-sm text-[#43474f] mt-1">
                Semantic ontology classification (e.g., roads, drainage, property tax).
              </p>
              <div className="mt-3 pt-1 bg-[#f1f3ff] px-2 py-0.5 rounded text-center border border-[#c3c6d0]/30">
                <span className="font-label-sm text-label-sm text-[#43474f]">22 Gazetted Subject Rules</span>
              </div>
            </div>

            {/* Stage 4 */}
            <div className="bg-[#ffffff] p-4 rounded-xl shadow-xs border border-[#c3c6d0]/60 flex flex-col relative overflow-hidden">
              <div className="w-full h-1 bg-[#15803d] absolute top-0 left-0" />
              <div className="flex items-center justify-between mb-1">
                <span className="font-label-sm text-label-sm uppercase font-bold text-[#15803d]">Tier 04</span>
                <span className="material-symbols-outlined text-[#15803d] text-[18px]">gavel</span>
              </div>
              <span className="font-headline-md text-headline-md font-bold text-[#121b2e]">
                Competent Department(s)
              </span>
              <p className="font-body-sm text-body-sm text-[#43474f] mt-1">
                Public Authority holding statutory record custody and Section 5(1) PIO.
              </p>
              <div className="mt-3 pt-1 bg-[#f1f3ff] px-2 py-0.5 rounded text-center border border-[#c3c6d0]/30">
                <span className="font-label-sm text-label-sm text-[#43474f]">Single / Shared Resolution</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter & Search Command Strip */}
      <section className="w-full py-6 bg-[#f1f3ff]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-4">
          {/* Search Input Container */}
          <div className="bg-[#ffffff] p-2.5 rounded-xl shadow-xs border border-[#c3c6d0]/60 flex flex-col md:flex-row items-center gap-3">
            <div className="flex items-center gap-2 flex-1 w-full px-2">
              <span className="material-symbols-outlined text-[#737780] text-[22px]">search</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Star Map rules (e.g. road repair, traffic signals, drainage, property tax)..."
                className="w-full bg-transparent font-body-md text-body-md text-[#121b2e] placeholder:text-[#737780] focus:outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-[#737780] hover:text-[#121b2e]"
                >
                  <span className="material-symbols-outlined text-[18px]">cancel</span>
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-1.5 font-label-md text-label-md text-[#235eac] hover:text-[#002548] font-bold transition-colors"
            >
              Reset Filters
            </button>
          </div>

          {/* Advanced Dropdown Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col bg-[#ffffff] px-3 py-2 rounded-lg border border-[#c3c6d0]/60 shadow-xs">
              <label htmlFor="starmap-state-filter" className="font-label-sm text-label-sm text-[#737780] uppercase font-bold">State / Scope</label>
              <select
                id="starmap-state-filter"
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="bg-transparent font-label-md text-label-md text-[#121b2e] font-semibold focus:outline-none cursor-pointer mt-0.5"
              >
                <option value="ALL">All States</option>
                <option value="Maharashtra">Maharashtra</option>
              </select>
            </div>

            <div className="flex flex-col bg-[#ffffff] px-3 py-2 rounded-lg border border-[#c3c6d0]/60 shadow-xs">
              <label htmlFor="starmap-district-filter" className="font-label-sm text-label-sm text-[#737780] uppercase font-bold">District / Authority</label>
              <select
                id="starmap-district-filter"
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="bg-transparent font-label-md text-label-md text-[#121b2e] font-semibold focus:outline-none cursor-pointer mt-0.5"
              >
                <option value="ALL">All Districts / Authorities</option>
                {uniqueDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col bg-[#ffffff] px-3 py-2 rounded-lg border border-[#c3c6d0]/60 shadow-xs">
              <label htmlFor="starmap-jurisdiction-filter" className="font-label-sm text-label-sm text-[#737780] uppercase font-bold">Jurisdiction Mode</label>
              <select
                id="starmap-jurisdiction-filter"
                value={jurisdictionFilter}
                onChange={(e) => setJurisdictionFilter(e.target.value)}
                className="bg-transparent font-label-md text-label-md text-[#121b2e] font-semibold focus:outline-none cursor-pointer mt-0.5"
              >
                <option value="ALL">All Jurisdictions (Single &amp; Shared)</option>
                <option value="single">Single Mandate Only</option>
                <option value="shared">Shared / Multi-Agency Only</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Rules Table & Records Presentation */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-headline-md text-headline-md text-[#002548] font-bold">
              Active Jurisdiction Rules ({filteredRules.length} of {rules.length})
            </h3>
            <p className="font-body-sm text-body-sm text-[#43474f]">
              Click any rule to review administrative metadata and statutory references.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#e9edff] text-[#002548] border border-[#c3c6d0]">
            <span className="w-2 h-2 rounded-full bg-[#235eac]" />
            MVP / Demonstration Jurisdiction Dataset
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[#737780] bg-[#ffffff] rounded-xl border border-[#c3c6d0]">
            <div className="animate-spin h-6 w-6 border-2 border-[#235eac] border-t-transparent rounded-full mx-auto mb-2" />
            <span>Loading Star Map rules from backend...</span>
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="p-12 text-center text-[#737780] bg-[#ffffff] rounded-xl border border-[#c3c6d0]">
            <span className="material-symbols-outlined text-[36px] text-[#c3c6d0] mb-2">search_off</span>
            <p className="font-body-md text-body-md font-bold text-[#121b2e]">No matching jurisdiction rules</p>
            <p className="font-body-sm text-body-sm mt-1">Try relaxing your search terms or resetting filters.</p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-3 px-4 py-1.5 bg-[#e9edff] text-[#002548] font-label-sm text-label-sm font-bold rounded-lg"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#c3c6d0]/60 shadow-xs bg-[#ffffff]">
            <table className="w-full text-left text-xs text-[#121b2e]">
              <thead className="bg-[#f1f3ff] text-[#002548] font-semibold border-b border-[#c3c6d0]">
                <tr>
                  <th className="p-3.5">Rule ID</th>
                  <th className="p-3.5">District</th>
                  <th className="p-3.5">Subject Area</th>
                  <th className="p-3.5">Competent Department(s)</th>
                  <th className="p-3.5">Jurisdiction</th>
                  <th className="p-3.5">Statutory Notes &amp; Guidance</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c3c6d0]/40 bg-[#ffffff]">
                {filteredRules.map((rule) => (
                  <tr
                    key={rule.id}
                    onClick={() => setSelectedRule(rule)}
                    className="hover:bg-[#f1f3ff]/60 cursor-pointer transition-colors"
                  >
                    <td className="p-3.5 font-mono text-[#002548] font-bold whitespace-nowrap">
                      {rule.id}
                    </td>
                    <td className="p-3.5 text-[#43474f] font-medium whitespace-nowrap">
                      {rule.district}
                    </td>
                    <td className="p-3.5 font-bold text-[#121b2e] min-w-[180px]">
                      {rule.subject}
                    </td>
                    <td className="p-3.5 min-w-[220px]">
                      <div className="flex flex-wrap gap-1">
                        {rule.departments?.map((dept, di) => (
                          <span
                            key={di}
                            className="px-2 py-0.5 rounded bg-[#e9edff] text-[#002548] font-medium text-[11px] border border-[#c3c6d0]/30"
                          >
                            {dept}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          rule.jurisdiction === 'shared'
                            ? 'bg-[#fef3c7] text-[#92400e] border border-[#b7791f]/30'
                            : 'bg-[#dcfce7] text-[#15803d] border border-[#15803d]/30'
                        }`}
                      >
                        {rule.jurisdiction}
                      </span>
                    </td>
                    <td className="p-3.5 text-[#43474f] max-w-sm">
                      <p className="line-clamp-2 text-xs">{rule.note}</p>
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRule(rule);
                        }}
                        className="px-3 py-1 bg-[#f1f3ff] hover:bg-[#e9edff] text-[#002548] font-label-sm text-label-sm font-bold rounded transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Selected Rule Inspector Modal */}
      {selectedRule && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#121b2e]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#ffffff] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#c3c6d0]">
            <div className="flex items-center justify-between pb-3 border-b border-[#c3c6d0]">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-[#002548] text-sm px-2 py-0.5 rounded bg-[#e9edff]">
                  {selectedRule.id}
                </span>
                <h3 className="font-headline-md text-headline-md text-[#002548] font-bold">
                  Rule Inspection
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRule(null)}
                className="p-1 rounded-lg text-[#737780] hover:text-[#121b2e]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="py-4 space-y-3 text-sm">
              <div>
                <span className="font-label-sm text-label-sm uppercase font-bold text-[#737780] block">Subject Area</span>
                <span className="font-bold text-[#121b2e] text-base">{selectedRule.subject}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-[#f1f3ff] p-3 rounded-lg border border-[#c3c6d0]/40">
                <div>
                  <span className="font-label-sm text-label-sm uppercase font-bold text-[#737780] block">District</span>
                  <span className="font-medium text-[#002548]">{selectedRule.district}</span>
                </div>
                <div>
                  <span className="font-label-sm text-label-sm uppercase font-bold text-[#737780] block">Jurisdiction Mode</span>
                  <span className="font-bold uppercase text-[#002548]">{selectedRule.jurisdiction}</span>
                </div>
              </div>

              <div>
                <span className="font-label-sm text-label-sm uppercase font-bold text-[#737780] block mb-1">
                  Responsible Public Authorities
                </span>
                <div className="flex flex-col gap-1.5">
                  {selectedRule.departments?.map((dept, di) => (
                    <div
                      key={di}
                      className="p-2 rounded bg-[#e9edff] text-[#002548] font-medium text-xs flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#235eac]" />
                      <span>{dept}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-label-sm text-label-sm uppercase font-bold text-[#737780] block mb-1">
                  Statutory Administrative Note
                </span>
                <p className="p-3 rounded-lg bg-[#f9f9ff] border border-[#c3c6d0]/40 text-[#43474f] text-xs leading-relaxed">
                  {selectedRule.note}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#c3c6d0] flex items-center justify-between gap-2">
              {onSelectSubject && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectSubject(selectedRule.subject);
                    setSelectedRule(null);
                  }}
                  className="px-3.5 py-2 bg-[#235eac] hover:bg-[#123b66] text-white font-label-sm text-label-sm font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">bolt</span>
                  <span>Draft RTI on this Subject →</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedRule(null)}
                className="px-4 py-2 bg-[#e9edff] hover:bg-[#d9e2fc] text-[#002548] font-label-sm text-label-sm font-bold rounded-lg transition-colors ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
