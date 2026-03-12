import { useState, useEffect, Component } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';

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
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import CookiePolicy from './pages/CookiePolicy';
import Contact from './pages/Contact';
import SharedReport from './pages/SharedReport';
import AccountSettings from './pages/AccountSettings';
import Billing from './pages/Billing';
import './index.css';

function DashboardPage() {
  const navigate = useNavigate();
  return <Dashboard onClose={() => navigate('/')} onUpgrade={() => navigate('/?upgrade=1')} />;
}

function MainApp() {
  const { user } = useAuth();
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [error, setError] = useState('');
  const [usage, setUsage] = useState(null);
  const [successToast, setSuccessToast] = useState(null);
  const [modelTier, setModelTier] = useState(null);
  const [uploadedFilename, setUploadedFilename] = useState('');
  const [landlordMode, setLandlordMode] = useState(false);
  const [analysisLandlordMode, setAnalysisLandlordMode] = useState(false);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Handle Stripe success redirect and upgrade intent from dashboard
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Dashboard "Upgrade" button navigates here with ?upgrade=1
    if (params.get('upgrade') === '1') {
      setPaywallOpen(true);
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
            const labels = { one: 'One Lease unlocked!', pro: 'Pro access activated!', unlimited: 'Unlimited access activated!' };
            setSuccessToast(labels[tier] || 'Access unlocked!');
            fetchUsage();
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
    const { text, imageBase64, imageMediaType, filename } = payload || {};
    setError('');
    setSummary('');
    setModelTier(null);
    setAnalysisLandlordMode(false);
    setUploadedFilename(filename || '');
    setLoading(true);
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

      // Guard against CF returning an HTML error page instead of JSON
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const raw = await res.text();
        console.error('[summarize] Non-JSON response:', raw.slice(0, 500));
        throw new Error(`CF error (HTTP ${res.status}): ${raw.replace(/<[^>]+>/g, '').trim().slice(0, 200)}`);
      }

      const data = await res.json();

      if (res.status === 402) {
        setPaywallOpen(true);
        return;
      }

      if (!res.ok || data.error) throw new Error(data.error || 'Something went wrong.');
      setSummary(data.summary);
      setModelTier(data.modelTier || null);
      setAnalysisLandlordMode(!!data.landlordMode);
      fetchUsage();
    } catch (e) {
      setError(e.message || 'Something went wrong.');
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
      <section id="upload" className="w-full flex flex-col items-center px-4 py-16 border-t border-white/[0.05]">
        <div className="w-full max-w-5xl grid md:grid-cols-[1fr_1.2fr] gap-6">
          <UploadPanel onUpload={handleUpload} loading={loading} usage={usage} onUpgrade={() => setPaywallOpen(true)} landlordMode={landlordMode} onLandlordModeChange={setLandlordMode} />
          <SummaryPanel summary={summary} loading={loading} error={error} modelTier={modelTier} usage={usage} filename={uploadedFilename} onUpgrade={() => setPaywallOpen(true)} landlordMode={analysisLandlordMode} />
        </div>
      </section>

      <Testimonials />
      <PricingSection onSelectTier={() => setPaywallOpen(true)} />
      <FAQ />
      <Footer />

      <PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} />
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

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<MainApp />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/shared/:token" element={<SharedReport />} />
            <Route path="/account" element={<AccountSettings />} />
            <Route path="/billing" element={<Billing />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
