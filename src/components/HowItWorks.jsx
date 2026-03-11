import { motion } from 'framer-motion';
import { Upload, ScanText, CheckCircle } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    icon: Upload,
    title: 'Upload your lease',
    desc: 'Drag in any PDF or .txt lease. Your file is processed in memory and never stored on our servers.',
    color: 'text-teal-400',
    ring: 'border-teal-500/30',
    glow: 'bg-teal-500/[0.07]',
  },
  {
    number: '02',
    icon: ScanText,
    title: 'AI scans every clause',
    desc: 'Claude 3 reads every line with tenant-advocate instructions — trained to surface what can hurt you.',
    color: 'text-cyan-400',
    ring: 'border-cyan-500/30',
    glow: 'bg-cyan-500/[0.07]',
  },
  {
    number: '03',
    icon: CheckCircle,
    title: 'Get your breakdown',
    desc: 'Red flags, key dates, tenant rights, and unusual clauses — structured clearly so you know what to negotiate.',
    color: 'text-emerald-400',
    ring: 'border-emerald-500/30',
    glow: 'bg-emerald-500/[0.07]',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 md:py-32 px-5 border-t border-white/[0.05]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16 md:mb-20"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-teal-400 mb-4">How it works</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Three steps. Two minutes.</h2>
          <p className="mt-4 text-zinc-400 text-base max-w-sm mx-auto">No account required. No waiting. Just upload and read.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-10 md:gap-8 relative">
          {/* Connector line on desktop */}
          <div className="hidden md:block absolute top-7 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-teal-500/20 via-white/10 to-emerald-500/20" />

          {STEPS.map(({ number, icon: Icon, title, desc, color, ring, glow }, i) => (
            <motion.div
              key={number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="flex flex-col items-center text-center md:items-start md:text-left"
            >
              <div className={`relative w-14 h-14 rounded-2xl border ${ring} ${glow} flex items-center justify-center mb-6`}>
                <Icon className={`w-6 h-6 ${color}`} />
                <span className="absolute -top-2.5 -right-2.5 text-[10px] font-bold text-zinc-500 bg-black border border-white/10 rounded-full w-5 h-5 flex items-center justify-center">
                  {number}
                </span>
              </div>
              <h3 className="text-base font-semibold text-white mb-2.5">{title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
