/**
 * Lightweight analytics utility.
 * Sends events to Plausible if available, otherwise fires a custom /api/event call.
 * All calls are fire-and-forget — no blocking, no errors surfaced.
 */
export function trackEvent(name, props = {}) {
  if (typeof window === 'undefined') return;

  // Plausible (if loaded via script tag in index.html)
  if (typeof window.plausible === 'function') {
    try { window.plausible(name, { props }); } catch { /* ignore */ }
  }

  // Custom lightweight fallback
  try {
    fetch('/api/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, props, url: window.location.href }),
      keepalive: true,
    }).catch(() => {});
  } catch { /* ignore */ }
}
