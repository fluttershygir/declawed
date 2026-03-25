import { Cookie } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 hover:border-white/[0.10] transition-colors">
      <h2 className="text-base font-semibold text-white mb-4">{title}</h2>
      <div className="space-y-3 text-[14.5px] text-zinc-400 leading-relaxed">{children}</div>
    </div>
  );
}

function CookieRow({ name, purpose, duration, required }) {
  return (
    <tr className="border-b border-white/[0.05]">
      <td className="py-3 pr-4 font-mono text-sm text-blue-400">{name}</td>
      <td className="py-3 pr-4 text-sm text-zinc-400">{purpose}</td>
      <td className="py-3 pr-4 text-sm text-zinc-500">{duration}</td>
      <td className="py-3 text-sm">
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${required ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-zinc-800 text-zinc-500'}`}>
          {required ? 'Required' : 'Optional'}
        </span>
      </td>
    </tr>
  );
}

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-[#07070d] text-slate-100 flex flex-col">
      <Navbar />

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-blue-500/[0.05] blur-[100px]" />
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
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Cookie className="w-5 h-5 text-blue-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Cookie Policy</h1>
          </div>
          <p className="text-[13px] text-zinc-600 mb-4">Last updated: March 25, 2026</p>
          <p className="text-zinc-400 leading-relaxed max-w-xl">
            Declawed uses a minimal set of cookies — only those strictly necessary to operate the service. We don't use advertising, analytics, or tracking cookies.
          </p>
        </div>
      </div>

      <main className="flex-1 w-full max-w-3xl mx-auto px-5 py-12">
        <div className="space-y-3">

          <Section title="What Are Cookies">
            <p>
              Cookies are small text files stored in your browser when you visit a website. They help websites remember information about your visit, such as whether you are logged in or have used the free tier.
            </p>
            <p>
              Declawed uses a minimal number of cookies — only those strictly necessary to operate the service. We do not use advertising cookies, cross-site tracking cookies, or analytics services like Google Analytics.
            </p>
          </Section>

          <Section title="Cookies We Use">
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="pb-3 pr-4 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Name</th>
                    <th className="pb-3 pr-4 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Purpose</th>
                    <th className="pb-3 pr-4 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Duration</th>
                    <th className="pb-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Type</th>
                  </tr>
                </thead>
                <tbody>
                  <CookieRow
                    name="sb-*"
                    purpose="Supabase authentication session. Keeps you logged in between page visits."
                    duration="Until sign out or expiry (~1 week)"
                    required
                  />
                  <CookieRow
                    name="dcl_free_used"
                    purpose="Tracks whether you have used your free analysis (anonymous users only). Prevents abuse of the free tier."
                    duration="1 year"
                    required
                  />
                </tbody>
              </table>
            </div>
            <p className="mt-4">
              We do not use any of the following:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>Advertising or retargeting cookies</li>
              <li>Third-party analytics cookies (e.g., Google Analytics)</li>
              <li>Social media tracking pixels</li>
              <li>Cross-site identification cookies</li>
            </ul>
          </Section>

          <Section title="Authentication Cookies">
            <p>
              When you sign in to Declawed, Supabase sets authentication cookies (prefixed with <code className="text-blue-400 text-[13px] bg-blue-500/10 px-1 rounded">sb-</code>) to maintain your session. These cookies are HttpOnly, meaning they cannot be accessed by JavaScript, and are marked Secure, meaning they are only sent over HTTPS.
            </p>
            <p>
              These cookies are deleted when you sign out, or automatically expire after approximately one week of inactivity.
            </p>
          </Section>

          <Section title="Free Tier Cookie">
            <p>
              For users who analyze a lease without creating an account, we set a cookie called <code className="text-blue-400 text-[13px] bg-blue-500/10 px-1 rounded">dcl_free_used</code> to record that your one free analysis has been used. This prevents a single browser from receiving unlimited free analyses. It does not contain any personally identifiable information.
            </p>
            <p>
              This cookie is HttpOnly and Secure, and expires after one year from when it is set. Once you create an account, your usage is tracked by your account instead.
            </p>
          </Section>

          <Section title="Managing Cookies">
            <p>
              You can control cookies through your browser settings. Most browsers allow you to:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>View and delete existing cookies</li>
              <li>Block cookies from specific websites</li>
              <li>Block all cookies (note: this will prevent you from staying signed in)</li>
            </ul>
            <p>
              Common browser settings:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>Chrome: Settings → Privacy and Security → Cookies</li>
              <li>Firefox: Settings → Privacy &amp; Security → Cookies and Site Data</li>
              <li>Safari: Preferences → Privacy → Manage Website Data</li>
              <li>Edge: Settings → Cookies and Site Permissions</li>
            </ul>
            <p>
              Note that deleting the <code className="text-blue-400 text-[13px] bg-blue-500/10 px-1 rounded">dcl_free_used</code> cookie does not entitle you to an additional free analysis — the free tier is intended as one use per person, and is ultimately enforced by your account once you sign up.
            </p>
          </Section>

          <Section title="Changes to This Policy">
            <p>
              We may update this Cookie Policy from time to time. We will post any changes on this page with a revised date. Continued use of the service after changes implies acceptance of the updated policy.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              For questions about our use of cookies, contact us at <span className="text-blue-400">privacy@declawed.app</span>.
            </p>
          </Section>

        </div>
      </main>
      <Footer />
    </div>
  );
}
