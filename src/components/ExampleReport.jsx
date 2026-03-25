import { motion } from 'framer-motion';
import { AlertCircle, Calendar, ShieldCheck, ListChecks, FileCheck } from 'lucide-react';

function SeverityBadge({ severity }) {
  const cfg = {
    HIGH:   { bg: 'bg-rose-500/10',  text: 'text-rose-400',  label: 'High' },
    MEDIUM: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Med'  },
    LOW:    { bg: 'bg-zinc-500/10',  text: 'text-zinc-500',  label: 'Low'  },
  }[severity] ?? { bg: 'bg-zinc-500/10', text: 'text-zinc-500', label: 'Low' };
  return (
    <span className={`inline-block text-[9px] font-semibold uppercase tracking-[0.06em] px-1.5 py-[3px] rounded ${cfg.bg} ${cfg.text} shrink-0 leading-none`}>
      {cfg.label}
    </span>
  );
}

function SectionRule({ icon: Icon, label, color = 'text-zinc-500', iconColor }) {
  return (
    <div className="flex items-center gap-2">
      {Icon && <Icon className={`w-3.5 h-3.5 ${iconColor ?? color} shrink-0`} />}
      <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${color} whitespace-nowrap`}>{label}</span>
      <div className="flex-1 h-px bg-white/[0.05]" />
    </div>
  );
}

const EXAMPLE_FLAGS = [
  { severity: 'HIGH',   text: "Automatic renewal trap — lease auto-renews for 12 months unless written notice is given 60 days before expiration. Most tenants miss this window and get locked into another year at the landlord's new rate." },
  { severity: 'HIGH',   text: "Habitability waiver — tenant waives the right to withhold rent for the landlord's failure to maintain habitable conditions. Likely unenforceable in most states, but a serious red flag about this landlord." },
  { severity: 'MEDIUM', text: "Landlord right-to-enter with 24-hour notice for 'any reasonable purpose' and no cap on frequency. Standard practice specifies limited purposes and typically 48 hours minimum." },
  { severity: 'MEDIUM', text: "Tenant liable for all repairs under $150 regardless of cause — including plumbing and appliance failures not caused by tenant negligence." },
  { severity: 'LOW',    text: "No subletting permitted without written landlord approval, which may not be unreasonably withheld — but 'unreasonably' is undefined in this lease." },
];

const EXAMPLE_DATES = [
  { label: 'Lease start',              value: 'August 1, 2026'   },
  { label: 'Lease end',                value: 'July 31, 2027'    },
  { label: 'Renewal notice deadline',  value: 'June 1, 2027'     },
  { label: 'Rent due',                 value: '1st of each month'},
  { label: 'Security deposit return',  value: 'Within 21 days of move-out' },
  { label: 'Notice to vacate',         value: '60 days written notice' },
];

const EXAMPLE_RIGHTS = [
  "Right to quiet enjoyment of the premises",
  "Landlord must maintain heating and plumbing in working order",
  "Security deposit must be held in a separate account and itemized on return",
  "Tenant may not be evicted without proper court order and statutory notice periods",
];

const EXAMPLE_STEPS = [
  "Request removal of the automatic renewal clause — propose month-to-month after the initial term, or require mutual written agreement for any renewal.",
  "Strike the habitability waiver entirely. This clause is likely void under state law and tells you something about how this landlord operates.",
  "Narrow the right-to-enter clause: specify 48-hour minimum notice, limit to maintenance/inspection/emergency, and cap non-emergency visits to once per month.",
  "Push back on the $150 repair liability — tenant should only be responsible for damage they caused, not normal wear or appliance failure.",
  "Ask for a written definition of 'reasonable' approval for subletting requests and a response deadline.",
];

export default function ExampleReport() {
  return (
    <section className="w-full border-t border-white/[0.05] bg-[#07070d] py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-3">Example output</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            This is what you get.
          </h2>
          <p className="mt-2.5 text-zinc-500 text-[14px] max-w-lg mx-auto leading-relaxed">
            A real-looking analysis of a sample lease. Every section below comes from a single upload — no editing, no cherry-picking.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className="rounded-2xl bg-[#0a0a10] border border-white/[0.08] overflow-hidden"
        >
          {/* Doc header */}
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/[0.06]">
            <FileCheck className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            <p className="text-[13px] font-medium text-zinc-400 truncate">sample_apartment_lease.pdf</p>
            <span className="ml-auto text-[10px] font-bold uppercase tracking-[0.12em] text-rose-400/70 bg-rose-500/10 px-1.5 py-[3px] rounded shrink-0">
              5 red flags
            </span>
          </div>

          <div className="p-5 space-y-5">
            {/* Score hero */}
            <div className="flex items-start gap-4 pl-4 border-l-[3px] border-rose-500/40">
              <div className="shrink-0">
                <span className="text-5xl font-black text-rose-400 leading-none">3</span>
                <span className="text-zinc-600 text-sm font-medium">/10</span>
              </div>
              <div className="pt-0.5 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-rose-400 mb-1">Heavily favors landlord</p>
                <p className="text-[13px] text-zinc-300 leading-relaxed">
                  This lease contains multiple high-severity clauses that disproportionately favor the landlord — including an automatic renewal trap, a waived habitability clause, and broad right-to-enter language with no frequency limit.
                </p>
              </div>
            </div>

            {/* Red Flags */}
            <section className="space-y-3">
              <SectionRule icon={AlertCircle} label="Red Flags" iconColor="text-rose-500/60" color="text-rose-500/40" />
              <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                {EXAMPLE_FLAGS.map((flag, i) => (
                  <div key={i} className={`flex items-start gap-3 px-4 py-3 text-[13px] ${i > 0 ? 'border-t border-white/[0.04]' : ''}`}>
                    <span className="flex-1 text-zinc-300 leading-relaxed">{flag.text}</span>
                    <SeverityBadge severity={flag.severity} />
                  </div>
                ))}
              </div>
            </section>

            {/* Key Dates */}
            <section className="space-y-3">
              <SectionRule icon={Calendar} label="Key Dates" color="text-zinc-500" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {EXAMPLE_DATES.map((d, i) => (
                  <div key={i} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 mb-0.5">{d.label}</p>
                    <p className="text-[12px] text-zinc-300 leading-snug">{d.value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Tenant Rights */}
            <section className="space-y-3">
              <SectionRule icon={ShieldCheck} label="Your Rights" iconColor="text-emerald-500/50" color="text-emerald-500/40" />
              <ul className="space-y-2">
                {EXAMPLE_RIGHTS.map((r, i) => (
                  <li key={i} className="flex gap-2.5 text-[13px] text-zinc-400 leading-relaxed">
                    <span className="text-emerald-600 mt-[5px] shrink-0 leading-none">•</span>
                    {r}
                  </li>
                ))}
              </ul>
            </section>

            {/* Action Steps */}
            <section className="space-y-3">
              <SectionRule icon={ListChecks} label="What to do before signing" color="text-zinc-500" />
              <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                {EXAMPLE_STEPS.map((step, i) => (
                  <div key={i} className={`flex items-start gap-3 px-4 py-3 ${i > 0 ? 'border-t border-white/[0.04]' : ''}`}>
                    <span className="w-[18px] h-[18px] rounded-full border border-zinc-700 text-zinc-500 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <span className="text-[13px] text-zinc-300 leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Footer CTA */}
          <div className="px-5 py-4 border-t border-white/[0.06] bg-blue-500/[0.03] flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[12px] text-zinc-600">Your lease is unique. The above is a sample — upload yours for a real analysis.</p>
            <a
              href="#upload"
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500 text-black text-xs font-bold hover:bg-blue-400 transition shadow-lg shadow-blue-500/20"
            >
              Analyze your lease ↑
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
