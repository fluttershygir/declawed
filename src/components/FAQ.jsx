import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';

const FAQS = [
  {
    q: 'Is this legal advice?',
    a: 'No. Declawed is an AI-powered document analysis tool, not a law firm. The summaries help you understand your lease in plain English so you can ask better questions — not to substitute for advice from a licensed attorney. For complex legal matters, always consult a lawyer.',
  },
  {
    q: 'How does it work?',
    a: "You upload a PDF or .txt lease. Declawed extracts the text and sends it to Declawed AI with tenant-advocate instructions trained to surface what can harm you. The response is structured into red flags, key dates, your rights, and unusual clauses.",
  },
  {
    q: 'Is my document stored anywhere?',
    a: 'No. Your file is read in memory and never written to disk or any database. Once your summary is returned, the document is gone. We do not store, train on, or sell your lease data.',
  },
  {
    q: 'What file types are supported?',
    a: 'PDF and plain text (.txt) files up to 10 MB. Most leases sent as PDFs work perfectly. If your PDF is a scanned image with no selectable text, the analysis may be limited — a text-based PDF works best.',
  },
  {
    q: 'Can I cancel my subscription anytime?',
    a: 'Yes. The $29/month Unlimited plan cancels at any time from your account settings. You keep access through the end of your billing period. No questions, no retention flows.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(null);

  return (
    <section id="faq" className="py-24 md:py-32 px-5 border-t border-white/[0.05]">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-400 mb-4">FAQ</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Common questions</h2>
        </motion.div>

        <div className="space-y-2">
          {FAQS.map(({ q, a }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl border border-white/[0.07] overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <span className="text-sm font-medium text-white">{q}</span>
                <Plus
                  className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${open === i ? 'rotate-45' : ''}`}
                />
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    key="body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-sm text-zinc-400 leading-relaxed border-t border-white/[0.05] pt-3">
                      {a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
