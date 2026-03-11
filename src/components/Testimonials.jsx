import { motion } from 'framer-motion';

const TESTIMONIALS = [
  {
    initials: 'SK',
    name: 'Sofia K.',
    location: 'Renter · Chicago, IL',
    avatarClass: 'bg-rose-500/20 text-rose-300',
    quote:
      'Caught an auto-renewal clause buried in paragraph 18 that would have locked me in for another full year unless I gave 60 days written notice. Declawed flagged it immediately. I would have signed right past it.',
  },
  {
    initials: 'MR',
    name: 'Marcus R.',
    location: 'First-time renter · Austin, TX',
    avatarClass: 'bg-teal-500/20 text-teal-300',
    quote:
      "I had no idea I had the right to sublet with written approval - my landlord was acting like it was entirely his call. Seeing it sourced directly from my own lease changed the whole negotiation.",
  },
  {
    initials: 'JP',
    name: 'Jamie P.',
    location: 'Relocating · New York, NY',
    avatarClass: 'bg-cyan-500/20 text-cyan-300',
    quote:
      'The red flag about the security deposit being 2x monthly rent saved me from a clause that may have been illegal in New York. Five dollars well spent - would have cost me $3,200 to find out the hard way.',
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
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-teal-400 mb-4">Renters say</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Caught before it cost them.</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map(({ initials, name, location, avatarClass, quote }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.09 }}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 flex flex-col gap-5 hover:border-white/[0.12] transition-colors"
            >
              {/* Stars */}
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, j) => (
                  <svg key={j} className="w-3.5 h-3.5 text-teal-400 fill-teal-400" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <p className="text-sm text-zinc-300 leading-relaxed flex-1">"{quote}"</p>

              <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
                <div className={`w-9 h-9 rounded-full ${avatarClass} text-xs font-bold flex items-center justify-center shrink-0`}>
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-tight">{name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
