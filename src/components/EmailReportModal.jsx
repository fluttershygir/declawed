import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Send, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const EMAIL_PLANS = new Set(['pro', 'unlimited']);

export default function EmailReportModal({ open, onClose, analysisData, filename, usage }) {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef(null);

  const isPaid = EMAIL_PLANS.has(usage?.plan);

  // Pre-fill email from auth user whenever modal opens
  useEffect(() => {
    if (open) {
      setEmail(user?.email || '');
      setStatus('idle');
      setErrorMsg('');
    }
  }, [open, user?.email]);

  // Focus the input after open animation
  useEffect(() => {
    if (open && isPaid) {
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [open, isPaid]);

  const handleSend = async () => {
    if (!email.trim()) { setErrorMsg('Please enter an email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErrorMsg('Please enter a valid email address.'); return; }

    setStatus('sending');
    setErrorMsg('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const res = await fetch('/api/send-report', {
        method: 'POST',
        headers,
        body: JSON.stringify({ to: email.trim(), analysisData, filename }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to send.');
      setStatus('success');
    } catch (e) {
      setErrorMsg(e.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && status === 'idle') handleSend();
    if (e.key === 'Escape') onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md rounded-2xl bg-[#0d0d14] border border-white/[0.08] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/25 shrink-0">
                  <Mail className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-tight">Email this report</p>
                  <p className="text-[10px] text-zinc-500 leading-tight mt-0.5 truncate max-w-[220px]">{filename || 'Lease analysis'}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-600 hover:text-white transition p-1 rounded-lg hover:bg-white/[0.06]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5">
              {!isPaid ? (
                /* Upgrade wall */
                <div className="flex flex-col items-center text-center py-4 gap-3">
                  <div className="w-11 h-11 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-zinc-500" />
                  </div>
                  <div>
                    <p className="text-slate-200 font-semibold text-sm">Pro & Unlimited only</p>
                    <p className="text-zinc-500 text-xs mt-1 leading-relaxed">Email reports are available on Pro and Unlimited plans. Upgrade to send your full analysis directly to your inbox.</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="mt-1 px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-semibold text-sm transition-colors"
                  >
                    View upgrade options
                  </button>
                </div>
              ) : status === 'success' ? (
                /* Success state */
                <div className="flex flex-col items-center text-center py-4 gap-3">
                  <div className="w-11 h-11 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-slate-200 font-semibold text-sm">Report sent!</p>
                    <p className="text-zinc-500 text-xs mt-1">Check your inbox at <span className="text-zinc-300">{email}</span></p>
                  </div>
                  <button
                    onClick={onClose}
                    className="mt-1 px-5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 font-semibold text-sm transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : (
                /* Send form */
                <>
                  <p className="text-xs text-zinc-500 mb-3 leading-relaxed">
                    We'll send your full lease analysis — red flags, key dates, your rights, and action steps — straight to your inbox.
                  </p>

                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5" htmlFor="report-email">
                    Send to
                  </label>
                  <input
                    ref={inputRef}
                    id="report-email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); setStatus('idle'); }}
                    onKeyDown={handleKeyDown}
                    placeholder="you@example.com"
                    className="w-full rounded-xl bg-white/[0.04] border border-white/[0.1] text-slate-200 placeholder-zinc-600 text-sm px-3.5 py-2.5 outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition"
                    disabled={status === 'sending'}
                  />

                  {(status === 'error' || errorMsg) && (
                    <div className="flex items-center gap-1.5 mt-2 text-rose-400 text-xs">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {errorMsg}
                    </div>
                  )}

                  <div className="flex gap-2.5 mt-4">
                    <button
                      onClick={onClose}
                      className="flex-1 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:text-zinc-200 font-semibold text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSend}
                      disabled={status === 'sending'}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
                    >
                      {status === 'sending' ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          Send report
                        </>
                      )}
                    </button>
                  </div>

                  <p className="mt-3 text-[10px] text-zinc-600 text-center">Not legal advice. For informational purposes only.</p>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
