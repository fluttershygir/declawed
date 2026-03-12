import { motion } from 'framer-motion';
import { ShieldCheck, FileText, Star } from 'lucide-react';

const STATS = [
  { icon: ShieldCheck, value: '100%', label: 'Privacy first', sub: 'Files never stored' },
  { icon: FileText, value: '3 formats', label: 'PDF · Word · PNG', sub: 'Export your report' },
  { icon: Star, value: '7-day', label: 'Money-back', sub: 'On all paid plans' },
];

const CITIES = ['New York', 'Austin', 'Chicago', 'Miami', 'Seattle', 'Denver', 'Portland'];

export default function TrustBar() {
  return (
    <div className="border-y border-white/[0.05] bg-white/[0.01]">
      {/* Stats row */}
      <div className="max-w-4xl mx-auto px-5 py-8">
        <div className="grid grid-cols-3 gap-4 sm:gap-8">
          {STATS.map(({ icon: Icon, value, label, sub }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row items-center sm:items-start gap-3 text-center sm:text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">{value}</p>
                <p className="text-[12px] font-medium text-zinc-400 leading-tight">{label}</p>
                <p className="text-[11px] text-zinc-600 leading-tight mt-0.5 hidden sm:block">{sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Cities */}
      <div className="border-t border-white/[0.04] py-3.5 px-5">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span className="text-[11px] text-zinc-600 font-medium">Trusted by renters across</span>
          {CITIES.map((city, i) => (
            <span key={city} className="flex items-center gap-2 text-[11px]">
              {i !== 0 && <span className="text-zinc-800">·</span>}
              <span className="text-zinc-500">{city}</span>
            </span>
          ))}
          <span className="text-zinc-800 text-[11px]">·</span>
          <span className="text-[11px] text-zinc-600">and growing</span>
        </div>
      </div>
    </div>
  );
}
