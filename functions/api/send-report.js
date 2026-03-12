// POST /api/send-report — emails a lease analysis report to the user via Resend
// env: RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_FROM_EMAIL

const EMAIL_PLANS = new Set(['pro', 'unlimited']);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    return await handleRequest(request, env);
  } catch (e) {
    console.error('[send-report] Unhandled error:', e?.message ?? e);
    return json({ error: `Server error: ${e?.message ?? 'Unknown'}` }, 500);
  }
}

async function handleRequest(request, env) {
  if (!env.RESEND_API_KEY) return json({ error: 'Email service not configured.' }, 503);
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'DB not configured.' }, 503);

  // ── Auth check ──────────────────────────────────────────────────────
  const authHeader = request.headers.get('Authorization') || '';
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!jwt) return json({ error: 'Authentication required.' }, 401);

  const userData = await getUserFromJwt(jwt, env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  if (!userData?.id) return json({ error: 'Invalid session. Please sign in again.' }, 401);

  // ── Plan check ──────────────────────────────────────────────────────
  const profileRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userData.id}&select=plan`,
    { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } }
  );
  const profiles = await profileRes.json();
  const plan = profiles?.[0]?.plan || 'free';

  if (!EMAIL_PLANS.has(plan)) {
    return json({ error: 'Email reports require a Pro or Unlimited plan.' }, 402);
  }

  // ── Parse body ──────────────────────────────────────────────────────
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid request body.' }, 400); }

  const { to, analysisData, filename } = body || {};

  if (!to?.trim()) return json({ error: 'Recipient email is required.' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return json({ error: 'Invalid email address.' }, 400);
  if (to.length > 254) return json({ error: 'Email address too long.' }, 400);
  if (!analysisData || typeof analysisData !== 'object') return json({ error: 'Analysis data is required.' }, 400);

  const safeFilename = (filename || 'Untitled document').slice(0, 200);

  // ── Build + send ────────────────────────────────────────────────────
  const fromEmail = env.RESEND_FROM_EMAIL || 'noreply@declawed.app';
  const html = buildEmailHtml(analysisData, safeFilename);

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: `Declawed <${fromEmail}>`,
      to: to.trim(),
      subject: `Your Lease Analysis \u2014 ${safeFilename}`,
      html,
    }),
  });

  if (!resendRes.ok) {
    const err = await resendRes.text();
    console.error('[send-report] Resend error:', err);
    return json({ error: 'Failed to send email. Please try again.' }, 500);
  }

  return json({ ok: true });
}

async function getUserFromJwt(jwt, supabaseUrl, serviceRoleKey) {
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${jwt}`, apikey: serviceRoleKey },
  });
  if (!res.ok) return null;
  return res.json();
}

// ── HTML escape ────────────────────────────────────────────────────────
function h(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Email HTML builder ─────────────────────────────────────────────────
function buildEmailHtml(data, filename) {
  const score = data.score ?? null;
  const isRed    = score !== null && score <= 4;
  const isYellow = score !== null && score >= 5 && score <= 7;
  const isGreen  = score !== null && score >= 8;

  const scoreColor = isRed ? '#f43f5e' : isYellow ? '#f59e0b' : isGreen ? '#10b981' : '#94a3b8';
  const scoreBg    = isRed ? '#fff1f2' : isYellow ? '#fffbeb' : isGreen ? '#ecfdf5' : '#f8fafc';
  const scoreBdr   = isRed ? '#fda4af' : isYellow ? '#fcd34d' : isGreen ? '#6ee7b7' : '#e2e8f0';
  const scoreLabel = isRed ? 'Heavily favors landlord' : isYellow ? 'Somewhat unfavorable' : isGreen ? 'Tenant-friendly' : '';

  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const SEV_COLOR = { HIGH: '#f43f5e', MEDIUM: '#f59e0b', LOW: '#94a3b8' };
  const SEV_BG    = { HIGH: '#fff1f2', MEDIUM: '#fffbeb', LOW: '#f4f4f5' };
  const SEV_BDR   = { HIGH: '#fda4af', MEDIUM: '#fcd34d', LOW: '#e4e4e7' };

  // ── Section builder helpers ──────────────────────────────────────────
  const sectionWrap = (content) => `
    <div style="margin-bottom:24px">${content}</div>`;

  const sectionHead = (emoji, label, color) =>
    `<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #e2e8f0">
      <span style="font-size:15px">${emoji}</span>
      <span style="font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:${color}">${label}</span>
    </div>`;

  // ── Score hero ───────────────────────────────────────────────────────
  let scoreHtml = '';
  if (score !== null || data.verdict) {
    const numStr = score !== null ? `<span style="font-size:48px;font-weight:900;color:${scoreColor};line-height:1">${Math.max(1, Math.min(10, score))}</span><span style="font-size:13px;color:#94a3b8;margin-left:3px">/&nbsp;10</span>` : '';
    scoreHtml = sectionWrap(`
      <div style="background:${scoreBg};border:1.5px solid ${scoreBdr};border-radius:12px;padding:20px 24px;display:flex;align-items:center;gap:20px">
        ${score !== null ? `<div style="text-align:center;min-width:68px">${numStr}</div>` : ''}
        <div>
          ${score !== null ? `<div style="font-weight:700;font-size:13px;color:${scoreColor};margin-bottom:4px">Lease Score &middot; ${h(scoreLabel)}</div>` : ''}
          ${data.verdict ? `<div style="font-size:14px;color:#334155;line-height:1.55">${h(data.verdict)}</div>` : ''}
        </div>
      </div>`);
  }

  // ── Red flags ────────────────────────────────────────────────────────
  let redFlagsHtml = '';
  if (data.redFlags?.length > 0) {
    const items = data.redFlags.map(flag => {
      const text = typeof flag === 'string' ? flag : flag.text;
      const sev  = (typeof flag === 'string' ? 'MEDIUM' : (flag.severity || 'MEDIUM')).toUpperCase();
      const sc   = SEV_COLOR[sev] || SEV_COLOR.LOW;
      const sb   = SEV_BG[sev]    || SEV_BG.LOW;
      const sd   = SEV_BDR[sev]   || SEV_BDR.LOW;
      return `<tr>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;vertical-align:top">
          <div style="display:flex;align-items:flex-start;gap:10px">
            <div style="width:3px;min-height:18px;background:${sc};border-radius:3px;flex-shrink:0;margin-top:2px"></div>
            <span style="font-size:13px;color:#334155;line-height:1.55;flex:1">${h(text)}</span>
            <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;background:${sb};color:${sc};border:1px solid ${sd};border-radius:4px;padding:2px 6px;white-space:nowrap;flex-shrink:0">${h(sev)}</span>
          </div>
        </td>
      </tr>`;
    }).join('');
    redFlagsHtml = sectionWrap(sectionHead('🚩', 'Red Flags', '#f43f5e') + `<table style="width:100%;border-collapse:collapse;background:#fffafa;border:1px solid #ffd7d7;border-radius:10px;overflow:hidden">${items}</table>`);
  }

  // ── Key dates ────────────────────────────────────────────────────────
  let keyDatesHtml = '';
  if (data.keyDates?.length > 0) {
    const cells = data.keyDates.map(item =>
      `<td style="width:50%;padding:10px 12px;vertical-align:top">
        <div style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:8px;padding:10px 12px">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#0891b2;margin-bottom:3px">${h(item.label)}</div>
          <div style="font-size:13px;color:#334155;line-height:1.45">${h(item.value)}</div>
        </div>
      </td>`
    );
    // Pair into rows of 2
    const rows = [];
    for (let i = 0; i < cells.length; i += 2) {
      const pair = cells.slice(i, i + 2);
      if (pair.length === 1) pair.push('<td></td>');
      rows.push(`<tr>${pair.join('')}</tr>`);
    }
    keyDatesHtml = sectionWrap(sectionHead('📅', 'Key Dates', '#06b6d4') + `<table style="width:100%;border-collapse:separate;border-spacing:6px">${rows.join('')}</table>`);
  }

  // ── Tenant rights ────────────────────────────────────────────────────
  let rightsHtml = '';
  if (data.tenantRights?.length > 0) {
    const items = data.tenantRights.map(right =>
      `<tr><td style="padding:9px 14px;border-bottom:1px solid #d1fae5;vertical-align:top">
        <div style="display:flex;align-items:flex-start;gap:10px">
          <span style="color:#10b981;font-size:14px;flex-shrink:0;margin-top:1px">&#10003;</span>
          <span style="font-size:13px;color:#334155;line-height:1.55">${h(right)}</span>
        </div>
      </td></tr>`
    ).join('');
    rightsHtml = sectionWrap(sectionHead('✅', 'Your Rights', '#10b981') + `<table style="width:100%;border-collapse:collapse;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;overflow:hidden">${items}</table>`);
  }

  // ── Unusual clauses ──────────────────────────────────────────────────
  let unusualHtml = '';
  if (data.unusualClauses?.length > 0) {
    const items = data.unusualClauses.map(clause =>
      `<tr><td style="padding:9px 14px;border-bottom:1px solid #fef3c7;vertical-align:top">
        <div style="display:flex;align-items:flex-start;gap:10px">
          <span style="color:#f59e0b;font-size:13px;flex-shrink:0;margin-top:2px">&#9888;</span>
          <span style="font-size:13px;color:#334155;line-height:1.55">${h(clause)}</span>
        </div>
      </td></tr>`
    ).join('');
    unusualHtml = sectionWrap(sectionHead('⚠️', 'Unusual Clauses', '#f59e0b') + `<table style="width:100%;border-collapse:collapse;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;overflow:hidden">${items}</table>`);
  }

  // ── Action steps ─────────────────────────────────────────────────────
  let actionHtml = '';
  if (data.actionSteps?.length > 0) {
    const items = data.actionSteps.map((step, i) =>
      `<tr><td style="padding:10px 14px;border-bottom:1px solid #ccfbf1;vertical-align:top">
        <div style="display:flex;align-items:flex-start;gap:12px">
          <span style="width:22px;height:22px;border-radius:5px;border:1.5px solid #2dd4bf;background:#f0fdfa;color:#0d9488;font-size:11px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">${i + 1}</span>
          <span style="font-size:13px;color:#334155;line-height:1.55">${h(step)}</span>
        </div>
      </td></tr>`
    ).join('');
    actionHtml = sectionWrap(sectionHead('📋', 'What to Do Before Signing', '#0d9488') + `<table style="width:100%;border-collapse:collapse;background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;overflow:hidden">${items}</table>`);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Your Lease Analysis &mdash; ${h(filename)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:28px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

  <!-- Header -->
  <tr>
    <td style="background:linear-gradient(135deg,#0d9488 0%,#06b6d4 100%);padding:28px 32px">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <div style="display:inline-flex;align-items:center;gap:10px">
              <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:8px;display:inline-flex;align-items:center;justify-content:center">
                <span style="font-size:18px">&#128274;</span>
              </div>
              <div>
                <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.3px">Declawed</div>
                <div style="font-size:11px;color:rgba(255,255,255,0.8);margin-top:1px">AI Lease Analysis Report</div>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Document info bar -->
  <tr>
    <td style="background:#f8fafc;padding:14px 32px;border-bottom:1px solid #e2e8f0">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:12px;color:#64748b">
            <strong style="color:#334155">Lease:</strong>&nbsp;${h(filename)}
          </td>
          <td align="right" style="font-size:12px;color:#64748b">
            <strong style="color:#334155">Date:</strong>&nbsp;${h(today)}
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="padding:28px 32px">
      ${scoreHtml}
      ${redFlagsHtml}
      ${keyDatesHtml}
      ${rightsHtml}
      ${unusualHtml}
      ${actionHtml}
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px">
      <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;line-height:1.6">
        Generated by <strong style="color:#0d9488">Declawed AI</strong> &mdash;
        <a href="https://declawed.app" style="color:#0d9488;text-decoration:none">declawed.app</a>
        &mdash; <strong>Not legal advice.</strong> Always consult a licensed attorney for legal questions.
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
