import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, LogOut, User, Zap, Infinity as InfinityIcon, CreditCard, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const PLAN_LABELS = {
  free: { label: 'Free', color: 'text-zinc-400', border: 'border-zinc-700' },
  one: { label: 'One Lease', color: 'text-cyan-400', border: 'border-cyan-700' },
  pro: { label: 'Pro', color: 'text-teal-400', border: 'border-teal-600' },
  unlimited: { label: 'Unlimited', color: 'text-emerald-400', border: 'border-emerald-700' },
};

export default function Dashboard({ onClose, onUpgrade }) {
  const { user, profile, signOut } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('analyses')
      .select('id, filename, verdict, created_at')
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
    <div className="min-h-screen bg-black text-slate-100">
      <div className="max-w-3xl mx-auto px-5 py-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-zinc-500 mt-0.5">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white transition"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>

        {/* Plan card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border ${planInfo.border} bg-white/[0.03] p-6 mb-6`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-600 mb-1">Current Plan</p>
              <div className="flex items-center gap-2">
                <span className={`text-xl font-bold ${planInfo.color}`}>{planInfo.label}</span>
              </div>
            </div>
            {plan === 'free' && (
              <button
                onClick={onUpgrade}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-500 text-black text-sm font-semibold hover:bg-teal-400 transition"
              >
                <Zap className="w-3.5 h-3.5" />
                Upgrade
              </button>
            )}
            {plan !== 'free' && (
              <span className="text-xs text-zinc-600 border border-zinc-800 rounded-full px-3 py-1">Active</span>
            )}
          </div>

          {/* Usage bar */}
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
              <span>Analyses used</span>
              <span>{isUnlimited ? `${used} / ∞` : `${used} / ${limit}`}</span>
            </div>
            {!isUnlimited && (
              <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full transition-all"
                  style={{ width: `${Math.min((used / limit) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Analysis history */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-500" />
              Analysis History
            </h2>
          </div>

          {loadingHistory ? (
            <div className="px-5 py-8 text-center text-sm text-zinc-600">Loading…</div>
          ) : analyses.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <FileText className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-600">No analyses yet.</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-medium hover:bg-teal-500/20 transition"
              >
                Analyze your first lease →
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {analyses.map((a) => (
                <li key={a.id} className="px-5 py-4 flex items-start gap-3 hover:bg-white/[0.02] transition">
                  <FileText className="w-4 h-4 text-zinc-600 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-300 truncate">{a.filename || 'Untitled document'}</p>
                    {a.verdict && (
                      <p className="text-xs text-zinc-600 mt-0.5 line-clamp-2">{a.verdict}</p>
                    )}
                  </div>
                  <time className="text-[11px] text-zinc-700 shrink-0">
                    {new Date(a.created_at).toLocaleDateString()}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 text-center">
          <button onClick={onClose} className="text-sm text-zinc-600 hover:text-zinc-400 transition">
            ← Back to app
          </button>
        </div>
      </div>
    </div>
  );
}
