import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Loader2, AlertCircle, Lock, Zap, Image as ImageIcon, Building2, Gift } from 'lucide-react';
import ShareToUnlockModal from './ShareToUnlockModal';
import * as pdfjsLib from 'pdfjs-dist';
import * as mammoth from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// Resize image to max 1568x1568 (Anthropic's internal cap) and encode as JPEG.
// This keeps API token cost identical regardless of original file size.
const MAX_IMG_PX = 1568;
async function resizeAndEncodeImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_IMG_PX || height > MAX_IMG_PX) {
        const scale = Math.min(MAX_IMG_PX / width, MAX_IMG_PX / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      const base64 = canvas.toDataURL('image/jpeg', 0.88).split(',')[1];
      resolve(base64);
    };
    img.onerror = reject;
    img.src = url;
  });
}

async function extractTextFromDocx(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function extractTextFromPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map(item => item.str).join(' '));
  }
  return pages.join('\n');
}

export default function UploadPanel({ onUpload, loading, usage, onUpgrade, landlordMode, onLandlordModeChange }) {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [parseError, setParseError] = useState('');
  const [isImage, setIsImage] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const isPaidUser = usage?.plan && ['one', 'pro', 'unlimited'].includes(usage.plan);
  const isUnlimited = usage?.plan === 'unlimited';

  const handleFile = async (file) => {
    if (!file) return;
    setParseError('');
    setIsImage(false);
    const isText = file.type === 'text/plain' || file.name.endsWith('.txt');
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx');
    const isImg = IMAGE_MIME_TYPES.includes(file.type) || IMAGE_EXTS.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!isPdf && !isText && !isDocx && !isImg) {
      setParseError('Supported formats: PDF, .docx, .txt, JPG, PNG, WebP.');
      return;
    }
    if (isImg) {
      if (!isPaidUser) {
        setParseError('Image scanning is a paid feature. Upgrade to analyze scanned or photographed leases.');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setParseError('Image must be under 20 MB.');
        return;
      }
      setFileName(file.name);
      setIsImage(true);
      const imageBase64 = await resizeAndEncodeImage(file);
      onUpload({ imageBase64, imageMediaType: 'image/jpeg', filename: file.name, landlordMode: !!landlordMode });
      return;
    }
    setFileName(file.name);
    let text = '';
    if (isText) {
      text = await file.text();
    } else if (isDocx) {
      try { text = await extractTextFromDocx(file); }
      catch { setParseError('Could not read this Word document. Ensure it is a valid .docx file.'); return; }
    } else {
      try { text = await extractTextFromPdf(file); }
      catch { setParseError('Could not read this PDF. Try a text-based (not scanned) PDF.'); return; }
    }
    if (!text.trim() || text.trim().length < 50) {
      setParseError('Could not extract text. Ensure the file is not a scanned image.');
      return;
    }
    onUpload({ text, filename: file.name, landlordMode: !!landlordMode });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const freeExhausted = usage && usage.plan === 'free' && (usage.used ?? 0) >= (usage.limit ?? 1);
  const canUpload = !freeExhausted;

  return (
    <motion.section
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-[0_0_50px_rgba(34,211,238,0.08)] backdrop-blur-sm p-6 flex flex-col"
    >
      <div className="flex items-center gap-2 mb-2">
        <Upload className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-semibold text-slate-100">Upload your lease</h2>
      </div>
      <p className="text-sm text-slate-400 mb-4">
        PDF, .docx, .txt{isPaidUser ? ', or image (JPG/PNG/WebP)' : ''} · Processed in your browser — your file is never stored.
      </p>

      {/* Landlord Mode toggle */}
      <div className="flex items-center justify-between mb-4 rounded-xl border px-3.5 py-2.5 transition-all duration-200"
        style={{
          borderColor: landlordMode ? 'rgba(245,158,11,0.35)' : 'rgba(51,65,85,0.6)',
          background: landlordMode ? 'rgba(245,158,11,0.06)' : 'rgba(15,23,42,0.3)',
        }}
      >
        <div className="flex items-center gap-2">
          <Building2 className={`w-3.5 h-3.5 shrink-0 transition-colors ${landlordMode ? 'text-amber-400' : 'text-zinc-500'}`} />
          <span className={`text-xs font-semibold transition-colors ${landlordMode ? 'text-amber-300' : 'text-zinc-400'}`}>
            Landlord Mode
          </span>
          {/* Tooltip trigger */}
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setTooltipVisible(true)}
              onFocus={() => setTooltipVisible(true)}
              onMouseLeave={() => setTooltipVisible(false)}
              onBlur={() => setTooltipVisible(false)}
              className="w-4 h-4 rounded-full border border-zinc-600 text-zinc-500 hover:text-zinc-300 hover:border-zinc-400 transition text-[9px] font-bold flex items-center justify-center leading-none"
              aria-label="Landlord Mode info"
            >
              ?
            </button>
            {tooltipVisible && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 rounded-lg bg-zinc-800 border border-zinc-700 shadow-xl p-2.5 text-[11px] text-zinc-300 leading-relaxed z-30 pointer-events-none">
                <p className="font-semibold text-amber-300 mb-1">Landlord Mode</p>
                Analyzes the lease from a landlord&rsquo;s perspective — highlighting tenant obligations, liability gaps, unenforceable clauses, and recommended additions to better protect you as the landlord.
                {!isUnlimited && <p className="mt-1.5 text-amber-400 font-semibold">Requires Unlimited plan.</p>}
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-zinc-800" />
              </div>
            )}
          </div>
          {!isUnlimited && (
            <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500/70 border border-amber-500/20">Unlimited</span>
          )}
        </div>

        {/* The toggle switch */}
        {isUnlimited ? (
          <button
            type="button"
            role="switch"
            aria-checked={!!landlordMode}
            onClick={() => onLandlordModeChange?.(!landlordMode)}
            className={`relative w-9 h-5 rounded-full border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 ${
              landlordMode
                ? 'bg-amber-400 border-amber-500'
                : 'bg-zinc-700 border-zinc-600'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                landlordMode ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        ) : (
          <button
            type="button"
            onClick={onUpgrade}
            className="relative w-9 h-5 rounded-full border bg-zinc-800 border-zinc-700 opacity-50 cursor-pointer"
            aria-label="Upgrade to unlock Landlord Mode"
          >
            <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-zinc-600 shadow" />
          </button>
        )}
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onClick={() => canUpload && !loading && inputRef.current?.click()}
        className={`
          flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-10 px-6 cursor-pointer transition-all
          ${dragActive ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-700 hover:border-slate-600'}
          ${!canUpload || loading ? 'opacity-60 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={`application/pdf,.pdf,text/plain,.txt,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx${isPaidUser ? ',image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp' : ''}`}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {loading ? (
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-3" />
        ) : isImage ? (
          <ImageIcon className="w-12 h-12 text-cyan-400 mb-3" />
        ) : (
          <FileText className="w-12 h-12 text-slate-500 mb-3" />
        )}
        <p className="text-sm font-medium text-slate-300">
          {loading
            ? (isImage ? 'Scanning image...' : 'Analyzing lease...')
            : isPaidUser
            ? 'Drop PDF, .docx, .txt, or image here, or click to browse'
            : 'Drop PDF, .docx, or .txt here, or click to browse'}
        </p>
        {fileName && !loading && (
          <p className="mt-2 text-xs text-slate-500 truncate max-w-full">{fileName}</p>
        )}
      </div>

      {parseError && (
        <div className="mt-3 flex items-start gap-2 text-rose-400 text-xs">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {parseError}
        </div>
      )}

      {/* Free tier exhausted — two-option card */}
      {freeExhausted && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-xl border border-white/[0.09] bg-white/[0.03] p-4"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Lock className="w-4 h-4 text-zinc-500 shrink-0" />
            <p className="text-sm font-semibold text-white">You've used your free analysis</p>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed mb-4">
            Share Declawed with a friend to unlock a free analysis, or upgrade to a paid plan.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShareModalOpen(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all"
            >
              <Gift className="w-3.5 h-3.5" />
              Share for +1 free
            </button>
            <button
              onClick={onUpgrade}
              className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all text-white"
            >
              <Zap className="w-3.5 h-3.5" />
              Upgrade
            </button>
          </div>
        </motion.div>
      )}

      <ShareToUnlockModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        onUpgrade={() => { setShareModalOpen(false); onUpgrade(); }}
      />

      <p className="mt-4 text-[11px] text-slate-500">
        Not legal advice. For binding decisions, consult a licensed attorney.
      </p>
    </motion.section>
  );
}
