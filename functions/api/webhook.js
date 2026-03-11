// Cloudflare Pages Function — POST /api/webhook
// Receives Stripe webhook events. Verifies signature using crypto.subtle (no SDK).
// env: STRIPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const PLAN_LIMITS = { one: 1, pro: 10, unlimited: 9999 };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function verifyStripeSignature(rawBody, header, secret) {
  const enc = new TextEncoder();
  const parts = header.split(',');
  const tPart = parts.find(p => p.startsWith('t='));
  const v1Part = parts.find(p => p.startsWith('v1='));
  if (!tPart || !v1Part) return false;

  const timestamp = tPart.slice(2);
  const expectedSig = v1Part.slice(3);

  // Reject events older than 5 minutes
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) return false;

  const payload = `${timestamp}.${rawBody}`;
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  const computed = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return computed === expectedSig;
}

async function upgradeUserPlan(userId, plan, supabaseUrl, serviceKey) {
  const limit = PLAN_LIMITS[plan] ?? 1;
  await fetch(`${supabaseUrl}/rest/v1/rpc/upgrade_user_plan`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: userId, new_plan: plan, new_limit: limit }),
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.STRIPE_WEBHOOK_SECRET) return json({ error: 'Webhook not configured.' }, 503);

  const rawBody = await request.text();
  const sig = request.headers.get('stripe-signature') || '';

  const valid = await verifyStripeSignature(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
  if (!valid) return json({ error: 'Invalid signature.' }, 400);

  let event;
  try { event = JSON.parse(rawBody); } catch { return json({ error: 'Invalid JSON.' }, 400); }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.user_id || session.client_reference_id;
    const plan = session.metadata?.plan;

    if (userId && plan && env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
      await upgradeUserPlan(userId, plan, env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    }
  }

  // Handle subscription cancellations — revert to free
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    // customer_reference_id isn't on subscription objects, so we look up via metadata if present
    const userId = sub.metadata?.user_id;
    if (userId && env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
      await upgradeUserPlan(userId, 'free', env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    }
  }

  return json({ received: true });
}
