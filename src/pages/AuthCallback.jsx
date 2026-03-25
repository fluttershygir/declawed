import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      // Check for OAuth error from Google
      const params = new URLSearchParams(window.location.search);
      const oauthError = params.get('error');
      if (oauthError) {
        setErrorMsg(params.get('error_description') || 'Sign-in was cancelled or failed.');
        setTimeout(() => { if (!cancelled) navigate('/'); }, 3000);
        return;
      }

      const code = params.get('code');

      if (code) {
        // PKCE flow — exchange code for session
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!cancelled) {
          if (error) {
            console.error('[AuthCallback] exchangeCodeForSession error:', error.message);
            setErrorMsg('Sign-in failed. Please try again.');
            setTimeout(() => navigate('/'), 3000);
          } else {
            navigate('/');
          }
        }
        return;
      }

      // Implicit flow fallback — Supabase sets session from URL hash automatically
      // Wait briefly for the client to process it
      const { data: { session } } = await supabase.auth.getSession();
      if (!cancelled) {
        if (session) {
          navigate('/');
        } else {
          // Give Supabase one more tick to process the hash
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (!cancelled) {
              navigate('/');
            }
          }, 800);
        }
      }
    }

    handleCallback();
    return () => { cancelled = true; };
  }, [navigate]);

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
