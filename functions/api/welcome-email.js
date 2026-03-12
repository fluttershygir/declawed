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
        subject: 'Welcome to Declawed — your lease analyzer is ready',
        html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0f;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background-color:#111118;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0d9488,#06b6d4);padding:28px 32px;text-align:center;">
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
              <td style="width:40px;height:40px;background:rgba(255,255,255,0.15);border-radius:10px;text-align:center;vertical-align:middle;"></td>
              <td style="padding-left:10px;vertical-align:middle;"><span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Declawed</span></td>
            </tr></table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 32px;">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Welcome aboard &#x1F44B;</h1>
            <p style="margin:0 0 20px;font-size:15px;color:#a1a1aa;line-height:1.6;">
              Your free Declawed account is ready. Upload any lease and get a full plain-English breakdown in under 30 seconds — red flags, key dates, and exactly what to negotiate before signing.
            </p>
            <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:28px;border:1px solid rgba(255,255,255,0.07);border-radius:12px;overflow:hidden;">
              <tr><td style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.05);">
                <span style="font-size:14px;color:#e4e4e7;"><strong style="color:#0d9488;">1.</strong>&nbsp; Upload your lease — PDF, Word doc, or a photo.</span>
              </td></tr>
              <tr><td style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.05);">
                <span style="font-size:14px;color:#e4e4e7;"><strong style="color:#0d9488;">2.</strong>&nbsp; Get your Lease Score (1–10) with a plain-English verdict.</span>
              </td></tr>
              <tr><td style="padding:14px 16px;">
                <span style="font-size:14px;color:#e4e4e7;"><strong style="color:#0d9488;">3.</strong>&nbsp; Review action steps — what to fix before you sign.</span>
              </td></tr>
            </table>
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="background-color:#0d9488;border-radius:10px;">
                <a href="https://declawed.app/#upload"
                   style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#000000;text-decoration:none;letter-spacing:-0.1px;">
                  Analyze your lease now &rarr;
                </a>
              </td>
            </tr></table>
            <p style="margin:24px 0 0;font-size:13px;color:#52525b;line-height:1.6;">
              Your first analysis is completely free. No credit card needed.<br />
              Questions? <a href="https://declawed.app/contact" style="color:#0d9488;text-decoration:none;">Contact us</a> any time.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;font-size:12px;color:#3f3f46;text-align:center;">
              Declawed &middot; AI-powered lease analysis &middot;
              <a href="https://declawed.app" style="color:#0d9488;text-decoration:none;">declawed.app</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
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
