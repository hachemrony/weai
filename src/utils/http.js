// src/utils/http.js
const { fetch } = require('undici');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchJson(url, opts = {}) {
  const {
    method = 'GET',
    headers = {},
    body,
    timeoutMs = 20000,
    retries = 2,
    retryOn = [429, 502, 503, 504],
    name = 'http',
  } = opts;

  for (let attempt = 0; ; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);

    try {
      const resp = await fetch(url, { method, headers, body, signal: ctrl.signal });
      const ok = resp.ok;
      const code = resp.status;

      const text = await resp.text();
      let json;
      try { json = text ? JSON.parse(text) : null; } catch { json = null; }

      if (!ok) {
        if (attempt < retries && retryOn.includes(code)) {
          const backoff = Math.min(1500 * (attempt + 1), 5000);
          await sleep(backoff);
          continue;
        }
        const msg = json?.error || text || `${name} HTTP ${code}`;
        const err = new Error(msg);
        err.status = code;
        err.body = json || text;
        throw err;
      }
      return json;
    } catch (err) {
      if (err.name === 'AbortError' && attempt < retries) {
        await sleep(500 * (attempt + 1));
        continue;
      }
      throw err;
    } finally {
      clearTimeout(t);
    }
  }
}

module.exports = { fetchJson };
