import { motion } from 'framer-motion';
import { Upload, ScanText, CheckCircle } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    icon: Upload,
    title: 'Upload your lease',
    desc: 'Drag in any PDF, Word doc, or image of your lease. Your file is processed in memory and never stored on our servers.',
    color: 'text-blue-400',
    ring: 'border-blue-500/30',
    glow: 'bg-blue-500/[0.07]',
    accent: 'from-blue-500/20 to-transparent',
  },
  {
    number: '02',
    icon: ScanText,
    title: 'AI scans every clause',
    desc: 'Our AI reads every line with tenant-advocate instructions — trained to surface what landlords hope you miss.',
    color: 'text-blue-400',
    ring: 'border-blue-500/30',
    glow: 'bg-blue-500/[0.07]',
    accent: 'from-blue-500/20 to-transparent',
  },
  {
    number: '03',
    icon: CheckCircle,
    title: 'Get your breakdown',
    desc: 'Red flags, key dates, tenant rights, and unusual clauses — structured clearly in plain English, not legalese.',
    color: 'text-emerald-400',
    ring: 'border-emerald-500/30',
    glow: 'bg-emerald-500/[0.07]',
    accent: 'from-emerald-500/20 to-transparent',
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
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-400 mb-4">How it works</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Three steps. Two minutes.</h2>
          <p className="mt-4 text-zinc-400 text-base max-w-sm mx-auto">No account required. No waiting. Just upload and understand.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {STEPS.map(({ number, icon: Icon, title, desc, color, ring, glow, accent }, i) => (
            <motion.div
              key={number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className={`relative rounded-2xl border ${ring} ${glow} p-6 overflow-hidden`}
            >
              {/* Step number - large faded bg */}
              <span className="absolute top-4 right-5 text-[64px] font-black text-white/[0.03] leading-none select-none pointer-events-none">
                {number}
              </span>

              <div className={`relative w-12 h-12 rounded-xl border ${ring} ${glow} flex items-center justify-center mb-5`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>

              <h3 className="text-[15px] font-semibold text-white mb-2.5 leading-snug">{title}</h3>
              <p className="text-[13.5px] text-zinc-400 leading-relaxed">{desc}</p>

              {/* Step indicator */}
              <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${accent}`} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
