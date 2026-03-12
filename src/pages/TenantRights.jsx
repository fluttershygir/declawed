import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, BookOpen, ExternalLink } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function TenantRights() {
  useEffect(() => {
    document.title = 'Tenant Rights Guide — Know Your Legal Protections as a Renter | Declawed';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
    meta.content = 'Understand your tenant rights before signing. Learn about habitability standards, security deposit rules, landlord entry laws, and how to protect yourself as a renter.';
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
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300 mb-6"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Tenant Rights
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white mb-6"
          >
            Tenant Rights:<br />
            <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
              What You&rsquo;re Legally Entitled To
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto mb-8"
          >
            Landlords hold significant power during the leasing process — but you have legal
            protections they can&rsquo;t take away. Understanding your tenant rights before signing is
            the most powerful thing you can do to protect yourself.
          </motion.p>
          <motion.a
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            href="/#upload"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500 text-sm font-semibold text-black hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/25 active:scale-95"
          >
            Check my lease for rights violations
            <ArrowRight className="w-4 h-4" />
          </motion.a>
        </section>

        {/* Core rights */}
        <section className="max-w-4xl mx-auto px-5 py-12 border-t border-white/[0.06]">
          <h2 className="text-2xl font-bold text-white mb-2">Core tenant rights every renter should know</h2>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            While exact rules vary by state and city, these fundamental rights apply broadly across
            the United States. Many landlords rely on tenants not knowing them.
          </p>
          <div className="space-y-4">
            {[
              {
                title: 'Right to a habitable home',
                desc: 'Your landlord must maintain the property in a livable condition — working heat, plumbing, electrical systems, and freedom from pests. A lease clause attempting to waive this is generally unenforceable.',
              },
              {
                title: 'Right to privacy and notice before entry',
                desc: 'Most states require landlords to give 24–48 hours written notice before entering your unit for non-emergency reasons. Clauses permitting "any time" entry are often illegal.',
              },
              {
                title: 'Right to a returned security deposit',
                desc: 'Landlords must return your security deposit within a legally defined window (14–30 days in most states) with an itemized list of any deductions. Failure to do so may entitle you to double or triple damages.',
              },
              {
                title: 'Right to withhold rent for repairs',
                desc: 'In many states, if a landlord fails to make essential repairs after written notice, you may be able to withhold rent, repair-and-deduct, or terminate the lease without penalty.',
              },
              {
                title: 'Right against illegal eviction',
                desc: 'A landlord cannot remove you from your home without a formal court process. Changing locks, removing belongings, or shutting off utilities to force you out is an illegal "self-help eviction."',
              },
              {
                title: 'Right against retaliation',
                desc: 'If you exercise your legal rights — such as reporting code violations — your landlord cannot legally retaliate through eviction, rent increases, or reduced services.',
              },
            ].map(({ title, desc }) => (
              <div key={title} className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-white mb-1">{title}</p>
                    <p className="text-[13px] text-zinc-400 leading-relaxed">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* When to consult a lawyer */}
        <section className="max-w-4xl mx-auto px-5 py-12 border-t border-white/[0.06]">
          <h2 className="text-2xl font-bold text-white mb-2">When to consult a tenant rights lawyer</h2>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            Declawed surfaces red flags and educates you — but it&rsquo;s not a substitute for legal
            counsel in serious situations. Consider speaking with a tenant&rsquo;s rights attorney if:
          </p>
          <ul className="space-y-2.5 mb-8">
            {[
              'You\'ve received an eviction notice',
              'Your landlord has entered without proper notice multiple times',
              'Your security deposit was withheld without a valid reason',
              'The property has habitability issues your landlord refuses to fix',
              'Your lease contains clauses that may violate local housing law',
              'You believe you\'re being discriminated against under fair housing law',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <BookOpen className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span className="text-sm text-zinc-300 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] p-5">
            <p className="text-sm font-semibold text-white mb-2">Free legal resources</p>
            <ul className="space-y-1.5">
              {[
                ['LawHelp.org', 'https://www.lawhelp.org/', 'Find free legal aid near you'],
                ['HUD Housing Counselors', 'https://www.hud.gov/topics/rental_assistance', 'Federal housing assistance directory'],
                ['Nolo Tenant Rights Guide', 'https://www.nolo.com/legal-encyclopedia/tenants-rights', 'State-by-state tenant rights reference'],
              ].map(([name, href, desc]) => (
                <li key={name}>
                  <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-cyan-300 hover:text-cyan-200 transition">
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    <span className="font-medium">{name}</span>
                    <span className="text-zinc-500">— {desc}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-5 py-14 border-t border-white/[0.06] text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">See which rights your lease respects</h2>
          <p className="text-zinc-400 mb-7 max-w-xl mx-auto leading-relaxed">
            Upload your lease and Declawed will surface clauses that may infringe on your tenant rights
            — in plain English, not legalese.
          </p>
          <a
            href="/#upload"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-teal-500 text-sm font-semibold text-black hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/25 active:scale-95"
          >
            Analyze my lease — it&rsquo;s free
            <ArrowRight className="w-4 h-4" />
          </a>
          <p className="mt-4 text-xs text-zinc-600">Not legal advice · For informational purposes only</p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
