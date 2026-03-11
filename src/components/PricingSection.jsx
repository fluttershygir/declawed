import { motion } from 'framer-motion';
import { Gift, Zap, Infinity } from 'lucide-react';

export default function PricingSection({ onSelectTier }) {
  return (
    <section className="mt-16 w-full max-w-4xl">
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center text-xs font-semibold text-slate-500 uppercase tracking-[0.2em] mb-6"
      >
        Simple pricing
      </motion.h3>
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
          <p className="text-sm text-slate-300 mt-1 mb-4">
            Unlimited summaries. Built for landlords, property managers & realtors.
          </p>
          <button
            onClick={onSelectTier}
            className="w-full rounded-xl border border-emerald-400/60 py-2.5 text-sm font-semibold text-emerald-50 hover:bg-emerald-500/20 transition"
          >
            Go unlimited
          </button>
        </motion.div>
      </div>
    </section>
  );
}
