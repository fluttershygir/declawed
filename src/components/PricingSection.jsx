import { motion } from 'framer-motion';
import { Gift, FileText, Zap, Infinity } from 'lucide-react';

const TIERS = [
  {
    key: 'starter',
    label: 'Starter',
    icon: Gift,
    iconColor: 'text-zinc-400',
    price: '$0',
    period: null,
    desc: '1 free lease analysis to try it out.',
    note: null,
    cta: 'Try free',
    popular: false,
    cardClass: 'border-white/[0.08] bg-white/[0.02]',
    ctaClass: 'border border-white/20 text-zinc-300 hover:border-white/30 hover:text-white',
  },
  {
    key: 'one',
    label: 'One Lease',
    icon: FileText,
    iconColor: 'text-cyan-400',
    price: '$4.99',
    period: 'one-time',
    desc: 'Single lease analysis. Pay once, no subscription.',
    note: 'No subscription ever.',
    cta: 'Analyze my lease',
    popular: false,
    cardClass: 'border-cyan-500/20 bg-cyan-500/[0.04]',
    ctaClass: 'border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400',
  },
  {
    key: 'pro',
    label: 'Pro',
    icon: Zap,
    iconColor: 'text-teal-300',
    price: '$12',
    period: '/mo',
    desc: '10 lease analyses per month. Perfect for small landlords.',
    note: null,
    cta: 'Get Pro',
    popular: true,
    cardClass: 'border-teal-400/40 bg-teal-500/[0.07] shadow-[0_0_48px_rgba(20,184,166,0.12)]',
    ctaClass: 'bg-teal-500 text-black font-semibold hover:bg-teal-400 shadow-lg shadow-teal-500/20',
  },
  {
    key: 'unlimited',
    label: 'Unlimited',
    icon: Infinity,
    iconColor: 'text-emerald-400',
    price: '$29',
    period: '/mo',
    desc: 'Unlimited analyses. Built for property managers and realtors.',
    note: null,
    cta: 'Go unlimited',
    popular: false,
    cardClass: 'border-emerald-500/20 bg-emerald-500/[0.04]',
    ctaClass: 'border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-400',
  },
];

export default function PricingSection({ onSelectTier }) {
  return (
    <section id="pricing" className="py-24 md:py-32 px-5 border-t border-white/[0.05] w-full">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-teal-400 mb-4">Pricing</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Simple, honest pricing</h2>
          <p className="mt-4 text-zinc-400 max-w-sm mx-auto">Pay once or go unlimited. No tricks, no auto-upgrades.</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TIERS.map(({ key, label, icon: Icon, iconColor, price, period, desc, note, cta, popular, cardClass, ctaClass }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`relative rounded-2xl border p-6 flex flex-col ${cardClass}`}
            >
              {popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.12em] bg-teal-500 text-black shadow-lg shadow-teal-500/30">
                  Most Popular
                </div>
              )}

              <div className="flex items-center gap-2 mb-4">
                <Icon className={`w-4 h-4 ${iconColor}`} />
                <p className={`text-[11px] font-bold uppercase tracking-[0.15em] ${iconColor}`}>{label}</p>
              </div>

              <div className="mb-1">
                <span className="text-3xl font-extrabold text-white">{price}</span>
                {period && (
                  <span className="text-sm font-normal text-zinc-500 ml-1">{period}</span>
                )}
              </div>

              <p className="text-sm text-zinc-400 leading-relaxed mt-2 flex-1">{desc}</p>
              {note && (
                <p className="text-[11px] text-zinc-600 mt-1.5">{note}</p>
              )}

              <button
                onClick={onSelectTier}
                className={`mt-6 w-full rounded-xl py-2.5 text-sm transition-all active:scale-95 ${ctaClass}`}
              >
                {cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
      <div className="grid md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-5 h-5 text-emerald-400" />
            <p className="text-xs font-semibold text-emerald-300 uppercase">Starter</p>
          </div>
          <p className="text-2xl font-bold text-slate-100">$0</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">1 free lease summary to try it out.</p>
          <button
            onClick={onSelectTier}
            className="w-full rounded-xl border border-slate-600 py-2.5 text-sm text-slate-300 hover:bg-slate-800/80 hover:border-slate-500 transition"
          >
            Use free summary
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border-2 border-cyan-500/50 bg-cyan-500/5 shadow-[0_0_40px_rgba(34,211,238,0.15)] p-5 relative"
        >
          <div className="absolute -top-2 left-4 px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/20 text-cyan-300">
            Most popular
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <p className="text-xs font-semibold text-cyan-300 uppercase">One lease</p>
          </div>
          <p className="text-2xl font-bold text-slate-100">$4.99</p>
          <p className="text-sm text-slate-300 mt-1 mb-4">One full summary. Pay once, no subscription.</p>
          <button
            onClick={onSelectTier}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 py-2.5 text-sm font-semibold text-slate-950 hover:brightness-110 transition shadow-lg shadow-cyan-500/25"
          >
            Analyze my lease
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <Infinity className="w-5 h-5 text-emerald-400" />
            <p className="text-xs font-semibold text-emerald-300 uppercase">Unlimited</p>
          </div>
          <p className="text-2xl font-bold text-slate-100">
            $29<span className="text-sm font-normal text-emerald-200">/mo</span>
          </p>
          <p className="text-sm text-slate-300 mt-1 mb-2">
            Unlimited summaries. Cancel anytime.
          </p>
          <p className="text-xs text-emerald-400/70 mb-4">Most used by landlords and property managers</p>
          <button
            onClick={onSelectTier}
            className="w-full rounded-xl border border-emerald-400/60 py-2.5 text-sm font-semibold text-emerald-50 hover:bg-emerald-500/20 transition"
          >
            Go unlimited
          </button>
        </motion.div>
      </div>
      </div>
    </section>
  );
}
