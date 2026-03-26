// Clipboard utility with execCommand fallback for browsers that block
// navigator.clipboard (permission denied, unfocused document, older Safari).
export async function copyToClipboard(text) {
  // Modern async clipboard API
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to legacy method
    }
  }
  // Legacy fallback: create a temporary textarea, select all, execCommand
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;';
    document.body.appendChild(el);
    el.focus();
    el.select();
    el.setSelectionRange(0, text.length); // needed on iOS
    const success = document.execCommand('copy');
    document.body.removeChild(el);
    return success;
  } catch {
    return false;
  }
}
