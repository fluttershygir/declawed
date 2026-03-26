import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileCheck, AlertCircle, Calendar, ShieldCheck, AlertTriangle, ListChecks, Download, Lock, Mail, Building2, RotateCcw, ExternalLink, CheckCircle2, Share2 } from 'lucide-react';
import EmailReportModal from './EmailReportModal';

// ─── Loading progress ────────────────────────────────────────────────────────

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
    const delays = [1200, 2200, 3500, 5000];
    let timeout;
    const advance = (i) => {
      if (i >= delays.length) return;
      timeout = setTimeout(() => { setStepIdx(i + 1); advance(i + 1); }, delays[i]);
    };
    advance(0);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="flex flex-col justify-center h-full px-4 py-8">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-5 text-center">
        Declawed AI is reading your lease
      </p>
      <div className="space-y-2">
        {ANALYSIS_STEPS.map((step, i) => {
          const done    = i < stepIdx;
          const active  = i === stepIdx;
          const pending = i > stepIdx;
          return (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: pending ? 0.25 : 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 border transition-all duration-500 ${
                active  ? 'border-blue-500/30 bg-blue-500/[0.05]' :
                done    ? 'border-white/[0.04] bg-white/[0.02]'   :
                          'border-transparent bg-transparent'
              }`}
            >
              <span className="text-sm w-4 text-center shrink-0">{step.icon}</span>
              <span className={`text-[12.5px] flex-1 transition-colors duration-300 ${
                active ? 'text-blue-300 font-medium' : done ? 'text-zinc-400' : 'text-zinc-700'
              }`}>
                {step.label}
              </span>
              {active && (
                <div className="w-3 h-3 border border-blue-500/40 border-t-blue-400 rounded-full animate-spin shrink-0" />
              )}
              {done && (
                <CheckCircle2 className="w-3 h-3 text-blue-500/70 shrink-0" />
              )}
            </motion.div>
          );
        })}
      </div>
      <p className="text-[11px] text-zinc-700 text-center mt-5">Usually 10–30 seconds</p>
    </div>
  );
}

// ─── Design system primitives ─────────────────────────────────────────────────

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

// Small label + full-width rule — used for every section header
function SectionRule({ icon: Icon, label, color = 'text-zinc-500', iconColor }) {
  return (
    <div className="flex items-center gap-2">
      {Icon && <Icon className={`w-3.5 h-3.5 ${iconColor ?? color} shrink-0`} />}
      <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${color} whitespace-nowrap`}>{label}</span>
      <div className="flex-1 h-px bg-white/[0.05]" />
    </div>
  );
}

// ─── Score colours (shared between StructuredSummary & AnonTeaser) ───────────

function scoreStyle(score) {
  const isRed   = score !== null && score <= 4;
  const isAmber = score !== null && score >= 5 && score <= 7;
  const isGreen = score !== null && score >= 8;
  return {
    color:  isRed ? 'text-rose-400'    : isAmber ? 'text-amber-400'    : isGreen ? 'text-emerald-400' : 'text-zinc-400',
    border: isRed ? 'border-rose-500/20' : isAmber ? 'border-amber-500/20' : isGreen ? 'border-emerald-500/20' : 'border-white/[0.07]',
    glow:   isRed ? 'bg-rose-500/[0.04]' : isAmber ? 'bg-amber-500/[0.04]' : isGreen ? 'bg-emerald-500/[0.04]' : 'bg-white/[0.02]',
    accent: isRed ? 'border-l-rose-500/60' : isAmber ? 'border-l-amber-400/60' : isGreen ? 'border-l-emerald-400/60' : 'border-l-white/20',
  };
}

// ─── Main report renderer ─────────────────────────────────────────────────────

function StructuredSummary({ data, landlordMode, scorePercentile }) {
  const score = typeof data.score === 'number' ? Math.max(1, Math.min(10, data.score)) : null;
  const { color, border, glow, accent } = scoreStyle(score);
  const scoreLabel = landlordMode
    ? (score <= 4 ? 'Poor landlord protection' : score <= 7 ? 'Moderate protection' : 'Strong landlord protection')
    : (score <= 4 ? 'Heavily favors landlord'  : score <= 7 ? 'Somewhat unfavorable' : 'Tenant-friendly');

  // Sort red flags: HIGH first, then MEDIUM, then LOW
  const sortedFlags = [...(data.redFlags ?? [])].sort((a, b) => {
    const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    const sa = order[typeof a === 'string' ? 'MEDIUM' : (a.severity ?? 'MEDIUM')] ?? 1;
    const sb = order[typeof b === 'string' ? 'MEDIUM' : (b.severity ?? 'MEDIUM')] ?? 1;
    return sa - sb;
  });

  return (
    <article className="space-y-6 text-[13px]">

      {/* ── Score hero ─────────────────────────────────────────────────────── */}
      {score !== null ? (
        <div className={`rounded-xl border-l-[3px] ${accent} border border-r-0 border-t-0 border-b-0 ${border} ${glow} p-5`}
          style={{ borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1 }}>
          <div className="flex items-start gap-5">
            {/* Score number */}
            <div className="shrink-0 flex items-baseline gap-1">
              <span className={`text-[64px] font-black leading-none tabular-nums ${color}`}>{score}</span>
              <span className="text-zinc-600 text-base font-semibold mb-1 leading-none">/10</span>
            </div>
            {/* Thin vertical rule */}
            <div className="w-px self-stretch bg-white/[0.07] shrink-0 mt-0.5" />
            {/* Verdict */}
            <div className="min-w-0 pt-0.5">
              <p className={`text-sm font-semibold leading-tight ${color}`}>{scoreLabel}</p>
              {data.verdict && (
                <p className="text-[13px] text-zinc-400 mt-2 leading-relaxed">{data.verdict}</p>
              )}
              {typeof scorePercentile === 'number' && (
                <p className="text-[11px] text-zinc-600 mt-2.5">
                  Better than{' '}
                  <span className="font-semibold text-zinc-400">{scorePercentile}%</span>{' '}
                  of leases analyzed
                </p>
              )}
            </div>
          </div>
        </div>
      ) : data.verdict ? (
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3.5">
          <p className="text-zinc-300 leading-relaxed">{data.verdict}</p>
        </div>
      ) : null}

      {/* ── Red Flags ──────────────────────────────────────────────────────── */}
      {sortedFlags.length > 0 && (
        <section className="space-y-3">
          <SectionRule
            icon={AlertCircle}
            label={landlordMode ? 'Landlord Risk Flags' : 'Red Flags'}
            color="text-zinc-500"
            iconColor="text-rose-500/70"
          />
          <div className="rounded-xl border border-white/[0.06] overflow-hidden">
            {sortedFlags.map((flag, i) => {
              const text     = typeof flag === 'string' ? flag : flag.text;
              const severity = typeof flag === 'string' ? 'MEDIUM' : (flag.severity ?? 'MEDIUM');
              return (
                <div
                  key={i}
                  className={`flex items-start gap-3 px-4 py-3 ${i > 0 ? 'border-t border-white/[0.04]' : ''}`}
                >
                  <span className="flex-1 text-[13px] text-zinc-300 leading-relaxed">{text}</span>
                  <SeverityBadge severity={severity} />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Key Dates ──────────────────────────────────────────────────────── */}
      {data.keyDates?.length > 0 && (
        <section className="space-y-3">
          <SectionRule icon={Calendar} label="Key Dates" color="text-zinc-500" iconColor="text-blue-400/70" />
          <div className="grid grid-cols-2 gap-1.5">
            {data.keyDates.map((item, i) => (
              <div key={i} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-zinc-600 mb-1 truncate">
                  {item.label}
                </p>
                <p className="text-[12.5px] text-zinc-200 font-medium leading-snug">{item.value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Tenant Rights ───────────────────────────────────────────────────── */}
      {data.tenantRights?.length > 0 && (
        <section className="space-y-3">
          <SectionRule
            icon={ShieldCheck}
            label={landlordMode ? 'Enforceable Tenant Obligations' : 'Your Rights'}
            color="text-zinc-500"
            iconColor="text-emerald-500/70"
          />
          <ul className="space-y-2.5">
            {data.tenantRights.map((right, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-[7px] w-[5px] h-[5px] rounded-full bg-emerald-500/70 shrink-0" />
                <span className="text-[13px] text-zinc-300 leading-relaxed">{right}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Unusual Clauses ─────────────────────────────────────────────────── */}
      {data.unusualClauses?.length > 0 && (
        <section className="space-y-3">
          <SectionRule
            icon={AlertTriangle}
            label="Unusual Clauses"
            color="text-zinc-500"
            iconColor="text-amber-400/70"
          />
          <div className="rounded-xl border border-white/[0.07] divide-y divide-white/[0.05] overflow-hidden">
            {data.unusualClauses.map((clause, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <span className="mt-[7px] w-[5px] h-[5px] rounded-full bg-amber-400/50 shrink-0" />
                <span className="text-[13px] text-zinc-400 leading-relaxed">{clause}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Action Steps ────────────────────────────────────────────────────── */}
      {data.actionSteps?.length > 0 && (
        <section className="space-y-3">
          <SectionRule
            icon={ListChecks}
            label={landlordMode ? 'Recommended Improvements' : 'Before you sign'}
            color="text-zinc-500"
            iconColor="text-blue-400/70"
          />
          <div className="rounded-xl border border-white/[0.07] overflow-hidden divide-y divide-white/[0.05]">
            {data.actionSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-3.5 px-4 py-3.5">
                <span className="mt-0.5 w-[18px] h-[18px] rounded-full border border-blue-500/25 bg-blue-500/[0.07] text-blue-400/80 text-[9px] font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="text-[13px] text-zinc-300 leading-relaxed">{step}</span>
              </div>
            ))}
          </div>
        </section>
      )}

    </article>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAID_PLANS  = new Set(['one', 'pro', 'unlimited']);
const EMAIL_PLANS = new Set(['pro', 'unlimited']);

// ─── Anonymous teaser ─────────────────────────────────────────────────────────

function AnonTeaser({ data, onSignUp, scorePercentile }) {
  const score = typeof data?.score === 'number' ? Math.max(1, Math.min(10, data.score)) : null;
  const { color, border, glow, accent } = scoreStyle(score);
  const scoreLabel = score <= 4 ? 'Heavily favors landlord' : score <= 7 ? 'Somewhat unfavorable' : 'Tenant-friendly';
  const previewFlags = (data?.redFlags || []).slice(0, 2);

  return (
    <div className="relative">
      <article className="space-y-5 text-[13px]">
        {/* Score hero — fully visible */}
        {score !== null && (
          <div
            className={`rounded-xl border-l-[3px] ${accent} border ${border} ${glow} p-5`}
            style={{ borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1 }}
          >
            <div className="flex items-start gap-5">
              <div className="shrink-0 flex items-baseline gap-1">
                <span className={`text-[64px] font-black leading-none tabular-nums ${color}`}>{score}</span>
                <span className="text-zinc-600 text-base font-semibold mb-1 leading-none">/10</span>
              </div>
              <div className="w-px self-stretch bg-white/[0.07] shrink-0 mt-0.5" />
              <div className="min-w-0 pt-0.5">
                <p className={`text-sm font-semibold leading-tight ${color}`}>{scoreLabel}</p>
                {data.verdict && (
                  <p className="text-[13px] text-zinc-400 mt-2 leading-relaxed">{data.verdict}</p>
                )}
                {typeof scorePercentile === 'number' && (
                  <p className="text-[11px] text-zinc-600 mt-2.5">
                    Better than{' '}
                    <span className="font-semibold text-zinc-400">{scorePercentile}%</span>{' '}
                    of leases analyzed
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* First 2 red flags visible */}
        {previewFlags.length > 0 && (
          <section className="space-y-3">
            <SectionRule icon={AlertCircle} label="Red Flags" color="text-zinc-500" iconColor="text-rose-500/70" />
            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
              {previewFlags.map((flag, i) => {
                const text     = typeof flag === 'string' ? flag : flag.text;
                const severity = typeof flag === 'string' ? 'MEDIUM' : (flag.severity ?? 'MEDIUM');
                return (
                  <div key={i} className={`flex items-start gap-3 px-4 py-3 ${i > 0 ? 'border-t border-white/[0.04]' : ''}`}>
                    <span className="flex-1 text-[13px] text-zinc-300 leading-relaxed">{text}</span>
                    <SeverityBadge severity={severity} />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Blurred placeholder sections */}
        <div className="pointer-events-none select-none blur-[5px] opacity-20 space-y-4">
          <div className="h-4 rounded bg-white/[0.06] w-1/3" />
          <div className="grid grid-cols-2 gap-1.5">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-12 rounded-lg bg-white/[0.04] border border-white/[0.06]" />)}
          </div>
          <div className="h-4 rounded bg-white/[0.06] w-1/4" />
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-8 rounded-lg bg-white/[0.03] border border-white/[0.05]" />)}
          </div>
        </div>
      </article>

      {/* Gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-[55%] bg-gradient-to-t from-[#0e0e16]/98 via-[#0e0e16]/70 to-transparent pointer-events-none" />

      {/* Sign-up gate */}
      <div className="absolute bottom-0 left-0 right-0 px-1 pb-1">
        <div className="w-full rounded-2xl border border-white/[0.08] bg-[#0e0e16]/95 backdrop-blur-md p-5 shadow-2xl">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-blue-400 shrink-0" />
            <p className="text-white font-semibold text-sm">
              {data?.redFlags?.length > 0
                ? `${data.redFlags.length} red flag${data.redFlags.length !== 1 ? 's' : ''} found — don't lose this`
                : 'See your full analysis'}
            </p>
          </div>
          <p className="text-zinc-500 text-[12px] mb-4 leading-relaxed">
            This analysis disappears when you close this tab. Sign up free to save it, unlock all sections, and get your action plan.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onSignUp?.('signup')}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-[13px] font-bold hover:bg-blue-500 active:scale-95 transition-all"
            >
              Save my report
            </button>
            <button
              onClick={() => onSignUp?.('signin')}
              className="flex-1 py-2.5 rounded-xl border border-white/[0.12] text-white text-[13px] font-medium hover:bg-white/[0.05] active:scale-95 transition-all"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function SummaryPanel({ summary, loading, error, modelTier, scorePercentile, usage, filename, onUpgrade, landlordMode, user, onSignUp, onRetry, shareToken }) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [shareState, setShareState] = useState('idle'); // idle | copying | copied

  const parsedSummary = (() => {
    if (!summary) return null;
    if (typeof summary === 'string') {
      try { return JSON.parse(summary); } catch { return { _parseError: true }; }
    }
    return summary;
  })();
  const summaryParseError = parsedSummary?._parseError === true;

  const handleShare = async () => {
    if (shareState === 'copying' || !shareToken) return;
    setShareState('copying');
    try {
      const shareUrl = `${window.location.origin}/shared/${shareToken}`;
      await navigator.clipboard.writeText(shareUrl);
      setShareState('copied');
      setTimeout(() => setShareState('idle'), 2500);
    } catch {
      setShareState('idle');
    }
  };

  const handleDownloadPDF = async () => {
    if (!PAID_PLANS.has(usage?.plan)) { onUpgrade?.(); return; }
    setPdfLoading(true);
    try {
      await new Promise(r => setTimeout(r, 50));
      const { generatePDF } = await import('../lib/generatePDF');
      generatePDF({ data: parsedSummary, filename, analysisDate: new Date() });
    } finally {
      setPdfLoading(false);
    }
  };

  const isLandlord = !!landlordMode;

  return (
    <motion.section
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className={`rounded-2xl flex flex-col overflow-hidden border transition-colors duration-300 ${
        isLandlord
          ? 'bg-[#0f0d07] border-amber-500/20'
          : 'bg-[#0a0a10] border-white/[0.08]'
      }`}
    >
      {/* ── Panel header ──────────────────────────────────────────────────── */}
      <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${isLandlord ? 'border-amber-500/15' : 'border-white/[0.06]'}`}>
        <FileCheck className={`w-4 h-4 shrink-0 ${isLandlord ? 'text-amber-400/70' : 'text-zinc-500'}`} />
        <h2 className="text-[13px] font-semibold text-zinc-300 tracking-tight">Analysis Report</h2>

        <div className="ml-auto flex items-center gap-2">
          {landlordMode && (
            <span className="flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-[0.1em] px-2 py-1 rounded-md bg-amber-500/10 text-amber-400/80 border border-amber-500/20">
              <Building2 className="w-2.5 h-2.5" />
              Landlord
            </span>
          )}
          {modelTier && (
            <span className={`flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-[0.1em] px-2 py-1 rounded-md border ${
              modelTier === 'advanced'
                ? 'bg-blue-500/[0.08] text-blue-400/70 border-blue-500/20'
                : 'bg-white/[0.03] text-zinc-600 border-white/[0.06]'
            }`}>
              <span className={`w-[5px] h-[5px] rounded-full ${modelTier === 'advanced' ? 'bg-blue-500' : 'bg-zinc-700'}`} />
              {modelTier === 'advanced' ? 'Advanced AI' : 'Standard AI'}
            </span>
          )}
        </div>
      </div>

      {/* ── Content area ──────────────────────────────────────────────────── */}
      <div className="relative flex-1">
        <div
          className="h-full max-h-[600px] min-h-[320px] overflow-y-auto p-5"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}
        >

          {/* Loading */}
          {loading && <AnalysisProgress />}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 py-10 gap-4">
              <div className="flex items-center gap-2 text-rose-400/80">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="text-sm text-zinc-400">{error}</p>
              </div>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[13px] font-medium text-zinc-400 hover:text-white hover:bg-white/[0.07] transition active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Retry analysis
                </button>
              )}
            </div>
          )}

          {/* Empty state — blurred preview */}
          {!loading && !error && !parsedSummary && (
            <div className="relative h-full min-h-[320px]">
              <article className="text-sm space-y-1 select-none pointer-events-none">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-[5px] h-[5px] rounded-full bg-rose-500/60" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-600">Red Flags</span>
                  <div className="flex-1 h-px bg-white/[0.04]" />
                </div>
                <div className="space-y-1.5 mb-5">
                  <div className="flex items-start gap-3 border-l-2 border-l-rose-500/60 pl-3.5 py-2.5">
                    <span className="text-zinc-300 leading-relaxed text-[13px]">Landlord may enter with only 12-hour notice — below the 24-hour standard in most states.</span>
                    <span className="flex items-center gap-1 shrink-0"><span className="w-[5px] h-[5px] rounded-full bg-rose-500" /><span className="text-[9.5px] font-bold uppercase text-rose-400/70">High</span></span>
                  </div>
                  <div className="flex items-start gap-3 border-l-2 border-l-amber-400/50 pl-3.5 py-2.5 blur-[2px] opacity-60">
                    <span className="text-zinc-300 leading-relaxed text-[13px]">Auto-renewal clause in Section 18 — requires 60-day written notice to exit.</span>
                  </div>
                </div>
                <div className="blur-[4px] opacity-40 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-[5px] h-[5px] rounded-full bg-blue-400/60" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-600">Key Dates</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[1,2,3,4].map(i => <div key={i} className="h-11 rounded-lg bg-white/[0.04] border border-white/[0.05]" />)}
                  </div>
                </div>
              </article>
              <div className="absolute bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-[#0a0a10] via-[#0a0a10]/70 to-transparent pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-6 text-center px-6">
                <p className="text-zinc-300 font-semibold text-sm">Upload your lease to see your full analysis</p>
                <p className="text-zinc-600 text-xs mt-1">Red flags, key dates & your rights — in plain English.</p>
              </div>
            </div>
          )}

          {/* Parse error */}
          {!loading && !error && summaryParseError && (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10 space-y-3">
              <AlertCircle className="w-7 h-7 text-rose-400/70" />
              <p className="text-sm font-semibold text-zinc-300">Couldn&rsquo;t display the analysis</p>
              <p className="text-xs text-zinc-600 leading-relaxed">
                The AI returned an unexpected format. Try uploading again or use a different file format.
              </p>
            </div>
          )}

          {/* Results */}
          {!loading && !error && parsedSummary && !summaryParseError && (
            user ? (
              <>
                <StructuredSummary
                  data={parsedSummary}
                  landlordMode={isLandlord}
                  scorePercentile={scorePercentile}
                />

                {/* ── Action toolbar ───────────────────────────────────────── */}
                <div className="mt-6 pt-4 border-t border-white/[0.05]">
                  <p className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-zinc-700 mb-2.5">What to do next</p>
                  <div className="grid grid-cols-4 gap-1.5">

                    {/* Copy link */}
                    <button
                      onClick={handleShare}
                      disabled={shareState === 'copying' || !shareToken}
                      className="group flex flex-col items-center gap-1.5 rounded-lg px-2 py-2.5 border border-blue-500/20 bg-blue-500/[0.05] hover:border-blue-500/40 hover:bg-blue-500/[0.09] transition-all disabled:opacity-50"
                    >
                      {shareState === 'copying' ? (
                        <div className="w-3.5 h-3.5 border border-blue-400/40 border-t-blue-400 rounded-full animate-spin" />
                      ) : shareState === 'copied' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5 text-blue-400/80" />
                      )}
                      <span className="text-[9.5px] font-semibold text-blue-400/70 group-hover:text-blue-300 text-center leading-tight transition">
                        {shareState === 'copying' ? '…' : shareState === 'copied' ? 'Copied!' : 'Share'}
                      </span>
                    </button>

                    {/* PDF */}
                    <button
                      onClick={handleDownloadPDF}
                      disabled={pdfLoading}
                      className="group flex flex-col items-center gap-1.5 rounded-lg px-2 py-2.5 border border-white/[0.06] bg-transparent hover:border-white/[0.12] hover:bg-white/[0.03] transition-all disabled:opacity-50"
                    >
                      {pdfLoading ? (
                        <div className="w-3.5 h-3.5 border border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
                      ) : (
                        <Download className={`w-3.5 h-3.5 ${PAID_PLANS.has(usage?.plan) ? 'text-zinc-400' : 'text-zinc-700'}`} />
                      )}
                      <span className="text-[9.5px] font-semibold text-zinc-500 group-hover:text-zinc-300 text-center leading-tight transition">
                        {PAID_PLANS.has(usage?.plan) ? 'PDF' : 'PDF ↑'}
                      </span>
                    </button>

                    {/* Email */}
                    <button
                      onClick={() => { if (!EMAIL_PLANS.has(usage?.plan)) { onUpgrade?.(); return; } setEmailModalOpen(true); }}
                      className="group flex flex-col items-center gap-1.5 rounded-lg px-2 py-2.5 border border-white/[0.06] bg-transparent hover:border-white/[0.12] hover:bg-white/[0.03] transition-all"
                    >
                      <Mail className={`w-3.5 h-3.5 ${EMAIL_PLANS.has(usage?.plan) ? 'text-zinc-400' : 'text-zinc-700'}`} />
                      <span className="text-[9.5px] font-semibold text-zinc-500 group-hover:text-zinc-300 text-center leading-tight transition">
                        {EMAIL_PLANS.has(usage?.plan) ? 'Email' : 'Email ↑'}
                      </span>
                    </button>

                    {/* Rights */}
                    <a
                      href="/tenant-rights"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col items-center gap-1.5 rounded-lg px-2 py-2.5 border border-white/[0.06] bg-transparent hover:border-white/[0.12] hover:bg-white/[0.03] transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition" />
                      <span className="text-[9.5px] font-semibold text-zinc-500 group-hover:text-zinc-300 text-center leading-tight transition">Rights</span>
                    </a>
                  </div>
                </div>

                {/* Attribution */}
                <p className="mt-3.5 text-[10.5px] text-zinc-700 flex items-center gap-1.5 pb-0.5">
                  <span className={`w-[5px] h-[5px] rounded-full shrink-0 ${modelTier === 'advanced' ? 'bg-blue-600' : 'bg-zinc-700'}`} />
                  Analyzed by Declawed AI
                  {modelTier && (
                    <span className={`ml-auto text-[10px] font-medium ${modelTier === 'advanced' ? 'text-blue-600' : 'text-zinc-700'}`}>
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
        {/* Scroll fade */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 rounded-b-2xl bg-gradient-to-t from-[#0a0a10]/90 to-transparent" />
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
