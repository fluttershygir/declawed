// Cloudflare Pages Function — POST /api/delete-account
// Permanently deletes all user data and the Supabase auth account.
// Steps: delete analyses → delete profile → delete auth user.
// env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function getUserFromJwt(jwt, supabaseUrl, serviceKey) {
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      apikey: serviceKey,
    },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY)
    return json({ error: 'Database not configured.' }, 503);

  const authHeader = request.headers.get('Authorization') || '';
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!jwt) return json({ error: 'Authentication required.' }, 401);

  const userData = await getUserFromJwt(jwt, env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  if (!userData?.id) return json({ error: 'Invalid session.' }, 401);

  const userId = userData.id;

  const dbHeaders = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  };

  // 1. Delete all analyses for this user
  await fetch(`${env.SUPABASE_URL}/rest/v1/analyses?user_id=eq.${userId}`, {
    method: 'DELETE',
    headers: dbHeaders,
  });

  // 2. Delete the profile row
  await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'DELETE',
    headers: dbHeaders,
  });

  // 3. Delete the Supabase auth user via admin API
  const deleteAuthRes = await fetch(
    `${env.SUPABASE_URL}/auth/v1/admin/users/${userId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      },
    }
  );

  // 404 means already deleted — that's fine
  if (!deleteAuthRes.ok && deleteAuthRes.status !== 404) {
    const errText = await deleteAuthRes.text().catch(() => '');
    console.error('[delete-account] auth delete failed:', deleteAuthRes.status, errText.slice(0, 200));
    // Data is already deleted — still return success so the client signs out
  }

  return json({ ok: true });
}
