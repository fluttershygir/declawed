import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Loader2, AlertCircle, Lock, Zap, Image as ImageIcon, Building2, Gift, ShieldCheck, EyeOff, CloudUpload } from 'lucide-react';
import ShareToUnlockModal from './ShareToUnlockModal';

// pdfjs-dist v5 uses Promise.withResolvers() which requires Safari 17.4+.
// Polyfill it so older iOS Safari (and any other missing environment) works.
if (typeof Promise.withResolvers === 'undefined') {
  Promise.withResolvers = function () {
    let resolve, reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
  };
}

// pdfjs-dist v5 may use structuredClone internally; polyfill for iOS <15.4.
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

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
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function readFileAsUint8Array(file) {
  // file.arrayBuffer() can fail on some iOS WebKit versions; fall back to
  // the older FileReader API which has wider support.
  try {
    const ab = await file.arrayBuffer();
    return new Uint8Array(ab);
  } catch {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(new Uint8Array(reader.result));
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }
}

async function extractTextFromPdf(file) {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  const data = await readFileAsUint8Array(file);
  const pdf = await pdfjsLib.getDocument({
    data,
    useWorkerFetch: false,
    isEvalSupported: false,
    disableRange: true,
    disableStream: true,
  }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const items = Array.from(content.items || []);
    pages.push(items.map(item => item.str || '').join(' '));
  }
  return pages.join('\n');
}

export default function UploadPanel({ onUpload, loading, usage, onUpgrade, landlordMode, onLandlordModeChange }) {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [parseError, setParseError] = useState('');
  const [isImage, setIsImage] = useState(false);
  const [parsing, setParsing] = useState(false);
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
    setParsing(true);
    let text = '';
    if (isText) {
      text = await file.text();
    } else if (isDocx) {
      try { text = await extractTextFromDocx(file); }
      catch { setParsing(false); setParseError('Could not read this Word document. Ensure it is a valid .docx file.'); return; }
    } else {
      try { text = await extractTextFromPdf(file); }
      catch (e) { console.error('[PDF parse error]', e); setParsing(false); setParseError('Could not read this PDF. Make sure it isn\'t password-protected, and try again. If the issue persists, export it from your PDF viewer and re-upload.'); return; }
    }
    setParsing(false);
    if (!text.trim() || text.trim().length < 50) {
      setParseError('No readable text found. This appears to be a scanned image PDF — try uploading it as an image instead, or use a text-based PDF.');
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
  const paidAtLimit = usage && usage.plan !== 'free' && usage.plan !== 'unlimited' && (usage.used ?? 0) >= (usage.limit ?? 1);
  const canUpload = !freeExhausted && !paidAtLimit;

  const acceptStr = `application/pdf,.pdf,text/plain,.txt,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx${isPaidUser ? ',image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp' : ''}`;

  return (
    <motion.section
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-2xl bg-zinc-950 border border-white/[0.09] shadow-2xl shadow-black/40 p-5 sm:p-6 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Upload className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white leading-none">Upload your lease</h2>
            <p className="text-[11px] text-zinc-600 mt-0.5">
              PDF, .docx{isPaidUser ? ', image' : ''}
            </p>
          </div>
        </div>

        {/* Landlord Mode toggle — Unlimited plan only */}
        {isUnlimited && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setTooltipVisible(true)}
                onFocus={() => setTooltipVisible(true)}
                onMouseLeave={() => setTooltipVisible(false)}
                onBlur={() => setTooltipVisible(false)}
                className={`text-[10px] font-semibold px-2 py-1 rounded-lg border transition-all ${
                  landlordMode
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                    : 'border-zinc-700 text-zinc-500 hover:border-zinc-600'
                }`}
                aria-label="Landlord Mode info"
              >
                <Building2 className="w-3 h-3 inline mr-1" />
                Landlord
              </button>
              {tooltipVisible && (
                <div className="absolute right-0 bottom-full mb-2 w-56 rounded-lg bg-zinc-800 border border-zinc-700 shadow-xl p-2.5 text-[11px] text-zinc-300 leading-relaxed z-30 pointer-events-none">
                  <p className="font-semibold text-amber-300 mb-1">Landlord Mode</p>
                  Analyzes from a landlord&rsquo;s perspective — highlighting tenant obligations, liability gaps, and unenforceable clauses.
                  <div className="absolute right-3 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-zinc-800" />
                </div>
              )}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!!landlordMode}
              onClick={() => onLandlordModeChange?.(!landlordMode)}
              className={`relative w-9 h-5 rounded-full border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 ${
                landlordMode ? 'bg-amber-400 border-amber-500' : 'bg-zinc-700 border-zinc-600'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${landlordMode ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>
        )}
      </div>

      {/* Drop zone */}
      <input
        ref={inputRef}
        type="file"
        accept={acceptStr}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onClick={() => canUpload && !loading && !parsing && inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center rounded-xl py-8 px-5 cursor-pointer transition-all duration-200 overflow-hidden
          ${dragActive
            ? 'border-2 border-blue-400 bg-blue-500/10 shadow-lg shadow-blue-500/10'
            : parsing || loading
              ? 'border-2 border-white/[0.06] bg-transparent cursor-default'
              : canUpload
                ? 'border-2 border-white/[0.07] bg-white/[0.02] hover:border-blue-500/40 hover:bg-blue-500/[0.04] hover:shadow-md hover:shadow-blue-500/10'
                : 'border-2 border-white/[0.05] bg-transparent opacity-50 cursor-not-allowed'
          }
        `}
      >
        {/* Subtle glow on drag */}
        {dragActive && (
          <div className="absolute inset-0 pointer-events-none rounded-xl bg-blue-500/[0.06]" />
        )}

        {loading ? (
          <>
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
              <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
            </div>
            <p className="text-sm font-semibold text-blue-300">
              {isImage ? 'Scanning image…' : 'Analyzing lease…'}
            </p>
            <p className="text-[11px] text-zinc-600 mt-1">Usually 10–30 seconds</p>
          </>
        ) : parsing ? (
          <>
            <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-white/[0.08] flex items-center justify-center mb-3">
              <Loader2 className="w-7 h-7 text-zinc-400 animate-spin" />
            </div>
            <p className="text-sm font-semibold text-zinc-300">Reading document…</p>
            <p className="text-[11px] text-zinc-600 mt-1">Extracting text from your file</p>
          </>
        ) : fileName ? (
          <>
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
              {isImage ? (
                <ImageIcon className="w-7 h-7 text-blue-400" />
              ) : (
                <FileText className="w-7 h-7 text-blue-400" />
              )}
            </div>
            <p className="text-sm font-semibold text-white truncate max-w-full px-4">{fileName}</p>
            <p className="text-[11px] text-zinc-500 mt-1">Tap to change file</p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-3 group-hover:border-blue-500/30 transition-colors">
              <CloudUpload className="w-7 h-7 text-zinc-500" />
            </div>
            <p className="text-sm font-semibold text-white">
              Drop your lease here
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">
              {isPaidUser ? 'PDF, .docx, .txt, or image' : 'PDF, .docx, or .txt'}
            </p>
          </>
        )}
      </div>

      {/* Mobile tap-to-upload button */}
      {canUpload && !loading && !parsing && (
        <button
          onClick={() => inputRef.current?.click()}
          className="mt-3 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all text-sm font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25"
        >
          <Upload className="w-4 h-4" />
          Choose lease file
        </button>
      )}

      {/* Trust badges */}
      <div className="mt-3 flex items-center justify-center gap-4 flex-wrap">
        <span className="flex items-center gap-1 text-[10.5px] text-zinc-600">
          <Lock className="w-2.5 h-2.5 shrink-0" />
          File never uploaded
        </span>
        <span className="flex items-center gap-1 text-[10.5px] text-zinc-600">
          <ShieldCheck className="w-2.5 h-2.5 shrink-0" />
          Not used to train AI
        </span>
        <span className="flex items-center gap-1 text-[10.5px] text-zinc-600">
          <EyeOff className="w-2.5 h-2.5 shrink-0" />
          Private &amp; secure
        </span>
      </div>

      {parseError && (
        <div className="mt-3 flex items-start gap-2 text-rose-400 text-xs bg-rose-500/[0.07] border border-rose-500/20 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {parseError}
        </div>
      )}

      {/* Free tier exhausted */}
      {freeExhausted && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-xl border border-white/[0.09] bg-white/[0.03] p-4"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Lock className="w-4 h-4 text-zinc-500 shrink-0" />
            <p className="text-sm font-semibold text-white">You&rsquo;ve used your free analysis</p>
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

      {paidAtLimit && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-sm font-semibold text-white">Monthly limit reached</p>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed mb-3">
            You&rsquo;ve used all {usage?.limit ?? ''} analyses this month. Upgrade to Unlimited for unlimited analyses.
          </p>
          <button
            onClick={onUpgrade}
            className="flex items-center justify-center gap-1.5 w-full rounded-xl py-2.5 px-3 text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all"
          >
            <Zap className="w-3.5 h-3.5" />
            Upgrade to Unlimited
          </button>
        </motion.div>
      )}

      <ShareToUnlockModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        onUpgrade={() => { setShareModalOpen(false); onUpgrade(); }}
      />
    </motion.section>
  );
}
