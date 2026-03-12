// POST /api/refund — processes a Stripe refund within the 7-day window
// Eligibility:
//   one plan:          analyses_used === 0  (analysis not yet used)
//   pro/unlimited:     analyses_used < 3    (fewer than 3 analyses used)
// env: STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
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

async function stripeGet(path, secretKey) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  if (!res.ok) return null;
  return res.json();
}

async function stripePost(path, secretKey, params) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params),
  });
  return res;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.STRIPE_SECRET_KEY) return json({ error: 'Payments not configured.' }, 503);
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'DB not configured.' }, 503);

  const authHeader = request.headers.get('Authorization') || '';
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!jwt) return json({ error: 'Authentication required.' }, 401);

  const userData = await getUserFromJwt(jwt, env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  if (!userData?.id) return json({ error: 'Invalid session.' }, 401);

  const userId = userData.id;

  // Fetch user profile
  const profileRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=plan,analyses_used`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );
  const profiles = await profileRes.json();
  const profile = profiles?.[0];

  if (!profile || profile.plan === 'free') {
    return json({ error: 'No active paid plan to refund.' }, 400);
  }

  const { plan, analyses_used: analysesUsed = 0 } = profile;
  const isSubscription = ['pro', 'unlimited'].includes(plan);

  // Check usage eligibility
  if (plan === 'one' && analysesUsed > 0) {
    return json({
      error: 'analysis_used',
      message: 'Your analysis has already been used. Contact support for disputes.',
    }, 400);
  }
  if (isSubscription && analysesUsed >= 3) {
    return json({
      error: 'analysis_limit',
      message: 'You have used 3 or more analyses this period. Contact support for disputes.',
    }, 400);
  }

  // Find the most recent Stripe checkout session for this user within 7 days
  const sevenDaysAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;
  const sessionsData = await stripeGet(
    `/checkout/sessions?client_reference_id=${encodeURIComponent(userId)}&limit=10`,
    env.STRIPE_SECRET_KEY
  );
  if (!sessionsData) return json({ error: 'Could not retrieve payment history.' }, 500);

  const session = sessionsData.data?.find(
    (s) => s.payment_status === 'paid' && s.metadata?.plan === plan && s.created > sevenDaysAgo
  );

  if (!session) {
    return json({
      error: 'outside_window',
      message: 'No refundable payment found within the 7-day window. Contact support for help.',
    }, 400);
  }

  // Process refund based on session mode
  if (session.mode === 'payment') {
    // One-time payment: refund via charge
    if (!session.payment_intent) return json({ error: 'Payment record not found.' }, 500);
    const pi = await stripeGet(`/payment_intents/${session.payment_intent}`, env.STRIPE_SECRET_KEY);
    if (!pi?.latest_charge) return json({ error: 'Charge not found.' }, 500);

    const refundRes = await stripePost('/refunds', env.STRIPE_SECRET_KEY, { charge: pi.latest_charge });
    if (!refundRes.ok) {
      const err = await refundRes.text();
      console.error('Stripe refund error:', err);
      return json({ error: 'Refund processing failed. Contact support.' }, 500);
    }
  } else {
    // Subscription: cancel immediately and refund latest invoice
    const subId = session.subscription;
    if (!subId) return json({ error: 'Subscription not found.' }, 500);

    // Cancel the subscription
    await fetch(`https://api.stripe.com/v1/subscriptions/${subId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
    });

    // Refund the latest invoice charge
    const invoicesData = await stripeGet(
      `/invoices?subscription=${subId}&limit=1`,
      env.STRIPE_SECRET_KEY
    );
    const invoice = invoicesData?.data?.[0];
    if (invoice?.charge) {
      const refundRes = await stripePost('/refunds', env.STRIPE_SECRET_KEY, { charge: invoice.charge });
      if (!refundRes.ok) {
        const err = await refundRes.text();
        console.error('Stripe subscription refund error:', err);
        return json({ error: 'Refund processing failed. Contact support.' }, 500);
      }
    }
  }

  // Revert user to free plan in Supabase
  await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ plan: 'free', analyses_limit: 1, analyses_used: 0 }),
  });

  return json({ ok: true });
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
