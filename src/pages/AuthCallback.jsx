import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) {
      navigate('/');
      return;
    }

    supabase.auth.exchangeCodeForSession(code)
      .then(({ error: err }) => {
        if (err) {
          setError('Sign-in failed. Please try again.');
          setTimeout(() => navigate('/'), 3000);
        } else {
          navigate('/');
        }
      });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      {error ? (
        <p className="text-rose-400 text-sm">{error}</p>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          <p className="text-zinc-500 text-sm">Signing you in…</p>
        </div>
      )}
    </div>
  );
}
