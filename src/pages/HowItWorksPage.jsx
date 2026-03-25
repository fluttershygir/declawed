import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Upload, ScanText, CheckCircle, Lock, Cpu, FileText,
  AlertTriangle, CalendarDays, Scale, Lightbulb, ArrowRight,
  ShieldCheck, Info,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const STEPS = [
  {
    number: '01',
    icon: Upload,
    title: 'You upload your lease',
    body: 'Drop in a PDF, Word doc (.docx), or an image of a printed lease. The file is parsed entirely in your browser using open-source libraries — the raw text (or image data) is extracted on your device, and only that extracted content is sent to the server. Your original file is never uploaded or stored.',
    color: 'text-blue-400',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/[0.07]',
  },
  {
    number: '02',
    icon: Cpu,
    title: 'Claude reads every clause',
    body: "Your lease text is sent to our backend, which calls Anthropic's Claude — a frontier large language model. Claude receives a detailed system prompt written from a tenant-advocate perspective, instructing it to read the entire document and surface what landlords hope tenants miss: hidden fees, waived rights, lopsided termination clauses, and more.",
    color: 'text-blue-400',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/[0.07]',
  },
  {
    number: '03',
    icon: CheckCircle,
    title: 'You get a structured breakdown',
    body: 'Claude returns a structured JSON object — not a wall of text. We parse it into labelled sections: a lease score, a plain-English verdict, red flags with severity ratings, key dates, your tenant rights as expressed in this lease, unusual clauses, and concrete action steps. Everything is rendered clearly, with no jargon.',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/[0.07]',
  },
];

const OUTPUTS = [
  {
    icon: AlertTriangle,
    label: 'Red Flags',
    color: 'text-rose-400',
    border: 'border-rose-500/25',
    bg: 'bg-rose-500/[0.06]',
    desc: 'Clauses that are unfair, unusual, or legally questionable — ranked HIGH, MEDIUM, or LOW by how much they could harm you. Examples: landlord right-to-enter with no notice, automatic renewal traps, waiving your right to withhold rent for habitability failures.',
  },
  {
    icon: CalendarDays,
    label: 'Key Dates',
    color: 'text-blue-400',
    border: 'border-blue-500/25',
    bg: 'bg-blue-500/[0.06]',
    desc: "Deadlines and notice windows pulled directly from the lease — move-in date, lease end, rent due date, notice required to vacate, renewal deadlines. Missing one of these can cost you your security deposit or lock you into another year.",
  },
  {
    icon: Scale,
    label: 'Tenant Rights',
    color: 'text-emerald-400',
    border: 'border-emerald-500/25',
    bg: 'bg-emerald-500/[0.06]',
    desc: "Rights the lease explicitly grants you, plus standard protections that should be present. This section helps you understand what leverage you have — and what's suspiciously absent from your agreement.",
  },
  {
    icon: FileText,
    label: 'Unusual Clauses',
    color: 'text-amber-400',
    border: 'border-amber-500/25',
    bg: 'bg-amber-500/[0.06]',
    desc: "Terms that aren't necessarily illegal but are uncommon enough to warrant attention — binding arbitration clauses, limitations on guests, landlord right to photograph the unit, liability waivers, pet breed restrictions. Know what you're agreeing to.",
  },
  {
    icon: Lightbulb,
    label: 'Action Steps',
    color: 'text-violet-400',
    border: 'border-violet-500/25',
    bg: 'bg-violet-500/[0.06]',
    desc: "Specific things to do before signing: questions to ask your landlord, clauses to push back on, items to document, protections to add via addendum. Concrete steps, not vague advice.",
  },
];

const SCORE_ROWS = [
  { range: '8 – 10', label: 'Tenant-friendly', desc: 'Balanced or tenant-protective language throughout.', color: 'text-emerald-400' },
  { range: '5 – 7', label: 'Mixed', desc: 'Some concerning terms but nothing egregious. Review red flags carefully.', color: 'text-amber-400' },
  { range: '1 – 4', label: 'Heavily landlord-sided', desc: 'Multiple one-sided clauses, missing protections, or outright unfair terms.', color: 'text-rose-400' },
];

const PRIVACY_POINTS = [
  { icon: Lock, text: 'Your original file is never uploaded — only the extracted text or image data.' },
  { icon: ShieldCheck, text: 'Analyses by signed-in users are stored in your account so you can revisit them. Anonymous analyses are not stored server-side.' },
  { icon: Info, text: 'We do not sell or share your lease data. It is used solely to generate your analysis.' },
];

function SectionLabel({ children }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-400 mb-3">{children}</p>
  );
}

function fade(delay = 0) {
  return {
    initial: { opacity: 0, y: 12 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { delay },
  };
}

export default function HowItWorksPage() {
  useEffect(() => {
    document.title = 'How It Works — Declawed AI Lease Analysis Methodology';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
    meta.content = 'Learn how Declawed parses your lease, what Claude AI looks for, how the lease score is calculated, and what every section of your analysis report means.';
  }, []);

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="max-w-4xl mx-auto px-5 pt-20 pb-14 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/[0.07] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-300 mb-6"
          >
            <ScanText className="w-3.5 h-3.5" />
            Methodology
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white mb-5"
          >
            How Declawed works
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto"
          >
            No black boxes. Here&rsquo;s exactly what happens from the moment you upload your lease to
            the moment you see your results — and what every section of your report means.
          </motion.p>
        </section>

        {/* ── Three Steps ── */}
        <section className="border-t border-white/[0.05] py-20 px-5">
          <div className="max-w-5xl mx-auto">
            <motion.div {...fade()} className="mb-14">
              <SectionLabel>The process</SectionLabel>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Three steps, under two minutes</h2>
            </motion.div>

            <div className="space-y-5">
              {STEPS.map(({ number, icon: Icon, title, body, color, border, bg }, i) => (
                <motion.div
                  key={number}
                  {...fade(i * 0.1)}
                  className={`rounded-2xl border ${border} ${bg} p-6 sm:p-8 flex gap-6 items-start`}
                >
                  <div className={`shrink-0 w-11 h-11 rounded-xl border ${border} ${bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600">{number}</span>
                      <h3 className="text-[15px] font-semibold text-white">{title}</h3>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed">{body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── The AI Model ── */}
        <section className="border-t border-white/[0.05] py-20 px-5 bg-[#07070d]">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-start">
            <motion.div {...fade()}>
              <SectionLabel>The AI</SectionLabel>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-4">
                Powered by Claude
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-4">
                Declawed uses <span className="text-white font-medium">Anthropic&rsquo;s Claude</span> — one of the most capable large language models available, with a 200,000-token context window large enough to read even the longest lease without truncation.
              </p>
              <p className="text-zinc-400 leading-relaxed mb-4">
                We wrote a detailed system prompt that instructs Claude to act as a tenant advocate: read the full document, apply knowledge of common tenant protections, and flag anything that deviates from fair or standard lease terms.
              </p>
              <p className="text-zinc-400 leading-relaxed">
                Pro and Unlimited plans use a more capable model tier with deeper reasoning — better at catching subtle or compound issues that simpler analyses miss.
              </p>
            </motion.div>

            <motion.div {...fade(0.1)} className="space-y-3">
              {[
                { label: 'Context window', value: 'Up to 200,000 tokens — handles even 50-page commercial leases' },
                { label: 'Output format', value: 'Structured JSON parsed into labelled sections, not free-form text' },
                { label: 'Prompt stance', value: 'Tenant-advocate by default; Landlord Mode available on Unlimited plan' },
                { label: 'Model provider', value: "Anthropic (claude.ai) — your data is not used to train Anthropic's models" },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-5 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 mb-1">{label}</p>
                  <p className="text-sm text-zinc-300 leading-snug">{value}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── Output Sections ── */}
        <section className="border-t border-white/[0.05] py-20 px-5">
          <div className="max-w-5xl mx-auto">
            <motion.div {...fade()} className="mb-14">
              <SectionLabel>Your report</SectionLabel>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">What each section means</h2>
              <p className="mt-3 text-zinc-400 max-w-xl">Every section of your analysis has a specific purpose. Here&rsquo;s what to pay attention to in each one.</p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {OUTPUTS.map(({ icon: Icon, label, color, border, bg, desc }, i) => (
                <motion.div
                  key={label}
                  {...fade(i * 0.07)}
                  className={`rounded-2xl border ${border} ${bg} p-5`}
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className={`text-[11px] font-bold uppercase tracking-[0.15em] ${color}`}>{label}</span>
                  </div>
                  <p className="text-[13px] text-zinc-400 leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Score ── */}
        <section className="border-t border-white/[0.05] py-20 px-5 bg-[#07070d]">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-start">
            <motion.div {...fade()}>
              <SectionLabel>Lease score</SectionLabel>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-4">
                How the 1–10 score is calculated
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-4">
                Claude assigns a holistic score from 1 to 10 based on the overall balance of the lease — weighing the number and severity of red flags, the presence of standard tenant protections, and how far each clause deviates from typical fair-market terms.
              </p>
              <p className="text-zinc-400 leading-relaxed">
                The score is a signal, not a verdict. A 6/10 lease might have one serious issue worth negotiating; a 8/10 lease might still have a clause that matters specifically to your situation. Always read the red flags section.
              </p>
            </motion.div>

            <motion.div {...fade(0.1)} className="space-y-3">
              {SCORE_ROWS.map(({ range, label, desc, color }) => (
                <div key={range} className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-5 py-4 flex gap-4 items-start">
                  <span className={`text-xl font-extrabold tabular-nums ${color} shrink-0 mt-0.5`}>{range}</span>
                  <div>
                    <p className={`text-sm font-semibold ${color}`}>{label}</p>
                    <p className="text-[12.5px] text-zinc-500 leading-snug mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
              <p className="text-[11px] text-zinc-600 px-1 pt-1">
                Your score is also compared against all analyses in our database so you can see what percentile your lease falls into.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ── Privacy ── */}
        <section className="border-t border-white/[0.05] py-20 px-5">
          <div className="max-w-5xl mx-auto">
            <motion.div {...fade()} className="mb-10">
              <SectionLabel>Privacy & data</SectionLabel>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">How your data is handled</h2>
            </motion.div>

            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {PRIVACY_POINTS.map(({ icon: Icon, text }, i) => (
                <motion.div
                  key={text}
                  {...fade(i * 0.08)}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"
                >
                  <Icon className="w-4 h-4 text-blue-400 mb-3" />
                  <p className="text-[13px] text-zinc-400 leading-relaxed">{text}</p>
                </motion.div>
              ))}
            </div>

            <motion.p {...fade(0.2)} className="text-[12.5px] text-zinc-600 max-w-2xl">
              For full details see our <a href="/privacy" className="text-zinc-400 hover:text-white underline underline-offset-2 transition-colors">Privacy Policy</a>. Declawed is built on Supabase (PostgreSQL) and Cloudflare Pages. Lease text sent to Claude is subject to{' '}
              <span className="text-zinc-500">Anthropic&rsquo;s data processing terms</span> — Anthropic does not use API inputs to train its models.
            </motion.p>
          </div>
        </section>

        {/* ── Limitations ── */}
        <section className="border-t border-white/[0.05] py-20 px-5 bg-[#07070d]">
          <div className="max-w-3xl mx-auto">
            <motion.div {...fade()} className="mb-8">
              <SectionLabel>Limitations</SectionLabel>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">What Declawed is not</h2>
            </motion.div>

            <motion.div {...fade(0.08)} className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-6 sm:p-8 space-y-4 mb-6">
              {[
                { heading: 'Not a lawyer', body: 'Declawed is an AI analysis tool, not legal counsel. It cannot give you advice specific to your jurisdiction, your personal circumstances, or recent case law. If a clause looks seriously problematic, consult a licensed tenant attorney — many offer free initial consultations.' },
                { heading: 'Not exhaustive', body: 'AI can miss context, misread ambiguous language, or overlook jurisdiction-specific nuances. Use the analysis as a starting point for your own review, not a substitute for reading your lease yourself.' },
                { heading: 'Not real-time legal data', body: "Claude's knowledge has a training cutoff. Tenant protection laws change — particularly rent control ordinances, eviction moratoriums, and security deposit rules. Always verify current law in your state or city." },
              ].map(({ heading, body }) => (
                <div key={heading}>
                  <p className="text-sm font-semibold text-amber-300 mb-1">{heading}</p>
                  <p className="text-[13px] text-zinc-400 leading-relaxed">{body}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="border-t border-white/[0.05] py-20 px-5">
          <motion.div
            {...fade()}
            className="max-w-xl mx-auto text-center"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-400 mb-3">Ready?</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-4">Upload your lease — it&rsquo;s free to try</h2>
            <p className="text-zinc-400 text-sm mb-8">No account required for your first analysis. Results in under 30 seconds.</p>
            <a
              href="/#upload"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-500 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
            >
              Analyze my lease
              <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
