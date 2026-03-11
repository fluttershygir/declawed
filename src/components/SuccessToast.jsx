import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

export default function SuccessToast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 px-4 py-3 shadow-lg"
    >
      <CheckCircle className="w-5 h-5 text-emerald-400" />
      <p className="text-sm font-medium text-emerald-100">{message}</p>
      <button
        onClick={onClose}
        className="ml-2 text-emerald-300 hover:text-emerald-100 text-xs"
      >
        Dismiss
      </button>
    </motion.div>
  );
}
