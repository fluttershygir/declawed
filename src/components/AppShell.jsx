import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { LayoutGrid, History, CreditCard, Settings, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_GROUPS = [
  {
    label: 'Workspace',
    items: [
      { icon: LayoutGrid, label: 'Dashboard',        href: '/dashboard' },
      { icon: History,    label: 'Analysis History', href: '/analysis-history' },
    ],
  },
  {
    label: 'Account',
    items: [
      { icon: CreditCard, label: 'Billing & Plan',   href: '/billing' },
      { icon: Settings,   label: 'Account Settings', href: '/account' },
    ],
  },
];

const LogoIcon = () => (
  <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0">
    <svg viewBox="0 0 20 20" fill="none" className="w-[14px] h-[14px]">
      <path d="M6 10V7a4 4 0 0 1 8 0v3" stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3.5" y="10" width="13" height="9" rx="2.5" fill="white" fillOpacity="0.95" />
      <circle cx="10" cy="14.5" r="1.4" fill="#1e40af" />
    </svg>
  </div>
);

export default function AppShell({ children }) {
  const { pathname } = useLocation();
  const { user, profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const fullName = user?.user_metadata?.full_name || profile?.full_name || user?.user_metadata?.name || '';
  const email    = user?.email ?? '';
  const initials = fullName
    ? fullName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : email[0]?.toUpperCase() ?? 'U';

  const isActive = (href) => pathname === href;

  async function handleSignOut() {
    await signOut();
    window.location.href = '/';
  }

  const navItems = (
    <>
      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto space-y-6">
        {NAV_GROUPS.map(({ label, items }) => (
          <div key={label}>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600 px-2.5 mb-1.5">
              {label}
            </p>
            <ul className="space-y-0.5">
              {items.map(({ icon: Icon, label: itemLabel, href }) => {
                const active = isActive(href);
                return (
                  <li key={itemLabel}>
                    <a
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-2.5 px-2.5 py-2.5 rounded-md text-[13px] font-medium transition-all ${
                        active
                          ? 'bg-blue-600/10 text-blue-400'
                          : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-500' : ''}`} />
                      {itemLabel}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User + Sign Out */}
      <div className="border-t border-white/[0.06] p-3 shrink-0">
        <div className="flex items-center gap-2.5 px-2.5 py-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-blue-600/15 border border-blue-500/25 text-blue-300 text-[10px] font-bold flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            {fullName && (
              <p className="text-[12px] font-semibold text-zinc-300 truncate leading-tight">{fullName}</p>
            )}
            <p className={`text-[11px] truncate leading-tight ${fullName ? 'text-zinc-600' : 'text-zinc-400'}`}>
              {email}
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-md text-[13px] font-medium text-zinc-500 hover:text-rose-400 hover:bg-rose-500/[0.07] transition mt-0.5"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#07070d] flex">

      {/* ─── Mobile top bar ──────────────────────────────── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 h-14 flex items-center justify-between px-4 border-b border-white/[0.06] bg-[#08080f]">
        <a href="/" className="flex items-center gap-2.5">
          <LogoIcon />
          <span className="text-[15px] font-bold tracking-tight text-white">Declawed</span>
        </a>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* ─── Mobile backdrop ─────────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ─── Sidebar ─────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[240px] shrink-0 border-r border-white/[0.06] bg-[#08080f] flex flex-col
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Logo row — close button on mobile */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-white/[0.06] shrink-0">
          <a href="/" className="flex items-center gap-2.5 hover:opacity-80 transition">
            <LogoIcon />
            <span className="text-[15px] font-bold tracking-tight text-white">Declawed</span>
          </a>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-zinc-600 hover:text-white hover:bg-white/[0.06] transition"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {navItems}
      </aside>

      {/* ─── Main content ────────────────────────────────── */}
      <div className="flex-1 min-h-screen md:ml-[240px] pt-14 md:pt-0">
        {children}
      </div>
    </div>
  );
}
