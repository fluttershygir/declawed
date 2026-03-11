import { motion } from 'framer-motion';

export default function Navbar() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full px-6 py-4 flex items-center justify-between border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            {/* Shield with check — the "protection from legal claws" icon */}
            <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V6l-9-4z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
        </div>
        <span className="text-xl font-extrabold tracking-tight text-slate-100">
          Declawed
        </span>
        <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500 border border-slate-700 px-2 py-0.5 rounded-full">
          Beta
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <span className="hidden sm:block text-xs text-slate-500 font-medium">
          AI-powered lease analysis
        </span>
        <a
          href="#pricing"
          className="px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/20 transition-colors"
        >
          Pricing
        </a>
      </div>
    </motion.nav>
  );
}
