export default function handler(req, res) {
  // Usage tracking is stateless on Vercel serverless — return a stub.
  // Wire up a DB (e.g. Upstash Redis) here when you add paid tiers.
  res.status(200).json({ used: 0, limit: 1, plan: 'free' });
}
