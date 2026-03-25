import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Calendar, ShieldCheck, AlertTriangle, FileCheck, ListChecks, ExternalLink, AlertOctagon } from 'lucide-react';

const SEVERITY_STYLES = {
  HIGH:   { bg: 'bg-rose-500/15',  text: 'text-rose-400',  border: 'border-rose-500/30'  },
  MEDIUM: { bg: 'bg-amber-500/12', text: 'text-amber-400', border: 'border-amber-500/30' },
  LOW:    { bg: 'bg-zinc-500/15',  text: 'text-zinc-400',  border: 'border-zinc-600/40'  },
};

function SeverityBadge({ severity }) {
  const s = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.LOW;
  return (
    <span className={`inline-block text-[9px] font-bold uppercase tracking-[0.14em] px-1.5 py-0.5 rounded border ${s.bg} ${s.text} ${s.border} shrink-0 leading-none`}>
      {severity ?? 'LOW'}
    </span>
  );
}

const LogoMark = () => (
  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
    <svg viewBox="0 0 20 20" fill="none" className="w-[14px] h-[14px]">
      <path d="M6 10V7a4 4 0 0 1 8 0v3" stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3.5" y="10" width="13" height="9" rx="2.5" fill="white" fillOpacity="0.95" />
      <circle cx="10" cy="14.5" r="1.4" fill="#4a7fcb" />
    </svg>
  </div>
);

export default function SharedReport() {
  const token = window.location.pathname.split('/shared/')[1]?.split('/')[0];
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) { setError('Invalid share link.'); setLoading(false); return; }
    fetch(`/api/shared/${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setAnalysis(data.analysis);
      })
      .catch((e) => setError(e.message || 'Report not found.'))
      .finally(() => setLoading(false));
  }, [token]);

  const data = analysis?.result || {};
  const score = data.score ?? null;
  const isRed = score !== null && score <= 4;
  const isYellow = score !== null && score >= 5 && score <= 7;
  const isGreen = score !== null && score >= 8;
  const scoreColor = isRed ? 'text-rose-400' : isYellow ? 'text-amber-400' : isGreen ? 'text-emerald-400' : 'text-zinc-400';
  const scoreRing  = isRed ? 'border-rose-500/40 bg-rose-500/[0.07]' : isYellow ? 'border-amber-500/40 bg-amber-500/[0.07]' : isGreen ? 'border-emerald-500/40 bg-emerald-500/[0.07]' : 'border-zinc-700 bg-zinc-800/40';
  const scoreLabel = isRed ? 'Problematic' : isYellow ? 'Fair' : isGreen ? 'Favorable' : '';

  return (
    <div className="min-h-screen bg-[#07070d] text-slate-100">
      {/* Minimal nav */}
      <div className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#07070d]/90 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-[15px] font-bold tracking-tight text-white">Declawed</span>
          </a>
          <a
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/25 text-xs font-semibold text-blue-400 hover:bg-blue-500/20 transition"
          >
            <ExternalLink className="w-3 h-3" />
            Analyze your lease
          </a>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-10">
        {/* Shared report badge */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">Shared Lease Report</span>
          <span className="text-zinc-700">·</span>
          <span className="text-[10px] text-zinc-700">Read-only</span>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
            <div className="w-10 h-10 border-2 border-blue-500/40 border-t-blue-400 rounded-full animate-spin mb-4" />
            <p className="text-sm">Loading report…</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-rose-500/25 bg-rose-500/[0.05] p-10 flex flex-col items-center text-center">
            <AlertOctagon className="w-10 h-10 text-rose-500/60 mb-4" />
            <p className="text-base font-semibold text-rose-300 mb-1">Report not found</p>
            <p className="text-sm text-zinc-500">{error}</p>
            <a href="/" className="mt-6 px-4 py-2 rounded-xl bg-blue-500 text-black text-sm font-bold hover:bg-blue-400 transition">
              Analyze your own lease
            </a>
          </div>
        )}

        {!loading && !error && analysis && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-[#0d0d14] border border-white/[0.08] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/[0.06]">
              <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-sm font-semibold text-white truncate">{analysis.filename || 'Untitled document'}</p>
              <time className="ml-auto text-xs text-zinc-600 shrink-0">
                {new Date(analysis.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </time>
            </div>

            {/* Body */}
            <div className="p-5 space-y-5 text-sm">
              {/* Score + Verdict */}
              {score !== null ? (
                <div className={`rounded-xl border ${scoreRing} p-4 flex items-center gap-4`}>
                  <div className={`w-14 h-14 rounded-full border-2 ${scoreRing} flex items-center justify-center shrink-0`}>
                    <span className={`text-2xl font-extrabold ${scoreColor}`}>{Math.max(1, Math.min(10, score))}</span>
                  </div>
                  <div className="min-w-0">
                    <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${scoreColor} mb-1`}>Lease Score · {scoreLabel}</p>
                    {data.verdict && <p className="text-sm text-slate-200 leading-snug">{data.verdict}</p>}
                  </div>
                </div>
              ) : data.verdict && (
                <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-4">
                  <p className="text-slate-200 leading-relaxed">{data.verdict}</p>
                </div>
              )}

              {/* Red Flags */}
              {data.redFlags?.length > 0 && (
                <section>
                  <h3 className="flex items-center gap-1.5 text-rose-400 font-semibold mb-3">
                    <AlertCircle className="w-4 h-4" /> Red Flags
                  </h3>
                  <ul className="space-y-3">
                    {data.redFlags.map((flag, i) => {
                      const text = typeof flag === 'string' ? flag : flag.text;
                      const severity = typeof flag === 'string' ? 'MEDIUM' : (flag.severity ?? 'MEDIUM');
                      return (
                        <li key={i} className="flex gap-2.5 text-slate-300 leading-relaxed">
                          <span className="text-rose-500 mt-0.5 shrink-0">•</span>
                          <span className="flex-1">{text}</span>
                          <SeverityBadge severity={severity} />
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              {/* Key Dates */}
              {data.keyDates?.length > 0 && (
                <section>
                  <h3 className="flex items-center gap-1.5 text-blue-400 font-semibold mb-3">
                    <Calendar className="w-4 h-4" /> Key Dates
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {data.keyDates.map((item, i) => (
                      <div key={i} className="rounded-lg bg-blue-500/[0.06] border border-blue-500/20 px-3 py-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-500/80 mb-0.5">{item.label}</p>
                        <p className="text-xs text-slate-300 leading-snug">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Tenant Rights */}
              {data.tenantRights?.length > 0 && (
                <section>
                  <h3 className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-3">
                    <ShieldCheck className="w-4 h-4" /> Your Rights
                  </h3>
                  <ul className="space-y-3">
                    {data.tenantRights.map((right, i) => (
                      <li key={i} className="flex gap-2.5 text-slate-300 leading-relaxed">
                        <span className="text-emerald-500 mt-0.5 shrink-0">•</span>{right}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Unusual Clauses */}
              {data.unusualClauses?.length > 0 && (
                <section>
                  <h3 className="flex items-center gap-1.5 text-amber-400 font-semibold mb-3">
                    <AlertTriangle className="w-4 h-4" /> Unusual Clauses
                  </h3>
                  <ul className="space-y-3">
                    {data.unusualClauses.map((clause, i) => (
                      <li key={i} className="flex gap-2.5 text-slate-300 leading-relaxed">
                        <span className="text-amber-500 mt-0.5 shrink-0">•</span>{clause}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Action Steps */}
              {data.actionSteps?.length > 0 && (
                <section className="rounded-xl border border-blue-500/25 bg-blue-500/[0.05] overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-blue-500/15 bg-blue-500/[0.04]">
                    <ListChecks className="w-4 h-4 text-blue-400 shrink-0" />
                    <h3 className="text-blue-300 font-semibold text-sm">What to do before signing</h3>
                  </div>
                  <ul className="divide-y divide-blue-500/[0.08]">
                    {data.actionSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3 px-4 py-2.5">
                        <span className="w-4 h-4 rounded border border-blue-500/40 bg-blue-500/10 text-blue-400 text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        <span className="text-slate-300 leading-relaxed text-sm">{step}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-white/[0.06] bg-white/[0.01] flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-[11px] text-zinc-600">Analyzed by Declawed AI · Not legal advice</p>
              <a
                href="/"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500 text-black text-xs font-bold hover:bg-blue-400 transition shadow-lg shadow-blue-500/20"
              >
                <ExternalLink className="w-3 h-3" />
                Analyze your own lease — free
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
