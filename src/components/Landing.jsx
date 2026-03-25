import { motion } from 'framer-motion';
import { ArrowRight, AlertCircle, CalendarDays, ShieldCheck } from 'lucide-react';

const PREVIEW_CHIPS = [
  {
    icon: AlertCircle,
    color: 'text-rose-400',
    border: 'border-rose-500/25',
    bg: 'bg-rose-500/[0.07]',
    label: '3 red flags',
    sub: 'incl. 1 HIGH severity',
  },
  {
    icon: CalendarDays,
    color: 'text-blue-400',
    border: 'border-blue-500/25',
    bg: 'bg-blue-500/[0.07]',
    label: 'Key dates extracted',
    sub: '60-day notice to vacate',
  },
  {
    icon: ShieldCheck,
    color: 'text-emerald-400',
    border: 'border-emerald-500/25',
    bg: 'bg-emerald-500/[0.07]',
    label: 'Tenant rights mapped',
    sub: '4 protections found',
  },
];

export default function Landing({ usage }) {
  return (
    <section
      id="hero"
      className="relative flex flex-col items-center text-center px-5 pt-20 pb-14 md:pt-28 md:pb-20 overflow-hidden"
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/4 w-[900px] h-[700px] rounded-full bg-blue-600/[0.07] blur-[130px]" />
        <div className="absolute left-1/2 top-1/2 -translate-x-[30%] -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-emerald-500/[0.04] blur-[90px]" />
        <div
          className="absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
            maskImage: 'radial-gradient(ellipse 70% 55% at 50% 30%, #000 10%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 50% 30%, #000 10%, transparent 100%)',
          }}
        />
      </div>

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
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
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08 }}
        className="mt-7 text-[2.6rem] sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.06] max-w-3xl"
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
        transition={{ duration: 0.5, delay: 0.18 }}
        className="mt-5 max-w-lg text-base md:text-lg text-zinc-400 leading-relaxed"
      >
        Upload your lease PDF and get every{' '}
        <span className="text-rose-400 font-medium">red flag</span>,{' '}
        <span className="text-blue-400 font-medium">key date</span>, and{' '}
        <span className="text-emerald-400 font-medium">tenant right</span> surfaced in plain English — in 30 seconds.
      </motion.p>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        className="mt-8 flex flex-col items-center gap-3"
      >
        <a
          href="#upload"
          className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-blue-500 text-sm font-bold text-black hover:bg-blue-400 transition-all shadow-lg shadow-blue-500/30 active:scale-95"
        >
          Analyze my lease — it&rsquo;s free
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </a>
        <p className="text-[11px] text-zinc-600 tracking-wide">
          No account required &nbsp;·&nbsp; File stays in your browser &nbsp;·&nbsp; 30 seconds
        </p>
      </motion.div>

      {/* Result preview strip */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42 }}
        className="mt-10 w-full max-w-xl"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-3">
          Example result
        </p>

        {/* Score card */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 mb-3 text-left flex items-center gap-4">
          <div className="shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-rose-500/[0.1] border border-rose-500/25">
            <span className="text-2xl font-black text-rose-400 leading-none">4</span>
            <span className="text-[9px] text-zinc-600 font-semibold">/ 10</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-rose-400">Heavily favors landlord</p>
            <p className="text-xs text-zinc-500 mt-0.5 leading-snug">
              Auto-renewal trap, below-standard entry notice, and waived habitability rights found.
            </p>
          </div>
        </div>

        {/* Chips row */}
        <div className="grid grid-cols-3 gap-2">
          {PREVIEW_CHIPS.map(({ icon: Icon, color, border, bg, label, sub }) => (
            <div
              key={label}
              className={`rounded-xl border ${border} ${bg} px-3 py-2.5 text-left`}
            >
              <Icon className={`w-3.5 h-3.5 ${color} mb-1.5`} />
              <p className={`text-[11px] font-semibold ${color} leading-tight`}>{label}</p>
              <p className="text-[10px] text-zinc-600 mt-0.5 leading-tight">{sub}</p>
            </div>
          ))}
        </div>

        <p className="mt-2.5 text-[10px] text-zinc-700 text-center">
          ↑ This is what your real result looks like
        </p>
      </motion.div>

      {usage && usage.plan !== 'free' && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-sm text-blue-600"
        >
          {usage.plan === 'unlimited'
            ? 'Unlimited access active'
            : `${Math.max(0, (usage.limit ?? 1) - (usage.used ?? 0))} analyses remaining`}
        </motion.p>
      )}
    </section>
  );
}
