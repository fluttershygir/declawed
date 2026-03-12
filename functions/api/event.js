// Cloudflare Pages Function — POST /api/event
// Lightweight analytics event receiver. Logs events and returns 200.
// For production, replace the console.log with a proper analytics sink (e.g. Plausible Events API,
// write to KV, or forward to a logging service).

export async function onRequestPost(context) {
  const { request } = context;

  let body;
  try { body = await request.json(); } catch { body = {}; }

  const { name, props, url } = body || {};

  // Sanitize inputs to avoid log injection
  const safeName = String(name || '').slice(0, 100).replace(/[\r\n]/g, '');
  const safeUrl  = String(url  || '').slice(0, 300).replace(/[\r\n]/g, '');

  // Log — replace with real analytics sink if needed
  console.log(`[event] ${safeName} | ${safeUrl}`, props);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
