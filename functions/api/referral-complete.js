// Cloudflare Pages Function — POST /api/referral-complete
// Called fire-and-forget after every successful analysis.
// Checks if this is a referred user completing their first analysis.
// If so: marks reward as given, increments referrer's analyses_limit +1, and sends an email.
// Fully idempotent — safe to call multiple times (reward_given flag prevents double-rewarding).
// env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, RESEND_FROM_EMAIL

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function getUserIdFromJwt(jwt, supabaseUrl, serviceKey) {
  if (!jwt || !supabaseUrl || !serviceKey) return null;
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${jwt}`, apikey: serviceKey },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.id || null;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return json({ ok: false, reason: 'not_configured' }, 503);
  }

  const authHeader = request.headers.get('Authorization') || '';
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const userId = await getUserIdFromJwt(jwt, env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  if (!userId) return json({ ok: false, reason: 'unauthorized' }, 401);

  const headers = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };

  // 1. Fetch the referred user's profile
  const profileRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=referred_by,referral_reward_given,analyses_used&limit=1`,
    { headers }
  );
  if (!profileRes.ok) return json({ ok: false, reason: 'profile_fetch_failed' });
  const [profile] = await profileRes.json();

  // Early exits — these are the common no-op paths
  if (!profile)                        return json({ ok: false, reason: 'no_profile' });
  if (!profile.referred_by)            return json({ ok: false, reason: 'no_referral' });
  if (profile.referral_reward_given)   return json({ ok: false, reason: 'already_rewarded' });
  if ((profile.analyses_used ?? 0) < 1) return json({ ok: false, reason: 'no_analysis_yet' });

  // 2. Atomically mark referred user as rewarded.
  //    The filter `?referral_reward_given=eq.false` ensures only one concurrent request succeeds.
  const markRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&referral_reward_given=eq.false`,
    {
      method: 'PATCH',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify({ referral_reward_given: true }),
    }
  );
  const updated = await markRes.json().catch(() => []);
  // If the array is empty, another request already claimed it — bail out
  if (!Array.isArray(updated) || updated.length === 0) {
    return json({ ok: false, reason: 'race_condition' });
  }

  const referrerId = profile.referred_by;

  // 3. Increment referrer's analyses_limit via RPC (atomic SQL increment)
  await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/reward_referrer`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ referrer_id: referrerId }),
  });

  // 4. Fetch referrer's email for the notification
  const referrerRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${referrerId}&select=email&limit=1`,
    { headers }
  );
  const [referrer] = referrerRes.ok ? await referrerRes.json() : [];
  const referrerEmail = referrer?.email;

  // 5. Send notification email via Resend (fire-and-forget, failure doesn't block the response)
  if (referrerEmail && env.RESEND_API_KEY) {
    const fromEmail = env.RESEND_FROM_EMAIL || 'noreply@declawed.app';
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `Declawed <${fromEmail}>`,
        to: referrerEmail,
        subject: 'Your friend joined Declawed \u2014 you\u2019ve earned 1 free analysis!',
        html: `<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0f0f0f;color:#e4e4e7">
  <h2 style="color:#10b981;margin:0 0 16px">&#x1F389; You earned a free analysis!</h2>
  <p style="color:#a1a1aa;line-height:1.7">
    Someone you referred just completed their first lease analysis on Declawed.<br>
    As a thank-you, <strong style="color:#e4e4e7">1 free analysis</strong> has been added to your account automatically.
  </p>
  <div style="margin:24px 0;padding:16px 20px;background:#18181b;border:1px solid #27272a;border-left:3px solid #10b981;border-radius:8px">
    <p style="margin:0;color:#d4d4d8;font-size:15px">&#x2705; Your analyses limit has been increased by 1</p>
  </div>
  <a href="https://declawed.app/#upload"
     style="display:inline-block;background:#14b8a6;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:4px">
    Analyze a lease now &rarr;
  </a>
  <p style="margin-top:28px;color:#52525b;font-size:13px">
    Keep sharing your referral link to earn more free analyses.<br>
    Questions? <a href="https://declawed.app/contact" style="color:#14b8a6">Contact us</a>
  </p>
</div>`,
      }),
    }).catch(() => {});
  }

  return json({ ok: true });
}
