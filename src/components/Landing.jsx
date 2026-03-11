import { motion } from 'framer-motion';
import { FileText, Sparkles } from 'lucide-react';

export default function Landing({ usage }) {
  return (
    <header className="pt-16 pb-6 px-4 flex flex-col items-center text-center">
      <motion.span
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-cyan-300"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Lease clarity in seconds
      </motion.span>
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-6 text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight max-w-4xl"
      >
        <span className="bg-gradient-to-r from-cyan-300 via-emerald-300 to-teal-300 bg-clip-text text-transparent">
          Don't sign until you know
        </span>
        <br />
        <span className="text-slate-200">what you're signing.</span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-5 max-w-xl text-lg text-slate-400 leading-relaxed"
      >
        Upload your lease PDF and get an instant breakdown of{' '}
        <span className="text-rose-400 font-medium">red flags</span>,{' '}
        <span className="text-cyan-400 font-medium">key dates</span>, and{' '}
        <span className="text-emerald-400 font-medium">your rights</span>—in plain English, not legalese.
      </motion.p>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="mt-4 flex items-center gap-2 text-emerald-400 text-sm font-medium"
      >
        <FileText className="w-4 h-4" />
        Your first summary is <span className="font-semibold text-emerald-300">free</span>.
      </motion.div>
      {usage && (usage.paidCredits > 0 || usage.unlimited) && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-sm text-slate-500"
        >
          {usage.unlimited
            ? 'Unlimited access active'
            : `${usage.paidCredits} summaries remaining`}
        </motion.p>
      )}
    </header>
  );
}
