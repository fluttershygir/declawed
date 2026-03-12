// Cloudflare Pages Function — POST /api/checkout
// Creates a Stripe Checkout Session — no SDK, raw fetch + form-encoding.
// env: STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const TIERS = {
  one: {
    name: 'Declawed — One Lease',
    amount: 399,
    mode: 'payment',
    plan: 'one',
    limit: 1,
  },
  pro: {
    name: 'Declawed Pro',
    amount: 1200,
    mode: 'subscription',
    plan: 'pro',
    limit: 10,
  },
  unlimited: {
    name: 'Declawed Unlimited',
    amount: 2900,
    mode: 'subscription',
    plan: 'unlimited',
    limit: 9999,
  },
};

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
  if (!env.STRIPE_SECRET_KEY) return json({ error: 'Payments not configured.' }, 503);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }

  const { tier } = body || {};
  const tierConfig = TIERS[tier];
  if (!tierConfig) return json({ error: 'Invalid tier.' }, 400);

  // Get user ID from JWT (required — anonymous users must sign in first)
  const authHeader = request.headers.get('Authorization') || '';
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const userId = await getUserIdFromJwt(jwt, env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  if (!userId) return json({ error: 'Sign in required to purchase.' }, 401);

  const origin = request.headers.get('Origin') || 'https://declawed.app';
  const successUrl = `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}&tier=${tier}`;
  const cancelUrl = origin;

  // Build form-encoded params for Stripe
  const params = new URLSearchParams({
    mode: tierConfig.mode,
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][product_data][name]': tierConfig.name,
    'line_items[0][price_data][unit_amount]': String(tierConfig.amount),
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: userId,
    'metadata[tier]': tier,
    'metadata[plan]': tierConfig.plan,
    'metadata[limit]': String(tierConfig.limit),
    'metadata[user_id]': userId,
  });

  if (tierConfig.mode === 'subscription') {
    params.set('line_items[0][price_data][recurring][interval]', 'month');
  }

  const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!stripeRes.ok) {
    const err = await stripeRes.text();
    console.error('Stripe error:', err);
    return json({ error: 'Failed to create checkout session.' }, 502);
  }

  const session = await stripeRes.json();
  return json({ url: session.url });
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
