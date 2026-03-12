import { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import UserDropdown from './UserDropdown';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

const NAV_LINKS = [
  { label: 'How it Works', href: '/#how-it-works' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'FAQ', href: '/#faq' },
  { label: 'Contact', href: '/contact' },
];

const LogoMark = () => (
  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/25 shrink-0">
    <svg viewBox="0 0 20 20" fill="none" className="w-[14px] h-[14px]">
      <path d="M6 10V7a4 4 0 0 1 8 0v3" stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3.5" y="10" width="13" height="9" rx="2.5" fill="white" fillOpacity="0.95" />
      <circle cx="10" cy="14.5" r="1.4" fill="#0d9488" />
    </svg>
  </div>
);

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState('signin');
  const { user } = useAuth();

  const openAuth = (tab = 'signin') => {
    setAuthTab(tab);
    setAuthOpen(true);
    setMobileOpen(false);
  };

  return (
    <>
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-black/85 backdrop-blur-xl"
    >
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        {/* Wordmark */}
        <a href="/" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="text-[15px] font-bold tracking-tight text-white">Declawed</span>
          <span className="hidden sm:inline text-[9px] font-bold uppercase tracking-[0.15em] text-teal-300 border border-teal-500/40 bg-teal-500/10 px-1.5 py-0.5 rounded-full leading-none">
            Beta
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map(({ label, href }) => (
            <a key={label} href={href} className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors">
              {label}
            </a>
          ))}
        </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user ? (
              <UserDropdown size="sm" />
            ) : (
              <>
                <button
                  onClick={() => openAuth('signin')}
                  className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Sign in
                </button>
                <a
                  href="/#upload"
                  className="px-4 py-2 rounded-lg bg-teal-500 text-[13px] font-semibold text-black hover:bg-teal-400 active:scale-95 transition-all shadow-lg shadow-teal-500/20"
                >
                  Try free →
                </a>
              </>
            )}
            <button
              className="md:hidden p-1.5 text-zinc-400 hover:text-white transition-colors"
              onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/[0.06] bg-black/95 px-5 py-5 flex flex-col gap-4">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="text-sm text-zinc-300 hover:text-white transition-colors"
            >
              {label}
            </a>
          ))}
          {user ? (
            <>
              <a href="/dashboard" onClick={() => setMobileOpen(false)} className="text-sm text-zinc-300 hover:text-white transition-colors">Dashboard</a>
              <a href="/account" onClick={() => setMobileOpen(false)} className="text-sm text-zinc-300 hover:text-white transition-colors">Account Settings</a>
              <a href="/billing" onClick={() => setMobileOpen(false)} className="text-sm text-zinc-300 hover:text-white transition-colors">Billing &amp; Plan</a>
            </>
          ) : (
            <button onClick={() => openAuth('signin')} className="text-left text-sm text-zinc-300 hover:text-white transition-colors">
              Sign in
            </button>
          )}
        </div>
      )}
    </motion.header>

    <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} defaultTab={authTab} />
  </>
  );
}
