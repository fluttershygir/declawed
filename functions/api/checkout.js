// Cloudflare Pages Function — POST /api/checkout
// Stripe integration — wired up after Supabase is confirmed working.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost(context) {
  const { env } = context;
  if (!env.STRIPE_SECRET_KEY) return json({ error: 'Payments not yet configured.' }, 503);

  // Full Stripe integration coming soon
  return json({ error: 'Payments not yet configured.' }, 503);
}
