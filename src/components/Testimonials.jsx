import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

const TESTIMONIALS = [
  {
    initials: 'SK',
    name: 'Sofia K.',
    location: 'Graduate student · Chicago, IL',
    avatarClass: 'bg-rose-500/20 text-rose-300',
    leaseScore: 4,
    quote:
      'There was an auto-renewal clause in paragraph 18 — I would have needed to give 60 days written notice to exit, or it would quietly roll into another full year. Declawed caught it in the first pass. I negotiated it down to 30 days and got it in writing before I signed.',
  },
  {
    initials: 'MR',
    name: 'Marcus R.',
    location: 'Relocating · Austin, TX',
    avatarClass: 'bg-blue-500/20 text-blue-300',
    leaseScore: 5,
    quote:
      "My landlord called the $200 cleaning surcharge in Section 9 'standard in Texas.' Declawed flagged it as a non-refundable fee with specific state disclosure requirements he hadn't followed. I asked for it to be removed, he agreed immediately. I wouldn't have known to push back.",
  },
  {
    initials: 'JP',
    name: 'Jamie P.',
    location: 'Signing remotely · New York, NY',
    avatarClass: 'bg-violet-500/20 text-violet-300',
    leaseScore: 3,
    quote:
      "The security deposit was listed as two months' rent — $3,400 — with a 60-day return window. Declawed flagged it immediately: New York law caps deposits at one month and requires return within 14 days. I pushed back and the landlord revised both terms before I signed.",
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 md:py-32 px-5 border-t border-white/[0.05]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-400 mb-4">Renters say</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Caught before it cost them.</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map(({ initials, name, location, avatarClass, leaseScore, quote }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.09 }}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 flex flex-col gap-5 hover:border-white/[0.12] transition-colors"
            >
              {/* Stars + lease score badge */}
              <div className="flex items-center justify-between">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="w-3.5 h-3.5 text-blue-400 fill-blue-400" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-md px-1.5 py-0.5">
                  Lease scored {leaseScore}/10
                </span>
              </div>

              <p className="text-sm text-zinc-300 leading-relaxed flex-1">"{quote}"</p>

              <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full ${avatarClass} text-xs font-bold flex items-center justify-center shrink-0`}>
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white leading-tight">{name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 shrink-0">
                  <ShieldCheck className="w-3 h-3" />
                  Verified
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
