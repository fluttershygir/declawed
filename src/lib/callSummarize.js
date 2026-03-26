// Shared utility for POST /api/summarize.
// Handles auth headers, fetch, JSON validation, status checks, and summary normalization.
// Returns { summary, modelTier, landlordMode, scorePercentile } on success, throws on error.
// Throws a special { paywall: true } error when the server responds 402.

import { supabase } from './supabase';

export async function callSummarize(payload) {
  const { text, imageBase64, imageMediaType, filename } = payload || {};

  const { data: { session } } = await supabase.auth.getSession();
  const headers = { 'Content-Type': 'application/json' };
  if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

  const bodyPayload = imageBase64
    ? { imageBase64, imageMediaType, filename, landlordMode: payload?.landlordMode }
    : { text, filename, landlordMode: payload?.landlordMode };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout

  let res;
  try {
    res = await fetch('/api/summarize', {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyPayload),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Analysis timed out. Please try again — large documents can take longer.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

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
}
