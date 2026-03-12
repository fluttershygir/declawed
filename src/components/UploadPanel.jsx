import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Loader2, AlertCircle, Lock, Zap } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import * as mammoth from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

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

  const handleFile = async (file) => {
    if (!file) return;
    setParseError('');
    const isText = file.type === 'text/plain' || file.name.endsWith('.txt');
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx');
    if (!isPdf && !isText && !isDocx) { setParseError('Only PDF, .docx, and .txt files are supported.'); return; }
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
    onUpload(text, file.name);
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
        PDF, .docx, or .txt · Text is extracted in your browser — your file is never uploaded.
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
          accept="application/pdf,.pdf,text/plain,.txt,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {loading ? (
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-3" />
        ) : (
          <FileText className="w-12 h-12 text-slate-500 mb-3" />
        )}
        <p className="text-sm font-medium text-slate-300">
          {loading ? 'Analyzing lease...' : 'Drop PDF, .docx, or .txt here, or click to browse'}
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
            Upgrade to analyze more leases — and unlock Advanced Declawed AI for deeper, more thorough results.
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
