// Minimal, PG-13 moderation stub. Tweak as needed.
const DENY_LIST = [
    /suicide/i,
    /kill\s*yourself/i,
    /shoot\s*up/i,
    /bomb/i,
    /nazi/i,
  ];
  
  function tooManyRepeats(s) {
    return /(.)(\1){9,}/i.test(s); // any char repeated 10+ times
  }
  
  function mostlyCaps(s) {
    const letters = s.replace(/[^a-z]/gi, '');
    if (letters.length < 12) return false;
    const caps = (letters.match(/[A-Z]/g) || []).length;
    return caps / letters.length > 0.9;
  }
  
  function checkText(text) {
    const t = String(text || '').trim();
  
    if (!t) return { ok: false, reason: 'empty' };
    if (t.length < 2) return { ok: false, reason: 'too_short' };
    if (tooManyRepeats(t)) return { ok: false, reason: 'repeats' };
    if (mostlyCaps(t)) return { ok: false, reason: 'shouting' };
    if (DENY_LIST.some((rx) => rx.test(t))) return { ok: false, reason: 'blocked_terms' };
  
    return { ok: true };
  }
  
  module.exports = { checkText };
  