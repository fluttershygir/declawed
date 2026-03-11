// Cloudflare Pages Function — GET /api/usage

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

async function getUserFromJwt(jwt, supabaseUrl, serviceRoleKey) {
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${jwt}`, apikey: serviceRoleKey },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function onRequestGet(context) {
  const { request, env } = context;

  const authHeader = request.headers.get('Authorization') || '';
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (jwt && env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    const userData = await getUserFromJwt(jwt, env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    if (userData?.id) {
      const profileRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userData.id}&select=plan,analyses_used,analyses_limit`,
        { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } }
      );
      const profiles = await profileRes.json();
      const profile = profiles?.[0];
      if (profile) {
        return json({
          plan: profile.plan || 'free',
          used: profile.analyses_used ?? 0,
          limit: profile.plan === 'unlimited' ? null : (profile.analyses_limit ?? 1),
        });
      }
    }
  }

  // Anonymous — check cookie
  const cookieHeader = request.headers.get('Cookie') || '';
  const usedFree = cookieHeader.includes('dcl_free_used=1');
  return json({ plan: 'free', used: usedFree ? 1 : 0, limit: 1 });
}
