const LOGO_SVG = (
  <svg viewBox="0 0 20 20" fill="none" className="w-[13px] h-[13px]">
    <path d="M6 10V7a4 4 0 0 1 8 0v3" stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="3.5" y="10" width="13" height="9" rx="2.5" fill="white" fillOpacity="0.95" />
    <circle cx="10" cy="14.5" r="1.4" fill="#0d9488" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] pt-14 pb-10 px-5 bg-[#07070d]">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-12 mb-12">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shrink-0 shadow-md shadow-teal-500/20">
                {LOGO_SVG}
              </div>
              <span className="text-sm font-bold text-white tracking-tight">Declawed</span>
            </div>
            <p className="text-[13px] text-zinc-500 leading-relaxed mb-4">
              AI-powered lease analysis for renters. Know what you're signing before you sign it.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-500/20 bg-amber-500/[0.05]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60 shrink-0" />
              <span className="text-[10.5px] text-amber-400/80 font-medium">Not legal advice</span>
            </div>
          </div>

          {/* Link columns */}
          <div className="flex flex-wrap gap-x-14 gap-y-8 text-sm">
            <div className="flex flex-col gap-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600 mb-1">Product</p>
              {[['How it Works', '/#how-it-works'], ['Pricing', '/#pricing'], ['FAQ', '/#faq']].map(([label, href]) => (
                <a key={label} href={href} className="text-[13px] text-zinc-500 hover:text-white transition-colors">{label}</a>
              ))}
            </div>
            <div className="flex flex-col gap-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600 mb-1">Legal</p>
              {[['Privacy Policy', '/privacy'], ['Terms of Service', '/terms'], ['Cookie Policy', '/cookies'], ['Contact', '/contact']].map(([label, href]) => (
                <a key={label} href={href} className="text-[13px] text-zinc-500 hover:text-white transition-colors">{label}</a>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-white/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px] text-zinc-700">
          <span>© {new Date().getFullYear()} Declawed. All rights reserved.</span>
          <span>For informational purposes only. Not a substitute for legal counsel.</span>
        </div>
      </div>
    </footer>
  );
}
