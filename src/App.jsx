import { useState, useEffect, useRef, Component } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, CheckCircle2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';
import { callSummarize } from './lib/callSummarize';

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ background: '#0a0a0f', color: '#f1f5f9', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'monospace' }}>
          <h1 style={{ color: '#fb7185', marginBottom: '1rem' }}>Something went wrong</h1>
          <pre style={{ background: '#1a1a2e', padding: '1rem', borderRadius: '8px', maxWidth: '600px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '13px', color: '#94a3b8' }}>{this.state.error.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
import Landing from './components/Landing';
import UploadPanel from './components/UploadPanel';
import SummaryPanel from './components/SummaryPanel';
import PaywallModal from './components/PaywallModal';
import PricingSection from './components/PricingSection';
import SuccessToast from './components/SuccessToast';
import Navbar from './components/Navbar';
import HowItWorks from './components/HowItWorks';
import TrustBar from './components/TrustBar';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import { trackEvent } from './lib/analytics';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import AuthModal from './components/AuthModal';
import UserDropdown from './components/UserDropdown';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import CookiePolicy from './pages/CookiePolicy';
import Contact from './pages/Contact';
import SharedReport from './pages/SharedReport';
import AccountSettings from './pages/AccountSettings';
import Billing from './pages/Billing';
import ResetPassword from './pages/ResetPassword';
import AnalysisHistory from './pages/AnalysisHistory';
import LeaseReview from './pages/LeaseReview';
import TenantRights from './pages/TenantRights';
import Analyze from './pages/Analyze';
import HowItWorksPage from './pages/HowItWorksPage';
import AuthCallback from './pages/AuthCallback';
import './index.css';

const PAID_PLANS = new Set(['one', 'pro', 'unlimited']);

function AnalysisHistoryPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/');
  }, [user, loading, navigate]);

  if (loading || !user) return null;
  return <AnalysisHistory />;
}

function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/');
  }, [user, loading, navigate]);

  if (loading || !user) return null;
  return <Dashboard onClose={() => navigate('/')} onUpgrade={() => navigate('/?upgrade=1')} />;
}

function MainApp() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const resultsRef = useRef(null);
  const [mobileTab, setMobileTab] = useState('upload');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [error, setError] = useState('');
  const [usage, setUsage] = useState(null);
  const [successToast, setSuccessToast] = useState(null);
  const [modelTier, setModelTier] = useState(null);
  const [scorePercentile, setScorePercentile] = useState(null);
  const [uploadedFilename, setUploadedFilename] = useState('');
  const [landlordMode, setLandlordMode] = useState(false);
  const [analysisLandlordMode, setAnalysisLandlordMode] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState('signin');
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

  // Re-fetch usage whenever auth state changes (sign-in / sign-out)
  useEffect(() => {
    fetchUsage();
    // After sign-in, if a pending result was saved from /analyze, redirect back there
    if (user && sessionStorage.getItem('dcl_pending_result')) {
      navigate('/analyze');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Capture ?ref=UUID from URL on load and store in localStorage for signup attribution
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref)) {
      localStorage.setItem('declawed_ref', ref);
    }
  }, []);

  // Handle Stripe success redirect and upgrade intent from dashboard
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Dashboard "Upgrade" button navigates here with ?upgrade=1
    if (params.get('upgrade') === '1') {
      setPaywallOpen(true);
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    // /analyze page sign-up/sign-in buttons navigate here with ?auth=signup or ?auth=signin
    const authParam = params.get('auth');
    if (authParam === 'signup' || authParam === 'signin') {
      setAuthTab(authParam);
      setAuthOpen(true);
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    const checkout = params.get('checkout');
    const sessionId = params.get('session_id');
    const tier = params.get('tier');

    if (checkout === 'success' && sessionId && tier) {
      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const headers = { 'Content-Type': 'application/json' };
          if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
          const res = await fetch('/api/verify-payment', {
            method: 'POST',
            headers,
            body: JSON.stringify({ session_id: sessionId }),
          });
          if (res.ok) {
            const labels = { one: 'Plan activated!', pro: 'Pro access activated!', unlimited: 'Unlimited access activated!' };
            setSuccessToast(labels[tier] || 'Access unlocked!');
            fetchUsage();
            refreshProfile();
          }
        } catch {
          // ignore
        }
        window.history.replaceState({}, '', window.location.pathname);
      })();
    }
  }, []);

  // UploadPanel calls onUpload({ text, filename }) or onUpload({ imageBase64, imageMediaType, filename })
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
      setScorePercentile(result.scorePercentile);
      setAnalysisLandlordMode(result.landlordMode);
      trackEvent('analysis_completed', { model_tier: result.modelTier || 'standard' });
      fetchUsage();
      setMobileTab('results');
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      // Fire-and-forget: reward referrer if this is the referred user's first analysis
      supabase.auth.getSession().then(({ data: sd }) => {
        if (!sd?.session?.access_token) return;
        fetch('/api/referral-complete', {
          method: 'POST',
          headers: { Authorization: `Bearer ${sd.session.access_token}` },
        }).catch(() => {});
      });
    } catch (e) {
      if (e.paywall) {
        setPaywallOpen(true);
        trackEvent('upgrade_clicked', { trigger: 'paywall_402' });
        return;
      }
      setError(e.message || 'Something went wrong.');
      trackEvent('analysis_failed', { error: e.message?.slice(0, 100) || 'unknown' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col">
      <Navbar />
      <Landing usage={usage} />
      <HowItWorks />
      <TrustBar />

      {/* Tool: upload + summary */}
      <section id="upload" className="w-full border-t border-b border-white/[0.06] bg-[#0f1117]" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
        <div className="w-full max-w-5xl mx-auto px-4">
          {/* Section header */}
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Analyze Your Lease</h2>
            <p className="text-zinc-500 mt-2 text-sm sm:text-base">Upload your lease and get a full breakdown in under 30 seconds.</p>
          </div>
          {/* Mobile tab switcher — only visible after first upload */}
          {(summary || loading || error) && (
            <div className="flex md:hidden rounded-xl bg-white/[0.04] border border-white/[0.07] p-1 mb-5">
              <button
                onClick={() => setMobileTab('upload')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${mobileTab === 'upload' ? 'bg-white/[0.09] text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >Upload</button>
              <button
                onClick={() => { setMobileTab('results'); setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${mobileTab === 'results' ? 'bg-white/[0.09] text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Results {loading && <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse align-middle" />}
              </button>
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-6 items-stretch">
            <div className={(summary || loading || error) ? (mobileTab === 'upload' ? 'block' : 'hidden md:block') : 'block'}>
              <UploadPanel onUpload={(p) => { setMobileTab('upload'); handleUpload(p); }} loading={loading} usage={usage} onUpgrade={() => setPaywallOpen(true)} landlordMode={landlordMode} onLandlordModeChange={setLandlordMode} />
            </div>
            <div ref={resultsRef} className={(summary || loading || error) ? (mobileTab === 'results' ? 'block' : 'hidden md:block') : 'block'}>
              <SummaryPanel summary={summary} loading={loading} error={error} modelTier={modelTier} scorePercentile={scorePercentile} usage={usage} filename={uploadedFilename} onUpgrade={() => setPaywallOpen(true)} landlordMode={analysisLandlordMode} user={user} onSignUp={(tab) => { setAuthTab(tab); setAuthOpen(true); }} onRetry={retryPayload ? () => handleUpload(retryPayload) : null} />
            </div>
          </div>
        </div>
      </section>

      <Testimonials />

      {/* Landlord Mode callout */}
      <section className="py-24 md:py-32 px-5 border-t border-white/[0.05] w-full">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400 mb-4">Landlord Mode</p>
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
                Not just for tenants.
              </h2>
              <p className="mt-4 text-zinc-400 leading-relaxed">
                Property managers and realtors use Declawed to review leases from the{' '}
                <span className="text-amber-300 font-medium">landlord&rsquo;s perspective</span> &mdash; surfacing
                tenant obligations, liability gaps, and clauses that won&rsquo;t hold up in court.
              </p>
              <p className="mt-3 text-zinc-500 text-sm leading-relaxed">
                On the Unlimited plan, toggle Landlord Mode before uploading and the AI shifts its
                entire analysis to protect you as the property owner instead of the tenant.
              </p>
              <button
                onClick={() => setPaywallOpen(true)}
                className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-semibold hover:bg-amber-500/20 hover:border-amber-500/50 transition-all active:scale-95"
              >
                <Building2 className="w-4 h-4" />
                See Unlimited plan
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { title: 'Spot unenforceable clauses', desc: "Know which of your terms won't hold up before a tenant challenges them." },
                { title: 'Surface tenant obligations', desc: 'Get a clear map of what your tenant is required to do and when.' },
                { title: 'Find liability gaps', desc: 'Identify places where your lease leaves you exposed in a dispute.' },
                { title: 'Flag missing protections', desc: 'Catch absent clauses — no-pet policy, subletting restrictions, late fees.' },
              ].map(({ title, desc }) => (
                <div key={title} className="rounded-xl border border-amber-500/15 bg-amber-500/[0.04] p-4">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 mb-2" />
                  <p className="text-sm font-semibold text-white mb-1.5">{title}</p>
                  <p className="text-[12px] text-zinc-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <PricingSection onSelectTier={() => setPaywallOpen(true)} />
      <FAQ />
      <Footer />

      <PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} defaultTab={authTab} />
      <AnimatePresence>
        {successToast && (
          <SuccessToast
            message={successToast}
            onClose={() => setSuccessToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AppPage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // Guard: not logged in or free plan → homepage
  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/'); return; }
    if (profile && !PAID_PLANS.has(profile.plan)) { navigate('/'); return; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile, authLoading]);

  const [summary, setSummary] = useState('');
  const [uploading, setUploading] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [error, setError] = useState('');
  const [usage, setUsage] = useState(null);
  const [successToast, setSuccessToast] = useState(null);
  const [modelTier, setModelTier] = useState(null);
  const [scorePercentile, setScorePercentile] = useState(null);
  const [uploadedFilename, setUploadedFilename] = useState('');
  const [landlordMode, setLandlordMode] = useState(false);
  const [analysisLandlordMode, setAnalysisLandlordMode] = useState(false);
  const [retryPayload, setRetryPayload] = useState(null);

  const fetchUsage = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = {};
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
      const res = await fetch('/api/usage', { headers });
      if (res.ok) setUsage(await res.json());
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchUsage(); }, [user]);

  // Handle Stripe success redirect back to /app
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get('checkout');
    const sessionId = params.get('session_id');
    const tier = params.get('tier');
    if (checkout === 'success' && sessionId && tier) {
      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const headers = { 'Content-Type': 'application/json' };
          if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
          const res = await fetch('/api/verify-payment', {
            method: 'POST', headers,
            body: JSON.stringify({ session_id: sessionId }),
          });
          if (res.ok) {
            const labels = { one: 'Plan activated!', pro: 'Pro access activated!', unlimited: 'Unlimited access activated!' };
            setSuccessToast(labels[tier] || 'Access unlocked!');
            fetchUsage();
            refreshProfile();
          }
        } catch { /* ignore */ }
        window.history.replaceState({}, '', window.location.pathname);
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpload = async (payload) => {
    const { imageBase64, filename } = payload || {};
    setError('');
    setSummary('');
    setModelTier(null);
    setAnalysisLandlordMode(false);
    setUploadedFilename(filename || '');
    setRetryPayload(payload || null);
    setUploading(true);
    trackEvent('analysis_started', { filename_type: imageBase64 ? 'image' : 'text' });
    try {
      const result = await callSummarize(payload);
      setSummary(result.summary);
      setModelTier(result.modelTier);
      setScorePercentile(result.scorePercentile);
      setAnalysisLandlordMode(result.landlordMode);
      trackEvent('analysis_completed', { model_tier: result.modelTier || 'standard' });
      fetchUsage();
      supabase.auth.getSession().then(({ data: sd }) => {
        if (!sd?.session?.access_token) return;
        fetch('/api/referral-complete', {
          method: 'POST',
          headers: { Authorization: `Bearer ${sd.session.access_token}` },
        }).catch(() => {});
      });
    } catch (e) {
      if (e.paywall) { setPaywallOpen(true); return; }
      setError(e.message || 'Something went wrong.');
      trackEvent('analysis_failed', { error: e.message?.slice(0, 100) || 'unknown' });
    } finally {
      setUploading(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-[#07070d] text-slate-100 flex flex-col">
      {/* App-focused navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#07070d]/95 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <a href="/app" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
              <svg viewBox="0 0 20 20" fill="none" className="w-[14px] h-[14px]">
                <path d="M6 10V7a4 4 0 0 1 8 0v3" stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="3.5" y="10" width="13" height="9" rx="2.5" fill="white" fillOpacity="0.95" />
                <circle cx="10" cy="14.5" r="1.4" fill="#4a7fcb" />
              </svg>
            </div>
            <span className="text-[15px] font-bold tracking-tight text-white">Declawed</span>
          </a>
          <nav className="hidden md:flex items-center gap-6">
            <a href="/dashboard" className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors">Dashboard</a>
            <a href="/billing" className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors">Billing</a>
            <a href="/account" className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors">Account Settings</a>
          </nav>
          <UserDropdown size="sm" />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Analyze Your Lease</h1>
          <p className="text-zinc-500 mt-2 text-sm sm:text-base">Upload your lease and get a full breakdown in under 30 seconds.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          <UploadPanel
            onUpload={handleUpload}
            loading={uploading}
            usage={usage}
            onUpgrade={() => setPaywallOpen(true)}
            landlordMode={landlordMode}
            onLandlordModeChange={setLandlordMode}
          />
          <SummaryPanel
            summary={summary}
            loading={uploading}
            error={error}
            modelTier={modelTier}
            scorePercentile={scorePercentile}
            usage={usage}
            filename={uploadedFilename}
            onUpgrade={() => setPaywallOpen(true)}
            landlordMode={analysisLandlordMode}
            user={user}
            onRetry={retryPayload ? () => handleUpload(retryPayload) : null}
          />
        </div>
      </main>

      <PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} />
      <AnimatePresence>
        {successToast && (
          <SuccessToast message={successToast} onClose={() => setSuccessToast(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<MainApp />} />
            <Route path="/app" element={<AppPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/analysis-history" element={<AnalysisHistoryPage />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/shared/:token" element={<SharedReport />} />
            <Route path="/account" element={<AccountSettings />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/analyze" element={<Analyze />} />
            <Route path="/tenant-rights" element={<TenantRights />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
