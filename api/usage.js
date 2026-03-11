import { createHmac, timingSafeEqual } from 'crypto';

const COOKIE_NAME = 'dcl_free_used';
const TIER_COOKIE  = 'dcl_tier';
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'dev-secret-change-in-production';

function sign(value) {
  return createHmac('sha256', COOKIE_SECRET).update(value).digest('base64url');
}

function verifySignedCookie(raw) {
  if (!raw || !raw.includes('.')) return false;
  const lastDot = raw.lastIndexOf('.');
  const value = raw.slice(0, lastDot);
  const sig = raw.slice(lastDot + 1);
  const expected = sign(value);
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export default function handler(req, res) {
  const header = req.headers.cookie || '';
  const cookies = Object.fromEntries(
    header.split(';').map(s => s.trim().split('=').map(decodeURIComponent))
  );

  // Check for a valid paid-tier cookie first
  const rawTier = cookies[TIER_COOKIE] || '';
  if (verifySignedCookie(rawTier)) {
    const tier = rawTier.slice(0, rawTier.lastIndexOf('.'));
    return res.status(200).json({ used: 0, limit: Infinity, plan: tier });
  }

  const used = verifySignedCookie(cookies[COOKIE_NAME]) ? 1 : 0;
  res.status(200).json({ used, limit: 1, plan: 'free' });
}
