import { Shield } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function Section({ number, title, children }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 hover:border-white/[0.10] transition-colors">
      <h2 className="text-base font-semibold text-white mb-4 flex items-start gap-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 tabular-nums mt-1 shrink-0 w-5">{number}.</span>
        <span>{title}</span>
      </h2>
      <div className="space-y-3 text-[14.5px] text-zinc-400 leading-relaxed pl-8">{children}</div>
    </div>
  );
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#07070d] text-slate-100 flex flex-col">
      <Navbar />

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-teal-500/[0.05] blur-[100px]" />
          <div
            className="absolute inset-0 opacity-[0.25]"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
              maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, #000 20%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, #000 20%, transparent 100%)',
            }}
          />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-5 py-16">
          <a href="/" className="inline-flex items-center gap-1.5 text-[13px] text-zinc-600 hover:text-zinc-300 transition mb-8 group">
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            Back to Declawed
          </a>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-teal-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Privacy Policy</h1>
          </div>
          <p className="text-[13px] text-zinc-600 mb-4">Last updated: March 11, 2026</p>
          <p className="text-zinc-400 leading-relaxed max-w-xl">
            Declawed is committed to protecting your privacy. This policy explains what data we collect, how we use it, and your rights with respect to your information.
          </p>
        </div>
      </div>

      <main className="flex-1 w-full max-w-3xl mx-auto px-5 py-12">
        <div className="space-y-3">

          <Section number="1" title="Overview">
            <p>
              Declawed ("we", "our", "us") operates the lease analysis service at declawed.app. By using Declawed, you agree to the practices described in this policy. If you do not agree, please do not use the service.
            </p>
          </Section>

          <Section number="2" title="Information We Collect">
            <p><span className="text-zinc-200 font-medium">Account information.</span> When you create an account, we collect your full name, email address, and a hashed password (managed by Supabase Auth). Your full name is used to personalise your dashboard experience and analysis reports. If you sign in with Google, we receive your email and name from Google's OAuth service.</p>
            <p><span className="text-zinc-200 font-medium">Document text.</span> When you upload a lease, the document text is extracted and sent to our servers for AI analysis. For free-tier users, document text is not stored after analysis. For paid-tier users, the structured analysis result is stored; the original document text is optionally retained to enable re-analysis.</p>
            <p><span className="text-zinc-200 font-medium">Usage data.</span> We track the number of analyses you have completed and your current subscription plan.</p>
            <p><span className="text-zinc-200 font-medium">Payment information.</span> Payments are processed by Stripe. We do not store your card number or full payment details — only a Stripe customer ID and subscription status.</p>
            <p><span className="text-zinc-200 font-medium">Technical data.</span> Our infrastructure partners (Cloudflare) may log IP addresses and request metadata for security and performance. We do not use this to personally identify users.</p>
          </Section>

          <Section number="3" title="How We Use Your Information">
            <p>We use collected information to:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>Provide and personalise the lease analysis service (including addressing you by name)</li>
              <li>Authenticate your account and manage your subscription</li>
              <li>Generate personalised PDF analysis reports</li>
              <li>Enforce usage limits and prevent abuse</li>
              <li>Send transactional emails (account confirmation, password resets, welcome)</li>
              <li>Investigate security incidents or Terms of Service violations</li>
            </ul>
            <p>We do not sell, rent, or share your personal information with third parties for marketing purposes.</p>
          </Section>

          <Section number="4" title="AI Processing">
            <p>
              Document text you submit is sent to Anthropic's Claude API for analysis. Anthropic processes this data under their own privacy policy and API usage policies. By using Declawed, you acknowledge that your document text will be processed by Anthropic's systems. We strongly recommend removing personally identifiable information (names, Social Security numbers, bank details) from documents before uploading.
            </p>
          </Section>

          <Section number="5" title="Third-Party Services">
            <p>Declawed uses the following third-party services:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li><span className="text-zinc-200">Supabase</span> — authentication, database hosting, and user profile storage (supabase.com)</li>
              <li><span className="text-zinc-200">Anthropic</span> — AI analysis via Claude API (anthropic.com)</li>
              <li><span className="text-zinc-200">Cloudflare Pages</span> — web hosting and CDN (cloudflare.com)</li>
              <li><span className="text-zinc-200">Stripe</span> — payment processing (stripe.com)</li>
            </ul>
            <p>Each service operates under its own privacy policy. We encourage you to review them.</p>
          </Section>

          <Section number="6" title="Data Retention">
            <p>
              We retain your account information and analysis history for as long as your account is active. If you delete your account, we will remove your personal data within 30 days, except where retention is required by law.
            </p>
            <p>
              For free-tier users, a browser cookie (<code className="text-teal-400 text-[13px] bg-teal-500/10 px-1 rounded">dcl_free_used</code>) is stored locally to track your free analysis. This cookie expires after one year.
            </p>
          </Section>

          <Section number="7" title="Your Rights">
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data (including your name)</li>
              <li>Request deletion of your account and associated data</li>
              <li>Object to or restrict certain processing</li>
              <li>Data portability (receive a copy of your data)</li>
            </ul>
            <p>To exercise any of these rights, email us at <span className="text-teal-400">privacy@declawed.app</span>.</p>
          </Section>

          <Section number="8" title="Security">
            <p>
              We implement industry-standard security measures including HTTPS encryption for all data in transit, hashed passwords via Supabase Auth, and restricted database access using row-level security. No method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </Section>

          <Section number="9" title="Children's Privacy">
            <p>
              Declawed is not directed at children under 13. We do not knowingly collect personal information from children. If you believe a child has provided us with information, please contact us immediately.
            </p>
          </Section>

          <Section number="10" title="Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. We will post the updated version on this page with a revised "Last updated" date. Continued use of the service after changes constitutes acceptance of the new policy.
            </p>
          </Section>

          <Section number="11" title="Contact">
            <p>
              For privacy-related questions or requests, contact us at <span className="text-teal-400">privacy@declawed.app</span>.
            </p>
          </Section>

        </div>
      </main>
      <Footer />
    </div>
  );
}
