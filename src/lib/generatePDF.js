import { jsPDF } from 'jspdf';

/**
 * Generates and saves a Declawed lease analysis PDF report.
 * @param {{ data: object, filename: string, analysisDate?: Date|string, userName?: string }} opts
 */
export function generatePDF({ data, filename, analysisDate, userName }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const PW = 210;
  const PH = 297;
  const M = 18;               // left/right margin
  const CW = PW - M * 2;     // content width
  const FOOTER_Y = PH - 12;  // y-position of the footer line

  let y = 0;

  // ── Palette ──────────────────────────────────────────────────────────
  const teal      = [13, 148, 136];
  const tealDk    = [9, 115, 106];
  const cyan      = [6, 182, 212];
  const rose      = [244, 63, 94];
  const amber     = [245, 158, 11];
  const emerald   = [16, 185, 129];
  const slate800  = [30, 41, 59];
  const slate700  = [51, 65, 85];
  const slate500  = [100, 116, 139];
  const slate400  = [148, 163, 184];
  const slate300  = [203, 213, 225];
  const slate50   = [248, 250, 252];
  const white     = [255, 255, 255];

  // ── Helpers ──────────────────────────────────────────────────────────

  /** Add a new page and reset y to top content area. */
  function addPage() {
    doc.addPage();
    y = 22;
  }

  /**
   * Ensure `needed` mm of space remain before the footer.
   * If not, start a new page.
   */
  function needSpace(needed) {
    if (y + needed > FOOTER_Y - 6) addPage();
  }

  /** Draw a coloured left-bar + bold label + separator. */
  function sectionHead(label, color) {
    needSpace(30); // room for header + at least one item
    doc.setFillColor(...color);
    doc.rect(M, y, 2.5, 7, 'F');
    doc.setTextColor(...color);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(label, M + 6, y + 5.5);
    // faint separator line
    doc.setDrawColor(...color.map(c => Math.min(255, c + 120)));
    doc.setLineWidth(0.25);
    doc.line(M, y + 8.5, M + CW, y + 8.5);
    y += 12;
  }

  /** Draw a pill-shaped severity badge. */
  function severityBadge(sev, bx, by) {
    const map = {
      HIGH:   { bg: [254, 202, 202], text: [185, 28, 28],  bdr: [252, 165, 165] },
      MEDIUM: { bg: [254, 243, 199], text: [161, 98,  7],  bdr: [253, 230, 138] },
      LOW:    { bg: [228, 228, 231], text: [82,  82, 91],  bdr: [212, 212, 216] },
    };
    const bc = map[sev] || map.LOW;
    const label = sev || 'LOW';
    const bw = label.length * 1.9 + 4.5;
    doc.setFillColor(...bc.bg);
    doc.setDrawColor(...bc.bdr);
    doc.setLineWidth(0.2);
    doc.roundedRect(bx, by - 3.2, bw, 4.5, 0.8, 0.8, 'FD');
    doc.setTextColor(...bc.text);
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.text(label, bx + bw / 2, by, { align: 'center' });
  }

  // ── HEADER BANNER ────────────────────────────────────────────────────
  doc.setFillColor(...teal);
  doc.rect(0, 0, PW, 26, 'F');
  doc.setFillColor(...tealDk);
  doc.rect(0, 23, PW, 3, 'F');

  // Padlock icon (left of brand name)
  const lx = M, ly = 7;
  // Lock body
  doc.setFillColor(...white);
  doc.roundedRect(lx, ly + 4.5, 10, 8, 1.5, 1.5, 'F');
  // Shackle (U-shape approximation)
  doc.setDrawColor(...white);
  doc.setLineWidth(1.7);
  doc.line(lx + 2, ly + 7.5, lx + 2, ly + 4.5);
  doc.line(lx + 2, ly + 4.5, lx + 8, ly + 4.5);
  doc.line(lx + 8, ly + 4.5, lx + 8, ly + 7.5);
  // Keyhole dot
  doc.setFillColor(...teal);
  doc.circle(lx + 5, ly + 10, 1.2, 'F');

  // Brand name + subtitle
  doc.setTextColor(...white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('Declawed', M + 14, 14.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('AI Lease Analysis Report', M + 14, 20.5);

  y = 32;

  // ── DOCUMENT INFO ─────────────────────────────────────────────────────
  const dateStr = analysisDate
    ? new Date(analysisDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const hasUserName = userName && userName.trim() && !userName.includes('@');
  const infoBoxH = hasUserName ? 22 : 16;

  doc.setFillColor(...slate50);
  doc.setDrawColor(...slate300);
  doc.setLineWidth(0.3);
  doc.roundedRect(M, y, CW, infoBoxH, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...slate500);

  doc.text('LEASE:', M + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slate700);
  const filenameLabel = doc.splitTextToSize(filename || 'Untitled document', CW - 30);
  doc.text(filenameLabel[0], M + 18, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...slate500);
  doc.text('DATE:', M + 4, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slate700);
  doc.text(dateStr, M + 18, y + 12);

  if (hasUserName) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...slate500);
    doc.text('FOR:', M + 4, y + 18);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...slate700);
    doc.text(userName.trim(), M + 18, y + 18);
  }

  y += infoBoxH + 6;

  // ── SCORE HERO ────────────────────────────────────────────────────────
  const score = data.score ?? null;
  if (score !== null || data.verdict) {
    let scoreRgb   = slate400;
    let bgRgb      = slate50;
    let borderRgb  = slate300;
    let scoreLabel = '';

    if (score !== null) {
      if (score <= 4)      { scoreRgb = rose;       bgRgb = [255, 241, 242]; borderRgb = [253, 164, 175]; scoreLabel = 'Heavily favors landlord'; }
      else if (score <= 7) { scoreRgb = [217,119,6]; bgRgb = [255, 251, 235]; borderRgb = [252, 211, 77];  scoreLabel = 'Somewhat unfavorable'; }
      else                 { scoreRgb = [5, 150,105]; bgRgb = [209, 250, 229]; borderRgb = [110, 231, 183]; scoreLabel = 'Tenant-friendly'; }
    }

    const hasScore = score !== null;
    const verdictW = hasScore ? CW - 32 : CW - 8;
    const verdictLines = data.verdict ? doc.splitTextToSize(data.verdict, verdictW) : [];
    const heroH = Math.max(hasScore ? 26 : 14, verdictLines.length * 4.5 + (hasScore ? 15 : 8));

    doc.setFillColor(...bgRgb);
    doc.setDrawColor(...borderRgb);
    doc.setLineWidth(0.5);
    doc.roundedRect(M, y, CW, heroH, 2.5, 2.5, 'FD');

    if (hasScore) {
      const cx = M + 14, cy = y + heroH / 2;
      doc.setFillColor(...scoreRgb);
      doc.circle(cx, cy, 10, 'F');
      doc.setTextColor(...white);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(String(Math.max(1, Math.min(10, score))), cx, cy + 2, { align: 'center' });
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.text('/ 10', cx, cy + 7.5, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...scoreRgb);
      doc.text(`Lease Score: ${scoreLabel}`, M + 28, y + 9);
    }

    if (verdictLines.length > 0) {
      const vx = hasScore ? M + 28 : M + 6;
      const vy = hasScore ? y + 15 : y + 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...slate700);
      doc.text(verdictLines, vx, vy);
    }

    y += heroH + 7;
  }

  // ── RED FLAGS ─────────────────────────────────────────────────────────
  if (data.redFlags?.length > 0) {
    sectionHead('Red Flags', rose);

    data.redFlags.forEach(flag => {
      const text = typeof flag === 'string' ? flag : flag.text;
      const sev  = typeof flag === 'string' ? 'MEDIUM' : (flag.severity || 'MEDIUM');
      const barCol = sev === 'HIGH' ? rose : sev === 'MEDIUM' ? amber : slate400;

      const lines = doc.splitTextToSize(text, CW - 22);
      const h = lines.length * 4.5 + 6;
      needSpace(h + 3);

      doc.setFillColor(...barCol);
      doc.rect(M, y, 2, h, 'F');

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...slate700);
      doc.text(lines, M + 6, y + 4.5);

      const bw = sev.length * 1.9 + 4.5;
      severityBadge(sev, M + CW - bw - 1, y + 4.5);

      y += h + 2;
    });
    y += 3;
  }

  // ── KEY DATES ─────────────────────────────────────────────────────────
  if (data.keyDates?.length > 0) {
    sectionHead('Key Dates', cyan);

    const colW = (CW - 4) / 2;
    for (let i = 0; i < data.keyDates.length; i += 2) {
      const pair = data.keyDates.slice(i, i + 2);
      const rowH = pair.reduce((max, item) => {
        const vl = doc.splitTextToSize(item.value || '', colW - 8);
        return Math.max(max, vl.length * 4 + 13);
      }, 14);
      needSpace(rowH + 3);

      pair.forEach((item, j) => {
        const cx = M + j * (colW + 4);
        doc.setFillColor(207, 250, 254);   // cyan-100
        doc.setDrawColor(165, 243, 252);   // cyan-200
        doc.setLineWidth(0.25);
        doc.roundedRect(cx, y, colW, rowH, 1.5, 1.5, 'FD');

        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(8, 145, 178);     // cyan-600
        doc.text((item.label || '').toUpperCase().slice(0, 32), cx + 4, y + 6);

        const vl = doc.splitTextToSize(item.value || '', colW - 8);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...slate700);
        doc.text(vl, cx + 4, y + 11);
      });

      y += rowH + 3;
    }
    y += 3;
  }

  // ── YOUR RIGHTS ───────────────────────────────────────────────────────
  if (data.tenantRights?.length > 0) {
    sectionHead('Your Rights', emerald);

    data.tenantRights.forEach(right => {
      const lines = doc.splitTextToSize(right, CW - 16);
      const h = lines.length * 4.5 + 7;
      needSpace(h + 2);

      doc.setFillColor(209, 250, 229);   // emerald-100
      doc.setDrawColor(167, 243, 208);   // emerald-200
      doc.setLineWidth(0.2);
      doc.roundedRect(M, y, CW, h, 1.5, 1.5, 'FD');

      // Filled circle indicator
      const bcy = y + h / 2;
      doc.setFillColor(...emerald);
      doc.circle(M + 5, bcy, 2.8, 'F');
      doc.setDrawColor(...white);
      doc.setLineWidth(0.8);
      doc.line(M + 3.5, bcy + 0.2, M + 4.8, bcy + 1.5);
      doc.line(M + 4.8, bcy + 1.5, M + 6.8, bcy - 1.2);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...slate700);
      doc.text(lines, M + 11, y + 5);

      y += h + 2;
    });
    y += 3;
  }

  // ── UNUSUAL CLAUSES ───────────────────────────────────────────────────
  if (data.unusualClauses?.length > 0) {
    sectionHead('Unusual Clauses', amber);

    data.unusualClauses.forEach(clause => {
      const lines = doc.splitTextToSize(clause, CW - 16);
      const h = lines.length * 4.5 + 7;
      needSpace(h + 2);

      doc.setFillColor(255, 251, 235);   // amber-50
      doc.setDrawColor(253, 230, 138);   // amber-200
      doc.setLineWidth(0.2);
      doc.roundedRect(M, y, CW, h, 1.5, 1.5, 'FD');

      // Warning diamond
      const wcy = y + h / 2;
      doc.setFillColor(...amber);
      doc.roundedRect(M + 2, wcy - 3, 6, 6, 0.8, 0.8, 'F');
      doc.setTextColor(...white);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('!', M + 5, wcy + 1.5, { align: 'center' });

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...slate700);
      doc.text(lines, M + 11, y + 5);

      y += h + 2;
    });
    y += 3;
  }

  // ── WHAT TO DO BEFORE SIGNING ─────────────────────────────────────────
  if (data.actionSteps?.length > 0) {
    sectionHead('What to Do Before Signing', teal);

    data.actionSteps.forEach((step, i) => {
      const lines = doc.splitTextToSize(step, CW - 17);
      const h = lines.length * 4.5 + 7;
      needSpace(h + 2);

      doc.setFillColor(204, 251, 241);   // teal-100
      doc.setDrawColor(153, 246, 228);   // teal-200
      doc.setLineWidth(0.2);
      doc.roundedRect(M, y, CW, h, 1.5, 1.5, 'FD');

      // Numbered circle
      const ncy = y + h / 2;
      doc.setFillColor(...teal);
      doc.circle(M + 6, ncy, 4, 'F');
      doc.setTextColor(...white);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.text(String(i + 1), M + 6, ncy + 1.2, { align: 'center' });

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...slate700);
      doc.text(lines, M + 14, y + 5);

      y += h + 2;
    });
  }

  // ── FOOTER on every page ──────────────────────────────────────────────
  const numPages = doc.getNumberOfPages();
  for (let p = 1; p <= numPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...slate300);
    doc.setLineWidth(0.3);
    doc.line(M, FOOTER_Y, PW - M, FOOTER_Y);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...slate400);
    doc.text(
      'Generated by Declawed AI \u2014 declawed.app \u2014 Not legal advice',
      M, PH - 5
    );
    if (numPages > 1) {
      doc.text(`${p} / ${numPages}`, PW - M, PH - 5, { align: 'right' });
    }
  }

  // ── Save ──────────────────────────────────────────────────────────────
  const safeName = (filename || 'lease-analysis')
    .replace(/\.[^/.]+$/, '')          // strip extension
    .replace(/[^\w\s-]/g, '')          // strip unsafe chars
    .replace(/\s+/g, '-')              // spaces to dashes
    .slice(0, 60) || 'lease-analysis';
  doc.save(`declawed-${safeName}.pdf`);
}
