import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileCheck, AlertCircle, Calendar, ShieldCheck, AlertTriangle, ListChecks, Download, Lock, Mail, Building2, RotateCcw, ExternalLink, CheckCircle2, Share2 } from 'lucide-react';
import EmailReportModal from './EmailReportModal';

const ANALYSIS_STEPS = [
  { label: 'Uploading document…',     icon: '📄' },
  { label: 'Extracting text…',        icon: '🔍' },
  { label: 'Analyzing clauses…',      icon: '⚖️' },
  { label: 'Identifying red flags…',  icon: '🚩' },
  { label: 'Generating your report…', icon: '✨' },
];

function AnalysisProgress() {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    // Advance through steps: faster early, slow at end (don't finish until real result arrives)
    const delays = [1200, 2200, 3500, 5000];
    let timeout;
    const advance = (i) => {
      if (i >= delays.length) return;
      timeout = setTimeout(() => {
        setStepIdx(i + 1);
        advance(i + 1);
      }, delays[i]);
    };
    advance(0);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="flex flex-col justify-center h-full px-4 py-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-600 mb-5 text-center">Declawed AI is reading your lease</p>
      <div className="space-y-2.5">
        {ANALYSIS_STEPS.map((step, i) => {
          const done    = i < stepIdx;
          const active  = i === stepIdx;
          const pending = i > stepIdx;
          return (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: pending ? 0.3 : 1, x: 0 }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 border transition-all duration-500 ${
                active  ? 'border-blue-500/40 bg-blue-500/[0.07]' :
                done    ? 'border-blue-500/25 bg-blue-500/[0.04]' :
                          'border-white/[0.05] bg-transparent'
              }`}
            >
              <span className="text-base w-5 text-center shrink-0">{step.icon}</span>
              <span className={`text-sm flex-1 transition-colors duration-300 ${
                active ? 'text-blue-300 font-semibold' : done ? 'text-blue-400' : 'text-zinc-600'
              }`}>
                {step.label}
              </span>
              {active && (
                <div className="w-3.5 h-3.5 border-2 border-blue-500/50 border-t-blue-400 rounded-full animate-spin shrink-0" />
              )}
              {done && (
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              )}
            </motion.div>
          );
        })}
      </div>
      <p className="text-xs text-zinc-600 text-center mt-5">Usually takes 10–30 seconds</p>
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

function StructuredSummary({ data, landlordMode, scorePercentile }) {
  const score = data.score ?? null;
  // In landlord mode: high score = landlord-favorable (green), low = red
  // In tenant mode: high score = tenant-favorable (green), low = red (same logic)
  const isRed = score !== null && score <= 4;
  const isYellow = score !== null && score >= 5 && score <= 7;
  const isGreen = score !== null && score >= 8;
  const scoreColor = isRed ? 'text-rose-400' : isYellow ? 'text-amber-400' : isGreen ? 'text-emerald-400' : 'text-zinc-400';
  const scoreBg = isRed ? 'bg-rose-500/[0.07] border-rose-500/25' : isYellow ? 'bg-amber-500/[0.07] border-amber-500/25' : isGreen ? 'bg-emerald-500/[0.07] border-emerald-500/25' : 'bg-white/[0.03] border-white/[0.07]';
  const scoreLabel = landlordMode
    ? (isRed ? 'Poor landlord protection' : isYellow ? 'Moderate protection' : isGreen ? 'Strong landlord protection' : '')
    : (isRed ? 'Heavily favors landlord' : isYellow ? 'Somewhat unfavorable' : isGreen ? 'Tenant-friendly' : '');

  return (
    <article className="space-y-5 text-[13px]">

      {/* Score hero */}
      {score !== null ? (
        <div className={`rounded-xl border ${scoreBg} px-5 py-4`}>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center shrink-0">
              <span className={`text-[56px] font-black leading-none tabular-nums ${scoreColor}`}>{Math.max(1, Math.min(10, score))}</span>
              <span className="text-[10px] text-zinc-600 font-semibold">/ 10</span>
            </div>
            <div className="min-w-0">
              <p className={`font-bold ${scoreColor}`}>{scoreLabel}</p>
              {data.verdict && <p className="text-slate-400 mt-1 leading-relaxed">{data.verdict}</p>}
              {typeof scorePercentile === 'number' && (
                <p className="mt-2 text-[11px] text-zinc-500">
                  Better than <span className="font-semibold text-zinc-300">{scorePercentile}%</span> of leases we've analyzed
                </p>
              )}
            </div>
          </div>
        </div>
      ) : data.verdict && (
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] px-4 py-3">
          <p className="text-slate-300 leading-relaxed">{data.verdict}</p>
        </div>
      )}

      {/* Red Flags — relabelled in landlord mode */}
      {data.redFlags?.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-rose-400 text-sm font-bold uppercase tracking-widest mb-3">
            <AlertCircle className="w-4 h-4" /> {landlordMode ? 'Landlord Risk Flags' : 'Red Flags'}
          </h2>
          <ul className="space-y-2">
            {data.redFlags.map((flag, i) => {
              const text = typeof flag === 'string' ? flag : flag.text;
              const severity = typeof flag === 'string' ? 'MEDIUM' : (flag.severity ?? 'MEDIUM');
              const bar = severity === 'HIGH' ? 'border-l-rose-500 bg-rose-500/[0.04]' : severity === 'MEDIUM' ? 'border-l-amber-400 bg-amber-500/[0.03]' : 'border-l-zinc-600';
              return (
                <li key={i} className={`flex items-start gap-3 border-l-[3px] ${bar} pl-3 py-1.5 rounded-r`}>
                  <span className="flex-1 text-slate-300 leading-relaxed text-sm">{text}</span>
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
          <h2 className="flex items-center gap-2 text-blue-400 text-sm font-bold uppercase tracking-widest mb-3">
            <Calendar className="w-4 h-4" /> Key Dates
          </h2>
          <div className="grid grid-cols-2 gap-1.5">
            {data.keyDates.map((item, i) => (
              <div key={i} className="rounded-lg bg-blue-500/[0.05] border border-blue-500/[0.12] px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500/70 mb-0.5">{item.label}</p>
                <p className="text-xs text-slate-300 leading-snug">{item.value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tenant rights — relabelled in landlord mode */}
      {data.tenantRights?.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-emerald-400 text-sm font-bold uppercase tracking-widest mb-3">
            <ShieldCheck className="w-4 h-4" /> {landlordMode ? 'Enforceable Tenant Obligations' : 'Your Rights'}
          </h2>
          <div className="space-y-1">
            {data.tenantRights.map((right, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-lg bg-emerald-500/[0.05] border border-emerald-500/[0.12] px-3 py-2">
                <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-slate-300 leading-relaxed">{right}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Unusual Clauses — amber grouped block */}
      {data.unusualClauses?.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-amber-400 text-sm font-bold uppercase tracking-widest mb-3">
            <AlertTriangle className="w-4 h-4" /> Unusual Clauses
          </h2>
          <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.04] divide-y divide-amber-500/[0.08]">
            {data.unusualClauses.map((clause, i) => (
              <div key={i} className="flex items-start gap-2.5 px-3.5 py-2.5">
                <AlertTriangle className="w-3 h-3 text-amber-500/70 shrink-0 mt-0.5" />
                <span className="text-slate-300 leading-relaxed">{clause}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Action steps — relabelled in landlord mode */}
      {data.actionSteps?.length > 0 && (
        <section className="rounded-xl border border-blue-500/25 bg-blue-500/[0.05] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-blue-500/15 bg-blue-500/[0.04]">
            <ListChecks className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <h2 className="text-blue-300 text-[11px] font-bold uppercase tracking-widest">
              {landlordMode ? 'Recommended Lease Improvements' : 'What to do before signing'}
            </h2>
          </div>
          <ul className="divide-y divide-blue-500/[0.08]">
            {data.actionSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-3 px-4 py-2.5">
                <span className="w-4 h-4 rounded border border-blue-500/40 bg-blue-500/10 text-blue-400 text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <span className="text-slate-300 leading-relaxed text-[13px]">{step}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

    </article>
  );
}

const PAID_PLANS = new Set(['one', 'pro', 'unlimited']);
const EMAIL_PLANS = new Set(['pro', 'unlimited']);

function AnonTeaser({ data, onSignUp, scorePercentile }) {
  const score = data?.score ?? null;
  const isRed = score !== null && score <= 4;
  const isYellow = score !== null && score >= 5 && score <= 7;
  const isGreen = score !== null && score >= 8;
  const scoreColor = isRed ? 'text-rose-400' : isYellow ? 'text-amber-400' : isGreen ? 'text-emerald-400' : 'text-zinc-400';
  const scoreBg = isRed ? 'bg-rose-500/[0.07] border-rose-500/25' : isYellow ? 'bg-amber-500/[0.07] border-amber-500/25' : isGreen ? 'bg-emerald-500/[0.07] border-emerald-500/25' : 'bg-white/[0.03] border-white/[0.07]';
  const scoreLabel = isRed ? 'Heavily favors landlord' : isYellow ? 'Somewhat unfavorable' : isGreen ? 'Tenant-friendly' : '';
  const previewFlags = (data?.redFlags || []).slice(0, 2);

  return (
    <div className="relative">
      <article className="space-y-5 text-[13px]">
        {/* Score hero — fully visible */}
        {score !== null && (
          <div className={`rounded-xl border ${scoreBg} px-5 py-4`}>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center shrink-0">
                <span className={`text-[56px] font-black leading-none tabular-nums ${scoreColor}`}>{Math.max(1, Math.min(10, score))}</span>
                <span className="text-[10px] text-zinc-600 font-semibold">/ 10</span>
              </div>
              <div className="min-w-0">
                <p className={`font-bold ${scoreColor}`}>{scoreLabel}</p>
                {data.verdict && <p className="text-slate-400 mt-1 leading-relaxed">{data.verdict}</p>}
                {typeof scorePercentile === 'number' && (
                  <p className="mt-2 text-[11px] text-zinc-500">
                    Better than <span className="font-semibold text-zinc-300">{scorePercentile}%</span> of leases we've analyzed
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Up to 2 red flags — visible */}
        {previewFlags.length > 0 && (
          <section>
            <h2 className="flex items-center gap-2 text-rose-400 text-sm font-bold uppercase tracking-widest mb-3">
              <AlertCircle className="w-4 h-4" /> Red Flags
            </h2>
            <ul className="space-y-2">
              {previewFlags.map((flag, i) => {
                const text = typeof flag === 'string' ? flag : flag.text;
                const severity = typeof flag === 'string' ? 'MEDIUM' : (flag.severity ?? 'MEDIUM');
                const bar = severity === 'HIGH' ? 'border-l-rose-500 bg-rose-500/[0.04]' : severity === 'MEDIUM' ? 'border-l-amber-400 bg-amber-500/[0.03]' : 'border-l-zinc-600';
                return (
                  <li key={i} className={`flex items-start gap-3 border-l-[3px] ${bar} pl-3 py-1.5 rounded-r`}>
                    <span className="flex-1 text-slate-300 leading-relaxed text-sm">{text}</span>
                    <SeverityBadge severity={severity} />
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Blurred mock of remaining content */}
        <div className="pointer-events-none select-none blur-[5px] opacity-25 space-y-4">
          <div className="rounded-lg bg-blue-500/[0.08] border border-blue-500/[0.12] h-8" />
          <div className="grid grid-cols-2 gap-1.5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="rounded-lg bg-blue-500/[0.05] border border-blue-500/[0.10] h-12" />
            ))}
          </div>
          <div className="rounded-lg bg-emerald-500/[0.08] border border-emerald-500/[0.12] h-8" />
          <div className="space-y-1">
            {[1, 2].map(i => (
              <div key={i} className="rounded-lg bg-emerald-500/[0.05] border border-emerald-500/[0.10] h-10" />
            ))}
          </div>
          <div className="rounded-xl border border-blue-500/15 bg-blue-500/[0.04] h-24" />
        </div>
      </article>

      {/* Gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-[58%] bg-gradient-to-t from-slate-900/98 via-slate-900/75 to-transparent pointer-events-none rounded-b-xl" />

      {/* Signup gate */}
      <div className="absolute bottom-0 left-0 right-0 px-2 pb-1">
        <div className="w-full rounded-2xl border border-white/[0.09] bg-slate-900/95 backdrop-blur-sm p-5 shadow-2xl">
          <div className="flex items-center gap-2 mb-1.5">
            <Lock className="w-4 h-4 text-blue-400 shrink-0" />
            <p className="text-white font-semibold text-[14px]">See your full analysis</p>
          </div>
          <p className="text-zinc-400 text-[12px] mb-4 leading-relaxed">
            Create a free account to unlock red flags, key dates, and your plain English summary.
          </p>
          <div className="flex gap-2.5">
            <button
              onClick={() => onSignUp?.('signup')}
              className="flex-1 py-2.5 rounded-lg bg-blue-500 text-black text-[13px] font-bold hover:bg-blue-400 active:scale-95 transition-all"
            >
              Sign up free
            </button>
            <button
              onClick={() => onSignUp?.('signin')}
              className="flex-1 py-2.5 rounded-lg border border-white/[0.15] text-white text-[13px] font-semibold hover:bg-white/[0.06] active:scale-95 transition-all"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SummaryPanel({ summary, loading, error, modelTier, scorePercentile, usage, filename, onUpgrade, landlordMode, user, onSignUp, onRetry, shareToken }) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Normalize summary: handle string (double-encoded), object, or null
  const parsedSummary = (() => {
    if (!summary) return null;
    if (typeof summary === 'string') {
      try { return JSON.parse(summary); } catch { return { _parseError: true }; }
    }
    return summary;
  })();
  const summaryParseError = parsedSummary?._parseError === true;

  const handleShare = async () => {
    const url = shareToken
      ? `${window.location.origin}/shared/${shareToken}`
      : window.location.href;
    if (navigator.share) {
      try {
        const score = parsedSummary?.score;
        await navigator.share({
          title: 'My Lease Analysis — Declawed',
          text: score != null
            ? `My lease scored ${score}/10 on Declawed. See what the AI found →`
            : 'Check out my lease analysis on Declawed →',
          url,
        });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  const handleDownloadPDF = async () => {
    const isPaid = PAID_PLANS.has(usage?.plan);
    if (!isPaid) {
      onUpgrade?.();
      return;
    }
    setPdfLoading(true);
    try {
      await new Promise(r => setTimeout(r, 50));
      const { generatePDF } = await import('../lib/generatePDF');
      generatePDF({ data: parsedSummary, filename, analysisDate: new Date() });
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className={`rounded-2xl backdrop-blur-sm flex flex-col overflow-hidden transition-colors duration-300 ${
        landlordMode
          ? 'bg-amber-950/30 border border-amber-500/30'
          : 'bg-slate-900/60 border border-slate-800/80'
      }`}
    >
      <div className="flex items-center gap-2 p-4 border-b border-slate-800/80">
        <FileCheck className="w-5 h-5 text-emerald-400" />
        <h2 className="text-lg font-semibold text-slate-100">Plain English summary</h2>
        {modelTier && (
          <span className={`ml-auto flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            modelTier === 'advanced'
              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
              : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              modelTier === 'advanced' ? 'bg-blue-400' : 'bg-zinc-600'
            }`} />
            {modelTier === 'advanced' ? 'Advanced AI' : 'Standard AI'}
          </span>
        )}
        {landlordMode && (
          <span className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 ${
            modelTier ? 'ml-2' : 'ml-auto'
          }`}>
            <Building2 className="w-3 h-3" />
            Landlord Mode
          </span>
        )}
      </div>
      <div className="relative flex-1">
        <div className="h-full max-h-[600px] min-h-[320px] overflow-y-auto p-4" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
        {loading && <AnalysisProgress />}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-10 gap-4">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] border border-white/[0.12] text-sm font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.10] transition active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retry analysis
              </button>
            )}
          </div>
        )}
        {!loading && !error && !parsedSummary && (
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
              <h2 className="text-blue-400 font-semibold mt-5 mb-2 blur-[2px] opacity-80">📅 Key Dates</h2>
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
        {!loading && !error && summaryParseError && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10 space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-400" />
            <p className="text-sm font-semibold text-rose-300">Couldn&rsquo;t display the analysis</p>
            <p className="text-xs text-zinc-500 leading-relaxed">
              The AI returned an unexpected format. Please try uploading the lease again.
              If the problem persists, try a different file format (PDF &rarr; text or vice versa).
            </p>
          </div>
        )}
        {!loading && !error && parsedSummary && !summaryParseError && (
          user ? (
            <>
            <StructuredSummary data={parsedSummary} landlordMode={landlordMode} scorePercentile={scorePercentile} />

            {/* ── What to do next ─────────────────────────────── */}
            <div className="mt-5 pt-4 border-t border-slate-800/60">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600 mb-3">What to do next</p>
              <div className="grid grid-cols-4 gap-2">
                {/* Share result */}
                <button
                  onClick={handleShare}
                  className="group flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 border border-blue-500/25 bg-blue-500/[0.07] hover:border-blue-500/50 hover:bg-blue-500/[0.12] transition"
                >
                  {shareCopied ? (
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  ) : (
                    <Share2 className="w-4 h-4 text-blue-400" />
                  )}
                  <span className="text-[10px] font-semibold text-blue-400 group-hover:text-blue-300 text-center leading-tight transition">
                    {shareCopied ? 'Copied!' : 'Share'}
                  </span>
                </button>
                {/* Download PDF */}
                <button
                  onClick={handleDownloadPDF}
                  disabled={pdfLoading}
                  className="group flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 border border-white/[0.08] bg-white/[0.03] hover:border-blue-500/30 hover:bg-blue-500/[0.06] transition disabled:opacity-60"
                >
                  {pdfLoading ? (
                    <div className="w-4 h-4 border-2 border-blue-400/40 border-t-blue-400 rounded-full animate-spin" />
                  ) : (
                    <Download className={`w-4 h-4 ${PAID_PLANS.has(usage?.plan) ? 'text-blue-400' : 'text-zinc-500'}`} />
                  )}
                  <span className="text-[10px] font-semibold text-zinc-400 group-hover:text-zinc-200 text-center leading-tight transition">
                    {PAID_PLANS.has(usage?.plan) ? 'PDF' : 'PDF (Paid)'}
                  </span>
                </button>
                {/* Email results */}
                <button
                  onClick={() => {
                    if (!EMAIL_PLANS.has(usage?.plan)) { onUpgrade?.(); return; }
                    setEmailModalOpen(true);
                  }}
                  className="group flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 border border-white/[0.08] bg-white/[0.03] hover:border-blue-500/30 hover:bg-blue-500/[0.06] transition"
                >
                  <Mail className={`w-4 h-4 ${EMAIL_PLANS.has(usage?.plan) ? 'text-blue-400' : 'text-zinc-500'}`} />
                  <span className="text-[10px] font-semibold text-zinc-400 group-hover:text-zinc-200 text-center leading-tight transition">
                    {EMAIL_PLANS.has(usage?.plan) ? 'Email' : 'Email (Pro)'}
                  </span>
                </button>
                {/* Tenant rights */}
                <a
                  href="/tenant-rights"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 border border-white/[0.08] bg-white/[0.03] hover:border-emerald-500/30 hover:bg-emerald-500/[0.06] transition"
                >
                  <ExternalLink className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-semibold text-zinc-400 group-hover:text-zinc-200 text-center leading-tight transition">Rights</span>
                </a>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-zinc-600 flex items-center gap-1.5 pb-1">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                modelTier === 'advanced' ? 'bg-blue-500' : 'bg-zinc-600'
              }`} />
              Analyzed by Declawed AI
              {modelTier && (
                <span className={`ml-auto font-medium ${
                  modelTier === 'advanced' ? 'text-blue-500' : 'text-zinc-500'
                }`}>
                  {modelTier === 'advanced' ? 'Advanced' : 'Standard'}
                </span>
              )}
            </p>
            </>
          ) : (
            <AnonTeaser data={parsedSummary} onSignUp={onSignUp} scorePercentile={scorePercentile} />
          )
        )}
        </div>
        {/* Scroll fade indicator */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 rounded-b-2xl bg-gradient-to-t from-slate-900/80 to-transparent" />
      </div>

      <EmailReportModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        analysisData={parsedSummary}
        filename={filename}
        usage={usage}
      />
    </motion.section>
  );
}
