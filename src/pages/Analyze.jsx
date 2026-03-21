import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import UploadPanel from '../components/UploadPanel';
import SummaryPanel from '../components/SummaryPanel';
import Footer from '../components/Footer';
import { trackEvent } from '../lib/analytics';
import { callSummarize } from '../lib/callSummarize';
import UserDropdown from '../components/UserDropdown';

const LogoMark = () => (
  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-sm shrink-0">
    <svg viewBox="0 0 20 20" fill="none" className="w-[14px] h-[14px]">
      <path d="M6 10V7a4 4 0 0 1 8 0v3" stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3.5" y="10" width="13" height="9" rx="2.5" fill="white" fillOpacity="0.95" />
      <circle cx="10" cy="14.5" r="1.4" fill="#0d9488" />
    </svg>
  </div>
);

export default function AnalyzePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usage, setUsage] = useState(null);
  const [uploadedFilename, setUploadedFilename] = useState('');
  const [landlordMode, setLandlordMode] = useState(false);
  const [analysisLandlordMode, setAnalysisLandlordMode] = useState(false);
  const [modelTier, setModelTier] = useState(null);
  const [retryPayload, setRetryPayload] = useState(null);

  const fetchUsage = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = {};
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
      const res = await fetch('/api/usage', { headers });
      if (res.ok) setUsage(await res.json());
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchUsage();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleUpload = async (payload) => {
    const { imageBase64, filename } = payload || {};
    setError('');
    setSummary('');
    setModelTier(null);
    setAnalysisLandlordMode(false);
    setUploadedFilename(filename || '');
    setRetryPayload(payload || null);
    setLoading(true);
    trackEvent('analysis_started', { filename_type: imageBase64 ? 'image' : 'text' });
    try {
      const result = await callSummarize(payload);
      setSummary(result.summary);
      setModelTier(result.modelTier);
      setAnalysisLandlordMode(result.landlordMode);
      trackEvent('analysis_completed', { model_tier: result.modelTier || 'standard' });
      fetchUsage();
    } catch (e) {
      if (e.paywall) { navigate('/billing'); return; }
      setError(e.message || 'Something went wrong.');
      trackEvent('analysis_failed', { error: e.message?.slice(0, 100) || 'unknown' });
    } finally {
      setLoading(false);
    }
  };

  const hasResult = loading || summary || error;

  return (
    <div className="min-h-screen bg-[#07070d] text-slate-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#07070d]/95 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-[15px] font-bold tracking-tight text-white">Declawed</span>
          </a>
          {user && <UserDropdown size="sm" />}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 w-full">
        <div className="max-w-5xl mx-auto px-4 py-10">

          {!hasResult ? (
            /* Centered upload — before first analysis */
            <div className="max-w-xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-xl font-semibold text-white tracking-tight">Analyze Your Lease</h1>
                <p className="text-sm text-zinc-500 mt-1">Upload a PDF, Word doc, or image — results in under 30 seconds.</p>
              </div>
              <UploadPanel
                onUpload={handleUpload}
                loading={loading}
                usage={usage}
                onUpgrade={() => navigate('/billing')}
                landlordMode={landlordMode}
                onLandlordModeChange={setLandlordMode}
              />
            </div>
          ) : (
            /* Side-by-side once analysis starts */
            <div className="grid md:grid-cols-2 gap-6 items-start">
              <UploadPanel
                onUpload={handleUpload}
                loading={loading}
                usage={usage}
                onUpgrade={() => navigate('/billing')}
                landlordMode={landlordMode}
                onLandlordModeChange={setLandlordMode}
              />
              <SummaryPanel
                summary={summary}
                loading={loading}
                error={error}
                modelTier={modelTier}
                usage={usage}
                filename={uploadedFilename}
                onUpgrade={() => navigate('/billing')}
                landlordMode={analysisLandlordMode}
                user={user}
                onSignUp={(tab) => navigate(`/?auth=${tab}`)}
                onRetry={retryPayload ? () => handleUpload(retryPayload) : null}
              />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
