// Generates a 1080×1080 PNG "lease score card" for social sharing.
// Returns a canvas element. Call canvas.toBlob() or canvas.toDataURL() to export.

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length >= 2) break;
    } else {
      line = test;
    }
  }
  if (line && lines.length < 2) lines.push(line);
  // Add ellipsis if verdict was truncated
  if (lines.length === 2) {
    const usedWords = lines.join(' ').split(' ').length;
    if (usedWords < text.split(' ').length) {
      lines[1] = lines[1].replace(/\s*\S+$/, '…');
    }
  }
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export function generateShareImage({ data }) {
  const W = 1080;
  const H = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const score = typeof data?.score === 'number' ? Math.max(1, Math.min(10, data.score)) : null;
  const verdict = data?.verdict || '';
  const redFlagCount = data?.redFlags?.length ?? 0;
  const highCount = (data?.redFlags || []).filter(
    f => (typeof f === 'string' ? 'MEDIUM' : (f.severity ?? 'MEDIUM')) === 'HIGH'
  ).length;
  const keyDateCount = data?.keyDates?.length ?? 0;

  const isRed    = score !== null && score <= 4;
  const isAmber  = score !== null && score >= 5 && score <= 7;
  const isGreen  = score !== null && score >= 8;

  const accent       = isRed ? '#fb7185' : isAmber ? '#fbbf24' : isGreen ? '#4ade80' : '#60a5fa';
  const accentDim    = isRed ? 'rgba(251,113,133,0.10)' : isAmber ? 'rgba(251,191,36,0.10)' : isGreen ? 'rgba(74,222,128,0.10)' : 'rgba(96,165,250,0.10)';
  const accentBorder = isRed ? 'rgba(251,113,133,0.28)' : isAmber ? 'rgba(251,191,36,0.28)' : isGreen ? 'rgba(74,222,128,0.28)' : 'rgba(96,165,250,0.28)';
  const glowColor    = isRed ? 'rgba(220,38,38,0.12)'   : isAmber ? 'rgba(217,119,6,0.12)'  : isGreen ? 'rgba(52,211,153,0.12)' : 'rgba(74,127,203,0.12)';
  const scoreLabel   = isRed ? 'Heavily favors landlord' : isAmber ? 'Somewhat unfavorable' : isGreen ? 'Tenant-friendly' : 'Lease analyzed';

  const SF = 'system-ui, -apple-system, Helvetica Neue, Arial, sans-serif';

  // ── Background ──────────────────────────────────────────
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, W, H);

  // Radial glow behind score
  const grd = ctx.createRadialGradient(W / 2, 480, 0, W / 2, 480, 460);
  grd.addColorStop(0, glowColor);
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  // Outer border inset
  roundRect(ctx, 40, 40, W - 80, H - 80, 32);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ── DECLAWED wordmark ────────────────────────────────────
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `700 30px ${SF}`;
  ctx.fillStyle = 'rgba(255,255,255,0.20)';
  ctx.fillText('DECLAWED', W / 2, 112);

  // Thin rule below wordmark
  ctx.beginPath();
  ctx.moveTo(W / 2 - 48, 130);
  ctx.lineTo(W / 2 + 48, 130);
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── "LEASE RISK SCORE" label ─────────────────────────────
  ctx.font = `700 24px ${SF}`;
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.fillText('LEASE RISK SCORE', W / 2, 200);

  // ── Score number ─────────────────────────────────────────
  if (score !== null) {
    // Score number — massive
    ctx.font = `900 320px ${SF}`;
    ctx.fillStyle = accent;
    ctx.fillText(String(score), W / 2, 560);

    // "/10"
    ctx.font = `500 58px ${SF}`;
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillText('/ 10', W / 2, 630);

    // Score label pill
    const labelText = scoreLabel;
    ctx.font = `700 34px ${SF}`;
    const lw = ctx.measureText(labelText).width;
    const pillW = lw + 56;
    const pillH = 54;
    const pillX = W / 2 - pillW / 2;
    const pillY = 660;
    roundRect(ctx, pillX, pillY, pillW, pillH, 27);
    ctx.fillStyle = accentDim;
    ctx.fill();
    ctx.strokeStyle = accentBorder;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.fillText(labelText, W / 2, pillY + 38);
  } else {
    ctx.font = `600 56px ${SF}`;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText('Lease Analyzed', W / 2, 540);
  }

  // ── Verdict snippet ──────────────────────────────────────
  if (verdict) {
    ctx.font = `400 30px ${SF}`;
    ctx.fillStyle = 'rgba(180,195,215,0.65)';
    const lines = wrapText(ctx, verdict, W - 180);
    const startY = score !== null ? 760 : 640;
    lines.forEach((l, i) => ctx.fillText(l, W / 2, startY + i * 46));
  }

  // ── Stats chips ──────────────────────────────────────────
  ctx.font = `600 26px ${SF}`;
  const chip1Label = `${redFlagCount} red flag${redFlagCount !== 1 ? 's' : ''}`;
  const chip2Label = highCount > 0 ? `${highCount} HIGH severity` : `${keyDateCount} key date${keyDateCount !== 1 ? 's' : ''}`;

  const chipH = 50;
  const chipPadX = 28;
  const chipGap = 18;
  const c1W = ctx.measureText(chip1Label).width + chipPadX * 2;
  const c2W = ctx.measureText(chip2Label).width + chipPadX * 2;
  const totalChips = c1W + c2W + chipGap;
  const chipsY = score !== null ? (verdict ? 870 : 790) : 720;
  const c1X = W / 2 - totalChips / 2;
  const c2X = c1X + c1W + chipGap;

  for (const [x, w, label] of [[c1X, c1W, chip1Label], [c2X, c2W, chip2Label]]) {
    roundRect(ctx, x, chipsY, w, chipH, 25);
    ctx.fillStyle = accentDim;
    ctx.fill();
    ctx.strokeStyle = accentBorder;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, chipsY + 33);
  }

  // ── Footer ───────────────────────────────────────────────
  ctx.font = `500 26px ${SF}`;
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.fillText('declawed.app', W / 2, H - 56);

  return canvas;
}

export function downloadShareImage(canvas, filename = 'lease-score.png') {
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

export async function shareOrDownloadImage(canvas, { score, shareUrl }) {
  const filename = `lease-score-${score ?? 'report'}.png`;

  // Try Web Share API with file (supported on iOS Safari, Android Chrome)
  if (navigator.canShare) {
    try {
      const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `My lease scored ${score ?? '?'}/10 — Declawed`,
          text: shareUrl ? `See the full analysis → ${shareUrl}` : 'Analyzed with Declawed',
        });
        return 'shared';
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        // Fall through to download
      } else {
        return 'cancelled';
      }
    }
  }

  // Fallback: download the PNG
  downloadShareImage(canvas, filename);
  return 'downloaded';
}
