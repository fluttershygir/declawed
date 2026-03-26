// Shared utility for POST /api/summarize.
// Handles auth headers, fetch, JSON validation, status checks, and summary normalization.
// Returns { summary, modelTier, landlordMode, scorePercentile } on success, throws on error.
// Throws a special { paywall: true } error when the server responds 402.

import { supabase } from './supabase';

export async function callSummarize(payload) {
  const { text, imageBase64, imageMediaType, filename } = payload || {};

  // getSession() can stall if Supabase needs to refresh the token and the
  // network request hangs. Race it against a 10-second timeout so it can
  // never block the analysis indefinitely. On timeout we fall through as
  // anonymous (no auth header), which is the safest degradation.
  let session = null;
  try {
    const sessionResult = await Promise.race([
      supabase.auth.getSession(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('auth timeout')), 10000)),
    ]);
    session = sessionResult?.data?.session ?? null;
  } catch {
    session = null;
  }

  const headers = { 'Content-Type': 'application/json' };
  if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

  const bodyPayload = imageBase64
    ? { imageBase64, imageMediaType, filename, landlordMode: payload?.landlordMode }
    : { text, filename, landlordMode: payload?.landlordMode };

  const controller = new AbortController();
  // 65 s covers full round-trip (headers + body). The backend's own Anthropic
  // timeout is 55 s, so this gives 10 s of slack while still failing fast enough
  // that users don't wait forever when something goes wrong.
  const timeoutId = setTimeout(() => controller.abort(), 65000);

  try {
    const res = await fetch('/api/summarize', {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyPayload),
      signal: controller.signal,
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const raw = await res.text();
      console.error('[summarize] Non-JSON response:', raw.slice(0, 500));
      throw new Error(`CF error (HTTP ${res.status}): ${raw.replace(/<[^>]+>/g, '').trim().slice(0, 200)}`);
    }

    const data = await res.json();

    if (res.status === 402) {
      const err = new Error(data.error || 'Upgrade required.');
      err.paywall = true;
      throw err;
    }

    if (!res.ok || data.error) throw new Error(data.error || 'Something went wrong.');

    const raw = data.summary;
    const summary = (() => {
      if (!raw) return null;
      if (typeof raw === 'object') return raw;
      try { return JSON.parse(raw); } catch { return { _parseError: true }; }
    })();

    return {
      summary,
      modelTier: data.modelTier || null,
      landlordMode: !!data.landlordMode,
      scorePercentile: typeof data.scorePercentile === 'number' ? data.scorePercentile : null,
      shareToken: data.shareToken || null,
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Analysis timed out. Please try again — large documents can take longer.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
