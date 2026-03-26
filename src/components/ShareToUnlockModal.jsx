import { useState, useEffect } from 'react';
import { copyToClipboard } from '../lib/clipboard';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Gift, Zap, MessageCircle, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CONFETTI_COLORS = ['#14b8a6', '#06b6d4', '#10b981', '#a78bfa', '#f59e0b', '#fb7185', '#38bdf8'];

function ConfettiBurst() {
  const particles = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 220,
    y: -70 - Math.random() * 90,
    rotate: Math.random() * 720 - 360,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 5 + Math.random() * 5,
    delay: i * 0.018,
    isRect: i % 3 === 0,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible', zIndex: 10 }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rotate, scale: 0.2 }}
          transition={{ duration: 0.85, delay: p.delay, ease: [0.2, 0, 0.4, 1] }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: p.size,
            height: p.isRect ? p.size * 0.5 : p.size,
            borderRadius: p.isRect ? '2px' : '50%',
            backgroundColor: p.color,
            marginTop: -p.size / 2,
            marginLeft: -p.size / 2,
          }}
        />
      ))}
    </div>
  );
}

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16 }}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.968-1.301A9.96 9.96 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.96 7.96 0 01-4.072-1.117l-.292-.173-3.026.793.808-2.95-.19-.302A7.968 7.968 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" />
  </svg>
);

export default function ShareToUnlockModal({ open, onClose, onUpgrade }) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const userId = user?.id;
  const refLink = userId ? `https://declawed.app/?ref=${userId}` : 'https://declawed.app';
  const shareMsg = `I've been using Declawed to check my lease for red flags — it caught things I never would've noticed. Try it free: ${refLink}`;

  useEffect(() => {
    if (!open) {
      setCopied(false);
      setShowConfetti(false);
    }
  }, [open]);

  async function handleCopy() {
    try {
      await copyToClipboard(refLink);
      setCopied(true);
      setShowConfetti(true);
      setTimeout(() => setCopied(false), 2500);
      setTimeout(() => setShowConfetti(false), 1100);
    } catch {
      // clipboard blocked — silently ignore
    }
  }

  const shareLinks = [
    {
      label: 'iMessage',
      Icon: MessageCircle,
      href: `sms:?body=${encodeURIComponent(shareMsg)}`,
      className: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/40',
    },
    {
      label: 'WhatsApp',
      Icon: WhatsAppIcon,
      href: `https://wa.me/?text=${encodeURIComponent(shareMsg)}`,
      className: 'bg-[#25D366]/10 border-[#25D366]/25 text-[#25D366] hover:bg-[#25D366]/20',
    },
    {
      label: 'Email',
      Icon: Mail,
      href: `mailto:?subject=${encodeURIComponent('Check your lease for red flags — free tool')}&body=${encodeURIComponent(shareMsg)}`,
      className: 'bg-blue-500/10 border-blue-500/25 text-blue-300 hover:bg-blue-500/20 hover:border-blue-500/40',
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-zinc-950 border border-white/[0.09] shadow-2xl shadow-black/60 relative overflow-hidden"
          >
            {/* Top accent line */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />

            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-zinc-600 hover:text-white transition z-10 p-1 rounded-md hover:bg-white/[0.06]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="px-6 pt-7 pb-6">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0">
                  <Gift className="text-emerald-400" style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <h2 className="text-[17px] font-bold text-white tracking-tight">Get 1 free analysis</h2>
                  <p className="text-[12px] text-zinc-500 leading-tight mt-0.5">No credit card — just share</p>
                </div>
              </div>

              <p className="text-sm text-zinc-400 leading-relaxed mb-5">
                Share your referral link with a friend. When they sign up using your link,
                you'll get{' '}
                <span className="text-emerald-400 font-semibold">1 free analysis</span>{' '}
                added to your account automatically.
              </p>

              {/* Referral link row */}
              <div className="mb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600 mb-2">Your referral link</p>
                <div className="flex items-stretch gap-2">
                  <div className="flex-1 flex items-center rounded-xl bg-white/[0.04] border border-white/[0.07] px-3 py-2.5 min-w-0">
                    <span className="text-xs text-zinc-400 font-mono truncate select-all">{refLink}</span>
                  </div>
                  <div className="relative shrink-0">
                    {showConfetti && <ConfettiBurst />}
                    <button
                      onClick={handleCopy}
                      className={`relative flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        copied
                          ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                          : 'bg-blue-600 hover:bg-blue-500 active:scale-95 text-white border border-blue-500'
                      }`}
                    >
                      <AnimatePresence mode="wait">
                        {copied ? (
                          <motion.span
                            key="check"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" /> Copied!
                          </motion.span>
                        ) : (
                          <motion.span
                            key="copy"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-1.5"
                          >
                            <Copy className="w-3.5 h-3.5" /> Copy
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  </div>
                </div>
              </div>

              {/* Share via buttons */}
              <div className="mb-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600 mb-2">Share via</p>
                <div className="grid grid-cols-3 gap-2">
                  {shareLinks.map(({ label, Icon, href, className }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-all ${className}`}
                    >
                      <Icon />
                      {label}
                    </a>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[11px] text-zinc-700 font-medium">or upgrade now</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              {/* Upgrade CTA */}
              <button
                onClick={() => { onClose(); onUpgrade(); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all text-white text-sm font-semibold shadow-lg shadow-blue-600/20"
              >
                <Zap className="w-4 h-4" />
                Upgrade to Pro — unlimited analyses
              </button>

              <p className="mt-3.5 text-center text-[11px] text-zinc-600 leading-relaxed">
                Your friend gets their first analysis free.{' '}
                <a
                  href="/#pricing"
                  onClick={onClose}
                  className="text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition"
                >
                  View all plans →
                </a>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
