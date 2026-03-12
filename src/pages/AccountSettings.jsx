import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User, Bell, AlertTriangle, Check, Loader2, Lock, Trash2, Mail, Pencil, X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import AppShell from '../components/AppShell';

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
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
          value ? 'bg-blue-600' : 'bg-zinc-700'
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
        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
        : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
    }`}>
      {msg.ok
        ? <Check className="w-4 h-4 shrink-0 text-emerald-400" />
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
  const [resetMsg, setResetMsg]         = useState(null);

  // Email change
  const [editingEmail,  setEditingEmail]  = useState(false);
  const [newEmail,      setNewEmail]      = useState('');
  const [savingEmail,   setSavingEmail]   = useState(false);
  const [emailMsg,      setEmailMsg]      = useState(null);

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
    // Direct table update — simpler and avoids schema-cache RPC issues
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', user.id);
    if (!error) {
      // Also sync into auth user_metadata so avatar initials update immediately
      await supabase.auth.updateUser({ data: { full_name: fullName.trim() } });
    }
    setSavingProfile(false);
    if (error) {
      setProfileMsg({ ok: false, text: error.message });
    } else {
      setProfileMsg({ ok: true, text: 'Name saved successfully.' });
      refreshProfile();
    }
  }

  async function handlePasswordReset() {
    setResetLoading(true);
    setResetMsg(null);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetLoading(false);
    if (error) {
      setResetMsg({ ok: false, text: error.message });
    } else {
      setResetSent(true);
      setResetMsg({ ok: true, text: `Password reset email sent to ${user.email}. Check your inbox.` });
    }
  }

  async function handleSaveEmail(e) {
    e.preventDefault();
    if (!newEmail.trim() || newEmail.trim() === user.email) {
      setEmailMsg({ ok: false, text: 'Please enter a different email address.' });
      return;
    }
    setSavingEmail(true);
    setEmailMsg(null);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setSavingEmail(false);
    if (error) {
      setEmailMsg({ ok: false, text: error.message });
    } else {
      setEmailMsg({ ok: true, text: `A confirmation link has been sent to ${newEmail.trim()}. Click it to confirm the change.` });
      setEditingEmail(false);
    }
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
    <>
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-5 sm:px-6 sm:py-8">

        {/* Page header */}
        <div className="mb-7">
          <h1 className="text-xl font-semibold text-white tracking-tight">Account Settings</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Manage your profile, security, and notification preferences</p>
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
                className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Email Address
                </label>
                {!editingEmail && (
                  <button
                    type="button"
                    onClick={() => { setEditingEmail(true); setNewEmail(user?.email || ''); setEmailMsg(null); }}
                    className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-blue-400 transition"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                )}
              </div>
              {editingEmail ? (
                <form onSubmit={handleSaveEmail} className="space-y-2">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    autoFocus
                    placeholder="New email address"
                    className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition"
                  />
                  <StatusBanner msg={emailMsg} />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={savingEmail}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/10 text-blue-400 text-sm font-semibold hover:bg-blue-600/20 transition disabled:opacity-50"
                    >
                      {savingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                      {savingEmail ? 'Sending…' : 'Send confirmation'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditingEmail(false); setEmailMsg(null); }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/[0.08] text-sm text-zinc-500 hover:text-white transition"
                    >
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full rounded-xl bg-white/[0.02] border border-white/[0.05] px-4 py-3 text-sm text-zinc-500 cursor-not-allowed select-none"
                  />
                  <StatusBanner msg={emailMsg} />
                </>
              )}
            </div>

            <StatusBanner msg={profileMsg} />

            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600/10 text-blue-400 text-sm font-semibold hover:bg-blue-600/20 transition disabled:opacity-50"
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-zinc-300">Password</p>
                <p className="text-xs text-zinc-600 mt-0.5">We'll email a reset link to {user?.email}.</p>
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
                {resetSent ? 'Email sent ✓' : 'Send reset link'}
              </button>
            </div>
            {resetMsg && <div className="mt-3"><StatusBanner msg={resetMsg} /></div>}
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
            className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600/10 text-blue-400 text-sm font-semibold hover:bg-blue-600/20 transition disabled:opacity-50"
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

      {/* ─── Delete confirmation modal ──────────────────── */}
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
    </AppShell>
    </>
  );
}
