import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, LogOut, Zap, ChevronRight, X, AlertCircle, Calendar, ShieldCheck, AlertTriangle, FileCheck, Upload, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const PLAN_LABELS = {
  free: { label: 'Free', color: 'text-zinc-400', border: 'border-zinc-700/60' },
  one: { label: 'One Lease', color: 'text-cyan-400', border: 'border-cyan-700/60' },
  pro: { label: 'Pro', color: 'text-teal-400', border: 'border-teal-600/60' },
  unlimited: { label: 'Unlimited', color: 'text-emerald-400', border: 'border-emerald-700/60' },
};

const LogoMark = () => (
  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/25 shrink-0">
    <svg viewBox="0 0 20 20" fill="none" className="w-[14px] h-[14px]">
      <path d="M6 10V7a4 4 0 0 1 8 0v3" stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3.5" y="10" width="13" height="9" rx="2.5" fill="white" fillOpacity="0.95" />
      <circle cx="10" cy="14.5" r="1.4" fill="#0d9488" />
    </svg>
  </div>
);

function AnalysisModal({ analysis, onClose }) {
  const data = analysis?.result || {};
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm p-4 pt-16 overflow-y-auto"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-2xl rounded-2xl bg-[#0d0d14] border border-white/[0.08] shadow-2xl overflow-hidden"
        >
          {/* Modal header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <p className="text-sm font-semibold text-white truncate max-w-xs">{analysis.filename || 'Untitled document'}</p>
            </div>
            <div className="flex items-center gap-3">
              <time className="text-xs text-zinc-600">{new Date(analysis.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</time>
              <button onClick={onClose} className="text-zinc-600 hover:text-white transition p-1 rounded-lg hover:bg-white/[0.06]">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal body */}
          <div className="p-5 space-y-5 text-sm">
            {data.verdict && (
              <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-4">
                <p className="text-slate-200 leading-relaxed">{data.verdict}</p>
              </div>
            )}
            {data.redFlags?.length > 0 && (
              <section>
                <h3 className="flex items-center gap-1.5 text-rose-400 font-semibold mb-2.5">
                  <AlertCircle className="w-4 h-4" /> Red Flags
                </h3>
                <ul className="space-y-2">
                  {data.redFlags.map((flag, i) => (
                    <li key={i} className="flex gap-2 text-slate-300 leading-relaxed">
                      <span className="text-rose-500 mt-0.5 shrink-0">•</span>{flag}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {data.keyDates?.length > 0 && (
              <section>
                <h3 className="flex items-center gap-1.5 text-cyan-400 font-semibold mb-2.5">
                  <Calendar className="w-4 h-4" /> Key Dates
                </h3>
                <ul className="space-y-2">
                  {data.keyDates.map((item, i) => (
                    <li key={i} className="flex gap-2 text-slate-300 leading-relaxed">
                      <span className="text-cyan-500 font-medium shrink-0">{item.label}:</span>{item.value}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {data.tenantRights?.length > 0 && (
              <section>
                <h3 className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-2.5">
                  <ShieldCheck className="w-4 h-4" /> Your Rights
                </h3>
                <ul className="space-y-2">
                  {data.tenantRights.map((right, i) => (
                    <li key={i} className="flex gap-2 text-slate-300 leading-relaxed">
                      <span className="text-emerald-500 mt-0.5 shrink-0">•</span>{right}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {data.unusualClauses?.length > 0 && (
              <section>
                <h3 className="flex items-center gap-1.5 text-amber-400 font-semibold mb-2.5">
                  <AlertTriangle className="w-4 h-4" /> Unusual Clauses
                </h3>
                <ul className="space-y-2">
                  {data.unusualClauses.map((clause, i) => (
                    <li key={i} className="flex gap-2 text-slate-300 leading-relaxed">
                      <span className="text-amber-500 mt-0.5 shrink-0">•</span>{clause}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function Dashboard({ onClose, onUpgrade }) {
  const { user, profile, signOut } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('analyses')
      .select('id, filename, verdict, created_at, result')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setAnalyses(data || []);
        setLoadingHistory(false);
      });
  }, [user]);

  const plan = profile?.plan || 'free';
  const planInfo = PLAN_LABELS[plan] || PLAN_LABELS.free;
  const used = profile?.analyses_used ?? 0;
  const limit = profile?.analyses_limit ?? 1;
  const isUnlimited = plan === 'unlimited';

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  return (
    <>
    <div className="min-h-screen bg-[#07070d] text-slate-100">
      {/* Top nav */}
      <div className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#07070d]/90 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-[15px] font-bold tracking-tight text-white">Declawed</span>
          </a>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white transition"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-10">

        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">My Leases</h1>
          <p className="text-sm text-zinc-500 mt-1">{user?.email}</p>
        </div>

        {/* Plan card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border ${planInfo.border} bg-white/[0.03] p-6 mb-8`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-1.5">Current Plan</p>
              <span className={`text-2xl font-bold ${planInfo.color}`}>{planInfo.label}</span>
            </div>
            {plan === 'free' ? (
              <button
                onClick={onUpgrade}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 text-black text-sm font-bold hover:bg-teal-400 active:scale-95 transition-all shadow-lg shadow-teal-500/20"
              >
                <Zap className="w-3.5 h-3.5" />
                Upgrade
              </button>
            ) : (
              <span className="text-xs text-zinc-500 border border-zinc-800 rounded-full px-3 py-1">Active</span>
            )}
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
              <span>Analyses used</span>
              <span className="tabular-nums">{isUnlimited ? `${used} / ∞` : `${used} / ${limit}`}</span>
            </div>
            {!isUnlimited && (
              <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min((used / limit) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Analysis history */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07 }}
          className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-500" />
              Analysis History
            </h2>
            {analyses.length > 0 && (
              <span className="text-xs text-zinc-600">{analyses.length} lease{analyses.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          {loadingHistory ? (
            <div className="px-6 py-12 text-center text-sm text-zinc-600">Loading…</div>
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
              <p className="text-base font-semibold text-zinc-300 mb-1.5">No leases analyzed yet</p>
              <p className="text-sm text-zinc-600 max-w-xs leading-relaxed mb-6">Upload your first lease and Declawed AI will flag red flags, key dates, and your tenant rights — in plain English.</p>
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 active:scale-95 transition-all text-black text-sm font-bold shadow-lg shadow-teal-500/20"
              >
                <Upload className="w-4 h-4" />
                Analyze your first lease
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {analyses.map((a, i) => {
                const flags = a.result?.redFlags?.length ?? 0;
                const dates = a.result?.keyDates?.length ?? 0;
                return (
                  <motion.li
                    key={a.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setSelectedAnalysis(a)}
                    className="px-6 py-4 flex items-start gap-3 hover:bg-white/[0.025] active:bg-white/[0.04] cursor-pointer transition group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center shrink-0 mt-0.5 group-hover:border-teal-500/30 transition">
                      <FileText className="w-3.5 h-3.5 text-zinc-500 group-hover:text-teal-400 transition" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-200 truncate group-hover:text-white transition">{a.filename || 'Untitled document'}</p>
                      {a.verdict && (
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1 leading-relaxed">{a.verdict}</p>
                      )}
                      {/* Summary badges */}
                      <div className="flex items-center gap-2 mt-2">
                        {flags > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/20">
                            <AlertCircle className="w-2.5 h-2.5" />{flags} red flag{flags !== 1 ? 's' : ''}
                          </span>
                        )}
                        {dates > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/20">
                            <Calendar className="w-2.5 h-2.5" />{dates} key date{dates !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <time className="text-[11px] text-zinc-600">{new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</time>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-400 transition" />
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </motion.div>

        {/* Analyze another lease CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-8 rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-500/[0.06] to-cyan-500/[0.03] p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div>
            <p className="font-semibold text-white text-sm">Ready to analyze another lease?</p>
            <p className="text-xs text-zinc-500 mt-0.5">Catch hidden clauses before you sign.</p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 active:scale-95 transition-all text-black text-sm font-bold whitespace-nowrap shadow-lg shadow-teal-500/20"
          >
            <Upload className="w-4 h-4" />
            Analyze another lease
          </button>
        </motion.div>

        <div className="mt-6 text-center">
          <button onClick={onClose} className="inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-400 transition">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to app
          </button>
        </div>
      </div>
    </div>

    {/* Analysis detail modal */}
    {selectedAnalysis && (
      <AnalysisModal analysis={selectedAnalysis} onClose={() => setSelectedAnalysis(null)} />
    )}
    </>
  );
}
