import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Settings, CreditCard, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MENU_ITEMS = [
  { icon: LayoutGrid, label: 'Dashboard',        href: '/dashboard' },
  { icon: Settings,    label: 'Account Settings', href: '/account'   },
  { icon: CreditCard,  label: 'Billing & Plan',   href: '/billing'   },
];

/**
 * A self-contained avatar button + premium dropdown.
 * Pass `size="sm"` for the navbar (w-8) or `size="md"` for the dashboard (w-9).
 */
export default function UserDropdown({ size = 'md', align = 'right' }) {
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onOutsideClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, [open]);

  const fullName   = user?.user_metadata?.full_name || profile?.full_name || user?.user_metadata?.name || '';
  const email      = user?.email ?? '';
  const initials   = fullName
    ? fullName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : email[0]?.toUpperCase() ?? 'U';

  const avatarSizes = size === 'sm'
    ? 'w-8 h-8 text-[11px]'
    : 'w-9 h-9 text-[12px]';

  return (
    <div className="relative" ref={ref}>
      {/* Avatar trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`${avatarSizes} rounded-full bg-teal-500/15 border border-teal-500/25 text-teal-300 font-bold flex items-center justify-center hover:bg-teal-500/25 hover:border-teal-500/40 transition ring-2 ring-transparent ${open ? 'ring-teal-500/30' : ''}`}
        aria-label="Account menu"
        aria-expanded={open}
      >
        {initials}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: align === 'right' ? 'top right' : 'top left' }}
            className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-[calc(100%+8px)] w-[228px] rounded-2xl border border-white/[0.09] bg-[#0f0f17] shadow-[0_20px_60px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.04)] z-[60] overflow-hidden`}
          >
            {/* Header */}
            <div className="px-4 py-3.5 flex items-center gap-3 border-b border-white/[0.07]">
              <div className="w-9 h-9 rounded-full bg-teal-500/15 border border-teal-500/25 text-teal-300 text-[12px] font-bold flex items-center justify-center shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                {fullName ? (
                  <p className="text-[13px] font-semibold text-white truncate leading-tight">{fullName}</p>
                ) : null}
                <p className={`text-[12px] truncate leading-tight ${fullName ? 'text-zinc-500' : 'text-zinc-300 font-medium'}`}>{email}</p>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-1.5">
              {MENU_ITEMS.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors group"
                >
                  <Icon className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0" />
                  {label}
                </a>
              ))}
            </div>

            {/* Divider */}
            <div className="mx-3 border-t border-white/[0.06]" />

            {/* Sign out */}
            <div className="py-1.5">
              <button
                onClick={() => { setOpen(false); signOut(); }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] text-zinc-500 hover:text-rose-400 hover:bg-rose-500/[0.06] transition-colors group text-left"
              >
                <LogOut className="w-4 h-4 shrink-0 group-hover:text-rose-400 transition-colors" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

