// Cloudflare Pages Function — POST /api/summarize
// Receives { text: string } (PDF parsed on client), JWT in Authorization header.
// env: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const SYSTEM_PROMPT = `You are a tenant-rights legal document analyzer. Read the lease and return ONLY a JSON object with exactly these keys:

{
  "score": number,
  "redFlags": [{"text": "string", "severity": "HIGH"|"MEDIUM"|"LOW"}],
  "keyDates": [{"label": "string", "value": "string"}],
  "tenantRights": ["string"],
  "unusualClauses": ["string"],
  "verdict": "string",
  "actionSteps": ["string"]
}

score: Integer 1–10 (1–3 = severely problematic, 4–5 = below average, 6–7 = fair, 8–10 = tenant-favorable).

redFlags: 3–6 harmful clauses. Severity MUST follow these rules exactly:
  HIGH: financial penalties or surprise fees, forfeiture/withholding of security deposit, any clause waiving tenant's right to sue or to habitable conditions, landlord entry without required notice, open-ended or disproportionate tenant liability, clauses likely illegal under most state law, automatic penalty clauses over $50.
  MEDIUM: unfair but legal — unusual notice periods, auto-renewal traps requiring uncommon action to cancel, non-standard maintenance duties placed on tenant, restrictive pet or guest policies.
  LOW: minor inconveniences, cosmetic restrictions, standard admin requirements.
  RULE: Always assign HIGH to financial traps and rights-waivers. Never downgrade a clearly harmful clause. Leases with real problems will have at least 1–2 HIGH flags.

keyDates: Every important date or deadline (move-in, lease end, notice periods, renewal deadlines, deposit return window, payment due dates).

tenantRights: 3–5 rights the tenant explicitly holds under this lease.

unusualClauses: 2–4 clauses that are atypical or strange — distinct from red flags (weird/unusual rather than clearly harmful).

verdict: 1–2 sentences naming the single biggest risk and overall fairness for the tenant, plainly worded.

actionSteps: 4–5 specific, actionable things the tenant should negotiate or do before signing — each tied directly to a specific red flag or risk.

Respond with ONLY valid JSON. No markdown, no explanation, no text outside the JSON object.`;

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

async function callAnthropic(apiKey, model, maxTokens, systemPrompt, messageContent) {
  return fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: messageContent }],
    }),
  });
}

async function checkIpRateLimit(ip, kv) {
  if (!kv || !ip) return false; // fail open if no KV binding
  const today = new Date().toISOString().slice(0, 10);
  const key = `ratelimit:${ip}:${today}`;
  try {
    const count = parseInt((await kv.get(key)) || '0');
    if (count >= 3) return true;
    await kv.put(key, String(count + 1), { expirationTtl: 86400 });
    return false;
  } catch {
    return false; // fail open on KV errors
  }
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
    // Anonymous — check IP rate limit first, then cookie
    const clientIp = request.headers.get('CF-Connecting-IP') || '';
    const rateLimited = await checkIpRateLimit(clientIp, env.RATE_LIMIT_KV);
    if (rateLimited) {
      return json({ error: 'Too many requests from this network. Please try again tomorrow or create a free account.' }, 429);
    }
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

  const model = isPaid ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001';
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

  // --- AI call (with one retry on server errors) ---
  let claudeRes = await callAnthropic(
    env.ANTHROPIC_API_KEY,
    model,
    isPaid ? 2048 : 1500,
    SYSTEM_PROMPT,
    userMessageContent
  );
  if (!claudeRes.ok && claudeRes.status >= 500) {
    await new Promise((r) => setTimeout(r, 2000));
    claudeRes = await callAnthropic(
      env.ANTHROPIC_API_KEY,
      model,
      isPaid ? 2048 : 1500,
      SYSTEM_PROMPT,
      userMessageContent
    );
  }

  if (!claudeRes.ok) {
    const err = await claudeRes.text();
    console.error('AI error:', err);
    return json({ error: 'Our AI analysis service is temporarily unavailable. Please try again in a few minutes.' }, 500);
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
