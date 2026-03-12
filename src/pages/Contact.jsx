import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Send, CheckCircle } from 'lucide-react';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();
      if (data.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Could not send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-xl mx-auto px-5 py-16">
        <div className="mb-10">
          <a href="/" className="text-sm text-zinc-600 hover:text-zinc-400 transition">← Back to Declawed</a>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Contact &amp; Support</h1>
        <p className="text-sm text-zinc-500 mb-10">
          Questions, refund requests, or anything else — we read every message.
        </p>

        {success ? (
          <div className="rounded-2xl border border-teal-500/30 bg-teal-500/[0.07] p-8 text-center">
            <CheckCircle className="w-10 h-10 text-teal-400 mx-auto mb-4" />
            <p className="text-white font-semibold mb-1">Message sent</p>
            <p className="text-sm text-zinc-400">We'll get back to you within 1–2 business days.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={200}
                placeholder="Your name"
                className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500/50 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={254}
                placeholder="you@example.com"
                className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500/50 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Message
              </label>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={5000}
                rows={6}
                placeholder="Describe your issue or question…"
                className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500/50 transition resize-none"
              />
            </div>

            {error && (
              <p className="text-sm text-rose-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full rounded-xl py-3 bg-teal-500 hover:bg-teal-400 active:scale-[0.98] transition-all text-black font-semibold text-sm shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Sending…' : 'Send message'}
            </button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
