import { motion } from 'framer-motion';
import { Gift, FileText, Zap, Infinity } from 'lucide-react';

const TIERS = [
  {
    key: 'starter',
    label: 'Starter',
    icon: Gift,
    iconColor: 'text-zinc-400',
    price: '$0',
    period: null,
    desc: 'Try your first analysis free. No credit card needed.',
    aiTier: 'standard',
    note: null,
    cta: 'Try free',
    guarantee: null,
    popular: false,
    cardClass: 'border-white/[0.08] bg-white/[0.02]',
    ctaClass: 'border border-white/20 text-zinc-300 hover:border-white/30 hover:text-white',
  },
  {
    key: 'one',
    label: 'One Lease',
    icon: FileText,
    iconColor: 'text-cyan-400',
    price: '$4.99',
    period: 'one-time',
    desc: 'Single lease analysis. Pay once, no subscription.',
    aiTier: 'advanced',
    note: 'No subscription ever.',
    cta: 'Analyze my lease',
    guarantee: '7-day money-back guarantee',
    popular: false,
    cardClass: 'border-cyan-500/20 bg-cyan-500/[0.04]',
    ctaClass: 'border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400',
  },
  {
    key: 'pro',
    label: 'Pro',
    icon: Zap,
    iconColor: 'text-teal-300',
    price: '$12',
    period: '/mo',
    desc: '10 lease analyses per month. Perfect for small landlords.',
    aiTier: 'advanced',
    note: null,
    cta: 'Get Pro',
    guarantee: '7-day money-back guarantee',
    popular: true,
    cardClass: 'border-teal-400/40 bg-teal-500/[0.07] shadow-[0_0_48px_rgba(20,184,166,0.12)]',
    ctaClass: 'bg-teal-500 text-black font-semibold hover:bg-teal-400 shadow-lg shadow-teal-500/20',
  },
  {
    key: 'unlimited',
    label: 'Unlimited',
    icon: Infinity,
    iconColor: 'text-emerald-400',
    price: '$29',
    period: '/mo',
    desc: 'Unlimited analyses. Built for property managers and realtors.',
    aiTier: 'advanced',
    note: null,
    cta: 'Go unlimited',
    guarantee: null,
    popular: false,
    cardClass: 'border-emerald-500/20 bg-emerald-500/[0.04]',
    ctaClass: 'border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-400',
  },
];

export default function PricingSection({ onSelectTier }) {
  return (
    <section id="pricing" className="py-24 md:py-32 px-5 border-t border-white/[0.05] w-full">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-teal-400 mb-4">Pricing</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Simple, honest pricing</h2>
          <p className="mt-4 text-zinc-400 max-w-sm mx-auto">Pay once or go unlimited. No tricks, no auto-upgrades.</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TIERS.map(({ key, label, icon: Icon, iconColor, price, period, desc, aiTier, note, cta, guarantee, popular, cardClass, ctaClass }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`relative rounded-2xl border p-6 flex flex-col ${cardClass}`}
            >
              {popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.12em] bg-teal-500 text-black shadow-lg shadow-teal-500/30">
                  Most Popular
                </div>
              )}

              <div className="flex items-center gap-2 mb-4">
                <Icon className={`w-4 h-4 ${iconColor}`} />
                <p className={`text-[11px] font-bold uppercase tracking-[0.15em] ${iconColor}`}>{label}</p>
              </div>

              <div className="mb-1">
                <span className="text-3xl font-extrabold text-white">{price}</span>
                {period && (
                  <span className="text-sm font-normal text-zinc-500 ml-1">{period}</span>
                )}
              </div>
              {key === 'one' && (
                <p className="text-[11px] text-zinc-600 mt-0.5">A lawyer charges $200+/hr for this</p>
              )}

              <p className="text-sm text-zinc-400 leading-relaxed mt-2">{desc}</p>

              {/* AI tier label */}
              <div className={`mt-3 flex items-center gap-1.5 ${
                aiTier === 'advanced' ? 'text-teal-400' : 'text-zinc-500'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  aiTier === 'advanced' ? 'bg-teal-400' : 'bg-zinc-600'
                }`} />
                <span className="text-[11px] font-medium">
                  {aiTier === 'advanced' ? 'Advanced Declawed AI' : 'Standard Declawed AI'}
                </span>
              </div>

              {aiTier === 'advanced' && (
                <p className="text-[10px] text-teal-500/70 mt-1 flex-1">Deeper analysis · longer documents</p>
              )}
              {aiTier !== 'advanced' && <div className="flex-1" />}

              {note && (
                <p className="text-[11px] text-zinc-600 mt-2">{note}</p>
              )}

              {key === 'starter' ? (
                <>
                  <a
                    href="/#upload"
                    className={`mt-6 w-full rounded-xl py-2.5 text-sm transition-all active:scale-95 text-center block ${ctaClass}`}
                  >
                    {cta}
                  </a>
                  <p className="mt-2 text-center text-[11px] text-zinc-600">No credit card required</p>
                </>
              ) : (
                <>
                  <button
                    onClick={onSelectTier}
                    className={`mt-6 w-full rounded-xl py-2.5 text-sm transition-all active:scale-95 ${ctaClass}`}
                  >
                    {cta}
                  </button>
                  {guarantee && (
                    <p className="mt-2 text-center text-[11px] text-zinc-600">✓ {guarantee}</p>
                  )}
                </>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
