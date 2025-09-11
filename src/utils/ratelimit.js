// src/utils/ratelimit.js
function ratelimit({ windowMs = 15_000, max = 5, keyGen = (req) => req.ip, message = "Too many requests" } = {}) {
  const hits = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
  }, windowMs).unref();

  return (req, res, next) => {
    const now = Date.now();
    const key = keyGen(req);

    let rec = hits.get(key);
    if (!rec || now >= rec.reset) rec = { count: 0, reset: now + windowMs };
    rec.count += 1;
    hits.set(key, rec);

    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - rec.count)));
    res.setHeader("X-RateLimit-Reset", String(rec.reset));

    if (rec.count > max) {
      res.setHeader("Retry-After", Math.ceil((rec.reset - now) / 1000));
      return res.status(429).json({ error: message, retryAfterMs: rec.reset - now });
    }
    next();
  };
}

module.exports = ratelimit;          // default: require('../utils/ratelimit')
module.exports.ratelimit = ratelimit; // named (lowercase)
module.exports.rateLimit = ratelimit; // named (camelCase)