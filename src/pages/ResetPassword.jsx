import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Check, AlertTriangle, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

const LogoMark = () => (
  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
    <svg viewBox="0 0 20 20" fill="none" className="w-[15px] h-[15px]">
      <path d="M6 10V7a4 4 0 0 1 8 0v3" stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3.5" y="10" width="13" height="9" rx="2.5" fill="white" fillOpacity="0.95" />
      <circle cx="10" cy="14.5" r="1.4" fill="#4a7fcb" />
    </svg>
  </div>
);

export default function ResetPassword() {
  const [ready, setReady]         = useState(false);   // recovery session established
  const [invalid, setInvalid]     = useState(false);   // invalid / expired token
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [showCf, setShowCf]       = useState(false);
  const [saving, setSaving]       = useState(false);
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    // Supabase v2 parses the recovery token from the URL hash automatically.
    // The PASSWORD_RECOVERY event fires once the session is established.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
        setInvalid(false);
      }
    });

    // Give Supabase ~3 s to detect the session from the URL before showing "invalid"
    const fallback = setTimeout(() => {
      supabase.auth.getSession().then(({ data }) => {
        if (!data?.session) setInvalid(true);
        else setReady(true);
      });
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallback);
    };
  }, []);

  // Redirect to dashboard 3 s after success
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => { window.location.href = '/dashboard'; }, 3000);
    return () => clearTimeout(t);
  }, [done]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
    } else {
      setDone(true);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <a href="/" className="flex items-center gap-2.5 mb-10">
        <LogoMark />
        <span className="text-[16px] font-bold tracking-tight text-white">Declawed</span>
      </a>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md rounded-2xl border border-white/[0.09] bg-white/[0.025] p-8 shadow-2xl"
      >
        {/* Invalid / expired */}
        {invalid && !ready && (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 text-rose-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Link expired or invalid</h1>
            <p className="text-zinc-500 text-sm leading-relaxed">
              This password reset link is no longer valid. Please request a new one.
            </p>
            <a
              href="/account"
              className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm text-zinc-300 hover:text-white hover:border-white/20 transition"
            >
              Back to Account Settings
            </a>
          </div>
        )}

        {/* Loading (waiting for Supabase to confirm token) */}
        {!invalid && !ready && !done && (
          <div className="text-center space-y-4">
            <Loader2 className="w-7 h-7 animate-spin text-blue-400 mx-auto" />
            <p className="text-zinc-400 text-sm">Verifying your reset link…</p>
          </div>
        )}

        {/* Success */}
        {done && (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Password updated</h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Your password has been changed successfully. Redirecting you to the dashboard…
            </p>
            <div className="flex justify-center mt-1">
              <span className="text-xs text-zinc-600">Redirecting in 3 seconds</span>
            </div>
          </div>
        )}

        {/* Form */}
        {ready && !done && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-5 h-5 text-blue-400" />
              </div>
              <h1 className="text-xl font-bold text-white">Set a new password</h1>
              <p className="text-zinc-500 text-sm mt-1">Choose a strong password of at least 8 characters.</p>
            </div>

            {/* New password */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoFocus
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3 pr-10 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showCf ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  placeholder="Repeat new password"
                  className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3 pr-10 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowCf(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
                  tabIndex={-1}
                >
                  {showCf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Inline match indicator */}
            {confirm.length > 0 && (
              <p className={`text-xs flex items-center gap-1.5 ${password === confirm ? 'text-emerald-400' : 'text-rose-400'}`}>
                {password === confirm
                  ? <><Check className="w-3.5 h-3.5" /> Passwords match</>
                  : <><AlertTriangle className="w-3.5 h-3.5" /> Passwords do not match</>
                }
              </p>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-500 text-black font-bold text-sm hover:bg-blue-400 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</>
                : <><Check className="w-4 h-4" /> Set new password</>
              }
            </button>
          </form>
        )}
      </motion.div>

      <p className="mt-6 text-xs text-zinc-600">
        Need help?{' '}
        <a href="/contact" className="text-blue-500 hover:text-blue-400 transition">Contact support</a>
      </p>
    </div>
  );
}
