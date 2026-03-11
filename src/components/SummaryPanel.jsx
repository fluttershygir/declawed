import { motion } from 'framer-motion';
import { FileCheck, AlertCircle, Calendar, ShieldCheck, AlertTriangle } from 'lucide-react';

function StructuredSummary({ data }) {
  return (
    <article className="text-sm space-y-5">
      {/* Verdict */}
      {data.verdict && (
        <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-3">
          <p className="text-slate-200 leading-relaxed">{data.verdict}</p>
        </div>
      )}

      {/* Red Flags */}
      {data.redFlags?.length > 0 && (
        <section>
          <h2 className="flex items-center gap-1.5 text-rose-400 font-semibold mb-2">
            <AlertCircle className="w-4 h-4" /> Red Flags
          </h2>
          <ul className="space-y-1.5">
            {data.redFlags.map((flag, i) => (
              <li key={i} className="flex gap-2 text-slate-300 leading-relaxed">
                <span className="text-rose-500 mt-0.5 shrink-0">•</span>
                {flag}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Key Dates */}
      {data.keyDates?.length > 0 && (
        <section>
          <h2 className="flex items-center gap-1.5 text-cyan-400 font-semibold mb-2">
            <Calendar className="w-4 h-4" /> Key Dates
          </h2>
          <ul className="space-y-1.5">
            {data.keyDates.map((item, i) => (
              <li key={i} className="flex gap-2 text-slate-300 leading-relaxed">
                <span className="text-cyan-500 shrink-0 font-medium">{item.label}:</span>
                {item.value}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Tenant Rights */}
      {data.tenantRights?.length > 0 && (
        <section>
          <h2 className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-2">
            <ShieldCheck className="w-4 h-4" /> Your Rights
          </h2>
          <ul className="space-y-1.5">
            {data.tenantRights.map((right, i) => (
              <li key={i} className="flex gap-2 text-slate-300 leading-relaxed">
                <span className="text-emerald-500 mt-0.5 shrink-0">•</span>
                {right}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Unusual Clauses */}
      {data.unusualClauses?.length > 0 && (
        <section>
          <h2 className="flex items-center gap-1.5 text-amber-400 font-semibold mb-2">
            <AlertTriangle className="w-4 h-4" /> Unusual Clauses
          </h2>
          <ul className="space-y-1.5">
            {data.unusualClauses.map((clause, i) => (
              <li key={i} className="flex gap-2 text-slate-300 leading-relaxed">
                <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                {clause}
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

export default function SummaryPanel({ summary, loading, error }) {
  return (
    <motion.section
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm flex flex-col overflow-hidden"
    >
      <div className="flex items-center gap-2 p-4 border-b border-slate-800/80">
        <FileCheck className="w-5 h-5 text-emerald-400" />
        <h2 className="text-lg font-semibold text-slate-100">Plain English summary</h2>
      </div>
      <div className="flex-1 min-h-[320px] p-4 overflow-y-auto">
        {loading && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <div className="w-10 h-10 border-2 border-cyan-500/50 border-t-cyan-400 rounded-full animate-spin mb-3" />
            <p className="text-sm">Claude is reading your lease…</p>
            <p className="text-xs mt-1">Usually takes 10–30 seconds</p>
          </div>
        )}
        {!loading && error && (
          <div className="flex items-center gap-2 text-rose-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}
        {!loading && !error && !summary && (
          <div className="relative h-full min-h-[320px]">
            {/* Sample output — top section crisp, fades into blur */}
            <article className="summary-content text-sm space-y-1 select-none pointer-events-none">
              {/* Fully legible top section */}
              <h2 className="text-rose-400 font-semibold mt-0 mb-2">🚩 Red Flags</h2>
              <ul className="list-disc ml-4 mb-2 space-y-1">
                <li className="text-slate-300 leading-relaxed">Landlord may enter with only 12-hour notice — below the 24-hour standard in most states.</li>
                <li className="text-slate-400 leading-relaxed blur-[1.5px]">Auto-renewal clause in Section 18 — lease renews 12 months unless 60-day written notice given.</li>
                <li className="text-slate-500 leading-relaxed blur-[3px]">Security deposit is 2× monthly rent — verify this is legal in your state.</li>
              </ul>
              {/* Progressively blurred sections */}
              <h2 className="text-cyan-400 font-semibold mt-5 mb-2 blur-[2px] opacity-80">📅 Key Dates</h2>
              <ul className="list-disc ml-4 mb-2 space-y-1 blur-[3px] opacity-60">
                <li className="text-slate-300 leading-relaxed">Lease start: March 1, 2026 — End: February 28, 2027</li>
                <li className="text-slate-300 leading-relaxed">Rent due 1st of each month; $75 late fee after the 5th.</li>
              </ul>
              <h2 className="text-emerald-400 font-semibold mt-5 mb-2 blur-[5px] opacity-40">✅ Your Rights</h2>
              <ul className="list-disc ml-4 mb-2 space-y-1 blur-[6px] opacity-30">
                <li className="text-slate-300 leading-relaxed">You may sublet with written landlord approval (Section 9).</li>
                <li className="text-slate-300 leading-relaxed">Landlord must restore heat/water within 72 hours.</li>
                <li className="text-slate-300 leading-relaxed">Security deposit returned within 21 days of move-out.</li>
              </ul>
            </article>
            {/* Gradient fade from transparent to panel color */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-slate-900/95 via-slate-900/60 to-transparent rounded-b-xl pointer-events-none"></div>
            {/* CTA pinned at bottom */}
            <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end pb-6 text-center px-6">
              <p className="text-slate-200 font-semibold text-sm">Upload your lease to see your full analysis</p>
              <p className="text-slate-500 text-xs mt-1">Red flags, key dates & your rights — in plain English.</p>
            </div>
          </div>
        )}
        {!loading && !error && summary && (
          <StructuredSummary data={summary} />
        )}
      </div>
    </motion.section>
  );
}
