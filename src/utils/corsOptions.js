// src/utils/corsOptions.js
const strip = (s) => (s || '').trim().replace(/\/$/, '');
const parseList = (s) =>
  (s || '')
    .split(',')
    .map((x) => strip(x))
    .filter(Boolean);

const ALLOWED = parseList(process.env.CORS_ORIGINS || '');

module.exports = {
  origin(origin, callback) {
    const o = strip(origin);

    // allow curl/server-to-server (no Origin header)
    if (!o) return callback(null, true);

    // allow if whitelist empty or contains the origin
    if (ALLOWED.length === 0 || ALLOWED.includes(o)) {
      return callback(null, true);
    }

    // IMPORTANT: don't throw (throwing causes 500). Just deny CORS.
    console.warn('[CORS] blocked:', o, 'not in', ALLOWED);
    return callback(null, false);
  },
  credentials: true,
  optionsSuccessStatus: 204,
};
