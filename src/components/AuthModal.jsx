import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Loader2, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const LogoMark = () => (
  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30 shrink-0">
    <svg viewBox="0 0 20 20" fill="none" className="w-[17px] h-[17px]">
      <path d="M6 10V7a4 4 0 0 1 8 0v3" stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3.5" y="10" width="13" height="9" rx="2.5" fill="white" fillOpacity="0.95" />
      <circle cx="10" cy="14.5" r="1.4" fill="#0d9488" />
    </svg>
  </div>
);

export default function AuthModal({ open, onClose, defaultTab = 'signin' }) {
  const [tab, setTab] = useState(defaultTab);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reset form and tab whenever the modal opens or defaultTab changes
  useEffect(() => {
    if (open) {
      setTab(defaultTab);
      setFullName('');
      setEmail('');
      setPassword('');
      setShowPass(false);
      setError('');
      setSuccess('');
    }
  }, [open, defaultTab]);

  const reset = () => { setError(''); setSuccess(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    reset();
    try {
      if (tab === 'signin') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        onClose();
      } else if (tab === 'signup') {
        // Read referral code stored by App.jsx when user visited via ?ref=UUID
        const storedRef = localStorage.getItem('declawed_ref');
        const refId = storedRef && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storedRef)
          ? storedRef
          : undefined;

        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName.trim(), ...(refId ? { referred_by: refId } : {}) } },
        });
        if (err) throw err;
        // Persist full_name (and referred_by if present) to profiles table
        if (data?.user?.id) {
          await supabase
            .from('profiles')
            .upsert(
              { id: data.user.id, full_name: fullName.trim(), ...(refId ? { referred_by: refId } : {}) },
              { onConflict: 'id' }
            );
        }
        // Clear referral code once used
        if (refId) localStorage.removeItem('declawed_ref');
        setSuccess('Account created! Check your email to confirm, then sign in.');
        // Fire-and-forget welcome email
        fetch('/api/welcome-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name: fullName.trim() }),
        }).catch(() => {});
      } else {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (err) throw err;
        setSuccess('Password reset email sent. Check your inbox.');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  };

  const headerTitle = tab === 'forgot' ? 'Reset your password' : 'Welcome to Declawed';
  const headerSub = tab === 'signin'
    ? 'Sign in to continue protecting yourself'
    : tab === 'signup'
    ? 'Know what you\'re signing before you sign it'
    : 'Enter your email and we\'ll send a reset link';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-zinc-950 border border-white/[0.09] shadow-2xl shadow-black/60 relative overflow-hidden"
          >
            {/* Top accent line */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-500/60 to-transparent" />

            <button onClick={onClose} className="absolute right-4 top-4 text-zinc-600 hover:text-white transition z-10 p-1 rounded-md hover:bg-white/[0.06]">
              <X className="w-4 h-4" />
            </button>

            {/* Brand header */}
            <div className="px-6 pt-7 pb-6 text-center border-b border-white/[0.06] bg-gradient-to-b from-white/[0.02] to-transparent">
              <div className="flex justify-center mb-3.5">
                <LogoMark />
              </div>
              <h2 className="text-[17px] font-bold text-white tracking-tight">{headerTitle}</h2>
              <p className="text-[12px] text-zinc-500 mt-1 leading-relaxed">{headerSub}</p>
            </div>

            <div className="p-6">
              {/* Tab toggle */}
              {tab !== 'forgot' && (
                <div className="flex gap-1 mb-5 bg-white/[0.04] rounded-xl p-1">
                  {[['signin', 'Sign in'], ['signup', 'Create account']].map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => { setTab(id); reset(); }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        tab === id
                          ? 'bg-white/[0.09] text-white shadow-sm'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Full Name — signup only */}
                {tab === 'signup' && (
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 group-focus-within:text-teal-400 transition" />
                    <input
                      type="text"
                      required
                      autoComplete="name"
                      placeholder="Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/60 focus:bg-white/[0.06] transition"
                    />
                  </div>
                )}

                {/* Email */}
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 group-focus-within:text-teal-400 transition" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/60 focus:bg-white/[0.06] transition"
                  />
                </div>

                {/* Password */}
                {tab !== 'forgot' && (
                  <div>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 group-focus-within:text-teal-400 transition" />
                      <input
                        type={showPass ? 'text' : 'password'}
                        required
                        minLength={tab === 'signup' ? 8 : 6}
                        autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/60 focus:bg-white/[0.06] transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
                      >
                        {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {tab === 'signup' && (
                      <p className="mt-1.5 ml-1 text-[11px] text-zinc-600 flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full transition-colors ${password.length >= 8 ? 'bg-teal-400' : 'bg-zinc-700'}`} />
                        At least 8 characters
                      </p>
                    )}
                  </div>
                )}

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/[0.08] border border-rose-500/20 text-rose-400 text-xs leading-relaxed"
                  >
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    {error}
                  </motion.div>
                )}

                {/* Success */}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-teal-500/[0.08] border border-teal-500/20 text-teal-400 text-xs leading-relaxed"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    {success}
                  </motion.div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-teal-500 text-black text-sm font-bold hover:bg-teal-400 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 mt-1"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {tab === 'signin' ? 'Sign in' : tab === 'signup' ? 'Create account' : 'Send reset email'}
                </button>

                {/* ToS notice — signup only */}
                {tab === 'signup' && (
                  <p className="text-[11px] text-zinc-600 text-center leading-relaxed pt-0.5">
                    By creating an account you agree to our{' '}
                    <a href="/terms" className="text-zinc-400 hover:text-white underline underline-offset-2 transition">Terms of Service</a>
                    {' '}and{' '}
                    <a href="/privacy" className="text-zinc-400 hover:text-white underline underline-offset-2 transition">Privacy Policy</a>
                  </p>
                )}
              </form>

              {/* Divider + Google */}
              {tab !== 'forgot' && (
                <>
                  <div className="my-4 flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/[0.06]" />
                    <span className="text-xs text-zinc-700">or</span>
                    <div className="flex-1 h-px bg-white/[0.06]" />
                  </div>
                  <button
                    onClick={handleGoogle}
                    className="w-full py-2.5 rounded-xl border border-white/[0.08] text-sm text-zinc-400 hover:text-white hover:border-white/20 hover:bg-white/[0.03] transition flex items-center justify-center gap-2.5"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </button>
                </>
              )}

              {tab === 'signin' && (
                <button
                  onClick={() => { setTab('forgot'); reset(); }}
                  className="mt-3 w-full text-center text-xs text-zinc-600 hover:text-zinc-400 transition"
                >
                  Forgot password?
                </button>
              )}
              {tab === 'forgot' && (
                <button
                  onClick={() => { setTab('signin'); reset(); }}
                  className="mt-3 w-full text-center text-xs text-zinc-600 hover:text-zinc-400 transition"
                >
                  ← Back to sign in
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
