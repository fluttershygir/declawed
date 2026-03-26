import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, ExternalLink, Zap, Gift, Infinity, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import AppShell from '../components/AppShell';


const PLAN_INFO = {
  free: {
    label: 'Free',
    color: 'text-zinc-400',
    barColor: 'bg-zinc-400',
    border: 'border-zinc-700/60',
    bg: 'bg-zinc-500/[0.03]',
    features: [
      '1 free analysis',
      'Standard Declawed AI',
      'Red flags & key dates',
      'No credit card required',
    ],
    isPaid: false,
    isSubscription: false,
  },
  // Legacy 'one' plan — keep for existing users
  one: {
    label: 'One Lease (Legacy)',
    color: 'text-blue-400',
    barColor: 'bg-blue-400',
    border: 'border-blue-700/60',
    bg: 'bg-blue-500/[0.04]',
    features: [
      '1 full analysis',
      'Advanced Declawed AI',
      'PDF, Word & PNG export',
      'Email report',
      '7-day money-back guarantee',
    ],
    isPaid: true,
    isSubscription: false,
  },
  pro: {
    label: 'Pro',
    color: 'text-blue-400',
    barColor: 'bg-blue-400',
    border: 'border-blue-600/60',
    bg: 'bg-blue-500/[0.04]',
    features: [
      '15 analyses / month',
      'Advanced Declawed AI',
      'PDF report download',
      'Email report to yourself',
      'Full analysis history',
      'Priority processing',
    ],
    isPaid: true,
    isSubscription: true,
  },
  unlimited: {
    label: 'Unlimited',
    color: 'text-emerald-400',
    barColor: 'bg-emerald-400',
    border: 'border-emerald-700/60',
    bg: 'bg-emerald-500/[0.04]',
    features: [
      'Unlimited analyses',
      'Advanced Declawed AI',
      'Everything in Pro',
      'Landlord Mode',
      'Priority support',
    ],
    isPaid: true,
    isSubscription: true,
  },
};

export default function Billing() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError,   setPortalError]   = useState('');
  const [usage,         setUsage]         = useState(null);
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundResult,  setRefundResult]  = useState(null);

  // Use the usage API for the authoritative plan — same as Dashboard
  const plan     = (usage?.plan || profile?.plan || 'free').toLowerCase();
  const planInfo = PLAN_INFO[plan] || PLAN_INFO.free;

  // Always fetch the latest profile on mount so plan changes (webhook, manual update) reflect immediately
  useEffect(() => {
    if (user) refreshProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (!authLoading && !user) window.location.href = '/';
  }, [authLoading, user]);

  const handleRefund = async () => {
    setRefundLoading(true);
    setRefundResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      const data = await res.json();
      if (data.ok) {
        await refreshProfile();
        setUsage(null); // will re-fetch on next render
        setRefundResult({ ok: true, message: 'Refund processed. Your plan has been reverted to Free.' });
      } else {
        setRefundResult({ ok: false, message: data.message || 'Refund could not be processed.' });
      }
    } catch {
      setRefundResult({ ok: false, message: 'Something went wrong. Please try again.' });
    } finally {
      setRefundLoading(false);
    }
  };

  async function handleOpenPortal() {
    setPortalLoading(true);
    setPortalError('');
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/create-portal-session', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (data.url) {
      window.location.href = data.url;
    } else {
      setPortalError(data.error || 'Could not open billing portal. Please try again or contact support.');
      setPortalLoading(false);
    }
  }

  const used  = usage?.used  ?? profile?.analyses_used  ?? 0;
  const limit = usage?.limit ?? profile?.analyses_limit ?? 1;
  const limitIsUnlimited = limit >= 9999;
  const usagePct = limitIsUnlimited ? 0 : Math.min(100, (used / limit) * 100);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#07070d] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-600" />
      </div>
    );
  }

  // Not logged in — redirect guard (useEffect handles navigation)
  if (!user) return null;

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-5 sm:px-6 sm:py-8">

        {/* Page header */}
        <div className="mb-7">
          <h1 className="text-xl font-semibold text-white tracking-tight">Billing &amp; Plan</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Manage your subscription, usage, and payment details</p>
        </div>

        {/* ─── Current plan card ───────────────────────── */}
        {usage === null ? (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 mb-5 animate-pulse">
            <div className="h-3 w-24 rounded bg-white/[0.05] mb-3" />
            <div className="h-7 w-36 rounded bg-white/[0.06] mb-5" />
            <div className="space-y-2.5 mb-5">
              {[80, 60, 70, 50].map(w => (
                <div key={w} className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded bg-white/[0.05] shrink-0" />
                  <div className={`h-3 rounded bg-white/[0.04]`} style={{ width: `${w}%` }} />
                </div>
              ))}
            </div>
            <div className="pt-5 border-t border-white/[0.05]">
              <div className="flex justify-between mb-2">
                <div className="h-3.5 w-32 rounded bg-white/[0.05]" />
                <div className="h-3.5 w-16 rounded bg-white/[0.05]" />
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.04]" />
            </div>
          </div>
        ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={`rounded-2xl border ${planInfo.border} ${planInfo.bg} p-6 mb-5`}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-1.5">Current Plan</p>
          <span className={`text-2xl font-bold ${planInfo.color}`}>{planInfo.label}</span>

          {/* Feature list */}
          <ul className="mt-5 space-y-2">
            {planInfo.features.map((feat) => (
              <li key={feat} className="flex items-center gap-2 text-[13px] text-zinc-400">
                <Check className={`w-3.5 h-3.5 shrink-0 ${planInfo.color}`} />
                {feat}
              </li>
            ))}
          </ul>

          {/* Usage bar */}
          {(usage || profile) && (
            <div className="mt-5 pt-5 border-t border-white/[0.06]">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-zinc-500">Analyses used this period</span>
                <span className={`font-semibold ${planInfo.color}`}>
                  {used}{limitIsUnlimited ? ' / ∞' : ` / ${limit}`}
                </span>
              </div>
              {!limitIsUnlimited && (
                <div className="w-full rounded-full bg-white/[0.06] h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${planInfo.barColor}`}
                    style={{ width: `${usagePct}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </motion.div>
        )}

        {/* ─── 7-day guarantee / refund ────────────────── */}
        {planInfo.isPaid && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 mb-5"
          >
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <p className="text-sm font-semibold text-white">7-day money-back guarantee</p>
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed mb-4">
              Not satisfied? Request a full refund within 7 days of your purchase — no questions asked.
            </p>

            {refundResult ? (
              <p className={`text-sm font-medium ${refundResult.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                {refundResult.message}
              </p>
            ) : (
              <button
                onClick={handleRefund}
                disabled={refundLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.08] text-sm text-zinc-400 hover:text-white hover:border-white/20 transition disabled:opacity-50"
              >
                {refundLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {refundLoading ? 'Processing…' : 'Request refund'}
              </button>
            )}
          </motion.div>
        )}

        {/* ─── Free: upgrade nudge ─────────────────────── */}
        {plan === 'free' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-blue-600/20 bg-blue-600/[0.04] p-6 mb-5"
          >
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-white">Upgrade for unlimited analyses</h2>
            </div>
            <p className="text-sm text-zinc-500 mb-5 leading-relaxed">
              Get advanced Declawed AI, full history, PDF exports, and more with a paid plan.
            </p>
            <a
              href="/#pricing"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 active:scale-95 transition shadow-lg shadow-blue-600/20"
            >
              View plans →
            </a>
          </motion.div>
        )}

        {/* ─── One-time legacy notice ───────────────────── */}
        {planInfo.isPaid && !planInfo.isSubscription && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 mb-5"
          >
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-4 h-4 text-blue-400" />
              <p className="text-sm font-semibold text-white">Legacy one-time purchase</p>
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Your One Lease plan was a one-time payment. When you're ready for more analyses,{' '}
              <a href="/#pricing" className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition">
                upgrade to Pro or Unlimited
              </a>
              .
            </p>
          </motion.div>
        )}

        {/* ─── Subscription: Stripe portal ─────────────── */}
        {planInfo.isPaid && planInfo.isSubscription && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 mb-5"
          >
            <h2 className="text-sm font-semibold text-white mb-1">Manage your subscription</h2>
            <p className="text-sm text-zinc-500 leading-relaxed mb-5">
              Update your payment method, download invoices, or cancel your subscription through the secure billing portal.
            </p>

            {portalError && (
              <p className="text-xs text-rose-400 mb-3 flex items-start gap-1.5">
                <span className="shrink-0 mt-0.5">⚠</span>
                {portalError}
              </p>
            )}

            <button
              onClick={handleOpenPortal}
              disabled={portalLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.09] text-sm text-zinc-300 hover:text-white hover:bg-white/[0.09] hover:border-white/20 transition disabled:opacity-50"
            >
              {portalLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <ExternalLink className="w-4 h-4" />
              }
              {portalLoading ? 'Opening portal…' : 'Manage subscription'}
            </button>

            <p className="mt-3 text-[11px] text-zinc-600">
              You'll be redirected to Stripe's secure portal. You can return to Declawed at any time.
            </p>
          </motion.div>
        )}

        {/* ─── Unlimited: highlight ────────────────────── */}
        {plan === 'unlimited' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-5 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
              <Infinity className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-300">You're on Unlimited</p>
              <p className="text-xs text-zinc-500 mt-0.5">Analyze as many leases as you need, every month.</p>
            </div>
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
