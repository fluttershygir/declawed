import Anthropic from '@anthropic-ai/sdk';
import { IncomingForm } from 'formidable';
import { readFileSync } from 'fs';
import { createRequire } from 'module';
import { createHmac, timingSafeEqual } from 'crypto';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

export const config = { api: { bodyParser: false } };

// ── Cookie-based free-tier protection ────────────────────────────────────────
// The cookie value is HMAC-signed with COOKIE_SECRET so it cannot be forged.
// HttpOnly prevents JS from reading or deleting it.

const COOKIE_NAME = 'dcl_free_used';
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'dev-secret-change-in-production';

function sign(value) {
  return createHmac('sha256', COOKIE_SECRET).update(value).digest('base64url');
}

function makeSignedCookie(value) {
  return `${value}.${sign(value)}`;
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

function parseCookies(req) {
  const header = req.headers.cookie || '';
  return Object.fromEntries(
    header.split(';').map(s => s.trim().split('=').map(decodeURIComponent))
  );
}

function hasUsedFreeTier(req) {
  const cookies = parseCookies(req);
  return verifySignedCookie(cookies[COOKIE_NAME]);
}

function setFreeTierUsedCookie(res) {
  const signed = makeSignedCookie('1');
  const oneYear = 60 * 60 * 24 * 365;
  res.setHeader('Set-Cookie',
    `${COOKIE_NAME}=${signed}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${oneYear}; Secure`
  );
}

const SYSTEM_PROMPT = `You are a tenant-friendly legal document analyzer. Read the lease or contract and return a JSON object with exactly these keys:

{
  "redFlags": ["string"],
  "keyDates": [{"label": "string", "value": "string"}],
  "tenantRights": ["string"],
  "unusualClauses": ["string"],
  "verdict": "string"
}

redFlags: 3–6 specific clauses that could harm the tenant. Be direct and concrete.
keyDates: All important dates/deadlines found in the document (move-in, notice periods, renewal, etc.).
tenantRights: 3–5 rights the tenant explicitly has under this lease.
unusualClauses: Clauses that are atypical, one-sided, or potentially unenforceable.
verdict: 1–2 sentence plain-English bottom line for the tenant.

Respond with only valid JSON. No markdown, no explanation outside the JSON.`;

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ maxFileSize: 10 * 1024 * 1024 });
    form.parse(req, (err, _fields, files) => {
      if (err) reject(err);
      else resolve(files);
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check whether the visitor has already used their free analysis.
  // The signed HttpOnly cookie can't be forged or deleted by JS.
  const alreadyUsedFree = hasUsedFreeTier(req);
  if (alreadyUsedFree) {
    return res.status(402).json({ error: 'Free analysis already used. Please upgrade to continue.' });
  }

  try {
    const files = await parseForm(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const allowed = ['application/pdf', 'text/plain'];
    if (!allowed.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Only PDF and .txt files are supported.' });
    }

    let text = '';
    const buffer = readFileSync(file.filepath);

    if (file.mimetype === 'application/pdf') {
      const parsed = await pdfParse(buffer);
      text = parsed.text;
    } else {
      text = buffer.toString('utf-8');
    }

    if (!text.trim()) {
      return res.status(400).json({ error: 'Could not extract text from the file.' });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: `Analyze this lease:\n\n${text.slice(0, 20000)}` },
      ],
    });

    const raw = message.content[0].text;
    let analysis;
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      analysis = JSON.parse(match ? match[0] : raw);
    } catch {
      analysis = { verdict: raw, redFlags: [], keyDates: [], tenantRights: [], unusualClauses: [] };
    }

    // Mark free tier as used — HttpOnly signed cookie, can't be cleared by JS
    setFreeTierUsedCookie(res);
    res.status(200).json({ summary: analysis });
  } catch (err) {
    console.error('Summarize error:', err);
    res.status(500).json({ error: err.message || 'Failed to analyze document.' });
  }
}
