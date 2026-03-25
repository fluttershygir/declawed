// Cloudflare Pages Function — GET /shared/:token
// Intercepts the shared report page and injects dynamic Open Graph meta tags
// before serving the React SPA. iMessage, Telegram, Slack, and Twitter/X
// will all pick up the score + verdict as link preview text.
// env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

class OGTagInjector {
  constructor(title, description, url) {
    this.title = title;
    this.description = description;
    this.url = url;
  }

  element(el) {
    const t = escapeAttr(this.title);
    const d = escapeAttr(this.description);
    const u = escapeAttr(this.url);
    el.append(
      `<meta property="og:type" content="website" />` +
      `<meta property="og:url" content="${u}" />` +
      `<meta property="og:title" content="${t}" />` +
      `<meta property="og:description" content="${d}" />` +
      `<meta property="og:site_name" content="Declawed" />` +
      `<meta name="twitter:card" content="summary" />` +
      `<meta name="twitter:title" content="${t}" />` +
      `<meta name="twitter:description" content="${d}" />`,
      { html: true }
    );
  }
}

class TitleReplacer {
  constructor(title) { this.title = title; }
  element(el) { el.setInnerContent(this.title); }
}

export async function onRequestGet(context) {
  const { params, env, request } = context;
  const token = params?.token;

  let title = 'Lease Analysis — Declawed';
  let description = 'See the full lease analysis — red flags, key dates, and action steps to take before signing.';

  if (token && env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/analyses?share_token=eq.${encodeURIComponent(token)}&select=result,filename&limit=1`,
        {
          headers: {
            apikey: env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
        }
      );
      if (res.ok) {
        const rows = await res.json();
        const row = rows?.[0];
        if (row?.result) {
          const { score, verdict, redFlags } = row.result;
          const fname = row.filename ? ` · ${row.filename}` : '';
          const flagCount = redFlags?.length ?? 0;

          title = score != null
            ? `Lease scored ${score}/10${fname} — Declawed`
            : `Lease Analysis${fname} — Declawed`;

          if (verdict) {
            const base = verdict.length > 140 ? verdict.slice(0, 137) + '…' : verdict;
            description = flagCount > 0
              ? `${base} (${flagCount} red flag${flagCount !== 1 ? 's' : ''} found)`
              : base;
          }
        }
      }
    } catch { /* non-critical — serve page without custom OG tags */ }
  }

  // Fetch the SPA HTML from Cloudflare Pages static assets
  const assetUrl = new URL(request.url);
  assetUrl.pathname = '/index.html';
  const htmlResponse = await env.ASSETS.fetch(new Request(assetUrl.toString()));

  return new HTMLRewriter()
    .on('title', new TitleReplacer(title))
    .on('head', new OGTagInjector(title, description, request.url))
    .transform(htmlResponse);
}
