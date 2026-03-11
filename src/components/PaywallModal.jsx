import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Infinity, CreditCard } from 'lucide-react';

const API_BASE = '/api';

export default function PaywallModal({ open, onClose }) {
  const [loading, setLoading] = useState(null);

  const startCheckout = async (tier) => {
    setLoading(tier);
    try {
      const res = await fetch(`${API_BASE}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setLoading(null);
    } catch {
      setLoading(null);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl shadow-cyan-500/10 p-6 relative"
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-slate-400 hover:text-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-xl font-semibold text-slate-100 pr-8">
            You&apos;ve used your free summary
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            Unlock more AI-powered lease reviews. Secure payment via Stripe.
          </p>

          <div className="mt-6 space-y-3">
            <button
              onClick={() => startCheckout('five')}
              disabled={loading}
              className="w-full flex items-center gap-3 rounded-xl border border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20 py-3 px-4 transition disabled:opacity-60"
            >
              <Zap className="w-5 h-5 text-cyan-400" />
              <div className="text-left flex-1">
                <p className="font-semibold text-slate-100">$9.99 · 5 summaries</p>
                <p className="text-xs text-slate-400">One-time payment</p>
              </div>
              {loading === 'five' ? (
                <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <CreditCard className="w-5 h-5 text-slate-500" />
              )}
            </button>

            <button
              onClick={() => startCheckout('unlimited')}
              disabled={loading}
              className="w-full flex items-center gap-3 rounded-xl border border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 py-3 px-4 transition disabled:opacity-60"
            >
              <Infinity className="w-5 h-5 text-emerald-400" />
              <div className="text-left flex-1">
                <p className="font-semibold text-slate-100">$19/mo · unlimited</p>
                <p className="text-xs text-slate-400">For landlords & property managers</p>
              </div>
              {loading === 'unlimited' ? (
                <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <CreditCard className="w-5 h-5 text-slate-500" />
              )}
            </button>
          </div>

          <p className="mt-4 text-[11px] text-slate-500">
            Cancel anytime. No hidden fees.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
