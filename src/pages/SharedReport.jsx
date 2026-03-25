import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle, Calendar, ShieldCheck, AlertTriangle,
  FileCheck, ListChecks, AlertOctagon, ArrowRight, Zap,
} from 'lucide-react';

function SeverityBadge({ severity }) {
  const cfg = {
    HIGH:   { bg: 'bg-rose-500/10',  text: 'text-rose-400',  label: 'High' },
    MEDIUM: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Med'  },
    LOW:    { bg: 'bg-zinc-500/10',  text: 'text-zinc-500',  label: 'Low'  },
  }[severity] ?? { bg: 'bg-zinc-500/10', text: 'text-zinc-500', label: 'Low' };
  return (
    <span className={`inline-block text-[9px] font-semibold uppercase tracking-[0.06em] px-1.5 py-[3px] rounded ${cfg.bg} ${cfg.text} shrink-0 leading-none`}>
      {cfg.label}
    </span>
  );
}

function SectionRule({ icon: Icon, label, color = 'text-zinc-500', iconColor }) {
  return (
    <div className="flex items-center gap-2">
      {Icon && <Icon className={`w-3.5 h-3.5 ${iconColor ?? color} shrink-0`} />}
      <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${color} whitespace-nowrap`}>{label}</span>
      <div className="flex-1 h-px bg-white/[0.05]" />
    </div>
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

function scoreStyle(score) {
  const isRed   = score !== null && score <= 4;
  const isAmber = score !== null && score >= 5 && score <= 7;
  const isGreen = score !== null && score >= 8;
  return {
    color:  isRed ? 'text-rose-400'      : isAmber ? 'text-amber-400'    : isGreen ? 'text-emerald-400'   : 'text-zinc-400',
    border: isRed ? 'border-rose-500/30' : isAmber ? 'border-amber-500/30' : isGreen ? 'border-emerald-500/25' : 'border-zinc-700/40',
    label:  isRed ? 'Heavily favors landlord' : isAmber ? 'Somewhat unfavorable' : isGreen ? 'Tenant-friendly' : 'Analyzed',
  };
}

export default function SharedReport() {
  const token = window.location.pathname.split('/shared/')[1]?.split('/')[0];
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) { setError('Invalid share link.'); setLoading(false); return; }
    fetch(`/api/shared/${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setAnalysis(data.analysis);
      })
      .catch(e => setError(e.message || 'Report not found.'))
      .finally(() => setLoading(false));
  }, [token]);

  const data = analysis?.result || {};
  const score = typeof data.score === 'number' ? Math.max(1, Math.min(10, data.score)) : null;
  const ss = scoreStyle(score);
  const sortedFlags = [...(data.redFlags || [])].sort((a, b) => {
    const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    const sa = order[typeof a === 'string' ? 'MEDIUM' : (a.severity ?? 'MEDIUM')] ?? 1;
    const sb = order[typeof b === 'string' ? 'MEDIUM' : (b.severity ?? 'MEDIUM')] ?? 1;
    return sa - sb;
  });

  return (
    <div className="min-h-screen bg-[#07070d] text-slate-100">
      {/* Nav */}
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
            <Zap className="w-3 h-3" />
            Analyze your lease free
          </a>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-10">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">Shared Lease Report</span>
          <span className="text-zinc-700">·</span>
          <span className="text-[10px] text-zinc-700">Read-only</span>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
            <div className="w-8 h-8 border-2 border-blue-500/40 border-t-blue-400 rounded-full animate-spin mb-4" />
            <p className="text-sm">Loading report…</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-10 flex flex-col items-center text-center">
            <AlertOctagon className="w-10 h-10 text-rose-500/50 mb-4" />
            <p className="text-base font-semibold text-rose-300 mb-1">Report not found</p>
            <p className="text-sm text-zinc-500 mb-6">{error}</p>
            <a href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 text-black text-sm font-bold hover:bg-blue-400 transition">
              Analyze your own lease <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {!loading && !error && analysis && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Report card */}
            <div className="rounded-2xl bg-[#0a0a10] border border-white/[0.08] overflow-hidden">
              {/* Doc header */}
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/[0.06]">
                <FileCheck className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                <p className="text-[13px] font-medium text-zinc-300 truncate">{analysis.filename || 'Lease document'}</p>
                <time className="ml-auto text-[11px] text-zinc-700 shrink-0">
                  {new Date(analysis.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </time>
              </div>

              {/* Body */}
              <div className="p-5 space-y-5">
                {/* Score hero */}
                {score !== null ? (
                  <div className={`flex items-start gap-4 pl-4 border-l-[3px] ${ss.border}`}>
                    <div className="shrink-0">
                      <span className={`text-5xl font-black ${ss.color} leading-none`}>{score}</span>
                      <span className="text-zinc-600 text-sm font-medium">/10</span>
                    </div>
                    <div className="pt-0.5 min-w-0">
                      <p className={`text-[10px] font-bold uppercase tracking-[0.15em] ${ss.color} mb-1`}>{ss.label}</p>
                      {data.verdict && <p className="text-[13px] text-zinc-300 leading-relaxed">{data.verdict}</p>}
                    </div>
                  </div>
                ) : data.verdict && (
                  <p className="text-[13px] text-zinc-300 leading-relaxed">{data.verdict}</p>
                )}

                {/* Red Flags */}
                {sortedFlags.length > 0 && (
                  <section className="space-y-3">
                    <SectionRule icon={AlertCircle} label="Red Flags" iconColor="text-rose-500/60" color="text-rose-500/40" />
                    <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                      {sortedFlags.map((flag, i) => {
                        const text = typeof flag === 'string' ? flag : flag.text;
                        const severity = typeof flag === 'string' ? 'MEDIUM' : (flag.severity ?? 'MEDIUM');
                        return (
                          <div key={i} className={`flex items-start gap-3 px-4 py-3 text-[13px] ${i > 0 ? 'border-t border-white/[0.04]' : ''}`}>
                            <span className="flex-1 text-zinc-300 leading-relaxed">{text}</span>
                            <SeverityBadge severity={severity} />
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Key Dates */}
                {data.keyDates?.length > 0 && (
                  <section className="space-y-3">
                    <SectionRule icon={Calendar} label="Key Dates" color="text-zinc-500" />
                    <div className="grid grid-cols-2 gap-2">
                      {data.keyDates.map((item, i) => (
                        <div key={i} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-600 mb-0.5">{item.label}</p>
                          <p className="text-[12px] text-zinc-300 leading-snug">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Tenant Rights */}
                {data.tenantRights?.length > 0 && (
                  <section className="space-y-3">
                    <SectionRule icon={ShieldCheck} label="Your Rights" iconColor="text-emerald-500/50" color="text-emerald-500/40" />
                    <ul className="space-y-2">
                      {data.tenantRights.map((right, i) => (
                        <li key={i} className="flex gap-2.5 text-[13px] text-zinc-400 leading-relaxed">
                          <span className="text-emerald-600 mt-[5px] shrink-0 leading-none">•</span>
                          {right}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Unusual Clauses */}
                {data.unusualClauses?.length > 0 && (
                  <section className="space-y-3">
                    <SectionRule icon={AlertTriangle} label="Unusual Clauses" iconColor="text-amber-500/50" color="text-amber-500/40" />
                    <div className="rounded-xl border border-white/[0.05] overflow-hidden">
                      {data.unusualClauses.map((clause, i) => (
                        <div key={i} className={`flex gap-2.5 px-4 py-3 text-[13px] text-zinc-400 leading-relaxed ${i > 0 ? 'border-t border-white/[0.04]' : ''}`}>
                          <span className="text-amber-600 mt-[5px] shrink-0 leading-none">•</span>
                          {clause}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Action Steps */}
                {data.actionSteps?.length > 0 && (
                  <section className="space-y-3">
                    <SectionRule icon={ListChecks} label="What to do before signing" color="text-zinc-500" />
                    <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                      {data.actionSteps.map((step, i) => (
                        <div key={i} className={`flex items-start gap-3 px-4 py-3 ${i > 0 ? 'border-t border-white/[0.04]' : ''}`}>
                          <span className="w-[18px] h-[18px] rounded-full border border-zinc-700 text-zinc-500 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                          <span className="text-[13px] text-zinc-300 leading-relaxed">{step}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <div className="px-5 py-3 border-t border-white/[0.05]">
                <p className="text-[11px] text-zinc-700">Analyzed by Declawed AI · Not legal advice</p>
              </div>
            </div>

            {/* CTA banner */}
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-400/60 mb-2">Free lease analysis</p>
              <h2 className="text-lg font-bold text-white mb-1.5">Know what you're signing before you sign it.</h2>
              <p className="text-[13px] text-zinc-400 mb-5 leading-relaxed">
                Get your own lease scored in under 30 seconds — red flags, key dates, and exactly what to negotiate before you commit.
              </p>
              <a
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 text-black text-sm font-bold hover:bg-blue-400 transition shadow-lg shadow-blue-500/25"
              >
                Analyze your lease — it's free
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
