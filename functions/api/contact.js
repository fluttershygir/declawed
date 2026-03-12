// POST /api/contact — sends a support email via Resend
// env: RESEND_API_KEY, SUPPORT_EMAIL, RESEND_FROM_EMAIL

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }

  const { name, email, message } = body || {};

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return json({ error: 'Name, email, and message are required.' }, 400);
  }

  // Basic email format validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Invalid email address.' }, 400);
  }

  // Limit field lengths to prevent abuse
  if (name.length > 200 || email.length > 254 || message.length > 5000) {
    return json({ error: 'Input too long.' }, 400);
  }

  if (!env.RESEND_API_KEY) {
    return json({ error: 'Email service not configured.' }, 503);
  }

  const fromEmail = env.RESEND_FROM_EMAIL || 'noreply@declawed.app';
  const toEmail = env.SUPPORT_EMAIL || 'support@declawed.app';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: `Declawed Support <${fromEmail}>`,
      to: toEmail,
      reply_to: email,
      subject: `[Support] ${name.slice(0, 80)}`,
      html: `<div style="font-family:system-ui,sans-serif;max-width:600px">
        <h3 style="margin:0 0 16px">New support message</h3>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Message:</strong></p>
        <blockquote style="border-left:3px solid #ccc;margin:0;padding:8px 16px;color:#555">
          ${escapeHtml(message).replace(/\n/g, '<br>')}
        </blockquote>
      </div>`,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Resend contact error:', err);
    return json({ error: 'Failed to send message. Please try again.' }, 500);
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

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
