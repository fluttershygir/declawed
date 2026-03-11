import { motion } from 'framer-motion';

const CITIES = ['New York', 'Austin', 'Chicago', 'Miami', 'Seattle'];

export default function TrustBar() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="border-y border-white/[0.05] py-5 px-5 bg-white/[0.01]"
    >
      <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <span className="text-xs text-zinc-500 font-medium">Trusted by renters across</span>
        {CITIES.map((city, i) => (
          <span key={city} className="flex items-center gap-2 text-xs">
            {i !== 0 && <span className="text-zinc-700">·</span>}
            <span className="text-zinc-400">{city}</span>
          </span>
        ))}
        <span className="text-zinc-700 text-xs">·</span>
        <span className="text-xs text-zinc-500">and growing</span>
      </div>
    </motion.div>
  );
}
