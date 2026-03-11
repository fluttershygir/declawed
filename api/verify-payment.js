import Stripe from 'stripe';
import { createHmac, timingSafeEqual } from 'crypto';

const COOKIE_SECRET = process.env.COOKIE_SECRET || 'dev-secret-change-in-production';
const TIER_COOKIE = 'dcl_tier';

function sign(value) {
  return createHmac('sha256', COOKIE_SECRET).update(value).digest('base64url');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const { session_id } = body || {};
  if (!session_id) return res.status(400).json({ error: 'Missing session_id' });
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured.' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(session_id);
  } catch {
    return res.status(400).json({ error: 'Invalid session ID.' });
  }

  // Verify payment was actually completed — never trust the URL param alone
  if (session.payment_status !== 'paid' && session.status !== 'complete') {
    return res.status(402).json({ error: 'Payment not completed.' });
  }

  // Tier is stored in metadata server-side during checkout creation — not user-controllable
  const tier = session.metadata?.tier;
  if (!tier || !['one', 'pro', 'unlimited'].includes(tier)) {
    return res.status(400).json({ error: 'Unable to determine tier from session.' });
  }

  // Sign the tier value so it can't be forged in the cookie
  const cookieValue = `${tier}.${sign(tier)}`;

  // one-time: 10 year cookie (can't revoke without DB, but it's a one-time payment)
  // subscriptions: 35-day cookie (slightly beyond monthly billing cycle)
  const maxAge = tier === 'one' ? 60 * 60 * 24 * 365 * 10 : 60 * 60 * 24 * 35;

  res.setHeader('Set-Cookie',
    `${TIER_COOKIE}=${cookieValue}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}; Secure`
  );

  const tierLabels = { one: 'One Lease', pro: 'Pro', unlimited: 'Unlimited' };
  res.status(200).json({ ok: true, tier, label: tierLabels[tier] });
}
