import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Loader2, AlertCircle, Lock, Zap, Image as ImageIcon } from 'lucide-react';
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

export default function UploadPanel({ onUpload, loading, usage, onUpgrade }) {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [parseError, setParseError] = useState('');
  const [isImage, setIsImage] = useState(false);

  const isPaidUser = usage?.plan && ['one', 'pro', 'unlimited'].includes(usage.plan);

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
      onUpload({ imageBase64, imageMediaType: 'image/jpeg', filename: file.name });
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
    onUpload({ text, filename: file.name });
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

      {/* Free tier exhausted banner */}
      {/* Image scanning badge for paid users */}
      {isPaidUser && !freeExhausted && (
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-teal-400/80">
          <ImageIcon className="w-3 h-3" />
          <span>Image scanning unlocked — upload photos of leases or scanned documents</span>
        </div>
      )}

      {freeExhausted && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/[0.07] p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-sm font-semibold text-amber-300">You've used your free analysis</p>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed mb-3">
            Upgrade to analyze more leases — unlock Advanced Declawed AI for deeper results, and image scanning for photos or scanned documents.
          </p>
          <button
            onClick={onUpgrade}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-teal-500 hover:bg-teal-400 active:scale-95 transition-all text-black text-sm font-semibold py-2"
          >
            <Zap className="w-4 h-4" />
            Upgrade to continue
          </button>
        </motion.div>
      )}

      <p className="mt-4 text-[11px] text-slate-500">
        Not legal advice. For binding decisions, consult a licensed attorney.
      </p>
    </motion.section>
  );
}
