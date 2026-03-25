import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X, AlertCircle, Calendar, ShieldCheck, AlertTriangle, FileCheck, ListChecks, FileImage, Loader2, Download, Pencil, Share2, RotateCcw, Copy, Check, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';

const SEVERITY_STYLES = {
  HIGH:   { bg: 'bg-rose-500/15',  text: 'text-rose-400',  border: 'border-rose-500/30'  },
  MEDIUM: { bg: 'bg-amber-500/12', text: 'text-amber-400', border: 'border-amber-500/30' },
  LOW:    { bg: 'bg-zinc-500/15',  text: 'text-zinc-400',  border: 'border-zinc-600/40'  },
};

export function SeverityBadge({ severity }) {
  const s = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.LOW;
  return (
    <span className={`inline-block text-[9px] font-bold uppercase tracking-[0.14em] px-1.5 py-0.5 rounded border ${s.bg} ${s.text} ${s.border} shrink-0 leading-none`}>
      {severity ?? 'LOW'}
    </span>
  );
}

export default function AnalysisModal({ analysis, onClose, onNoteUpdate, onReanalyzeComplete, onUpgrade, userName }) {
  const data = analysis?.result || {};
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState('');
  const [note, setNote] = useState(analysis?.note ?? '');
  const [editingNote, setEditingNote] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareToken, setShareToken] = useState(analysis?.share_token ?? null);
  const [shareCopied, setShareCopied] = useState(false);
  const [reanalyzeLoading, setReanalyzeLoading] = useState(false);
  const [reanalyzeError, setReanalyzeError] = useState(null);
  const [showReanalyzeConfirm, setShowReanalyzeConfirm] = useState(false);
  const [currentUsage, setCurrentUsage] = useState(null);
  const score = data.score ?? null;

  // Fetch current usage so we can show credit count in confirmation dialog
  useEffect(() => {
    supabase.auth.getSession().then(({ data: sd }) => {
      if (!sd?.session?.access_token) return;
      fetch('/api/usage', { headers: { Authorization: `Bearer ${sd.session.access_token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setCurrentUsage(d); })
        .catch(() => {});
    });
  }, []);

  async function handleDownload(type) {
    if (downloading) return;
    setDownloading(type);
    try {
      const filename = analysis.filename || 'lease-analysis';
      const baseFilename = filename.replace(/\.[^.]+$/, '');
      if (type === 'pdf') {
        const { generatePDF } = await import('../lib/generatePDF');
        generatePDF({ data, filename, analysisDate: new Date(analysis.created_at), userName });
      } else if (type === 'doc') {
        const { generateDOCX } = await import('../lib/generateDOCX');
        generateDOCX({ data, filename, analysisDate: new Date(analysis.created_at) });
      } else if (type === 'img') {
        const { default: html2canvas } = await import('html2canvas');
        const canvas = await html2canvas(cardRef.current, {
          backgroundColor: '#0d0d14',
          scale: 2,
          useCORS: true,
          logging: false,
        });
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = baseFilename + '.png';
        a.click();
      }
    } catch (e) {
      console.error('Download failed:', e);
    } finally {
      setDownloading('');
    }
  }
  const isRed = score !== null && score <= 4;

  async function handleSaveNote() {
    setNoteSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch('/api/note', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ analysis_id: analysis.id, note }),
      });
      setEditingNote(false);
      onNoteUpdate?.(analysis.id, note);
    } finally {
      setNoteSaving(false);
    }
  }

  async function handleShare() {
    setShareLoading(true);
    try {
      let token = shareToken;
      if (!token) {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
          body: JSON.stringify({ analysis_id: analysis.id }),
        });
        const d = await res.json();
        token = d.share_token;
        if (token) setShareToken(token);
      }
      if (token) {
        await navigator.clipboard.writeText(`https://declawed.app/shared/${token}`);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2500);
      }
    } catch { /* ignore */ } finally {
      setShareLoading(false);
    }
  }

  async function handleReanalyze() {
    setReanalyzeLoading(true);
    setReanalyzeError(null);
    try {
      const { data: srcData } = await supabase
        .from('analyses')
        .select('source_text')
        .eq('id', analysis.id)
        .single();
      if (!srcData?.source_text) {
        setReanalyzeError('Original text not stored — please re-upload the file to re-analyze.');
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ text: srcData.source_text, filename: analysis.filename }),
      });
      if (res.status === 402) { onUpgrade?.(); return; }
      const resData = await res.json();
      if (!res.ok || resData.error) throw new Error(resData.error || 'Analysis failed');
      onReanalyzeComplete?.();
    } catch (e) {
      if (e.message !== 'Analysis failed') setReanalyzeError(e.message || 'Re-analysis failed.');
    } finally {
      setReanalyzeLoading(false);
    }
  }

  const isRed2 = score !== null && score <= 4;
  const isYellow = score !== null && score >= 5 && score <= 7;
  const isGreen = score !== null && score >= 8;
  const scoreColor = isRed2 ? 'text-rose-400' : isYellow ? 'text-amber-400' : isGreen ? 'text-emerald-400' : 'text-zinc-400';
  const scoreRing = isRed2 ? 'border-rose-500/40 bg-rose-500/[0.07]' : isYellow ? 'border-amber-500/40 bg-amber-500/[0.07]' : isGreen ? 'border-emerald-500/40 bg-emerald-500/[0.07]' : 'border-zinc-700 bg-zinc-800/40';
  const scoreLabel = isRed2 ? 'Problematic' : isYellow ? 'Fair' : isGreen ? 'Favorable' : '';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm p-3 pt-20 sm:p-4 sm:pt-16 overflow-y-auto"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-2xl rounded-2xl bg-[#0d0d14] border border-white/[0.08] shadow-2xl overflow-hidden mb-4"
          ref={cardRef}
        >
          {/* Modal header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <p className="text-sm font-semibold text-white truncate max-w-xs">{analysis.filename || 'Untitled document'}</p>
            </div>
            <div className="flex items-center gap-3">
              <time className="text-xs text-zinc-600">{new Date(analysis.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</time>
              <button onClick={onClose} className="text-zinc-600 hover:text-white transition p-1 rounded-lg hover:bg-white/[0.06]">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal body */}
          <div className="p-5 space-y-5 text-sm">

            {/* Score + Verdict hero */}
            {score !== null ? (
              <div className={`rounded-xl border ${scoreRing} p-4 flex items-center gap-4`}>
                <div className={`w-14 h-14 rounded-full border-2 ${scoreRing} flex items-center justify-center shrink-0`}>
                  <span className={`text-2xl font-extrabold ${scoreColor}`}>{Math.max(1, Math.min(10, score))}</span>
                </div>
                <div className="min-w-0">
                  <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${scoreColor} mb-1`}>Lease Score · {scoreLabel}</p>
                  {data.verdict && <p className="text-sm text-slate-200 leading-snug">{data.verdict}</p>}
                </div>
              </div>
            ) : data.verdict && (
              <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-4">
                <p className="text-slate-200 leading-relaxed">{data.verdict}</p>
              </div>
            )}

            {/* Red Flags */}
            {data.redFlags?.length > 0 && (
              <section>
                <h3 className="flex items-center gap-1.5 text-rose-400 font-semibold mb-3">
                  <AlertCircle className="w-4 h-4" /> Red Flags
                </h3>
                <ul className="space-y-3">
                  {data.redFlags.map((flag, i) => {
                    const text = typeof flag === 'string' ? flag : flag.text;
                    const severity = typeof flag === 'string' ? 'MEDIUM' : (flag.severity ?? 'MEDIUM');
                    return (
                      <li key={i} className="flex gap-2.5 text-slate-300 leading-relaxed">
                        <span className="text-rose-500 mt-0.5 shrink-0">•</span>
                        <span className="flex-1">{text}</span>
                        <SeverityBadge severity={severity} />
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {/* Key Dates grid */}
            {data.keyDates?.length > 0 && (
              <section>
                <h3 className="flex items-center gap-1.5 text-blue-400 font-semibold mb-3">
                  <Calendar className="w-4 h-4" /> Key Dates
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {data.keyDates.map((item, i) => (
                    <div key={i} className="rounded-lg bg-blue-500/[0.06] border border-blue-500/20 px-3 py-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-500/80 mb-0.5">{item.label}</p>
                      <p className="text-xs text-slate-300 leading-snug">{item.value}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Tenant Rights */}
            {data.tenantRights?.length > 0 && (
              <section>
                <h3 className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-3">
                  <ShieldCheck className="w-4 h-4" /> Your Rights
                </h3>
                <ul className="space-y-3">
                  {data.tenantRights.map((right, i) => (
                    <li key={i} className="flex gap-2.5 text-slate-300 leading-relaxed">
                      <span className="text-emerald-500 mt-0.5 shrink-0">•</span>{right}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Unusual Clauses */}
            {data.unusualClauses?.length > 0 && (
              <section>
                <h3 className="flex items-center gap-1.5 text-amber-400 font-semibold mb-3">
                  <AlertTriangle className="w-4 h-4" /> Unusual Clauses
                </h3>
                <ul className="space-y-3">
                  {data.unusualClauses.map((clause, i) => (
                    <li key={i} className="flex gap-2.5 text-slate-300 leading-relaxed">
                      <span className="text-amber-500 mt-0.5 shrink-0">•</span>{clause}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* What to do before signing */}
            {data.actionSteps?.length > 0 && (
              <section className="rounded-xl border border-blue-500/25 bg-blue-500/[0.05] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-blue-500/15 bg-blue-500/[0.04]">
                  <ListChecks className="w-4 h-4 text-blue-400 shrink-0" />
                  <h3 className="text-blue-300 font-semibold text-sm">What to do before signing</h3>
                </div>
                <ul className="divide-y divide-blue-500/[0.08]">
                  {data.actionSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 px-4 py-2.5">
                      <span className="w-4 h-4 rounded border border-blue-500/40 bg-blue-500/10 text-blue-400 text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                      <span className="text-slate-300 leading-relaxed text-sm">{step}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Note + Share + Re-analyze */}
          <div className="px-5 py-4 border-t border-white/[0.06] space-y-3">
            {/* Note */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 flex items-center gap-1.5">
                  <Pencil className="w-2.5 h-2.5" /> Note
                </span>
                {!editingNote && note && (
                  <button onClick={() => setEditingNote(true)} className="text-[10px] text-blue-500 hover:text-blue-400 transition">Edit</button>
                )}
              </div>
              {editingNote ? (
                <div>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value.slice(0, 500))}
                    placeholder="Add a personal note about this lease…"
                    rows={3}
                    className="w-full rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-slate-300 placeholder-zinc-600 px-3 py-2 resize-none focus:outline-none focus:border-blue-500/50 transition"
                    autoFocus
                  />
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-zinc-600">{note.length}/500</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setNote(analysis?.note ?? ''); setEditingNote(false); }}
                        className="text-[11px] text-zinc-500 hover:text-zinc-300 transition px-2 py-1"
                      >Cancel</button>
                      <button
                        onClick={handleSaveNote}
                        disabled={noteSaving}
                        className="text-[11px] font-semibold px-3 py-1 rounded-lg bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 disabled:opacity-50 transition"
                      >{noteSaving ? 'Saving…' : 'Save note'}</button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setEditingNote(true)}
                  className="w-full text-left px-3 py-2.5 rounded-lg bg-white/[0.03] border border-dashed border-white/[0.08] text-sm hover:border-blue-500/30 transition"
                >
                  {note
                    ? <span className="text-slate-300 leading-relaxed">{note}</span>
                    : <span className="italic text-zinc-600">+ Add a personal note…</span>}
                </button>
              )}
            </div>

            {/* Share + Re-analyze row */}
            <div className="flex gap-2">
              <button
                onClick={handleShare}
                disabled={shareLoading}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.07] text-xs font-semibold text-zinc-400 hover:text-white transition disabled:opacity-50"
              >
                {shareLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : shareCopied ? <Check className="w-3 h-3 text-blue-400" /> : <Share2 className="w-3 h-3" />}
                {shareCopied ? 'Link copied!' : 'Share report'}
              </button>
              <button
                onClick={() => setShowReanalyzeConfirm(true)}
                disabled={reanalyzeLoading}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.07] text-xs font-semibold text-zinc-400 hover:text-white transition disabled:opacity-50"
              >
                {reanalyzeLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                {reanalyzeLoading ? 'Re-analyzing…' : 'Re-analyze'}
              </button>
            </div>
            {reanalyzeError && <p className="text-xs text-rose-400">{reanalyzeError}</p>}

            {/* Re-analyze confirmation */}
            <AnimatePresence>
              {showReanalyzeConfirm && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="rounded-xl border border-amber-500/30 bg-amber-500/[0.07] p-4"
                >
                  <div className="flex items-start gap-2 mb-3">
                    <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-white">Use 1 analysis credit?</p>
                      <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                        {currentUsage && currentUsage.limit < 9999
                          ? `You have ${Math.max(0, currentUsage.limit - currentUsage.used)} credit${Math.max(0, currentUsage.limit - currentUsage.used) !== 1 ? 's' : ''} remaining.`
                          : currentUsage?.limit >= 9999
                            ? 'You have unlimited credits.'
                            : 'This will use 1 analysis credit.'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowReanalyzeConfirm(false)}
                      className="flex-1 py-1.5 rounded-lg border border-white/[0.10] text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/[0.06] transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => { setShowReanalyzeConfirm(false); handleReanalyze(); }}
                      className="flex-1 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 transition"
                    >
                      Confirm
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Export bar */}
          <div className="px-4 py-3 sm:px-5 border-t border-white/[0.06] bg-white/[0.015] flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 shrink-0">Export</span>
            <div className="flex gap-1.5 ml-auto">
              {[
                { type: 'pdf', label: 'PDF',  Icon: FileText  },
                { type: 'doc', label: 'Word', Icon: Download  },
                { type: 'img', label: 'PNG',  Icon: FileImage },
              ].map(({ type, label, Icon }) => (
                <button
                  key={type}
                  onClick={() => handleDownload(type)}
                  disabled={!!downloading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.07] text-zinc-400 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloading === type
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Icon className="w-3 h-3" />}
                  {label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
