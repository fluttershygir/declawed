import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Calendar, FileCheck } from 'lucide-react';

export default function WelcomeModal({ open, onClose }) {
  return (
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
            initial={{ scale: 0.95, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-zinc-950 border border-white/[0.09] shadow-2xl shadow-black/60 relative overflow-hidden"
          >
            {/* Top accent line */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />

            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-zinc-600 hover:text-white transition z-10 p-1 rounded-md hover:bg-white/[0.06]"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="px-6 pt-7 pb-5 text-center border-b border-white/[0.06] bg-gradient-to-b from-white/[0.02] to-transparent">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 20 20" fill="none" className="w-[18px] h-[18px]">
                  <path d="M6 10V7a4 4 0 0 1 8 0v3" stroke="#60a5fa" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="3.5" y="10" width="13" height="9" rx="2.5" fill="#60a5fa" fillOpacity="0.9" />
                  <circle cx="10" cy="14.5" r="1.4" fill="#1d4ed8" />
                </svg>
              </div>
              <h2 className="text-[17px] font-bold text-white tracking-tight">You're in. Here's what to expect.</h2>
              <p className="text-[12px] text-zinc-500 mt-1.5 leading-relaxed">
                Upload any lease and Declawed flags the clauses that cost renters the most.
              </p>
            </div>

            {/* What the AI checks */}
            <div className="px-6 py-5 space-y-3.5">
              {[
                {
                  icon: AlertTriangle,
                  color: 'text-rose-400',
                  bg: 'bg-rose-500/10 border-rose-500/20',
                  title: 'Red flags, ranked by severity',
                  desc: 'Financial traps, rights-waivers, and clauses that may be unenforceable — with HIGH/MEDIUM/LOW severity labels.',
                },
                {
                  icon: Calendar,
                  color: 'text-blue-400',
                  bg: 'bg-blue-500/10 border-blue-500/20',
                  title: 'Key dates & deadlines',
                  desc: 'Notice windows, auto-renewal traps, deposit return timelines — everything with a deadline.',
                },
                {
                  icon: FileCheck,
                  color: 'text-emerald-400',
                  bg: 'bg-emerald-500/10 border-emerald-500/20',
                  title: 'Specific negotiation steps',
                  desc: "Exact clauses to push back on, by section number, with language you can use immediately.",
                },
              ].map(({ icon: Icon, color, bg, title, desc }) => (
                <div key={title} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg border ${bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white leading-tight">{title}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="px-6 pb-6">
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all text-sm font-bold text-white shadow-lg shadow-blue-600/25"
              >
                Upload my first lease →
              </button>
              <p className="text-[10.5px] text-zinc-600 text-center mt-2.5">
                Results in ~30 seconds · File stays in your browser
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
