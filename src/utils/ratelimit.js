const rateLimit = require('express-rate-limit');

// Very low for testing: 3 requests per 5 seconds per IP
const simulateLimiter = rateLimit({
  windowMs: 5 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many simulation requests, slow down.' },
});

module.exports = { simulateLimiter };
