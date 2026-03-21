import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Zap, ChevronRight, X, AlertCircle, Calendar, ShieldCheck, AlertTriangle, FileCheck, Upload, ArrowLeft, ListChecks, RefreshCw, FileImage, Loader2, Download, Pencil, Share2, RotateCcw, Copy, Check, Users, ShieldAlert } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import AppShell from './AppShell';

const PLAN_LABELS = {
  free:      { label: 'Free',      color: 'text-zinc-400',    border: 'border-zinc-700/60',    progress: 'bg-blue-600',    badge: 'FREE PLAN'  },
  one:       { label: 'One Lease', color: 'text-cyan-400',    border: 'border-cyan-700/60',    progress: 'bg-cyan-500',    badge: 'ONE LEASE'  },
  pro:       { label: 'Pro',       color: 'text-teal-400',    border: 'border-teal-600/60',    progress: 'bg-teal-500',    badge: 'PRO PLAN'   },
  unlimited: { label: 'Unlimited', color: 'text-emerald-400', border: 'border-emerald-700/60', progress: 'bg-emerald-500', badge: 'UNLIMITED'  },
};

const PLAN_FEATURES = {
  free:      ['1 free analysis', 'Standard Declawed AI', 'Red flags & key dates'],
  one:       ['1 full analysis', 'Advanced Declawed AI', 'PDF report download', '7-day money-back guarantee'],
  pro:       ['10 analyses / month', 'Advanced Declawed AI', 'PDF report download', 'Email report to yourself', 'Full analysis history', 'Priority processing'],
  unlimited: ['Unlimited analyses', 'Advanced Declawed AI', 'Everything in Pro', 'Landlord Mode', 'Priority support'],
};

import AnalysisModal, { SeverityBadge } from './AnalysisModal';

function cleanVerdict(v) {
  if (!v || typeof v !== 'string') return '';
  const t = v.trim();
  if (t.startsWith('{') || t.startsWith('`') || t.startsWith('```')) return '';
  return t;
}

export default function Dashboard({ onClose, onUpgrade }) {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [refCopied, setRefCopied] = useState(false);
  const [toast, setToast] = useState(null);
  const [shareLoadingIds, setShareLoadingIds] = useState(new Set());
  const [usage, setUsage] = useState(null);
  const [referralCount, setReferralCount] = useState(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('analyses')
      .select('id, filename, verdict, created_at, result, note, share_token')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setAnalyses(data || []);
        setLoadingHistory(false);
      });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchUsage = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers = {};
        if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
        const res = await fetch('/api/usage', { headers });
        if (res.ok) setUsage(await res.json());
      } catch {
        // ignore
      }
    };
    fetchUsage();
  }, [user]);

  useEffect(() => {
    if (user) refreshProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('referred_by', user.id)
      .eq('referral_reward_given', true)
      .then(({ count }) => { if (count !== null) setReferralCount(count); });
  }, [user]);

  const plan = (usage?.plan || 'free').toLowerCase();
  const planInfo = PLAN_LABELS[plan] || PLAN_LABELS.free;
  const used = usage?.used ?? 0;
  const limit = usage?.limit ?? 1;
  const isUnlimited = plan === 'unlimited';
  const fullDisplayName = user?.user_metadata?.full_name || profile?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'there';
  const displayName = fullDisplayName.split(' ')[0];

  // Computed stats from analysis history
  const totalRedFlags = analyses.reduce((s, a) => s + (a.result?.redFlags?.length ?? 0), 0);
  const riskiest = analyses.length
    ? analyses.reduce((m, a) => ((a.result?.score ?? 11) < (m.result?.score ?? 11)) ? a : m)
    : null;
  const avatarInitials = fullDisplayName.slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  function handleNoteUpdate(id, newNote) {
    setAnalyses((prev) => prev.map((a) => (a.id === id ? { ...a, note: newNote } : a)));
  }

  async function handleReanalyzeComplete() {
    const { data } = await supabase
      .from('analyses')
      .select('id, filename, verdict, created_at, result, note, share_token')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setAnalyses(data || []);
    setSelectedAnalysis(null);
    setToast('Re-analysis complete! New result added to your history.');
    setTimeout(() => setToast(null), 4000);
  }

  async function shareFromList(e, a) {
    e.stopPropagation();
    const id = a.id;
    if (shareLoadingIds.has(id)) return;
    setShareLoadingIds((prev) => new Set([...prev, id]));
    try {
      let token = a.share_token;
      if (!token) {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
          body: JSON.stringify({ analysis_id: id }),
        });
        const d = await res.json();
        token = d.share_token;
        if (token) setAnalyses((prev) => prev.map((item) => item.id === id ? { ...item, share_token: token } : item));
      }
      if (token) {
        await navigator.clipboard.writeText(`https://declawed.app/shared/${token}`);
        setToast('Share link copied to clipboard!');
        setTimeout(() => setToast(null), 3000);
      }
    } catch {
      setToast('Failed to copy link — try again.');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setShareLoadingIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    }
  }

  function handleCopyRef() {
    navigator.clipboard.writeText(`https://declawed.app/?ref=${user.id}`);
    setRefCopied(true);
    setTimeout(() => setRefCopied(false), 2500);
  }

  return (
    <>
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-5 sm:px-6 sm:py-8">

        {/* Page header */}
        <div className="mb-7 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">Welcome back, {displayName}</h1>
            <p className="text-sm text-zinc-500 mt-0.5 truncate max-w-[180px] sm:max-w-none">{user?.email}</p>
          </div>
          <a
            href="/analyze"
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.02] text-sm font-medium text-zinc-400 hover:text-white hover:border-white/[0.15] transition shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New analysis</span>
          </a>
        </div>

        {/* Plan card */}
        {!usage ? (
          <div className="rounded-xl border border-white/[0.06] bg-[#0b0b12] p-5 mb-5 animate-pulse">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-2">
                <div className="h-4 w-16 rounded bg-white/[0.06]" />
                <div className="h-6 w-28 rounded bg-white/[0.06]" />
                <div className="h-3 w-20 rounded bg-white/[0.04]" />
              </div>
              <div className="h-8 w-24 rounded-lg bg-white/[0.05]" />
            </div>
            <div className="pt-4 border-t border-white/[0.05]">
              <div className="flex justify-between mb-2">
                <div className="h-3 w-24 rounded bg-white/[0.04]" />
                <div className="h-3 w-12 rounded bg-white/[0.04]" />
              </div>
              <div className="h-1 rounded-full bg-white/[0.04]" />
            </div>
          </div>
        ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl border ${planInfo.border} bg-[#0b0b12] p-5 mb-5`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <span className={`inline-block text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded border ${planInfo.border} ${planInfo.color} mb-2 opacity-70`}>
                {planInfo.badge}
              </span>
              <p className={`text-xl font-bold ${planInfo.color} leading-tight`}>{planInfo.label}</p>
              <p className="text-[11px] text-zinc-600 mt-0.5">Your current plan</p>
            </div>
            {plan === 'free' ? (
              <a
                href="/billing"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 active:scale-95 transition-all shadow-lg shadow-blue-600/20 whitespace-nowrap shrink-0"
              >
                <Zap className="w-3.5 h-3.5" />
                Upgrade to Pro
              </a>
            ) : (
              <a
                href="/billing"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] text-xs font-medium text-zinc-400 hover:text-white hover:border-white/[0.15] transition whitespace-nowrap shrink-0"
              >
                Manage plan →
              </a>
            )}
          </div>

          {/* Plan features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mb-4">
            {(PLAN_FEATURES[plan] || []).map((feat, i) => (
              <p key={i} className="flex items-center gap-1.5 text-xs text-zinc-500 min-w-0">
                <span className={`${planInfo.color} shrink-0`}>✓</span>
                <span className="truncate">{feat}</span>
              </p>
            ))}
          </div>

          <div className="pt-4 border-t border-white/[0.05]">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
              <span>Analyses used</span>
              <span className={`font-semibold tabular-nums ${planInfo.color}`}>{isUnlimited ? `${used} / ∞` : `${used} / ${limit}`}</span>
            </div>
            {!isUnlimited && (
              <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                <div
                  className={`h-full ${planInfo.progress} rounded-full transition-all duration-700`}
                  style={{ width: `${Math.min((used / limit) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>

        </motion.div>
        )}

        {/* Quick Stats row */}
        {loadingHistory ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 mb-5 sm:mb-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-xl bg-[#0b0b12] border border-white/[0.06] px-3 py-4 sm:px-5 sm:py-5 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-white/[0.05] mb-3" />
                <div className="h-7 w-10 rounded bg-white/[0.05] mb-2" />
                <div className="h-3 w-20 rounded bg-white/[0.04]" />
              </div>
            ))}
          </div>
        ) : analyses.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 mb-5 sm:mb-6"
          >
            {[
              {
                icon: FileText,
                label: 'Total Analyses',
                value: analyses.length,
                sub: 'leases reviewed',
                valueColor: 'text-blue-400',
                iconBg: 'bg-blue-600/10 border-blue-600/20',
                iconColor: 'text-blue-400',
              },
              {
                icon: AlertTriangle,
                label: 'Red Flags Found',
                value: totalRedFlags,
                sub: 'across all leases',
                valueColor: 'text-rose-400',
                iconBg: 'bg-rose-500/10 border-rose-500/20',
                iconColor: 'text-rose-400',
              },
              {
                icon: ShieldAlert,
                label: 'Highest Risk',
                value: riskiest == null || riskiest.result?.score == null ? '—'
                  : riskiest.result.score <= 4 ? 'High'
                  : riskiest.result.score <= 7 ? 'Medium'
                  : 'Low',
                sub: riskiest?.result?.score != null ? `Score: ${riskiest.result.score}/10` : 'no analyses yet',
                valueColor: riskiest?.result?.score == null ? 'text-zinc-500'
                  : riskiest.result.score <= 4 ? 'text-rose-400'
                  : riskiest.result.score <= 7 ? 'text-amber-400'
                  : 'text-emerald-400',
                iconBg: riskiest?.result?.score == null ? 'bg-zinc-800/60 border-zinc-700/40'
                  : riskiest.result.score <= 4 ? 'bg-rose-500/10 border-rose-500/20'
                  : riskiest.result.score <= 7 ? 'bg-amber-500/10 border-amber-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/20',
                iconColor: riskiest?.result?.score == null ? 'text-zinc-600'
                  : riskiest.result.score <= 4 ? 'text-rose-400'
                  : riskiest.result.score <= 7 ? 'text-amber-400'
                  : 'text-emerald-400',
              },
            ].map(({ icon: Icon, label, value, sub, valueColor, iconBg, iconColor }) => (
              <div key={label} className="rounded-xl bg-[#0b0b12] border border-white/[0.06] px-3 py-4 sm:px-5 sm:py-5">
                <div className={`w-8 h-8 rounded-lg border ${iconBg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${iconColor}`} />
                </div>
                <p className={`text-2xl font-bold tabular-nums ${valueColor}`}>{value}</p>
                <p className="text-[12px] font-medium text-zinc-400 mt-0.5">{label}</p>
                <p className="text-[11px] text-zinc-600 mt-0.5">{sub}</p>
              </div>
            ))}
          </motion.div>
        ) : null}

        {/* Analysis history */}
        <motion.div
          id="history"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07 }}
          className="rounded-xl border border-white/[0.07] bg-[#0b0b12] overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-500" />
              Recent Analyses
            </h2>
            {analyses.length > 0 && (
              <span className="text-xs text-zinc-600">{analyses.length} lease{analyses.length !== 1 ? 's' : ''} analyzed</span>
            )}
          </div>

          {loadingHistory ? (
            <div className="divide-y divide-white/[0.04]">
              {[0, 1, 2].map((i) => (
                <div key={i} className="px-4 py-4 sm:px-6 flex items-start gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.05] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="h-4 w-2/3 rounded bg-white/[0.05]" />
                    <div className="h-3 w-1/2 rounded bg-white/[0.04]" />
                    <div className="flex gap-2">
                      <div className="h-4 w-16 rounded bg-white/[0.04]" />
                      <div className="h-4 w-16 rounded bg-white/[0.04]" />
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-white/[0.05] shrink-0" />
                </div>
              ))}
            </div>
          ) : analyses.length === 0 ? (
            /* Empty state */
            <div className="px-6 py-14 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-center mb-5">
                <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10" xmlns="http://www.w3.org/2000/svg">
                  <rect x="10" y="6" width="36" height="46" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1.5"/>
                  <rect x="15" y="16" width="18" height="2.5" rx="1.25" fill="#475569"/>
                  <rect x="15" y="23" width="26" height="2.5" rx="1.25" fill="#334155"/>
                  <rect x="15" y="30" width="22" height="2.5" rx="1.25" fill="#334155"/>
                  <rect x="15" y="37" width="14" height="2.5" rx="1.25" fill="#334155"/>
                  <circle cx="47" cy="47" r="13" fill="#0d1117" stroke="#0d9488" strokeWidth="1.5"/>
                  <path d="M43 47l3 3 6-6" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-base font-semibold text-zinc-300 mb-1.5">Welcome to Declawed!</p>
              <p className="text-sm text-zinc-600 max-w-xs leading-relaxed mb-5">Analyze your first lease and get a full breakdown of red flags, key dates, and your rights — in plain English.</p>
              <div className="w-full max-w-xs text-left space-y-3 mb-7">
                {[
                  'Upload a lease PDF, Word doc, or image',
                  'AI flags red flags, key dates & action steps in ~30s',
                  'Review your analysis here and export a PDF report',
                ].map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600/20 border border-blue-600/30 text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                    <p className="text-xs text-zinc-500 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
              <a
                href="/"
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all text-white text-sm font-semibold shadow-lg shadow-blue-600/20"
              >
                <Upload className="w-4 h-4" />
                Analyze your first lease
              </a>
            </div>
          ) : (
            <>
            <ul className="divide-y divide-white/[0.04]">
              {analyses.slice(0, 3).map((a, i) => {
                const flags = a.result?.redFlags?.length ?? 0;
                const dates = a.result?.keyDates?.length ?? 0;
                const score = a.result?.score ?? null;
                const scoreIsRed = score !== null && score <= 4;
                const scoreIsYellow = score !== null && score >= 5 && score <= 7;
                const scoreIsGreen = score !== null && score >= 8;
                const scoreColor = scoreIsRed ? 'text-rose-400 border-rose-500/40 bg-rose-500/10' : scoreIsYellow ? 'text-amber-400 border-amber-500/40 bg-amber-500/10' : scoreIsGreen ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' : 'text-zinc-500 border-zinc-700 bg-zinc-800/40';
                return (
                  <motion.li
                    key={a.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setSelectedAnalysis(a)}
                    className="relative px-4 py-4 sm:px-6 flex items-start gap-3 cursor-pointer transition-all group border-l-2 border-transparent hover:border-blue-500/40 hover:bg-white/[0.03] active:bg-white/[0.04]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center shrink-0 mt-0.5 group-hover:border-blue-500/30 transition">
                      <FileText className="w-3.5 h-3.5 text-zinc-500 group-hover:text-blue-400 transition" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-200 truncate group-hover:text-white transition">{a.filename || 'Untitled document'}</p>
                      {cleanVerdict(a.verdict) && (
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1 leading-relaxed">{cleanVerdict(a.verdict)}</p>
                      )}
                      {/* Summary badges */}
                      <div className="flex items-center gap-2 mt-2">
                        {flags > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/20">
                            <AlertCircle className="w-2.5 h-2.5" />{flags} red flag{flags !== 1 ? 's' : ''}
                          </span>
                        )}
                        {dates > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <Calendar className="w-2.5 h-2.5" />{dates} key date{dates !== 1 ? 's' : ''}
                          </span>
                        )}
                        {a.note && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-white/[0.04] text-zinc-500 border border-white/[0.06]">
                            <Pencil className="w-2.5 h-2.5" /> note
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {score !== null && (
                        <span className={`w-7 h-7 rounded-full border text-[11px] font-extrabold flex items-center justify-center ${scoreColor}`}>
                          {Math.max(1, Math.min(10, score))}
                        </span>
                      )}
                      <time className="text-[11px] text-zinc-600">{new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</time>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedAnalysis(a); }}
                          title="Add / edit note"
                          className={`p-1 rounded transition ${a.note ? 'text-teal-500 hover:text-teal-400' : 'text-zinc-700 hover:text-zinc-400'}`}
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => shareFromList(e, a)}
                          title="Copy share link"
                          className="p-1 rounded text-zinc-700 hover:text-zinc-400 transition"
                        >
                          {shareLoadingIds.has(a.id)
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <Share2 className="w-3 h-3" />}
                        </button>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-400 transition" />
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
            <div className="px-6 py-3.5 border-t border-white/[0.04]">
              <a
                href="/analysis-history"
                className="text-xs font-medium text-blue-400 hover:text-blue-300 transition"
              >
                View all analyses →
              </a>
            </div>
            </>
          )}
        </motion.div>

        {/* Analyze another lease CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-6 rounded-xl border border-blue-600/20 bg-blue-600/[0.04] p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div>
            <p className="font-semibold text-white text-sm">Ready to analyze another lease?</p>
            <p className="text-xs text-zinc-500 mt-0.5">Catch hidden clauses before you sign.</p>
          </div>
          <a
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all text-white text-sm font-semibold whitespace-nowrap shadow-lg shadow-blue-600/20"
          >
            <Upload className="w-4 h-4" />
            New analysis
          </a>
        </motion.div>

        {/* Referral section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-5"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-violet-400" />
              <p className="font-semibold text-white text-sm">Share Declawed with a friend</p>
            </div>
            {referralCount !== null && referralCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-300">
                +{referralCount} reward{referralCount !== 1 ? 's' : ''} earned
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
            Each friend who analyzes a lease earns you <span className="text-zinc-300 font-medium">+1 free analysis</span>. Share your link:
          </p>
          <div className="flex gap-2">
            <div className="flex-1 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-xs text-zinc-400 font-mono truncate select-all">
              https://declawed.app/?ref={user?.id}
            </div>
            <button
              onClick={handleCopyRef}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-500/15 border border-violet-500/25 text-xs font-semibold text-violet-400 hover:bg-violet-500/25 hover:text-violet-300 transition whitespace-nowrap"
            >
              {refCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {refCopied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
        </motion.div>
      </div>
    </AppShell>

    {/* Analysis detail modal */}
    {selectedAnalysis && (
      <AnalysisModal
        analysis={selectedAnalysis}
        onClose={() => setSelectedAnalysis(null)}
        onNoteUpdate={handleNoteUpdate}
        onReanalyzeComplete={handleReanalyzeComplete}
        onUpgrade={onUpgrade}
        userName={fullDisplayName}
      />
    )}

    {/* Toast notification */}
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-xl shadow-blue-600/25 whitespace-nowrap"
        >
          {toast}
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
