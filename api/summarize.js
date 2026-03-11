import Anthropic from '@anthropic-ai/sdk';
import { IncomingForm } from 'formidable';
import { readFileSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

export const config = { api: { bodyParser: false } };

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

    res.status(200).json({ summary: analysis });
  } catch (err) {
    console.error('Summarize error:', err);
    res.status(500).json({ error: err.message || 'Failed to analyze document.' });
  }
}
