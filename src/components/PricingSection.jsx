import { motion } from 'framer-motion';
import { Check, Gift, Zap, Infinity } from 'lucide-react';
import { trackEvent } from '../lib/analytics';

const TIERS = [
  {
    key: 'starter',
    label: 'Free',
    icon: Gift,
    iconColor: 'text-zinc-400',
    price: '$0',
    period: null,
    desc: 'Try your first analysis free. No credit card needed.',
    features: [
      '1 free analysis',
      'Standard Declawed AI',
      'Red flags & key dates',
      'No credit card required',
    ],
    cta: 'Try free',
    guarantee: null,
    popular: false,
    landlordMode: false,
    cardClass: 'border-white/[0.08] bg-white/[0.02]',
    ctaClass: 'border border-white/20 text-zinc-300 hover:border-white/30 hover:text-white',
    checkColor: 'text-zinc-500',
  },
  {
    key: 'pro',
    label: 'Pro',
    icon: Zap,
    iconColor: 'text-blue-300',
    price: '$12',
    period: '/mo',
    desc: '10 lease analyses per month. Perfect for small landlords.',
    features: [
      '10 analyses / month',
      'Advanced Declawed AI',
      'PDF report download',
      'Email report to yourself',
      'Full analysis history',
      'Priority processing',
    ],
    cta: 'Get Pro',
    guarantee: '7-day money-back guarantee',
    popular: true,
    landlordMode: false,
    cardClass: 'border-blue-400/40 bg-blue-500/[0.07] shadow-[0_0_48px_rgba(20,184,166,0.12)]',
    ctaClass: 'bg-blue-500 text-black font-semibold hover:bg-blue-400 shadow-lg shadow-blue-500/20',
    checkColor: 'text-blue-400',
  },
  {
    key: 'unlimited',
    label: 'Unlimited',
    icon: Infinity,
    iconColor: 'text-emerald-400',
    price: '$29',
    period: '/mo',
    desc: 'For property managers, realtors, and anyone reviewing leases regularly. Unlimited analyses, both sides of the table.',
    features: [
      'Unlimited analyses — no monthly cap',
      'Advanced Declawed AI',
      'Everything in Pro',
      'Landlord Mode',
      'Spot unenforceable clauses & liability gaps',
      'Priority support',
    ],
    cta: 'Go unlimited',
    guarantee: '7-day money-back guarantee',
    popular: false,
    landlordMode: true,
    cardClass: 'border-emerald-500/30 bg-emerald-500/[0.06] shadow-[0_0_40px_rgba(16,185,129,0.10)]',
    ctaClass: 'border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-400',
    checkColor: 'text-emerald-400',
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
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-400 mb-4">Pricing</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Simple, honest pricing</h2>
          <p className="mt-4 text-zinc-400 max-w-sm mx-auto">Pay once or go unlimited. No tricks, no auto-upgrades.</p>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-4">
          {TIERS.map(({ key, label, icon: Icon, iconColor, price, period, desc, features, note, cta, guarantee, popular, landlordMode, cardClass, ctaClass, checkColor }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`relative rounded-2xl border p-6 flex flex-col ${cardClass}`}
            >
              {popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.12em] bg-blue-500 text-black shadow-lg shadow-blue-500/30 whitespace-nowrap">
                  Most Popular
                </div>
              )}

              {landlordMode && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.12em] bg-emerald-500 text-black shadow-lg shadow-emerald-500/30 whitespace-nowrap">
                  Landlord Mode
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
              <p className="text-sm text-zinc-400 leading-relaxed mt-2 mb-4">{desc}</p>

              {/* Feature checklist */}
              <ul className="space-y-2 grow mb-4">
                {(features || []).map((feat) => (
                  <li key={feat} className="flex items-center gap-2 text-[12.5px]">
                    <Check className={`w-3.5 h-3.5 shrink-0 ${checkColor}`} />
                    {feat === 'Landlord Mode' ? (
                      <span className="text-zinc-200 font-medium">
                        Landlord Mode{' '}
                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full align-middle">
                          New
                        </span>
                      </span>
                    ) : (
                      <span className="text-zinc-400">{feat}</span>
                    )}
                  </li>
                ))}
              </ul>

              {key === 'starter' ? (
                <a
                  href="/#upload"
                  className={`mt-auto w-full rounded-xl py-2.5 text-sm transition-all active:scale-95 text-center block ${ctaClass}`}
                >
                  {cta}
                </a>
              ) : (
                <>
                  <button
                    onClick={() => { trackEvent('upgrade_clicked', { tier: key, source: 'pricing_section' }); onSelectTier(); }}
                    className={`mt-auto w-full rounded-xl py-2.5 text-sm transition-all active:scale-95 ${ctaClass}`}
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
