import { motion } from 'framer-motion';
import { FileCheck, AlertCircle, Calendar, ShieldCheck, AlertTriangle, ClipboardList } from 'lucide-react';

function ScoreRing({ score }) {
  const clamped = Math.max(1, Math.min(10, score ?? 0));
  const isRed = clamped <= 4;
  const isYellow = clamped >= 5 && clamped <= 7;
  const isGreen = clamped >= 8;
  const color = isRed ? 'text-rose-400' : isYellow ? 'text-amber-400' : 'text-emerald-400';
  const ring = isRed ? 'border-rose-500/50 shadow-rose-500/20' : isYellow ? 'border-amber-500/50 shadow-amber-500/20' : 'border-emerald-500/50 shadow-emerald-500/20';
  const bg = isRed ? 'bg-rose-500/10' : isYellow ? 'bg-amber-500/10' : 'bg-emerald-500/10';
  const label = isRed ? 'Problematic' : isYellow ? 'Fair' : 'Favorable';
  return (
    <div className={`flex items-center gap-4 rounded-xl border ${ring} ${bg} p-4 shadow-lg mb-5`}>
      <div className={`w-14 h-14 rounded-full border-2 ${ring} flex items-center justify-center shrink-0 shadow-md`}>
        <span className={`text-2xl font-extrabold ${color}`}>{clamped}</span>
      </div>
      <div>
        <p className={`text-xs font-bold uppercase tracking-[0.15em] ${color} mb-0.5`}>Lease Score · {label}</p>
        <p className="text-sm text-slate-300 leading-snug font-medium">{/* verdict injected below */}</p>
      </div>
    </div>
  );
}

const SEVERITY_STYLES = {
  HIGH:   { bg: 'bg-rose-500/15',   text: 'text-rose-400',   border: 'border-rose-500/30'   },
  MEDIUM: { bg: 'bg-amber-500/12',  text: 'text-amber-400',  border: 'border-amber-500/30'  },
  LOW:    { bg: 'bg-zinc-500/15',   text: 'text-zinc-400',   border: 'border-zinc-600/40'   },
};

function SeverityBadge({ severity }) {
  const s = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.LOW;
  return (
    <span className={`inline-block text-[9px] font-bold uppercase tracking-[0.14em] px-1.5 py-0.5 rounded border ${s.bg} ${s.text} ${s.border} shrink-0 leading-none`}>
      {severity ?? 'LOW'}
    </span>
  );
}

function StructuredSummary({ data }) {
  const score = data.score ?? null;
  const isRed = score !== null && score <= 4;
  const isYellow = score !== null && score >= 5 && score <= 7;
  const isGreen = score !== null && score >= 8;
  const scoreColor = isRed ? 'text-rose-400' : isYellow ? 'text-amber-400' : isGreen ? 'text-emerald-400' : 'text-zinc-400';
  const scoreRing = isRed ? 'border-rose-500/40 bg-rose-500/[0.07] shadow-rose-500/15' : isYellow ? 'border-amber-500/40 bg-amber-500/[0.07] shadow-amber-500/15' : isGreen ? 'border-emerald-500/40 bg-emerald-500/[0.07] shadow-emerald-500/15' : 'border-zinc-700 bg-zinc-800/40';
  const scoreLabel = isRed ? 'Problematic' : isYellow ? 'Fair' : isGreen ? 'Favorable' : '';

  return (
    <article className="text-sm space-y-6">

      {/* Score + Verdict hero */}
      {score !== null && (
        <div className={`rounded-xl border shadow-lg ${scoreRing} p-4 flex items-center gap-4`}>
          <div className={`w-14 h-14 rounded-full border-2 ${scoreRing} flex items-center justify-center shrink-0`}>
            <span className={`text-2xl font-extrabold ${scoreColor}`}>{Math.max(1, Math.min(10, score))}</span>
          </div>
          <div className="min-w-0">
            <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${scoreColor} mb-1`}>Lease Score · {scoreLabel}</p>
            {data.verdict && (
              <p className="text-sm text-slate-200 leading-snug">{data.verdict}</p>
            )}
          </div>
        </div>
      )}

      {/* Fallback verdict if no score */}
      {score === null && data.verdict && (
        <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-3">
          <p className="text-slate-200 leading-relaxed">{data.verdict}</p>
        </div>
      )}

      {/* Red Flags */}
      {data.redFlags?.length > 0 && (
        <section>
          <h2 className="flex items-center gap-1.5 text-rose-400 font-semibold mb-3">
            <AlertCircle className="w-4 h-4" /> Red Flags
          </h2>
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

      {/* Key Dates — 2-column card grid */}
      {data.keyDates?.length > 0 && (
        <section>
          <h2 className="flex items-center gap-1.5 text-cyan-400 font-semibold mb-3">
            <Calendar className="w-4 h-4" /> Key Dates
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {data.keyDates.map((item, i) => (
              <div key={i} className="rounded-lg bg-cyan-500/[0.06] border border-cyan-500/20 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-500/80 mb-0.5">{item.label}</p>
                <p className="text-xs text-slate-300 leading-snug">{item.value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tenant Rights */}
      {data.tenantRights?.length > 0 && (
        <section>
          <h2 className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-3">
            <ShieldCheck className="w-4 h-4" /> Your Rights
          </h2>
          <ul className="space-y-3">
            {data.tenantRights.map((right, i) => (
              <li key={i} className="flex gap-2.5 text-slate-300 leading-relaxed">
                <span className="text-emerald-500 mt-0.5 shrink-0">•</span>
                {right}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Unusual Clauses */}
      {data.unusualClauses?.length > 0 && (
        <section>
          <h2 className="flex items-center gap-1.5 text-amber-400 font-semibold mb-3">
            <AlertTriangle className="w-4 h-4" /> Unusual Clauses
          </h2>
          <ul className="space-y-3">
            {data.unusualClauses.map((clause, i) => (
              <li key={i} className="flex gap-2.5 text-slate-300 leading-relaxed">
                <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                {clause}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* What to do before signing */}
      {data.actionSteps?.length > 0 && (
        <section className="rounded-xl border border-teal-500/20 bg-teal-500/[0.05] p-4">
          <h2 className="flex items-center gap-1.5 text-teal-300 font-semibold mb-3">
            <ClipboardList className="w-4 h-4" /> What to do before signing
          </h2>
          <ol className="space-y-3">
            {data.actionSteps.map((step, i) => (
              <li key={i} className="flex gap-3 text-slate-300 leading-relaxed">
                <span className="w-5 h-5 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </section>
      )}

    </article>
  );
}

export default function SummaryPanel({ summary, loading, error, modelTier }) {
  return (
    <motion.section
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm flex flex-col overflow-hidden"
    >
      <div className="flex items-center gap-2 p-4 border-b border-slate-800/80">
        <FileCheck className="w-5 h-5 text-emerald-400" />
        <h2 className="text-lg font-semibold text-slate-100">Plain English summary</h2>
        {modelTier && (
          <span className={`ml-auto flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            modelTier === 'advanced'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30'
              : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              modelTier === 'advanced' ? 'bg-teal-400' : 'bg-zinc-600'
            }`} />
            {modelTier === 'advanced' ? 'Advanced AI' : 'Standard AI'}
          </span>
        )}
      </div>
      <div className="flex-1 min-h-[320px] p-4 overflow-y-auto">
        {loading && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <div className="w-10 h-10 border-2 border-cyan-500/50 border-t-cyan-400 rounded-full animate-spin mb-3" />
            <p className="text-sm">Declawed AI is reading your lease…</p>
            <p className="text-xs mt-1">Usually takes 10–30 seconds</p>
          </div>
        )}
        {!loading && error && (
          <div className="flex items-center gap-2 text-rose-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}
        {!loading && !error && !summary && (
          <div className="relative h-full min-h-[320px]">
            {/* Sample output — top section crisp, fades into blur */}
            <article className="summary-content text-sm space-y-1 select-none pointer-events-none">
              {/* Fully legible top section */}
              <h2 className="text-rose-400 font-semibold mt-0 mb-2">🚩 Red Flags</h2>
              <ul className="list-disc ml-4 mb-2 space-y-1">
                <li className="text-slate-300 leading-relaxed">Landlord may enter with only 12-hour notice — below the 24-hour standard in most states.</li>
                <li className="text-slate-400 leading-relaxed blur-[1.5px]">Auto-renewal clause in Section 18 — lease renews 12 months unless 60-day written notice given.</li>
                <li className="text-slate-500 leading-relaxed blur-[3px]">Security deposit is 2× monthly rent — verify this is legal in your state.</li>
              </ul>
              {/* Progressively blurred sections */}
              <h2 className="text-cyan-400 font-semibold mt-5 mb-2 blur-[2px] opacity-80">📅 Key Dates</h2>
              <ul className="list-disc ml-4 mb-2 space-y-1 blur-[3px] opacity-60">
                <li className="text-slate-300 leading-relaxed">Lease start: March 1, 2026 — End: February 28, 2027</li>
                <li className="text-slate-300 leading-relaxed">Rent due 1st of each month; $75 late fee after the 5th.</li>
              </ul>
              <h2 className="text-emerald-400 font-semibold mt-5 mb-2 blur-[5px] opacity-40">✅ Your Rights</h2>
              <ul className="list-disc ml-4 mb-2 space-y-1 blur-[6px] opacity-30">
                <li className="text-slate-300 leading-relaxed">You may sublet with written landlord approval (Section 9).</li>
                <li className="text-slate-300 leading-relaxed">Landlord must restore heat/water within 72 hours.</li>
                <li className="text-slate-300 leading-relaxed">Security deposit returned within 21 days of move-out.</li>
              </ul>
            </article>
            {/* Gradient fade from transparent to panel color */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-slate-900/95 via-slate-900/60 to-transparent rounded-b-xl pointer-events-none"></div>
            {/* CTA pinned at bottom */}
            <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end pb-6 text-center px-6">
              <p className="text-slate-200 font-semibold text-sm">Upload your lease to see your full analysis</p>
              <p className="text-slate-500 text-xs mt-1">Red flags, key dates & your rights — in plain English.</p>
            </div>
          </div>
        )}
        {!loading && !error && summary && (
          <>
            <StructuredSummary data={summary} />
            <p className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-zinc-600 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                modelTier === 'advanced' ? 'bg-teal-500' : 'bg-zinc-600'
              }`} />
              Analyzed by Declawed AI
              {modelTier && (
                <span className={`ml-auto font-medium ${
                  modelTier === 'advanced' ? 'text-teal-500' : 'text-zinc-500'
                }`}>
                  {modelTier === 'advanced' ? 'Advanced' : 'Standard'}
                </span>
              )}
            </p>
          </>
        )}
      </div>
    </motion.section>
  );
}
