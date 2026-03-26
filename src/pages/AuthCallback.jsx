import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let finished = false;

    // Single exit point — prevents double-redirects and clears the safety timer.
    const timers = [];
    const finish = () => {
      if (finished) return;
      finished = true;
      timers.forEach(clearTimeout);
      window.location.replace('/');
    };

    // Absolute safety valve: never hang more than 10 seconds under any circumstance.
    timers.push(setTimeout(finish, 10000));

    // ── Listener path ───────────────────────────────────────────────────────
    // Supabase JS v2 with detectSessionInUrl:true auto-exchanges the PKCE code
    // on initialisation and fires SIGNED_IN. Catch it here so we redirect even
    // if the manual exchange below is redundant or races.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) finish();
    });

    // ── Active exchange path ────────────────────────────────────────────────
    async function handleCallback() {
      const params = new URLSearchParams(window.location.search);
      const oauthError = params.get('error');

      if (oauthError) {
        setErrorMsg(params.get('error_description') || 'Sign-in was cancelled or failed.');
        timers.push(setTimeout(finish, 3000));
        return;
      }

      // If the library already auto-exchanged the code, session is set; redirect now.
      const { data: { session: existing } } = await supabase.auth.getSession();
      if (existing) { finish(); return; }

      const code = params.get('code');
      if (!code) { finish(); return; }

      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (finished) return;
        if (error) {
          // Could be a double-exchange (library already consumed the code).
          // Re-check session before showing an error to the user.
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (retrySession) { finish(); return; }
          setErrorMsg('Sign-in failed. Please try again.');
          timers.push(setTimeout(finish, 3000));
        } else {
          finish();
        }
      } catch {
        if (finished) return;
        // Threw — still check whether a session was silently set.
        const { data: { session: catchSession } } = await supabase.auth.getSession();
        if (catchSession) { finish(); return; }
        setErrorMsg('Sign-in failed. Please try again.');
        timers.push(setTimeout(finish, 3000));
      }
    }

    handleCallback();

    return () => {
      finished = true;
      timers.forEach(clearTimeout);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      {errorMsg ? (
        <div className="text-center px-6">
          <p className="text-rose-400 text-sm font-medium mb-2">{errorMsg}</p>
          <p className="text-zinc-600 text-xs">Redirecting you back…</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
          </div>
          <p className="text-zinc-500 text-sm">Signing you in…</p>
        </div>
      )}
    </div>
  );
}
