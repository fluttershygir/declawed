// Cloudflare Pages Function — POST /api/summarize
// Receives { text: string } (PDF parsed on client), JWT in Authorization header.
// env: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const LANDLORD_PROMPT = `You are a landlord-side real estate attorney reviewing a lease agreement. Analyze the lease from the LANDLORD'S perspective and return ONLY a JSON object with exactly these keys:

{
  "score": number,
  "verdict": "string",
  "redFlags": [{"text": "string", "severity": "HIGH"|"MEDIUM"|"LOW"}],
  "keyDates": [{"label": "string", "value": "string"}],
  "tenantRights": ["string"],
  "actionSteps": ["string"],
  "unusualClauses": ["string"]
}

score: Integer 1–10 rating of how well this lease protects the LANDLORD (1 = very weak landlord protections, 10 = very strong landlord protections).

verdict: 1–2 sentences naming the single biggest landlord risk in this lease and overall assessment of how well the landlord is protected.

redFlags: 3–6 items that create RISK OR LIABILITY FOR THE LANDLORD — clauses that:
  HIGH: expose the landlord to significant legal liability, missing clauses that landlords typically need (no auto-renewal, no early termination fee, no attorney's fees clause), language that could be challenged as unenforceable, clauses waiving landlord's standard remedies, missing required disclosures that could void the lease.
  MEDIUM: tenant obligations that are vague or hard to enforce, notice periods too short to protect landlord interests, rent increase restrictions, unusual repair/maintenance allocations that favor the tenant.
  LOW: minor administrative gaps, cosmetic issues, non-standard formatting that could cause ambiguity.

keyDates: Every important date or deadline the landlord must track (rent due dates, lease expiry, notice deadlines, inspection windows, deposit return deadlines).

tenantRights: 3–5 TENANT OBLIGATIONS under this lease — things the tenant is contractually required to do that the landlord can enforce.

actionSteps: 3–5 SPECIFIC changes the landlord's attorney should make to strengthen this lease before using it again — each must:
  - Reference the exact clause, section number, or missing provision
  - State exactly what to add, remove, or rewrite
  - Explain the legal protection it provides
  Examples: "Add an attorney's fees clause — currently absent — so landlord can recover legal costs if tenant defaults", "Tighten Section 8 to specify tenant is responsible for all pest control costs, not just 'infestations they cause'", "Add a holdover rent clause at 150% of monthly rent — currently silent on holdover tenancy"

unusualClauses: 2–4 clauses that are atypical, overly tenant-favorable, or may be unenforceable under standard landlord-tenant law.

Respond with ONLY valid JSON. No markdown, no explanation, no text outside the JSON object.`;

const SYSTEM_PROMPT = `You are a tenant-rights legal document analyzer. Read the lease and return ONLY a JSON object with exactly these keys:

{
  "score": number,
  "verdict": "string",
  "redFlags": [{"text": "string", "severity": "HIGH"|"MEDIUM"|"LOW"}],
  "keyDates": [{"label": "string", "value": "string"}],
  "tenantRights": ["string"],
  "actionSteps": ["string"],
  "unusualClauses": ["string"]
}

score: Integer 1–10 (1–3 = severely problematic, 4–5 = below average, 6–7 = fair, 8–10 = tenant-favorable).

verdict: 1–2 sentences naming the single biggest risk and overall fairness for the tenant, plainly worded.

redFlags: 3–6 harmful clauses. Severity MUST follow these rules exactly:
  HIGH: financial penalties or surprise fees, forfeiture/withholding of security deposit, any clause waiving tenant's right to sue or to habitable conditions, landlord entry without required notice, open-ended or disproportionate tenant liability, clauses likely illegal under most state law, automatic penalty clauses over $50.
  MEDIUM: unfair but legal — unusual notice periods, auto-renewal traps requiring uncommon action to cancel, non-standard maintenance duties placed on tenant, restrictive pet or guest policies.
  LOW: minor inconveniences, cosmetic restrictions, standard admin requirements.
  RULE: Always assign HIGH to financial traps and rights-waivers. Never downgrade a clearly harmful clause. Leases with real problems will have at least 1–2 HIGH flags.

keyDates: Every important date or deadline (move-in, lease end, notice periods, renewal deadlines, deposit return window, payment due dates).

tenantRights: 3–5 rights the tenant explicitly holds under this lease.

actionSteps: 3–5 SPECIFIC, actionable steps the tenant should take before signing — each must:
  - Reference the exact clause, section number, or quoted term from the lease (e.g. "Clause 7", "Section 12", "the $75 late fee")
  - Name what to ask for or negotiate (removal, cap, written clarification, addendum)
  - Use plain language a non-lawyer can act on immediately
  Examples of the level of specificity required:
    "Ask the landlord to remove or cap the $50/day maintenance charge in Section 5 — it has no upper limit"
    "Request a written addendum defining 'normal wear and tear' before signing, since the lease holds you liable for all damage"
    "Negotiate the 60-day notice-to-vacate requirement in Clause 18 down to the standard 30 days"
    "Get written confirmation that the $1,200 security deposit will be returned within 21 days per state law, not the 60 days listed"
  If a clause number isn't clearly labeled, reference the specific fee, term, or rule instead. Never write a generic tip.

unusualClauses: 2–4 clauses that are atypical or strange — distinct from red flags (weird/unusual rather than clearly harmful).

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

async function signCookieValue(secret, value) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function verifyCookieValue(secret, value, signature) {
  const expected = await signCookieValue(secret, value);
  if (expected.length !== signature.length) return false;
  // constant-time comparison
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

function fetchWithTimeout(url, options, ms = 8000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...options, signal: ctrl.signal }).finally(() => clearTimeout(id));
}

async function getUserFromJwt(jwt, supabaseUrl, serviceRoleKey) {
  try {
    const res = await fetchWithTimeout(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
        apikey: serviceRoleKey,
      },
    }, 8000);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null; // auth timeout → treat as anonymous
  }
}

async function callAnthropic(apiKey, model, maxTokens, systemPrompt, messageContent) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 55000); // 55s hard timeout
  try {
    return await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
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
  } finally {
    clearTimeout(timer);
  }
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
    return await handleRequest(request, env, context);
  } catch (e) {
    if (e?.name === 'AbortError' || e?.message?.includes('aborted')) {
      return json({ error: 'Analysis timed out — please try again. Very long documents may take a moment.' }, 504);
    }
    console.error('[summarize] Unhandled error:', e?.message ?? e);
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
}

async function handleRequest(request, env, context) {
  if (!env.ANTHROPIC_API_KEY) return json({ error: 'API not configured. Add ANTHROPIC_API_KEY to Cloudflare Pages environment variables.' }, 500);
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'DB not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to Cloudflare Pages environment variables.' }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON body.' }, 400); }

  const { text, filename, imageBase64, imageMediaType, landlordMode: rawLandlordMode } = body || {};
  const isImageRequest = !!imageBase64;
  const landlordMode = rawLandlordMode === true;

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
      const profileRes = await fetchWithTimeout(
        `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=plan,analyses_used,analyses_limit`,
        { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } },
        8000
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
    const cookieMatch = cookieHeader.match(/(?:^|;\s*)dcl_free_used=([^;]+)/);
    if (cookieMatch) {
      const cookieSecret = env.COOKIE_SECRET || '';
      const isValid = cookieSecret
        ? await verifyCookieValue(cookieSecret, 'dcl_free_used', cookieMatch[1])
        : cookieMatch[1] === '1'; // fallback for missing secret (dev only)
      if (isValid) {
        return json({ error: 'Free analysis already used. Please sign in or upgrade.' }, 402);
      }
    }
  }

  // --- Pick model based on plan ---
  const isPaid = userId && ['one', 'pro', 'unlimited'].includes(userPlan);
  const isUnlimited = userId && userPlan === 'unlimited';

  // Landlord mode requires Unlimited plan
  const useLandlordMode = landlordMode && isUnlimited;

  // Image analysis requires a paid plan (vision-capable model)
  if (isImageRequest && !isPaid) {
    return json({ error: 'Image scanning is available on paid plans. Please upgrade.' }, 402);
  }

  // Landlord mode requires Unlimited
  if (landlordMode && !isUnlimited) {
    return json({ error: 'Landlord Mode is available on the Unlimited plan.' }, 402);
  }

  const model = isPaid ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001';
  const modelTier = isPaid ? 'advanced' : 'standard';
  const activePrompt = useLandlordMode ? LANDLORD_PROMPT : SYSTEM_PROMPT;

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
        { type: 'text', text: useLandlordMode ? 'Analyze this lease from the landlord\'s perspective:' : 'Analyze this lease document shown in the image:' },
      ]
    : `${useLandlordMode ? 'Analyze this lease from the landlord\'s perspective' : 'Analyze this lease'}:\n\n${text.slice(0, isPaid ? 40000 : 20000)}`;

  // --- AI call (with one retry on server errors) ---
  let claudeRes = await callAnthropic(
    env.ANTHROPIC_API_KEY,
    model,
    isPaid ? 2048 : 2000,
    activePrompt,
    userMessageContent
  );
  if (!claudeRes.ok && claudeRes.status >= 500) {
    await new Promise((r) => setTimeout(r, 2000));
    claudeRes = await callAnthropic(
      env.ANTHROPIC_API_KEY,
      model,
      isPaid ? 2048 : 2000,
      activePrompt,
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
    // Strip markdown code fences (Claude sometimes wraps response in ```json ... ```)
    const stripped = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();
    // Extract the outermost JSON object from the cleaned string
    const match = stripped.match(/\{[\s\S]*\}/);
    analysis = JSON.parse(match ? match[0] : stripped);
    // Guarantee required fields exist so the frontend always has a valid shape
    if (typeof analysis !== 'object' || analysis === null) throw new Error('Not an object');
    analysis.score = typeof analysis.score === 'number' ? analysis.score : null;
    analysis.verdict = analysis.verdict || '';
    // Sanitize: strip if raw JSON or markdown fences leaked into the verdict field
    if (analysis.verdict) {
      const _v = analysis.verdict.trim();
      if (_v.startsWith('{') || _v.startsWith('`')) {
        analysis.verdict = '';
      } else {
        analysis.verdict = _v;
      }
    }
    analysis.redFlags = Array.isArray(analysis.redFlags)
      ? analysis.redFlags.map(f => typeof f === 'string' ? { text: f, severity: 'MEDIUM' } : f)
      : [];
    analysis.keyDates = Array.isArray(analysis.keyDates) ? analysis.keyDates : [];
    analysis.tenantRights = Array.isArray(analysis.tenantRights) ? analysis.tenantRights : [];
    analysis.unusualClauses = Array.isArray(analysis.unusualClauses) ? analysis.unusualClauses : [];
    analysis.actionSteps = Array.isArray(analysis.actionSteps) ? analysis.actionSteps : [];
  } catch {
    // Last-resort fallback: show a parse-error verdict
    analysis = {
      score: null,
      verdict: '',
      redFlags: [],
      keyDates: [],
      tenantRights: [],
      unusualClauses: [],
      actionSteps: [],
      _parseError: true,
    };
  }

  // --- Record usage ---
  const responseHeaders = new Headers({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });

  let shareToken = null;

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
    // Insert into analyses history — generate share_token here since the column has no DB default
    const generatedToken = crypto.randomUUID().replace(/-/g, '');
    try {
      const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/analyses`, {
        method: 'POST',
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          user_id: userId,
          filename: filename || null,
          verdict: analysis.verdict,
          result: analysis,
          share_token: generatedToken,
          // Store original text for re-analysis (null for image uploads)
          source_text: isImageRequest ? null : (text ? text.slice(0, 40000) : null),
        }),
      });
      if (insertRes.ok) {
        shareToken = generatedToken;
      }
    } catch { /* non-critical — analysis still returned */ }
  } else {
    // Anonymous — set a signed cookie so users can't clear it and reuse the free tier.
    const cookieSecret = env.COOKIE_SECRET || '';
    const cookieSig = cookieSecret
      ? await signCookieValue(cookieSecret, 'dcl_free_used')
      : '1'; // fallback for missing secret (dev only)
    responseHeaders.append('Set-Cookie', `dcl_free_used=${cookieSig}; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000; Secure`);
  }

  // Compute score percentile — how does this lease compare to all analyzed leases?
  let scorePercentile = null;
  if (typeof analysis.score === 'number' && env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const scoresRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/analyses?select=s:result->>score&limit=10000`,
        { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } }
      );
      if (scoresRes.ok) {
        const rows = await scoresRes.json();
        const total = rows.length;
        if (total > 1) {
          const lower = rows.filter(r => Number(r.s) < analysis.score).length;
          scorePercentile = Math.round((lower / total) * 100);
        }
      }
    } catch { /* ignore — non-critical */ }
  }

  // Schedule a 24-hour follow-up email for logged-in users (fire-and-forget)
  if (userId && env.RESEND_API_KEY) {
    context.waitUntil(scheduleFollowUpEmail({ userId, analysis, shareToken, env }));
  }

  return new Response(JSON.stringify({ summary: analysis, modelTier, landlordMode: useLandlordMode, scorePercentile, shareToken: shareToken || null }), { status: 200, headers: responseHeaders });
}

async function scheduleFollowUpEmail({ userId, analysis, shareToken, env }) {
  try {
    // Fetch the user's email via Supabase Auth admin API
    const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    if (!userRes.ok) return;
    const userObj = await userRes.json();
    const email = userObj?.email;
    if (!email) return;

    const score = analysis?.score ?? null;
    const redFlags = analysis?.redFlags || [];
    const highFlags = redFlags.filter(f => (typeof f === 'string' ? 'MEDIUM' : (f.severity ?? 'MEDIUM')) === 'HIGH');
    const topFlags = (highFlags.length > 0 ? highFlags : redFlags).slice(0, 3);
    const shareUrl = shareToken ? `https://declawed.app/shared/${shareToken}` : 'https://declawed.app';
    const scoreLabel = score !== null
      ? (score <= 4 ? 'heavily favors your landlord' : score <= 7 ? 'somewhat unfavorable for you' : 'tenant-friendly')
      : null;

    const flagListHtml = topFlags.length > 0
      ? topFlags.map(f => {
          const text = typeof f === 'string' ? f : f.text;
          return `<tr><td style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.05);font-size:14px;color:#a1a1aa;line-height:1.5;">${text}</td></tr>`;
        }).join('')
      : '';

    const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const fromEmail = env.RESEND_FROM_EMAIL || 'noreply@declawed.app';

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `Declawed <${fromEmail}>`,
        to: email,
        subject: score !== null
          ? `Your lease scored ${score}/10 — did you follow up with your landlord?`
          : `Your lease analysis is ready — did you follow up?`,
        scheduled_at: scheduledAt,
        html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0f;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background-color:#111118;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
        <tr>
          <td style="padding:24px 32px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
            <span style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Declawed</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 32px 24px;">
            <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
              ${score !== null ? `Your lease scored ${score}/10.` : 'Your lease analysis is ready.'}<br />
              Did you talk to your landlord?
            </h1>
            ${scoreLabel ? `<p style="margin:0 0 20px;font-size:14px;color:#a1a1aa;line-height:1.6;">This lease ${scoreLabel}. Here are the most important issues we flagged — if you haven't raised them yet, now is the time.</p>` : '<p style="margin:0 0 20px;font-size:14px;color:#a1a1aa;line-height:1.6;">Here are the most important issues we flagged in your lease.</p>'}
            ${flagListHtml ? `
            <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;border:1px solid rgba(255,255,255,0.07);border-radius:12px;overflow:hidden;">
              ${flagListHtml}
            </table>` : ''}
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="background-color:#3b82f6;border-radius:10px;">
                <a href="${shareUrl}"
                   style="display:inline-block;padding:13px 26px;font-size:14px;font-weight:700;color:#000000;text-decoration:none;letter-spacing:-0.1px;">
                  Review your full report &rarr;
                </a>
              </td>
            </tr></table>
            <p style="margin:20px 0 0;font-size:13px;color:#52525b;line-height:1.6;">
              Most landlords will negotiate if you ask in writing. Use your action steps as a checklist.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;font-size:12px;color:#3f3f46;text-align:center;">
              Declawed &middot; AI-powered lease analysis &middot;
              <a href="https://declawed.app" style="color:#3b82f6;text-decoration:none;">declawed.app</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      }),
    });
  } catch { /* non-critical */ }
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
