import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, FileText, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UploadPanel from '../components/UploadPanel';
import SummaryPanel from '../components/SummaryPanel';
import { trackEvent } from '../lib/analytics';

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
  const [retryPayload, setRetryPayload] = useState(null);

  // Fetch usage data
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

  useState(() => {
    fetchUsage();
  }, [user]);

  const handleUpload = async (payload) => {
    const { text, imageBase64, imageMediaType, filename } = payload || {};
    setError('');
    setSummary('');
    setAnalysisLandlordMode(false);
    setUploadedFilename(filename || '');
    setRetryPayload(payload || null);
    setLoading(true);
    trackEvent('analysis_started', { filename_type: imageBase64 ? 'image' : 'text' });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const bodyPayload = imageBase64
        ? { imageBase64, imageMediaType, filename, landlordMode: payload?.landlordMode }
        : { text, filename, landlordMode: payload?.landlordMode };

      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const raw = await res.text();
        throw new Error(`CF error (HTTP ${res.status}): ${raw.replace(/<[^>]+>/g, '').trim().slice(0, 200)}`);
      }

      const data = await res.json();

      if (res.status === 402) {
        // Redirect to billing for paywall
        navigate('/billing');
        return;
      }

      if (!res.ok || data.error) throw new Error(data.error || 'Something went wrong.');
      
      const rawSummary = data.summary;
      const parsedSummary = (() => {
        if (!rawSummary) return null;
        if (typeof rawSummary === 'object') return rawSummary;
        try { return JSON.parse(rawSummary); } catch { return { _parseError: true }; }
      })();
      setSummary(parsedSummary);
      setAnalysisLandlordMode(!!data.landlordMode);
      trackEvent('analysis_completed', { model_tier: data.modelTier || 'standard' });
      fetchUsage();
    } catch (e) {
      setError(e.message || 'Something went wrong.');
      trackEvent('analysis_failed', { error: e.message?.slice(0, 100) || 'unknown' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070d] text-slate-100 flex flex-col">
      {/* Simple header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#07070d]/95 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <a href="/app" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/25 shrink-0">
              <svg viewBox="0 0 20 20" fill="none" className="w-[14px] h-[14px]">
                <path d="M6 10V7a4 4 0 0 1 8 0v3" stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="3.5" y="10" width="13" height="9" rx="2.5" fill="white" fillOpacity="0.95" />
                <circle cx="10" cy="14.5" r="1.4" fill="#0d9488" />
              </svg>
            </div>
            <span className="text-[15px] font-bold tracking-tight text-white">Declawed</span>
          </a>
          
          <button
            onClick={() => navigate('/app')}
            className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </button>
        </div>
      </header>

      {/* Main content - centered upload tool */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">Analyze Your Lease</h1>
          <p className="text-zinc-500 text-sm sm:text-base">Upload your lease and get a full breakdown in under 30 seconds.</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 items-stretch">
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
            modelTier={null} 
            usage={usage} 
            filename={uploadedFilename} 
            onUpgrade={() => navigate('/billing')} 
            landlordMode={analysisLandlordMode} 
            user={user} 
            onRetry={retryPayload ? () => handleUpload(retryPayload) : null} 
          />
        </div>
      </main>
    </div>
  );
}
