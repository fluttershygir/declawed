// POST /api/welcome-email — sends a welcome email to a new signup via Resend
// Called fire-and-forget from the client after successful signup.
// env: RESEND_API_KEY, RESEND_FROM_EMAIL

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // Silently no-op if email service not configured
  if (!env.RESEND_API_KEY) return json({ ok: true });

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }

  const { email } = body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Valid email required.' }, 400);
  }

  const fromEmail = env.RESEND_FROM_EMAIL || 'noreply@declawed.app';

  // Fire welcome email — failures are logged but don't surface to the user
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `Declawed <${fromEmail}>`,
        to: email,
        subject: "Welcome to Declawed \u2014 here's how to get started",
        html: `<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0f0f0f;color:#e4e4e7">
  <h2 style="color:#14b8a6;margin:0 0 16px">Welcome to Declawed &#x1F44B;</h2>
  <p style="color:#a1a1aa">Thanks for signing up. Here&rsquo;s how to get the most out of it:</p>
  <ol style="color:#d4d4d8;line-height:1.8">
    <li><strong>Upload your lease</strong> &mdash; PDF, .docx, or even a photo of it.</li>
    <li><strong>Get your Lease Score</strong> &mdash; a 1&ndash;10 rating plus plain-English red flags and key dates.</li>
    <li><strong>Review action steps</strong> &mdash; specific things to negotiate before you sign.</li>
  </ol>
  <p style="color:#a1a1aa">Your first analysis is free. No credit card needed.</p>
  <a href="https://declawed.app/#upload"
     style="display:inline-block;background:#14b8a6;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">
    Analyze a lease now &rarr;
  </a>
  <p style="margin-top:32px;color:#52525b;font-size:13px">
    Questions? Reply to this email or visit
    <a href="https://declawed.app/contact" style="color:#14b8a6">declawed.app/contact</a>
  </p>
</div>`,
      }),
    });
  } catch (e) {
    console.error('welcome-email send error:', e?.message);
  }

  return json({ ok: true });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
