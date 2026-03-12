// POST /api/cron-reset — monthly reset of analyses_used for pro/unlimited users
// Secured by CRON_SECRET env var. Trigger with:
//   POST https://declawed.app/api/cron-reset
//   Authorization: Bearer <CRON_SECRET>
// Schedule via cron-job.org or similar on the 1st of each month.
// env: CRON_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // Verify bearer secret
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token || !env.CRON_SECRET || token !== env.CRON_SECRET) {
    return json({ error: 'Unauthorized.' }, 401);
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: 'DB not configured.' }, 500);
  }

  // Reset analyses_used = 0 for all subscription plan users
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?plan=in.(pro,unlimited)`,
    {
      method: 'PATCH',
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ analyses_used: 0 }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error('cron-reset DB error:', err);
    return json({ error: `DB update failed: ${err}` }, 500);
  }

  return json({ ok: true, reset_at: new Date().toISOString() });
}
