import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, User, Bell, AlertTriangle, Check, Loader2, Lock, Trash2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import UserDropdown from '../components/UserDropdown';

const LogoMark = () => (
  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/25 shrink-0">
    <svg viewBox="0 0 20 20" fill="none" className="w-[14px] h-[14px]">
      <path d="M6 10V7a4 4 0 0 1 8 0v3" stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3.5" y="10" width="13" height="9" rx="2.5" fill="white" fillOpacity="0.95" />
      <circle cx="10" cy="14.5" r="1.4" fill="#0d9488" />
    </svg>
  </div>
);

function ToggleRow({ label, description, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-white/[0.05] last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm text-zinc-200 leading-snug">{label}</p>
        <p className="text-xs text-zinc-600 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        role="switch"
        aria-checked={value}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 ${
          value ? 'bg-teal-500' : 'bg-zinc-700'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            value ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function StatusBanner({ msg }) {
  if (!msg) return null;
  return (
    <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
      msg.ok
        ? 'bg-teal-500/10 border border-teal-500/20 text-teal-400'
        : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
    }`}>
      {msg.ok
        ? <Check className="w-4 h-4 shrink-0" />
        : <AlertTriangle className="w-4 h-4 shrink-0" />
      }
      {msg.text}
    </div>
  );
}

export default function AccountSettings() {
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();

  // Profile
  const [fullName, setFullName]         = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg]     = useState(null);

  // Password reset
  const [resetSent, setResetSent]       = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Notification prefs
  const [notifAnalysis, setNotifAnalysis] = useState(false);
  const [notifSummary,  setNotifSummary]  = useState(false);
  const [savingNotifs, setSavingNotifs]   = useState(false);
  const [notifsMsg, setNotifsMsg]         = useState(null);

  // Danger zone
  const [deleteModalOpen,   setDeleteModalOpen]   = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting]                   = useState(false);
  const [deleteError, setDeleteError]             = useState('');

  // Hydrate from profile
  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name || '');
    const prefs = profile.user_preferences || {};
    setNotifAnalysis(prefs.email_on_complete ?? true);
    setNotifSummary(prefs.monthly_summary     ?? false);
  }, [profile]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) window.location.href = '/';
  }, [authLoading, user]);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', user.id);
    setSavingProfile(false);
    if (error) {
      setProfileMsg({ ok: false, text: error.message });
    } else {
      setProfileMsg({ ok: true, text: 'Profile updated.' });
      refreshProfile();
      // Also update user_metadata so the avatar initials refresh
      await supabase.auth.updateUser({ data: { full_name: fullName.trim() } });
    }
  }

  async function handlePasswordReset() {
    setResetLoading(true);
    await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/account`,
    });
    setResetLoading(false);
    setResetSent(true);
  }

  async function handleSaveNotifs() {
    setSavingNotifs(true);
    setNotifsMsg(null);
    const prefs = { email_on_complete: notifAnalysis, monthly_summary: notifSummary };
    const { error } = await supabase
      .from('profiles')
      .update({ user_preferences: prefs })
      .eq('id', user.id);
    setSavingNotifs(false);
    setNotifsMsg(
      error
        ? { ok: false, text: error.message }
        : { ok: true,  text: 'Preferences saved.' }
    );
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    setDeleteError('');
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/delete-account', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (res.ok) {
      await supabase.auth.signOut();
      window.location.href = '/';
    } else {
      const d = await res.json().catch(() => ({}));
      setDeleteError(d.error || 'Failed to delete account. Please try again or contact support.');
      setDeleting(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#07070d] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070d] text-slate-100">
      {/* Top nav */}
      <div className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#07070d]/90 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-[15px] font-bold tracking-tight text-white">Declawed</span>
          </a>
          <UserDropdown size="md" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-10">
        {/* Back */}
        <a
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </a>

        <div className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-2">Account</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Account Settings</h1>
        </div>

        {/* ─── Profile ─────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 mb-5"
        >
          <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 mb-5">
            <User className="w-3.5 h-3.5" /> Profile
          </h2>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={100}
                placeholder="Your name"
                className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500/50 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full rounded-xl bg-white/[0.02] border border-white/[0.05] px-4 py-3 text-sm text-zinc-500 cursor-not-allowed select-none"
              />
              <p className="mt-1.5 text-[11px] text-zinc-600">Email address cannot be changed.</p>
            </div>

            <StatusBanner msg={profileMsg} />

            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500/15 text-teal-300 text-sm font-semibold hover:bg-teal-500/25 transition disabled:opacity-50"
            >
              {savingProfile
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Check className="w-4 h-4" />
              }
              {savingProfile ? 'Saving…' : 'Save changes'}
            </button>
          </form>

          {/* Change password */}
          <div className="mt-6 pt-6 border-t border-white/[0.06]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-zinc-300">Password</p>
                <p className="text-xs text-zinc-600 mt-0.5">We'll send a reset link to your email address.</p>
              </div>
              <button
                onClick={handlePasswordReset}
                disabled={resetLoading || resetSent}
                className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.09] text-sm text-zinc-400 hover:text-white hover:border-white/20 transition disabled:opacity-50 disabled:cursor-default"
              >
                {resetLoading
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Lock className="w-3.5 h-3.5" />
                }
                {resetSent ? 'Reset email sent ✓' : 'Change password'}
              </button>
            </div>
          </div>
        </motion.section>

        {/* ─── Notification Preferences ────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 mb-5"
        >
          <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 mb-4">
            <Bell className="w-3.5 h-3.5" /> Notification Preferences
          </h2>

          <ToggleRow
            label="Email me when analysis is complete"
            description="Receive an email as soon as your lease analysis finishes"
            value={notifAnalysis}
            onChange={setNotifAnalysis}
          />
          <ToggleRow
            label="Monthly lease activity summary"
            description="A monthly digest of your analysis activity and tips"
            value={notifSummary}
            onChange={setNotifSummary}
          />

          <StatusBanner msg={notifsMsg} />

          <button
            onClick={handleSaveNotifs}
            disabled={savingNotifs}
            className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500/15 text-teal-300 text-sm font-semibold hover:bg-teal-500/25 transition disabled:opacity-50"
          >
            {savingNotifs
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Check className="w-4 h-4" />
            }
            {savingNotifs ? 'Saving…' : 'Save preferences'}
          </button>
        </motion.section>

        {/* ─── Danger Zone ─────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-rose-500/25 bg-rose-500/[0.03] p-6"
        >
          <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-rose-400 mb-2">
            <AlertTriangle className="w-3.5 h-3.5" /> Danger Zone
          </h2>
          <p className="text-sm text-zinc-500 mb-5 leading-relaxed">
            Permanently delete your account and all associated data including analyses, settings, and history. This action cannot be undone.
          </p>
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-rose-500/30 text-rose-400 text-sm font-semibold hover:bg-rose-500/10 hover:border-rose-500/50 transition"
          >
            <Trash2 className="w-4 h-4" />
            Delete account
          </button>
        </motion.section>
      </div>

      {/* ─── Delete confirmation modal ───────────────────── */}
      {deleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDeleteModalOpen(false);
              setDeleteConfirmText('');
              setDeleteError('');
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-[#0d0d14] border border-white/[0.08] rounded-2xl p-7 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base leading-tight">Delete your account</h3>
                <p className="text-xs text-zinc-500 mt-0.5">This action is permanent and cannot be reversed.</p>
              </div>
            </div>

            <p className="text-sm text-zinc-400 leading-relaxed mb-5">
              All of your analyses, settings, and account data will be permanently deleted. To confirm, type{' '}
              <span className="font-mono font-bold text-zinc-200">DELETE</span> in the box below.
            </p>

            <input
              type="text"
              placeholder="Type DELETE to confirm"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-rose-500/40 transition mb-4 font-mono"
              autoFocus
            />

            {deleteError && (
              <p className="text-xs text-rose-400 mb-4 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {deleteError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteModalOpen(false); setDeleteConfirmText(''); setDeleteError(''); }}
                className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-sm text-zinc-400 hover:text-white hover:border-white/20 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-sm font-semibold hover:bg-rose-500/30 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleting
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Trash2 className="w-4 h-4" />
                }
                {deleting ? 'Deleting…' : 'Delete forever'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
