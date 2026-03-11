import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import './index.css';

const API_BASE = '/api';

function App() {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [error, setError] = useState('');
  const [usage, setUsage] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  const fetchUsage = async () => {
    try {
      const res = await fetch(`${API_BASE}/usage`);
      if (res.ok) setUsage(await res.json());
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  // Handle Stripe success redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get('checkout');
    const sessionId = params.get('session_id');
    const tier = params.get('tier');

    if (checkout === 'success' && sessionId && tier) {
      (async () => {
        try {
          const res = await fetch(`${API_BASE}/verify-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId }),
          });
          if (res.ok) {
            const data = await res.json();
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

  const handleUpload = async (file) => {
    setError('');
    setSummary('');
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);

      const res = await fetch(`${API_BASE}/summarize`, {
        method: 'POST',
        body: form,
      });

      const data = await res.json();

      if (res.status === 402) {
        setPaywallOpen(true);
        return;
      }

      if (data.error) throw new Error(data.error);
      setSummary(data.summary);
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
          <UploadPanel onUpload={handleUpload} loading={loading} usage={usage} />
          <SummaryPanel summary={summary} loading={loading} error={error} />
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

export default App;
