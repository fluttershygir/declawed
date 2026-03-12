// GET /api/health — checks that backing services are reachable
// No auth required. Useful for uptime monitors.

export async function onRequestGet(context) {
  const { env } = context;
  const result = { status: 'ok', timestamp: new Date().toISOString() };

  // Check Supabase
  try {
    const sbRes = await fetch(`${env.SUPABASE_URL}/rest/v1/`, {
      headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY },
    });
    result.supabase = sbRes.ok ? 'ok' : `error (${sbRes.status})`;
  } catch (e) {
    result.supabase = `error: ${e.message}`;
  }

  // Check AI API reachability (HEAD request — no cost)
  try {
    const anRes = await fetch('https://api.anthropic.com', { method: 'HEAD' });
    result.ai = anRes.status < 500 ? 'ok' : `error (${anRes.status})`;
  } catch (e) {
    result.ai = `error: ${e.message}`;
  }

  const allOk = result.supabase === 'ok' && result.ai === 'ok';

  return new Response(JSON.stringify(result), {
    status: allOk ? 200 : 503,
    headers: { 'Content-Type': 'application/json' },
  });
}
