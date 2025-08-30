// src/routes/simulate.js
const router = require('express').Router();
const { rateLimit } = require('../utils/ratelimit');

// simple placeholder; keep or replace with real simulate logic later
router.post('/', rateLimit({ windowMs: 15_000, max: 3 }), (req, res) => {
  res.json({ ok: true, note: 'simulate placeholder' });
});

module.exports = router;
