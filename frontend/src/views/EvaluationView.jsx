import React, { useState, useEffect } from 'react';
import { t } from '../i18n';

async function fetchJson(path) {
  try {
    let res;
    try {
      res = await fetch(path);
    } catch {
      res = await fetch(`http://127.0.0.1:8000${path}`);
    }
    if (res.ok) return res.json();
  } catch (err) {
    console.warn(`Could not fetch ${path}`, err);
  }
  return null;
}

function StatCard({ label, value, caption }) {
  return (
    <div className="bg-[#ffffff] rounded-xl p-4 shadow-xs border border-[#c3c6d0]/60 flex flex-col">
      <span className="font-label-sm text-label-sm text-[#737780] uppercase font-bold tracking-wider">
        {label}
      </span>
      <span className="font-headline-lg text-headline-lg font-bold text-[#002548] mt-1">
        {value}
      </span>
      {caption && (
        <span className="font-body-sm text-body-sm text-[#43474f] mt-0.5">{caption}</span>
      )}
    </div>
  );
}

export default function EvaluationView({ lang = 'EN' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const tt = (key) => t(key, lang);

  useEffect(() => {
    let mounted = true;
    fetchJson('/api/evaluation').then((payload) => {
      if (mounted) {
        setData(payload);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const evalM = data?.evaluation || null;
  const trainM = data?.training || null;
  const pct = (v) => (v == null || v === undefined ? '—' : `${(v * 100).toFixed(1)}%`);

  return (
    <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[#235eac] text-[20px]">science</span>
            <span className="font-label-sm text-label-sm uppercase font-bold text-[#235eac] tracking-wider">
              {tt('eval.subtitle')}
            </span>
          </div>
          <h2 className="font-headline-xl text-headline-xl text-[#002548] font-bold">
            {tt('eval.title')}
          </h2>
          <p className="font-body-sm text-body-sm text-[#43474f] font-mono mt-1">
            {data?.engine_version && `engine ${data.engine_version} • ruleset ${data.ruleset_version}`}
            {evalM?.generated_at && ` • ${tt('eval.generated')}: ${evalM.generated_at}`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-[#ffffff] rounded-xl p-8 border border-[#c3c6d0]/60 text-center text-[#737780]">
          Loading metrics…
        </div>
      ) : !evalM && !trainM ? (
        <div className="bg-[#ffffff] rounded-xl p-8 border border-[#c3c6d0]/60 text-center text-[#43474f] font-body-md text-body-md">
          {tt('eval.notGenerated')}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {evalM && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatCard label={tt('eval.statusAccuracy')} value={pct(evalM.status_accuracy)} caption={`${evalM.cases_total} cases`} />
                <StatCard label={tt('eval.languageAccuracy')} value={pct(evalM.language_detection_accuracy)} />
                <StatCard label={tt('eval.topRuleAccuracy')} value={pct(evalM.top_rule_accuracy)} />
                <StatCard label={tt('eval.departmentAccuracy')} value={pct(evalM.department_accuracy)} caption="CLEAR cases" />
                <StatCard label={tt('eval.generated')} value={evalM.duration_seconds != null ? `${evalM.duration_seconds}s` : '—'} caption={evalM.generated_at} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#ffffff] rounded-xl p-5 shadow-xs border border-[#c3c6d0]/60">
                  <p className="font-label-sm text-label-sm font-bold text-[#43474f] uppercase tracking-wider mb-3">
                    {tt('eval.perLanguage')}
                  </p>
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="text-[#737780] border-b border-[#c3c6d0]/60">
                        <th className="py-1.5 pr-2">Lang</th>
                        <th className="py-1.5 pr-2">Rows</th>
                        <th className="py-1.5 pr-2">{tt('eval.statusAccuracy')}</th>
                        <th className="py-1.5">{tt('eval.languageAccuracy')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(evalM.per_language || {}).map(([code, m]) => (
                        <tr key={code} className="border-b border-[#c3c6d0]/30">
                          <td className="py-1.5 pr-2 font-mono font-bold text-[#002548]">{code}</td>
                          <td className="py-1.5 pr-2">{m.rows}</td>
                          <td className="py-1.5 pr-2">{pct(m.status_accuracy)}</td>
                          <td className="py-1.5">{pct(m.language_accuracy)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-[#ffffff] rounded-xl p-5 shadow-xs border border-[#c3c6d0]/60">
                  <p className="font-label-sm text-label-sm font-bold text-[#43474f] uppercase tracking-wider mb-3">
                    {tt('eval.perCategory')}
                  </p>
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="text-[#737780] border-b border-[#c3c6d0]/60">
                        <th className="py-1.5 pr-2">Category</th>
                        <th className="py-1.5 pr-2">Rows</th>
                        <th className="py-1.5">{tt('eval.statusAccuracy')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(evalM.per_category || {}).map(([cat, m]) => (
                        <tr key={cat} className="border-b border-[#c3c6d0]/30">
                          <td className="py-1.5 pr-2 font-medium text-[#121b2e]">{cat}</td>
                          <td className="py-1.5 pr-2">{m.rows}</td>
                          <td className="py-1.5">{pct(m.status_accuracy)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {evalM.failures && evalM.failures.length > 0 && (
                <div className="bg-[#ffdad6] border border-[#ba1a1a]/40 rounded-xl p-5">
                  <p className="font-label-sm text-label-sm font-bold text-[#93000a] uppercase tracking-wider mb-2">
                    {tt('eval.failures')}
                  </p>
                  <ul className="text-xs text-[#93000a] space-y-1 font-mono">
                    {evalM.failures.map((f) => (
                      <li key={f.id}>
                        {f.id}: expected {f.expected_status}, got {f.predicted_status} ({f.language}/{f.category})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
          {trainM && (
            <div className="bg-[#ffffff] rounded-xl p-5 shadow-xs border border-[#c3c6d0]/60">
              <p className="font-label-sm text-label-sm font-bold text-[#43474f] uppercase tracking-wider mb-3">
                {tt('eval.training')}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label={tt('eval.hitAt1')} value={pct(trainM.hit_at_1)} />
                <StatCard label={tt('eval.hitAt3')} value={pct(trainM.hit_at_3)} />
                <StatCard label={tt('eval.mrr')} value={trainM.mrr != null ? trainM.mrr.toFixed(3) : '—'} />
                <StatCard label={tt('eval.rows')} value={trainM.rows_total ?? '—'} caption={trainM.generated_at} />
              </div>
              <table className="w-full text-xs text-left mt-4">
                <thead>
                  <tr className="text-[#737780] border-b border-[#c3c6d0]/60">
                    <th className="py-1.5 pr-2">Language</th>
                    <th className="py-1.5 pr-2">Rows</th>
                    <th className="py-1.5 pr-2">{tt('eval.hitAt1')}</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(trainM.per_language || {}).map(([lng, m]) => (
                    <tr key={lng} className="border-b border-[#c3c6d0]/30">
                      <td className="py-1.5 pr-2 font-mono font-bold text-[#002548]">{lng}</td>
                      <td className="py-1.5 pr-2">{m.rows}</td>
                      <td className="py-1.5">{pct(m.hit_at_1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

