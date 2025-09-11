// src/middleware/viewerId.js
const { randomUUID } = require('crypto');

module.exports = function viewerId(req, res, next) {
  const raw = req.headers.cookie || '';
  const m = raw.match(/(?:^|;\s*)weai_vid=([^;]+)/);
  let vid = m ? decodeURIComponent(m[1]) : null;

  if (!vid) {
    vid = randomUUID();
    res.setHeader(
      'Set-Cookie',
      `weai_vid=${encodeURIComponent(vid)}; Path=/; Max-Age=31536000; SameSite=Lax`
    );
  }
  req.viewerId = vid;
  next();
};
