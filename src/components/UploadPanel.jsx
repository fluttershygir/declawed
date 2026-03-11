import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

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

export default function UploadPanel({ onUpload, loading, usage }) {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [parseError, setParseError] = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    setParseError('');
    const isText = file.type === 'text/plain' || file.name.endsWith('.txt');
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    if (!isPdf && !isText) { setParseError('Only PDF and .txt files are supported.'); return; }
    setFileName(file.name);
    let text = '';
    if (isText) {
      text = await file.text();
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

  const canUpload = !usage || usage.plan !== 'free' || (usage.used < (usage.limit ?? 1));

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
        PDF or .txt · Text is extracted in your browser — your file is never uploaded.
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
          accept="application/pdf,.pdf,text/plain,.txt"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {loading ? (
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-3" />
        ) : (
          <FileText className="w-12 h-12 text-slate-500 mb-3" />
        )}
        <p className="text-sm font-medium text-slate-300">
          {loading ? 'Analyzing lease...' : 'Drop PDF or .txt here, or click to browse'}
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

      <p className="mt-4 text-[11px] text-slate-500">
        Not legal advice. For binding decisions, consult a licensed attorney.
      </p>
    </motion.section>
  );
}
