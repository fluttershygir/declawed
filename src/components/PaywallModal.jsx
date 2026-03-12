import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Zap, Infinity, CreditCard, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AuthModal from './AuthModal';

const API_BASE = '/api';

const TIERS = [
  {
    key: 'one',
    label: 'One Lease',
    price: '$4.99',
    period: 'one-time',
    note: 'No subscription. Ever.',
    perks: ['1 full lease analysis', 'All red flags & key dates', 'Image scanning', 'PDF, .docx, or image'],
    icon: FileText,
    iconColor: 'text-cyan-400',
    borderClass: 'border-cyan-500/30',
    bgClass: 'bg-cyan-500/[0.06]',
    ctaClass: 'border border-cyan-500/60 text-cyan-300 hover:bg-cyan-500/15',
  },
  {
    key: 'pro',
    label: 'Pro',
    price: '$12',
    period: '/mo',
    note: 'Perfect for small landlords',
    perks: ['10 analyses per month', 'All red flags & key dates', 'Image scanning', 'Advanced Declawed AI'],
    icon: Zap,
    iconColor: 'text-teal-300',
    borderClass: 'border-teal-400/50',
    bgClass: 'bg-teal-500/[0.08]',
    ctaClass: 'bg-teal-500 text-black font-semibold hover:bg-teal-400 shadow-lg shadow-teal-500/20',
    popular: true,
  },
  {
    key: 'unlimited',
    label: 'Unlimited',
    price: '$29',
    period: '/mo',
    note: 'For property managers & realtors',
    perks: ['Unlimited analyses', 'All red flags & key dates', 'Image scanning', 'Advanced Declawed AI'],
    icon: Infinity,
    iconColor: 'text-emerald-400',
    borderClass: 'border-emerald-500/30',
    bgClass: 'bg-emerald-500/[0.06]',
    ctaClass: 'border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/15',
  },
];

export default function PaywallModal({ open, onClose }) {
  const [loading, setLoading] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);

  const startCheckout = async (tier) => {
    // Require sign-in before purchasing
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setAuthOpen(true);
      return;
    }

    setLoading(tier);
    try {
      const res = await fetch(`${API_BASE}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setLoading(null);
      }
    } catch {
      setLoading(null);
    }
  };

  return (
    <>
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl bg-zinc-950 border border-white/[0.09] shadow-2xl p-6 relative"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-zinc-500 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-teal-400 mb-2">Upgrade</p>
              <h3 className="text-xl font-bold text-white">Choose a plan</h3>
              <p className="mt-1.5 text-sm text-zinc-400">
                Secure payment via Stripe. No hidden fees, cancel anytime.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              {TIERS.map(({ key, label, price, period, note, perks, icon: Icon, iconColor, borderClass, bgClass, ctaClass, popular }) => (
                <div
                  key={key}
                  className={`relative rounded-xl border ${borderClass} ${bgClass} p-4 flex flex-col`}
                >
                  {/* Most Popular badge row — reserves same height on all cards for alignment */}
                  <div className="h-6 flex items-center justify-center mb-2.5">
                    {popular && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.14em] bg-teal-500 text-black px-2.5 py-1 rounded-full shadow-md shadow-teal-500/30">
                        <Zap className="w-2.5 h-2.5" />
                        Most Popular
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 mb-3">
                    <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${iconColor}`}>{label}</span>
                  </div>

                  <div className="mb-1">
                    <span className="text-2xl font-extrabold text-white">{price}</span>
                    <span className="text-xs text-zinc-500 ml-1">{period}</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mb-3">{note}</p>

                  <ul className="space-y-1.5 mb-4 flex-1">
                    {perks.map(p => (
                      <li key={p} className="flex items-start gap-1.5 text-[11px] text-zinc-400">
                        <CheckCircle className="w-3 h-3 text-teal-500 mt-0.5 shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => startCheckout(key)}
                    disabled={!!loading}
                    className={`w-full rounded-lg py-2 text-xs transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${ctaClass}`}
                  >
                    {loading === key ? (
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CreditCard className="w-3 h-3" />
                    )}
                    {loading === key ? 'Redirecting…' : 'Choose plan'}
                  </button>
                </div>
              ))}
            </div>

            <p className="mt-4 text-[10px] text-zinc-600 text-center">
              Payments processed by Stripe · Cancel anytime · No hidden charges
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} defaultTab="signin" />
  </>
  );
}
