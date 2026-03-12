import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Zap, ChevronRight, X, AlertCircle, Calendar, ShieldCheck, AlertTriangle, FileCheck, Upload, ArrowLeft, ListChecks, RefreshCw, FileImage, Loader2, Download, Pencil, Share2, RotateCcw, Copy, Check, Users, ShieldAlert } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import AppShell from './AppShell';

const PLAN_LABELS = {
  free:      { label: 'Free',      color: 'text-zinc-400',    border: 'border-zinc-700/60',    progress: 'bg-blue-600',    badge: 'FREE PLAN'  },
  one:       { label: 'One Lease', color: 'text-cyan-400',    border: 'border-cyan-700/60',    progress: 'bg-cyan-500',    badge: 'ONE LEASE'  },
  pro:       { label: 'Pro',       color: 'text-teal-400',    border: 'border-teal-600/60',    progress: 'bg-teal-500',    badge: 'PRO PLAN'   },
  unlimited: { label: 'Unlimited', color: 'text-emerald-400', border: 'border-emerald-700/60', progress: 'bg-emerald-500', badge: 'UNLIMITED'  },
};

const PLAN_FEATURES = {
  free:      ['1 free analysis', 'Standard Declawed AI', 'Red flags & key dates'],
  one:       ['1 full analysis', 'Advanced Declawed AI', 'PDF report download', '7-day money-back guarantee'],
  pro:       ['10 analyses / month', 'Advanced Declawed AI', 'PDF report download', 'Email report to yourself', 'Full analysis history', 'Priority processing'],
  unlimited: ['Unlimited analyses', 'Advanced Declawed AI', 'Everything in Pro', 'Landlord Mode', 'Priority support'],
};

const SEVERITY_STYLES = {
  HIGH:   { bg: 'bg-rose-500/15',  text: 'text-rose-400',  border: 'border-rose-500/30'  },
  MEDIUM: { bg: 'bg-amber-500/12', text: 'text-amber-400', border: 'border-amber-500/30' },
  LOW:    { bg: 'bg-zinc-500/15',  text: 'text-zinc-400',  border: 'border-zinc-600/40'  },
};

function SeverityBadge({ severity }) {
  const s = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.LOW;
  return (
    <span className={`inline-block text-[9px] font-bold uppercase tracking-[0.14em] px-1.5 py-0.5 rounded border ${s.bg} ${s.text} ${s.border} shrink-0 leading-none`}>
      {severity ?? 'LOW'}
    </span>
  );
}

const LogoMark = () => (
  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/25 shrink-0">
    <svg viewBox="0 0 20 20" fill="none" className="w-[14px] h-[14px]">
      <path d="M6 10V7a4 4 0 0 1 8 0v3" stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3.5" y="10" width="13" height="9" rx="2.5" fill="white" fillOpacity="0.95" />
      <circle cx="10" cy="14.5" r="1.4" fill="#0d9488" />
    </svg>
  </div>
);

function AnalysisModal({ analysis, onClose, onNoteUpdate, onReanalyzeComplete, onUpgrade, userName }) {
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
  const score = data.score ?? null;

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
        className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm p-4 pt-16 overflow-y-auto"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-2xl rounded-2xl bg-[#0d0d14] border border-white/[0.08] shadow-2xl overflow-hidden"
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
                <h3 className="flex items-center gap-1.5 text-cyan-400 font-semibold mb-3">
                  <Calendar className="w-4 h-4" /> Key Dates
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {data.keyDates.map((item, i) => (
                    <div key={i} className="rounded-lg bg-cyan-500/[0.06] border border-cyan-500/20 px-3 py-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-500/80 mb-0.5">{item.label}</p>
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
              <section className="rounded-xl border border-teal-500/25 bg-teal-500/[0.05] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-teal-500/15 bg-teal-500/[0.04]">
                  <ListChecks className="w-4 h-4 text-teal-400 shrink-0" />
                  <h3 className="text-teal-300 font-semibold text-sm">What to do before signing</h3>
                </div>
                <ul className="divide-y divide-teal-500/[0.08]">
                  {data.actionSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 px-4 py-2.5">
                      <span className="w-4 h-4 rounded border border-teal-500/40 bg-teal-500/10 text-teal-400 text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
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
                  <button onClick={() => setEditingNote(true)} className="text-[10px] text-teal-500 hover:text-teal-400 transition">Edit</button>
                )}
              </div>
              {editingNote ? (
                <div>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value.slice(0, 500))}
                    placeholder="Add a personal note about this lease…"
                    rows={3}
                    className="w-full rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-slate-300 placeholder-zinc-600 px-3 py-2 resize-none focus:outline-none focus:border-teal-500/50 transition"
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
                        className="text-[11px] font-semibold px-3 py-1 rounded-lg bg-teal-500/15 text-teal-400 hover:bg-teal-500/25 disabled:opacity-50 transition"
                      >{noteSaving ? 'Saving…' : 'Save note'}</button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setEditingNote(true)}
                  className="w-full text-left px-3 py-2.5 rounded-lg bg-white/[0.03] border border-dashed border-white/[0.08] text-sm hover:border-teal-500/30 transition"
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
                {shareLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : shareCopied ? <Check className="w-3 h-3 text-teal-400" /> : <Share2 className="w-3 h-3" />}
                {shareCopied ? 'Link copied!' : 'Share report'}
              </button>
              <button
                onClick={handleReanalyze}
                disabled={reanalyzeLoading}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.07] text-xs font-semibold text-zinc-400 hover:text-white transition disabled:opacity-50"
              >
                {reanalyzeLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                {reanalyzeLoading ? 'Re-analyzing…' : 'Re-analyze'}
              </button>
            </div>
            {reanalyzeError && <p className="text-xs text-rose-400">{reanalyzeError}</p>}
          </div>

          {/* Export bar */}
          <div className="px-5 py-3 border-t border-white/[0.06] bg-white/[0.015] flex items-center gap-2">
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

export default function Dashboard({ onClose, onUpgrade }) {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundResult, setRefundResult] = useState(null);
  const [refCopied, setRefCopied] = useState(false);
  const [toast, setToast] = useState(null);
  const [shareLoadingIds, setShareLoadingIds] = useState(new Set());

  useEffect(() => {
    if (!user) return;
    supabase
      .from('analyses')
      .select('id, filename, verdict, created_at, result, note, share_token')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setAnalyses(data || []);
        setLoadingHistory(false);
      });
  }, [user]);

  const plan = (profile?.plan || 'free').toLowerCase();
  const planInfo = PLAN_LABELS[plan] || PLAN_LABELS.free;
  const used = profile?.analyses_used ?? 0;
  const limit = profile?.analyses_limit ?? 1;
  const isUnlimited = plan === 'unlimited';
  const fullDisplayName = user?.user_metadata?.full_name || profile?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'there';
  const displayName = fullDisplayName.split(' ')[0];

  // Computed stats from analysis history
  const totalRedFlags = analyses.reduce((s, a) => s + (a.result?.redFlags?.length ?? 0), 0);
  const riskiest = analyses.length
    ? analyses.reduce((m, a) => ((a.result?.score ?? 11) < (m.result?.score ?? 11)) ? a : m)
    : null;
  const avatarInitials = fullDisplayName.slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  function handleNoteUpdate(id, newNote) {
    setAnalyses((prev) => prev.map((a) => (a.id === id ? { ...a, note: newNote } : a)));
  }

  async function handleReanalyzeComplete() {
    const { data } = await supabase
      .from('analyses')
      .select('id, filename, verdict, created_at, result, note, share_token')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
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

  function handleCopyRef() {
    navigator.clipboard.writeText(`https://declawed.app/?ref=${user.id}`);
    setRefCopied(true);
    setTimeout(() => setRefCopied(false), 2500);
  }

  const handleRefund = async () => {
    setRefundLoading(true);
    setRefundResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      const data = await res.json();
      if (data.ok) {
        await refreshProfile();
        setRefundResult({ ok: true, message: 'Refund processed. Your plan has been reverted to Free.' });
      } else {
        setRefundResult({ ok: false, message: data.message || 'Refund could not be processed.' });
      }
    } catch {
      setRefundResult({ ok: false, message: 'Something went wrong. Please try again.' });
    } finally {
      setRefundLoading(false);
    }
  };

  return (
    <>
    <AppShell>
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Page header */}
        <div className="mb-7 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">Welcome back, {displayName}</h1>
            <p className="text-sm text-zinc-500 mt-0.5">{user?.email}</p>
          </div>
          <a
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.08] bg-white/[0.02] text-sm font-medium text-zinc-400 hover:text-white hover:border-white/[0.15] transition"
          >
            <Upload className="w-3.5 h-3.5" />
            New analysis
          </a>
        </div>

        {/* Plan card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl border ${planInfo.border} bg-[#0b0b12] p-5 mb-5`}
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <span className={`inline-block text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded border ${planInfo.border} ${planInfo.color} mb-2 opacity-70`}>
                {planInfo.badge}
              </span>
              <p className={`text-xl font-bold ${planInfo.color} leading-tight`}>{planInfo.label}</p>
              <p className="text-[11px] text-zinc-600 mt-0.5">Your current plan</p>
            </div>
            {plan === 'free' ? (
              <a
                href="/billing"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 active:scale-95 transition-all shadow-lg shadow-blue-600/20 whitespace-nowrap shrink-0"
              >
                <Zap className="w-3.5 h-3.5" />
                Upgrade to Pro
              </a>
            ) : (
              <a
                href="/billing"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] text-xs font-medium text-zinc-400 hover:text-white hover:border-white/[0.15] transition whitespace-nowrap shrink-0"
              >
                Manage plan →
              </a>
            )}
          </div>

          {/* Plan features */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 mb-4">
            {(PLAN_FEATURES[plan] || []).map((feat, i) => (
              <p key={i} className="flex items-center gap-1.5 text-xs text-zinc-500">
                <span className={`${planInfo.color} shrink-0`}>✓</span>
                {feat}
              </p>
            ))}
          </div>

          <div className="pt-4 border-t border-white/[0.05]">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
              <span>Analyses used</span>
              <span className={`font-semibold tabular-nums ${planInfo.color}`}>{isUnlimited ? `${used} / ∞` : `${used} / ${limit}`}</span>
            </div>
            {!isUnlimited && (
              <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                <div
                  className={`h-full ${planInfo.progress} rounded-full transition-all duration-700`}
                  style={{ width: `${Math.min((used / limit) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Refund section — only for paid plans within 7-day window */}
          {plan !== 'free' && !refundResult?.ok && (() => {
            const isSubscription = ['pro', 'unlimited'].includes(plan);
            const eligible = plan === 'one' ? used === 0 : used < 3;
            return (
              <div className="mt-5 pt-5 border-t border-white/[0.05]">
                <p className="text-[11px] text-zinc-600 mb-3 uppercase tracking-widest font-semibold">7-day Guarantee</p>
                {eligible ? (
                  <button
                    onClick={handleRefund}
                    disabled={refundLoading}
                    className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${refundLoading ? 'animate-spin' : ''}`} />
                    {refundLoading ? 'Processing…' : 'Request refund'}
                  </button>
                ) : (
                  <p className="text-xs text-zinc-600">
                    {isSubscription ? 'Analysis limit reached — ' : 'Analysis already used — '}
                    <a href="/contact" className="text-blue-500 hover:text-blue-400 transition">contact support</a> for disputes.
                  </p>
                )}
              </div>
            );
          })()}
          {refundResult && (
            <p className={`mt-4 text-xs ${refundResult.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
              {refundResult.message}
            </p>
          )}
        </motion.div>

        {/* Quick Stats row */}
        {!loadingHistory && analyses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
            className="grid grid-cols-3 gap-4 mb-6"
          >
            {[
              {
                icon: FileText,
                label: 'Total Analyses',
                value: analyses.length,
                sub: 'leases reviewed',
                valueColor: 'text-blue-400',
                iconBg: 'bg-blue-600/10 border-blue-600/20',
                iconColor: 'text-blue-400',
              },
              {
                icon: AlertTriangle,
                label: 'Red Flags Found',
                value: totalRedFlags,
                sub: 'across all leases',
                valueColor: 'text-rose-400',
                iconBg: 'bg-rose-500/10 border-rose-500/20',
                iconColor: 'text-rose-400',
              },
              {
                icon: ShieldAlert,
                label: 'Highest Risk',
                value: riskiest == null || riskiest.result?.score == null ? '—'
                  : riskiest.result.score <= 4 ? 'High'
                  : riskiest.result.score <= 7 ? 'Medium'
                  : 'Low',
                sub: riskiest?.result?.score != null ? `Score: ${riskiest.result.score}/10` : 'no analyses yet',
                valueColor: riskiest?.result?.score == null ? 'text-zinc-500'
                  : riskiest.result.score <= 4 ? 'text-rose-400'
                  : riskiest.result.score <= 7 ? 'text-amber-400'
                  : 'text-emerald-400',
                iconBg: riskiest?.result?.score == null ? 'bg-zinc-800/60 border-zinc-700/40'
                  : riskiest.result.score <= 4 ? 'bg-rose-500/10 border-rose-500/20'
                  : riskiest.result.score <= 7 ? 'bg-amber-500/10 border-amber-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/20',
                iconColor: riskiest?.result?.score == null ? 'text-zinc-600'
                  : riskiest.result.score <= 4 ? 'text-rose-400'
                  : riskiest.result.score <= 7 ? 'text-amber-400'
                  : 'text-emerald-400',
              },
            ].map(({ icon: Icon, label, value, sub, valueColor, iconBg, iconColor }) => (
              <div key={label} className="rounded-xl bg-[#0b0b12] border border-white/[0.06] px-5 py-5">
                <div className={`w-8 h-8 rounded-lg border ${iconBg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${iconColor}`} />
                </div>
                <p className={`text-2xl font-bold tabular-nums ${valueColor}`}>{value}</p>
                <p className="text-[12px] font-medium text-zinc-400 mt-0.5">{label}</p>
                <p className="text-[11px] text-zinc-600 mt-0.5">{sub}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Analysis history */}
        <motion.div
          id="history"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07 }}
          className="rounded-xl border border-white/[0.07] bg-[#0b0b12] overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-500" />
              Analysis History
            </h2>
            {analyses.length > 0 && (
              <span className="text-xs text-zinc-600">{analyses.length} lease{analyses.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          {loadingHistory ? (
            <div className="px-6 py-12 text-center text-sm text-zinc-600">Loading…</div>
          ) : analyses.length === 0 ? (
            /* Empty state */
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
              <p className="text-base font-semibold text-zinc-300 mb-1.5">No leases analyzed yet</p>
              <p className="text-sm text-zinc-600 max-w-xs leading-relaxed mb-6">Upload your first lease and Declawed AI will flag red flags, key dates, and your tenant rights — in plain English.</p>
              <a
                href="/"
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all text-white text-sm font-semibold shadow-lg shadow-blue-600/20"
              >
                <Upload className="w-4 h-4" />
                Analyze your first lease
              </a>
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {analyses.map((a, i) => {
                const flags = a.result?.redFlags?.length ?? 0;
                const dates = a.result?.keyDates?.length ?? 0;
                const score = a.result?.score ?? null;
                const scoreIsRed = score !== null && score <= 4;
                const scoreIsYellow = score !== null && score >= 5 && score <= 7;
                const scoreIsGreen = score !== null && score >= 8;
                const scoreColor = scoreIsRed ? 'text-rose-400 border-rose-500/40 bg-rose-500/10' : scoreIsYellow ? 'text-amber-400 border-amber-500/40 bg-amber-500/10' : scoreIsGreen ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' : 'text-zinc-500 border-zinc-700 bg-zinc-800/40';
                return (
                  <motion.li
                    key={a.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setSelectedAnalysis(a)}
                    className="relative px-6 py-4 flex items-start gap-3 cursor-pointer transition-all group border-l-2 border-transparent hover:border-blue-500/40 hover:bg-white/[0.03] active:bg-white/[0.04]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center shrink-0 mt-0.5 group-hover:border-blue-500/30 transition">
                      <FileText className="w-3.5 h-3.5 text-zinc-500 group-hover:text-blue-400 transition" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-200 truncate group-hover:text-white transition">{a.filename || 'Untitled document'}</p>
                      {a.verdict && (
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1 leading-relaxed">{a.verdict}</p>
                      )}
                      {/* Summary badges */}
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
                      <time className="text-[11px] text-zinc-600">{new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</time>
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
        </motion.div>

        {/* Analyze another lease CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-6 rounded-xl border border-blue-600/20 bg-blue-600/[0.04] p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div>
            <p className="font-semibold text-white text-sm">Ready to analyze another lease?</p>
            <p className="text-xs text-zinc-500 mt-0.5">Catch hidden clauses before you sign.</p>
          </div>
          <a
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all text-white text-sm font-semibold whitespace-nowrap shadow-lg shadow-blue-600/20"
          >
            <Upload className="w-4 h-4" />
            New analysis
          </a>
        </motion.div>

        {/* Referral section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-5"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Users className="w-4 h-4 text-violet-400" />
            <p className="font-semibold text-white text-sm">Share Declawed with a friend</p>
          </div>
          <p className="text-xs text-zinc-500 mb-4 leading-relaxed">Help someone avoid a bad lease. Share your referral link — it's free for them to try.</p>
          <div className="flex gap-2">
            <div className="flex-1 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-xs text-zinc-400 font-mono truncate select-all">
              https://declawed.app/?ref={user?.id}
            </div>
            <button
              onClick={handleCopyRef}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-500/15 border border-violet-500/25 text-xs font-semibold text-violet-400 hover:bg-violet-500/25 hover:text-violet-300 transition whitespace-nowrap"
            >
              {refCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {refCopied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
        </motion.div>
      </div>
    </AppShell>

    {/* Analysis detail modal */}
    {selectedAnalysis && (
      <AnalysisModal
        analysis={selectedAnalysis}
        onClose={() => setSelectedAnalysis(null)}
        onNoteUpdate={handleNoteUpdate}
        onReanalyzeComplete={handleReanalyzeComplete}
        onUpgrade={onUpgrade}
        userName={fullDisplayName}
      />
    )}

    {/* Toast notification */}
    <AnimatePresence>
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
    </AnimatePresence>
    </>
  );
}
