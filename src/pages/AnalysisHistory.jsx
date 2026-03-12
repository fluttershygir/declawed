import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, AlertCircle, Calendar, Pencil, Share2, ChevronRight, Loader2, Search, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import AppShell from '../components/AppShell';
import AnalysisModal, { SeverityBadge } from '../components/AnalysisModal';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'highest-risk', label: 'Highest risk' },
];

function cleanVerdict(v) {
  if (!v || typeof v !== 'string') return '';
  const t = v.trim();
  if (t.startsWith('{') || t.startsWith('`') || t.startsWith('```')) return '';
  return t;
}

function sortAnalyses(analyses, sort) {
  const copy = [...analyses];
  if (sort === 'newest') {
    return copy.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  if (sort === 'oldest') {
    return copy.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }
  if (sort === 'highest-risk') {
    return copy.sort((a, b) => {
      const sa = a.result?.score ?? 999;
      const sb = b.result?.score ?? 999;
      return sa - sb;
    });
  }
  return copy;
}

export default function AnalysisHistory() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [shareLoadingIds, setShareLoadingIds] = useState(new Set());
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('analyses')
      .select('id, filename, verdict, created_at, result, note, share_token')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(500)
      .then(({ data }) => {
        setAnalyses(data || []);
        setLoading(false);
      });
  }, [user]);

  function handleNoteUpdate(id, newNote) {
    setAnalyses((prev) => prev.map((a) => (a.id === id ? { ...a, note: newNote } : a)));
  }

  async function handleReanalyzeComplete() {
    const { data } = await supabase
      .from('analyses')
      .select('id, filename, verdict, created_at, result, note, share_token')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(500);
    setAnalyses(data || []);
    setSelectedAnalysis(null);
    setToast('Re-analysis complete! New result added to your history.');
    setTimeout(() => setToast(null), 4000);
  }

  async function shareFromList(e, a) {
    e.stopPropagation();
    const id = a.id;
    if (shareLoadingIds.has(id)) return;
    setShareLoadingIds((prev) => new Set([...prev, id]));
    try {
      let token = a.share_token;
      if (!token) {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
          body: JSON.stringify({ analysis_id: id }),
        });
        const d = await res.json();
        token = d.share_token;
        if (token) setAnalyses((prev) => prev.map((item) => item.id === id ? { ...item, share_token: token } : item));
      }
      if (token) {
        await navigator.clipboard.writeText(`https://declawed.app/shared/${token}`);
        setToast('Share link copied to clipboard!');
        setTimeout(() => setToast(null), 3000);
      }
    } catch {
      setToast('Failed to copy link — try again.');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setShareLoadingIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    }
  }

  const q = search.trim().toLowerCase();
  const filtered = sortAnalyses(
    q
      ? analyses.filter(
          (a) =>
            (a.filename || '').toLowerCase().includes(q) ||
            (a.verdict || '').toLowerCase().includes(q)
        )
      : analyses,
    sort
  );

  const fullDisplayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    '';

  return (
    <>
      <AppShell>
<div className="max-w-5xl mx-auto px-4 py-5 sm:px-6 sm:py-8">

          {/* Page header */}
          <div className="mb-7">
            <h1 className="text-xl font-semibold text-white tracking-tight">Analysis History</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {loading ? 'Loading…' : `${analyses.length} lease${analyses.length !== 1 ? 's' : ''} analyzed`}
            </p>
          </div>

          {/* Search + Sort bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by filename or summary…"
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#0b0b12] border border-white/[0.07] text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-blue-500/40 transition"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[#0b0b12] border border-white/[0.07] text-sm text-zinc-400 focus:outline-none focus:border-blue-500/40 transition cursor-pointer appearance-none pr-8"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#0b0b12]">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div className="rounded-xl border border-white/[0.07] bg-[#0b0b12] overflow-hidden">

            {loading ? (
              <div className="divide-y divide-white/[0.04]">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="px-4 py-4 sm:px-6 flex items-start gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.05] shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-white/[0.05]" />
                      <div className="h-3 w-1/2 rounded bg-white/[0.04]" />
                      <div className="flex gap-2">
                        <div className="h-4 w-16 rounded bg-white/[0.04]" />
                        <div className="h-4 w-16 rounded bg-white/[0.04]" />
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-white/[0.05] shrink-0" />
                  </div>
                ))}
              </div>
            ) : analyses.length === 0 ? (
              /* Empty state — no analyses at all */
              <div className="px-6 py-14 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-center mb-5">
                  <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10" xmlns="http://www.w3.org/2000/svg">
                    <rect x="10" y="6" width="36" height="46" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1.5"/>
                    <rect x="15" y="16" width="18" height="2.5" rx="1.25" fill="#475569"/>
                    <rect x="15" y="23" width="26" height="2.5" rx="1.25" fill="#334155"/>
                    <rect x="15" y="30" width="22" height="2.5" rx="1.25" fill="#334155"/>
                    <rect x="15" y="37" width="14" height="2.5" rx="1.25" fill="#334155"/>
                    <circle cx="47" cy="47" r="13" fill="#0d1117" stroke="#0d9488" strokeWidth="1.5"/>
                    <path d="M43 47l3 3 6-6" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-base font-semibold text-zinc-300 mb-1.5">No analyses yet</p>
                <p className="text-sm text-zinc-600 max-w-xs leading-relaxed mb-6">Upload your first lease and Declawed AI will flag red flags, key dates, and your tenant rights — in plain English.</p>
                <a
                  href="/"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all text-white text-sm font-semibold shadow-lg shadow-blue-600/20"
                >
                  <Upload className="w-4 h-4" />
                  Analyze your first lease →
                </a>
              </div>
            ) : filtered.length === 0 ? (
              /* No search results */
              <div className="px-6 py-12 text-center">
                <p className="text-sm text-zinc-500">No analyses match <span className="text-zinc-300">"{search}"</span></p>
              </div>
            ) : (
              <ul className="divide-y divide-white/[0.04]">
                {filtered.map((a, i) => {
                  const flags = a.result?.redFlags?.length ?? 0;
                  const dates = a.result?.keyDates?.length ?? 0;
                  const score = a.result?.score ?? null;
                  const scoreIsRed = score !== null && score <= 4;
                  const scoreIsYellow = score !== null && score >= 5 && score <= 7;
                  const scoreIsGreen = score !== null && score >= 8;
                  const scoreColor = scoreIsRed
                    ? 'text-rose-400 border-rose-500/40 bg-rose-500/10'
                    : scoreIsYellow
                    ? 'text-amber-400 border-amber-500/40 bg-amber-500/10'
                    : scoreIsGreen
                    ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
                    : 'text-zinc-500 border-zinc-700 bg-zinc-800/40';
                  return (
                    <motion.li
                      key={a.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.3) }}
                      onClick={() => setSelectedAnalysis(a)}
                      className="relative px-4 py-4 sm:px-6 flex items-start gap-3 cursor-pointer transition-all group border-l-2 border-transparent hover:border-blue-500/40 hover:bg-white/[0.03] active:bg-white/[0.04]"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center shrink-0 mt-0.5 group-hover:border-blue-500/30 transition">
                        <FileText className="w-3.5 h-3.5 text-zinc-500 group-hover:text-blue-400 transition" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-200 truncate group-hover:text-white transition">{a.filename || 'Untitled document'}</p>
                        {cleanVerdict(a.verdict) && (
                          <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1 leading-relaxed">{cleanVerdict(a.verdict)}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {flags > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/20">
                              <AlertCircle className="w-2.5 h-2.5" />{flags} red flag{flags !== 1 ? 's' : ''}
                            </span>
                          )}
                          {dates > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              <Calendar className="w-2.5 h-2.5" />{dates} key date{dates !== 1 ? 's' : ''}
                            </span>
                          )}
                          {a.note && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-white/[0.04] text-zinc-500 border border-white/[0.06]">
                              <Pencil className="w-2.5 h-2.5" /> note
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {score !== null && (
                          <span className={`w-7 h-7 rounded-full border text-[11px] font-extrabold flex items-center justify-center ${scoreColor}`}>
                            {Math.max(1, Math.min(10, score))}
                          </span>
                        )}
                        <time className="text-[11px] text-zinc-600">{new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</time>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedAnalysis(a); }}
                            title="Add / edit note"
                            className={`p-1 rounded transition ${a.note ? 'text-teal-500 hover:text-teal-400' : 'text-zinc-700 hover:text-zinc-400'}`}
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => shareFromList(e, a)}
                            title="Copy share link"
                            className="p-1 rounded text-zinc-700 hover:text-zinc-400 transition"
                          >
                            {shareLoadingIds.has(a.id)
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Share2 className="w-3 h-3" />}
                          </button>
                          <ChevronRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-400 transition" />
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </AppShell>

      {/* Analysis detail modal */}
      {selectedAnalysis && (
        <AnalysisModal
          analysis={selectedAnalysis}
          onClose={() => setSelectedAnalysis(null)}
          onNoteUpdate={handleNoteUpdate}
          onReanalyzeComplete={handleReanalyzeComplete}
          userName={fullDisplayName}
        />
      )}

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-xl shadow-blue-600/25 whitespace-nowrap"
        >
          {toast}
        </motion.div>
      )}
    </>
  );
}
