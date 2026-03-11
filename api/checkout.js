import Stripe from 'stripe';

// Map tier keys to Stripe Price IDs (set in env vars)
const PRICES = {
  one:       process.env.STRIPE_PRICE_ONE,
  pro:       process.env.STRIPE_PRICE_PRO,
  unlimited: process.env.STRIPE_PRICE_UNLIMITED,
};

// one-time payment vs recurring subscription
const MODES = {
  one:       'payment',
  pro:       'subscription',
  unlimited: 'subscription',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  let body = req.body;
  // Vercel serverless functions parse JSON body automatically, but guard just in case
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const { tier } = body || {};

  if (!tier || !PRICES[tier]) {
    return res.status(400).json({ error: 'Invalid tier' });
  }
  if (!PRICES[tier] || !PRICES[tier].startsWith('price_')) {
    return res.status(500).json({ error: 'Stripe price not configured for this tier.' });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured.' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const origin = req.headers.origin || 'https://www.declawed.app';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: MODES[tier],
      line_items: [{ price: PRICES[tier], quantity: 1 }],
      // Store tier in metadata so verify-payment can read it server-side (user can't tamper)
      metadata: { tier },
      success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}&tier=${tier}`,
      cancel_url:  `${origin}/?checkout=cancelled`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: err.message || 'Failed to create checkout session.' });
  }
}
