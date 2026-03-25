import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function LeaseReview() {
  useEffect(() => {
    document.title = 'Free Lease Review — Spot Red Flags Before You Sign | Declawed';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
    meta.content = 'Get a free lease review powered by AI. Declawed checks your rental agreement for red flags, unfair clauses, hidden fees, and missing tenant protections — in seconds.';
  }, []);

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-5 pt-20 pb-14 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/[0.08] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-300 mb-6"
          >
            <FileText className="w-3.5 h-3.5" />
            Free Lease Review
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white mb-6"
          >
            Free Lease Review:<br />
            <span className="bg-gradient-to-r from-blue-300 to-blue-300 bg-clip-text text-transparent">
              Know What You&rsquo;re Signing
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto mb-8"
          >
            Most renters sign a lease without reading every clause. That&rsquo;s how landlords bury
            automatic renewal traps, inflated fees, and clauses that strip away legal protections
            you&rsquo;re entitled to. Declawed reads every line so you don&rsquo;t have to.
          </motion.p>
          <motion.a
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            href="/#upload"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500 text-sm font-semibold text-black hover:bg-blue-400 transition-all shadow-lg shadow-blue-500/25 active:scale-95"
          >
            Review my lease free
            <ArrowRight className="w-4 h-4" />
          </motion.a>
        </section>

        {/* What we check */}
        <section className="max-w-4xl mx-auto px-5 py-12 border-t border-white/[0.06]">
          <h2 className="text-2xl font-bold text-white mb-2">What a lease review should cover</h2>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            A thorough lease review isn&rsquo;t just skimming for the rent amount. Here&rsquo;s what
            Declawed checks automatically in every document:
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: 'Auto-renewal clauses', desc: 'Hidden provisions that lock you into another 12-month term if you don\'t give 60-day written notice.' },
              { title: 'Illegal entry clauses', desc: 'Landlord access with less than the legally required notice period — typically 24–48 hours in most states.' },
              { title: 'Security deposit terms', desc: 'Excessive deposit amounts, vague deduction language, or missing return timelines that may violate state law.' },
              { title: 'Fees and penalties', desc: 'Late fees, maintenance fees, administrative charges, and pet surcharges that may be disproportionate or illegal.' },
              { title: 'Maintenance responsibilities', desc: 'Clauses that shift legally mandated landlord duties (habitability, heat, plumbing) onto the tenant.' },
              { title: 'Early termination penalties', desc: 'Excessive buyout fees, forfeiture of deposit, or continued rent liability that goes beyond what\'s enforceable.' },
            ].map(({ title, desc }) => (
              <div key={title} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-white mb-1">{title}</p>
                    <p className="text-[13px] text-zinc-400 leading-relaxed">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Common red flags */}
        <section className="max-w-4xl mx-auto px-5 py-12 border-t border-white/[0.06]">
          <h2 className="text-2xl font-bold text-white mb-2">The most common red flags in rental leases</h2>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            After analyzing thousands of lease agreements, these are the issues that appear most
            frequently — and cost tenants the most money or freedom:
          </p>
          <ul className="space-y-3">
            {[
              'Automatic lease renewal without clear written notice requirements',
              '"Landlord right of entry" with no minimum notice period',
              'Security deposit clauses with vague or unenforceable deduction lists',
              'Tenant liable for all repairs regardless of fault',
              'Broad landlord indemnification clauses that waive your right to sue',
              'Noise, guest, and occupancy restrictions that are unenforceable under local law',
            ].map((flag, i) => (
              <li key={i} className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="text-sm text-zinc-300 leading-relaxed">{flag}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-5 py-14 border-t border-white/[0.06] text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Ready to review your lease?</h2>
          <p className="text-zinc-400 mb-7 max-w-xl mx-auto leading-relaxed">
            Upload your PDF or .docx lease and get a full AI-powered review in under 30 seconds — free.
            No account required for your first analysis.
          </p>
          <a
            href="/#upload"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-blue-500 text-sm font-semibold text-black hover:bg-blue-400 transition-all shadow-lg shadow-blue-500/25 active:scale-95"
          >
            Start your free lease review
            <ArrowRight className="w-4 h-4" />
          </a>
          <p className="mt-4 text-xs text-zinc-600">No credit card · Your file is never stored · Results in seconds</p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
