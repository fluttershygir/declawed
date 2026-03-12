// Cloudflare Pages Function — POST /api/create-portal-session
// Creates a Stripe billing portal session for the authenticated user.
// Looks up stripe_customer_id from the profiles table; falls back to
// searching Stripe customers by email if not stored.
// env: STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

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

async function searchStripeCustomerByEmail(email, secretKey) {
  // Stripe customer search — finds existing customer by email
  const res = await fetch(
    `https://api.stripe.com/v1/customers/search?query=email%3A%27${encodeURIComponent(email)}%27&limit=1`,
    { headers: { Authorization: `Bearer ${secretKey}` } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data?.data?.[0]?.id || null;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.STRIPE_SECRET_KEY)
    return json({ error: 'Payments not configured.' }, 503);
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY)
    return json({ error: 'Database not configured.' }, 503);

  const authHeader = request.headers.get('Authorization') || '';
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!jwt) return json({ error: 'Authentication required.' }, 401);

  const userData = await getUserFromJwt(jwt, env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  if (!userData?.id) return json({ error: 'Invalid session.' }, 401);

  const userId = userData.id;
  const email  = userData.email;

  // Try to get stripe_customer_id from the profiles table
  const profileRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=stripe_customer_id`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );
  const profiles  = await profileRes.json().catch(() => []);
  let customerId  = profiles?.[0]?.stripe_customer_id || null;

  // Fall back: search Stripe by email
  if (!customerId && email) {
    customerId = await searchStripeCustomerByEmail(email, env.STRIPE_SECRET_KEY);
  }

  if (!customerId) {
    return json(
      { error: 'No Stripe customer record found. Please contact support at support@declawed.app.' },
      404
    );
  }

  const origin    = request.headers.get('Origin') || 'https://declawed.app';
  const returnUrl = `${origin}/billing`;

  // Create billing portal session
  const portalRes = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      customer:   customerId,
      return_url: returnUrl,
    }),
  });

  if (!portalRes.ok) {
    const err = await portalRes.json().catch(() => ({}));
    const msg = err?.error?.message || 'Failed to create portal session.';
    return json({ error: msg }, 500);
  }

  const portal = await portalRes.json();
  return json({ url: portal.url });
}
