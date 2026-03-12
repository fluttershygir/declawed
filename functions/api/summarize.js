// Cloudflare Pages Function — POST /api/summarize
// Receives { text: string } (PDF parsed on client), JWT in Authorization header.
// env: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const SYSTEM_PROMPT = `You are a tenant-friendly legal document analyzer. Read the lease or contract and return a JSON object with exactly these keys:

{
  "redFlags": ["string"],
  "keyDates": [{"label": "string", "value": "string"}],
  "tenantRights": ["string"],
  "unusualClauses": ["string"],
  "verdict": "string"
}

redFlags: 3–6 specific clauses that could harm the tenant. Be direct and concrete.
keyDates: All important dates/deadlines found in the document (move-in, notice periods, renewal, etc.).
tenantRights: 3–5 rights the tenant explicitly has under this lease.
unusualClauses: Clauses that are atypical, one-sided, or potentially unenforceable.
verdict: 1–2 sentence plain-English bottom line for the tenant.

Respond with only valid JSON. No markdown, no explanation outside the JSON.`;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

async function getUserFromJwt(jwt, supabaseUrl, serviceRoleKey) {
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      apikey: serviceRoleKey,
    },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    return await handleRequest(request, env);
  } catch (e) {
    console.error('[summarize] Unhandled error:', e?.message ?? e);
    return json({ error: `Server error: ${e?.message ?? 'Unknown error'}` }, 500);
  }
}

async function handleRequest(request, env) {
  if (!env.ANTHROPIC_API_KEY) return json({ error: 'API not configured. Add ANTHROPIC_API_KEY to Cloudflare Pages environment variables.' }, 500);
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'DB not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to Cloudflare Pages environment variables.' }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON body.' }, 400); }

  const { text, filename, imageBase64, imageMediaType } = body || {};
  const isImageRequest = !!imageBase64;

  if (!isImageRequest && (!text || text.trim().length < 50)) {
    return json({ error: 'Document text is too short or missing.' }, 400);
  }
  if (isImageRequest && !imageBase64) {
    return json({ error: 'Image data is missing.' }, 400);
  }

  // --- Auth & usage check ---
  const authHeader = request.headers.get('Authorization') || '';
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  let userId = null;
  let userPlan = 'free';

  if (jwt) {
    const userData = await getUserFromJwt(jwt, env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    if (userData?.id) {
      userId = userData.id;

      // Fetch profile for plan + usage
      const profileRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=plan,analyses_used,analyses_limit`,
        { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } }
      );
      const profiles = await profileRes.json();
      const profile = profiles?.[0];

      if (profile) {
        userPlan = profile.plan || 'free';
        const limit = profile.analyses_limit ?? 1;
        const used = profile.analyses_used ?? 0;
        // Unlimited plan has no cap
        if (userPlan !== 'unlimited' && used >= limit) {
          return json({ error: 'Analysis limit reached. Please upgrade.' }, 402);
        }
      }
    }
  } else {
    // Anonymous — enforce via signed cookie
    const cookieHeader = request.headers.get('Cookie') || '';
    if (cookieHeader.includes('dcl_free_used=1')) {
      return json({ error: 'Free analysis already used. Please sign in or upgrade.' }, 402);
    }
  }

  // --- Pick model based on plan ---
  const isPaid = userId && ['one', 'pro', 'unlimited'].includes(userPlan);

  // Image analysis requires a paid plan (vision-capable model)
  if (isImageRequest && !isPaid) {
    return json({ error: 'Image scanning is available on paid plans. Please upgrade.' }, 402);
  }

  const model = isPaid ? 'claude-sonnet-4-5' : 'claude-haiku-4-5';
  const modelTier = isPaid ? 'advanced' : 'standard';

  // --- Build Anthropic message content ---
  const userMessageContent = isImageRequest
    ? [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: imageMediaType || 'image/jpeg',
            data: imageBase64,
          },
        },
        { type: 'text', text: 'Analyze this lease document shown in the image:' },
      ]
    : `Analyze this lease:\n\n${text.slice(0, isPaid ? 40000 : 20000)}`;

  // --- AI call ---
  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: isPaid ? 2048 : 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessageContent }],
    }),
  });

  if (!claudeRes.ok) {
    const err = await claudeRes.text();
    console.error('Claude error:', err);
    let detail = err;
    try { detail = JSON.parse(err)?.error?.message || err; } catch {}
    return json({ error: `AI analysis failed: ${detail}` }, 500);
  }

  const claudeData = await claudeRes.json();
  const raw = claudeData.content?.[0]?.text || '';

  let analysis;
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    analysis = JSON.parse(match ? match[0] : raw);
  } catch {
    analysis = { verdict: raw, redFlags: [], keyDates: [], tenantRights: [], unusualClauses: [] };
  }

  // --- Record usage ---
  const responseHeaders = new Headers({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });

  if (userId) {
    // Atomically increment analyses_used via RPC (avoids PostgREST string expression pitfall)
    await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/increment_analyses_used`, {
      method: 'POST',
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    });
    // Insert into analyses history
    await fetch(`${env.SUPABASE_URL}/rest/v1/analyses`, {
      method: 'POST',
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ user_id: userId, filename: filename || null, verdict: analysis.verdict, result: analysis }),
    });
  } else {
    // Anonymous — set a simple cookie. Not tamper-proof like before, but Supabase auth is the real gate now.
    responseHeaders.append('Set-Cookie', 'dcl_free_used=1; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000; Secure');
  }

  return new Response(JSON.stringify({ summary: analysis, modelTier }), { status: 200, headers: responseHeaders });
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
