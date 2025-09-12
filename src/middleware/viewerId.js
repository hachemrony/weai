// src/middleware/viewerId.js
const { randomUUID } = require('crypto');

module.exports = function viewerId(req, res, next) {
  // Never interfere with HEAD (health check)
if (req.method === 'HEAD') return next();

const raw = req.headers.cookie || '';
const m   = raw.match(/(?:^|;\s*)weai_vid=([^;]+)/);
let vid   = m ? decodeURIComponent(m[1]) : null;

if (!vid) {                                      // <— fix: only when missing
  vid = randomUUID();
  const extras = process.env.NODE_ENV === 'production' ? '; Secure; HttpOnly' : '';
  res.setHeader(
    'Set-Cookie',
    `weai_vid=${encodeURIComponent(vid)}; Path=/; Max-Age=31536000; SameSite=Lax${extras}`
  );
}

req.viewerId = vid;
next();

};
