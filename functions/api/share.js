// Cloudflare Pages Function — POST /api/share
// Generates (or returns an existing) share token for one of the user's analyses.
// Body: { analysis_id: string }
// Returns: { share_token: string }

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

function generateToken() {
  // 18 cryptographically random bytes → 36-char hex string
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost(context) {
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
    const { analysis_id } = body || {};
    if (!analysis_id) return json({ error: 'analysis_id required' }, 400);

    // Fetch the analysis to verify ownership and check for existing token
    const fetchRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/analyses?id=eq.${encodeURIComponent(analysis_id)}&user_id=eq.${encodeURIComponent(userData.id)}&select=id,share_token`,
      {
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    if (!fetchRes.ok) return json({ error: 'Server error' }, 500);
    const rows = await fetchRes.json();
    if (!rows?.[0]) return json({ error: 'Analysis not found' }, 404);

    // Return existing token if already generated
    if (rows[0].share_token) {
      return json({ share_token: rows[0].share_token });
    }

    // Generate and persist a new token
    const token = generateToken();
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
        body: JSON.stringify({ share_token: token }),
      }
    );

    if (!updateRes.ok) {
      const err = await updateRes.text();
      console.error('[share] update failed:', err);
      return json({ error: 'Failed to generate share link' }, 500);
    }

    return json({ share_token: token });
  } catch (e) {
    console.error('[share] unhandled:', e?.message);
    return json({ error: 'Server error' }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
