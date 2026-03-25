import { motion } from 'framer-motion';

export default function Landing({ usage }) {
  return (
    <section
      id="hero"
      className="relative flex flex-col items-center text-center px-5 pt-10 pb-3 md:pt-14 md:pb-4 overflow-hidden"
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/4 w-[800px] h-[500px] rounded-full bg-blue-600/[0.06] blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 20%, #000 10%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 20%, #000 10%, transparent 100%)',
          }}
        />
      </div>

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/[0.08] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-300"
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-400" />
        </span>
        AI Lease Analysis · Free to Try
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.07 }}
        className="mt-5 text-[2.3rem] sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.06] max-w-2xl"
      >
        <span className="bg-gradient-to-br from-white via-white to-white/55 bg-clip-text text-transparent">
          Your lease has traps.
        </span>
        <br />
        <span className="bg-gradient-to-r from-blue-300 via-blue-200 to-emerald-300 bg-clip-text text-transparent">
          Find them first.
        </span>
      </motion.h1>

      {/* Sub */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mt-4 max-w-md text-[15px] text-zinc-400 leading-relaxed"
      >
        Upload your lease and get every{' '}
        <span className="text-rose-400 font-medium">red flag</span>,{' '}
        <span className="text-blue-400 font-medium">key date</span>, and{' '}
        <span className="text-emerald-400 font-medium">tenant right</span>{' '}
        surfaced in plain English — in under 30 seconds.
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="mt-2.5 text-[11px] text-zinc-600 tracking-wide"
      >
        No account required &nbsp;·&nbsp; File stays in your browser &nbsp;·&nbsp; 30 seconds
      </motion.p>

      {usage && usage.plan !== 'free' && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-xs text-blue-500"
        >
          {usage.plan === 'unlimited'
            ? 'Unlimited access active'
            : `${Math.max(0, (usage.limit ?? 1) - (usage.used ?? 0))} analyses remaining`}
        </motion.p>
      )}
    </section>
  );
}
