// Cloudflare Pages Function — POST /api/verify-payment
// Fallback for when the Stripe webhook hasn't fired yet.
// Retrieves the checkout session from Stripe, verifies payment, and upgrades the user's plan.
// env: STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const PLAN_LIMITS = { one: 3, pro: 15, unlimited: 9999 };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function upgradeUserPlan(userId, plan, supabaseUrl, serviceKey, stripeCustomerId = null) {
  const limit = PLAN_LIMITS[plan] ?? 1;
  const body = { plan, analyses_limit: limit, analyses_used: 0 };
  if (stripeCustomerId) body.stripe_customer_id = stripeCustomerId;
  await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.STRIPE_SECRET_KEY) return json({ error: 'Payments not configured.' }, 503);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }

  const { session_id } = body || {};
  if (!session_id || !/^cs_[a-zA-Z0-9_]+$/.test(session_id)) {
    return json({ error: 'Invalid session_id.' }, 400);
  }

  // Retrieve the checkout session from Stripe
  const stripeRes = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${session_id}`,
    { headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` } }
  );

  if (!stripeRes.ok) return json({ error: 'Could not retrieve session.' }, 400);

  const session = await stripeRes.json();

  if (session.payment_status !== 'paid') {
    return json({ error: 'Payment not completed.' }, 402);
  }

  const userId = session.metadata?.user_id || session.client_reference_id;
  const plan = session.metadata?.plan;
  const stripeCustomerId = session.customer || null;

  if (userId && plan && env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    await upgradeUserPlan(userId, plan, env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, stripeCustomerId);
  }

  return json({ ok: true, plan: plan || 'unknown' });
}
