// Cloudflare Pages Function — PATCH /api/note
// Saves a user's personal note on one of their own analyses.
// Body: { analysis_id: string, note: string (max 500 chars) }

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

export async function onRequestPatch(context) {
  const { request, env } = context;
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!jwt) return json({ error: 'Unauthorized' }, 401);

    const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${jwt}`, apikey: env.SUPABASE_SERVICE_ROLE_KEY },
    });
    if (!userRes.ok) return json({ error: 'Unauthorized' }, 401);
    const userData = await userRes.json();
    if (!userData?.id) return json({ error: 'Unauthorized' }, 401);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
    const { analysis_id, note } = body || {};
    if (!analysis_id) return json({ error: 'analysis_id required' }, 400);

    // Clamp note to 500 chars; allow empty string to clear a note
    const safeNote = typeof note === 'string' ? note.slice(0, 500) : null;

    // Filter by user_id to ensure ownership (service role bypasses RLS)
    const updateRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/analyses?id=eq.${encodeURIComponent(analysis_id)}&user_id=eq.${encodeURIComponent(userData.id)}`,
      {
        method: 'PATCH',
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ note: safeNote }),
      }
    );

    if (!updateRes.ok) {
      const err = await updateRes.text();
      console.error('[note] update failed:', err);
      return json({ error: 'Failed to save note' }, 500);
    }

    return json({ ok: true });
  } catch (e) {
    console.error('[note] unhandled:', e?.message);
    return json({ error: 'Server error' }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
