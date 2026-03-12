// Cloudflare Pages Function — GET /api/shared/[token]
// Public endpoint — no auth required.
// Returns the read-only analysis data for a given share token.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

export async function onRequestGet(context) {
  const { params, env } = context;
  const token = params?.token;

  if (!token || token.length < 10) return json({ error: 'Not found' }, 404);

  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/analyses?share_token=eq.${encodeURIComponent(token)}&select=filename,result,created_at`,
      {
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    if (!res.ok) return json({ error: 'Server error' }, 500);
    const rows = await res.json();
    if (!rows?.[0]) return json({ error: 'Report not found or link has expired' }, 404);

    return json({ analysis: rows[0] });
  } catch (e) {
    console.error('[shared/token] unhandled:', e?.message);
    return json({ error: 'Server error' }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
