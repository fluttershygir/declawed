import { motion } from 'framer-motion';
import { useState } from 'react';
import { ArrowRight, Mail } from 'lucide-react';

function EmailCapture() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/email-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'landing_hero' }),
      });
      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="mt-8 w-full max-w-md"
    >
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-6 py-5 text-left">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="w-4 h-4 text-teal-400" />
          <p className="text-sm font-semibold text-white">Get your free lease review checklist</p>
        </div>
        <p className="text-xs text-zinc-500 mb-4">A plain-English checklist of 15 things to look for before signing any lease.</p>
        {status === 'success' ? (
          <p className="text-sm text-teal-400 font-medium">Checklist sent! Check your inbox.</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="flex-1 min-w-0 rounded-lg bg-white/[0.06] border border-white/10 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500/50 transition-colors"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="shrink-0 px-4 py-2 rounded-lg bg-teal-500 text-black text-sm font-semibold hover:bg-teal-400 transition-colors disabled:opacity-60"
            >
              {status === 'loading' ? '…' : 'Send it'}
            </button>
          </form>
        )}
        {status === 'error' && (
          <p className="mt-2 text-xs text-rose-400">Something went wrong. Please try again.</p>
        )}
      </div>
    </motion.div>
  );
}

export default function Landing({ usage }) {
  return (
    <section id="hero" className="relative flex flex-col items-center text-center px-5 pt-28 pb-24 md:pt-36 md:pb-32 overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/4 w-[900px] h-[600px] rounded-full bg-teal-500/[0.06] blur-[120px]" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] rounded-full bg-cyan-500/[0.04] blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, #000 20%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, #000 20%, transparent 100%)',
          }}
        />
      </div>

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative inline-flex items-center gap-2 rounded-full border border-teal-500/25 bg-teal-500/[0.08] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-teal-300"
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-400" />
        </span>
        AI-Powered Lease Analysis
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-8 text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.07] max-w-4xl"
      >
        <span className="bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent">
          Don't sign until you know
        </span>
        <br />
        <span className="bg-gradient-to-r from-teal-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
          what you're signing.
        </span>
      </motion.h1>

      {/* Subheading */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-7 max-w-xl text-lg md:text-xl text-zinc-400 leading-relaxed"
      >
        Upload your lease PDF. Declawed surfaces every{' '}
        <span className="text-rose-400 font-medium">red flag</span>,{' '}
        <span className="text-cyan-400 font-medium">key date</span>, and{' '}
        <span className="text-emerald-400 font-medium">tenant right</span>—in plain English, not legalese.
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-10 flex flex-col sm:flex-row items-center gap-3"
      >
        <a
          href="#upload"
          className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500 text-sm font-semibold text-black hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/25 active:scale-95"
        >
          Analyze my lease — it's free
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </a>
        <a
          href="#how-it-works"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-sm font-medium text-zinc-300 hover:border-white/20 hover:text-white transition-all"
        >
          See how it works
        </a>
      </motion.div>

      {/* Micro trust line */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-5 text-xs text-zinc-600"
      >
        No account required · First summary free · Your file is never stored
      </motion.p>

      {/* Email capture */}
      <EmailCapture />

      {usage && usage.plan !== 'free' && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 text-sm text-teal-600"
        >
          {usage.plan === 'unlimited'
            ? 'Unlimited access active'
            : `${Math.max(0, (usage.limit ?? 1) - (usage.used ?? 0))} analyses remaining`}
        </motion.p>
      )}
    </section>
  );
}
