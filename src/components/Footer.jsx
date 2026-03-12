const LOGO_SVG = (
  <svg viewBox="0 0 20 20" fill="none" className="w-[13px] h-[13px]">
    <path d="M6 10V7a4 4 0 0 1 8 0v3" stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="3.5" y="10" width="13" height="9" rx="2.5" fill="white" fillOpacity="0.95" />
    <circle cx="10" cy="14.5" r="1.4" fill="#0d9488" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-16 px-5">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-12">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shrink-0">
                {LOGO_SVG}
              </div>
              <span className="text-sm font-bold text-white">Declawed</span>
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed">Know what you're signing.</p>
          </div>

          {/* Link columns */}
          <div className="flex flex-wrap gap-x-14 gap-y-8 text-sm">
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600 mb-1">Product</p>
              {[['How it Works', '/#how-it-works'], ['Pricing', '/#pricing'], ['FAQ', '/#faq']].map(([label, href]) => (
                <a key={label} href={href} className="text-zinc-400 hover:text-white transition-colors">{label}</a>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600 mb-1">Legal</p>
              {[['Privacy Policy', '/privacy'], ['Terms of Service', '/terms'], ['Cookie Policy', '/cookies'], ['Contact', '/contact']].map(([label, href]) => (
                <a key={label} href={href} className="text-zinc-400 hover:text-white transition-colors">{label}</a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-zinc-700">
          <span>© {new Date().getFullYear()} Declawed. All rights reserved.</span>
          <span>Not legal advice. For informational purposes only.</span>
        </div>
      </div>
    </footer>
  );
}
