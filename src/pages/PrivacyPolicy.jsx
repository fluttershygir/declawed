import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function Section({ title, children }) {
  return (
    <div className="mb-10">
      <h2 className="text-lg font-semibold text-white mb-3">{title}</h2>
      <div className="space-y-3 text-[15px] text-zinc-400 leading-relaxed">{children}</div>
    </div>
  );
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-3xl mx-auto px-5 py-16">
        <div className="mb-10">
          <a href="/" className="text-sm text-zinc-600 hover:text-zinc-400 transition">← Back to Declawed</a>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-zinc-600 mb-12">Last updated: July 2025</p>

        <Section title="1. Overview">
          <p>
            Declawed ("we", "our", "us") operates the lease analysis service at declawed.app. This Privacy Policy explains what information we collect, how we use it, and your rights with respect to that information.
          </p>
          <p>
            By using Declawed, you agree to the practices described in this policy. If you do not agree, please do not use the service.
          </p>
        </Section>

        <Section title="2. Information We Collect">
          <p><span className="text-zinc-200 font-medium">Account information.</span> When you create an account, we collect your email address and a hashed password (managed by Supabase Auth). If you sign in with Google, we receive your email and name from Google's OAuth service.</p>
          <p><span className="text-zinc-200 font-medium">Document text.</span> When you upload a lease or rental agreement, the document text is extracted in your browser and sent to our servers for analysis by Anthropic's Claude AI. For free-tier users, document text is not stored after analysis completes. For paid-tier users, the analysis result (structured summary) is stored in our database; the original document text is not stored.</p>
          <p><span className="text-zinc-200 font-medium">Usage data.</span> We track the number of analyses you have completed and your current subscription plan.</p>
          <p><span className="text-zinc-200 font-medium">Payment information.</span> Payments are processed by Stripe. We do not store your credit card number or full payment details. We retain a Stripe customer ID and subscription status.</p>
          <p><span className="text-zinc-200 font-medium">Technical data.</span> Our infrastructure partners (Cloudflare) may log IP addresses and request metadata for security and performance purposes. We do not use this data to personally identify users.</p>
        </Section>

        <Section title="3. How We Use Your Information">
          <p>We use collected information to:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Provide and improve the lease analysis service</li>
            <li>Authenticate your account and manage your subscription</li>
            <li>Enforce usage limits and prevent abuse</li>
            <li>Send transactional emails (account confirmation, password resets)</li>
            <li>Investigate security incidents or violations of our Terms of Service</li>
          </ul>
          <p>We do not sell, rent, or share your personal information with third parties for marketing purposes.</p>
        </Section>

        <Section title="4. AI Processing">
          <p>
            Document text you submit is sent to Anthropic's Claude API for analysis. Anthropic processes this data under their own privacy policy and API usage policies. By using Declawed, you acknowledge that your document text will be processed by Anthropic's systems. We strongly recommend removing personally identifiable information (names, Social Security numbers, bank details) from documents before uploading.
          </p>
        </Section>

        <Section title="5. Third-Party Services">
          <p>Declawed uses the following third-party services:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li><span className="text-zinc-200">Supabase</span> — authentication and database hosting (supabase.com)</li>
            <li><span className="text-zinc-200">Anthropic</span> — AI analysis via Claude API (anthropic.com)</li>
            <li><span className="text-zinc-200">Cloudflare Pages</span> — web hosting and CDN (cloudflare.com)</li>
            <li><span className="text-zinc-200">Stripe</span> — payment processing (stripe.com)</li>
          </ul>
          <p>Each of these services operates under its own privacy policy. We encourage you to review them.</p>
        </Section>

        <Section title="6. Data Retention">
          <p>
            We retain your account information and analysis history for as long as your account is active. If you delete your account, we will remove your personal data from our systems within 30 days, except where retention is required by law.
          </p>
          <p>
            For free-tier users, a browser cookie (<code className="text-teal-400 text-sm bg-teal-500/10 px-1 rounded">dcl_free_used</code>) is stored locally to track your free analysis. This cookie expires after one year.
          </p>
        </Section>

        <Section title="7. Your Rights">
          <p>Depending on your location, you may have the right to:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and associated data</li>
            <li>Object to or restrict certain processing</li>
            <li>Data portability (receive a copy of your data)</li>
          </ul>
          <p>To exercise any of these rights, email us at <span className="text-teal-400">privacy@declawed.app</span>.</p>
        </Section>

        <Section title="8. Security">
          <p>
            We implement industry-standard security measures including HTTPS encryption for all data in transit, hashed passwords via Supabase Auth, and restricted database access using row-level security. No method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
          </p>
        </Section>

        <Section title="9. Children's Privacy">
          <p>
            Declawed is not directed at children under 13. We do not knowingly collect personal information from children. If you believe a child has provided us with information, please contact us immediately.
          </p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will post the updated version on this page with a revised "Last updated" date. Continued use of the service after changes constitutes acceptance of the new policy.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>
            For privacy-related questions or requests, contact us at <span className="text-teal-400">privacy@declawed.app</span>.
          </p>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
