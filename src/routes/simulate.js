// src/routes/simulate.js
const RLmod = require('../utils/ratelimit');
const ratelimit = RLmod.ratelimit || RLmod;   // works for default or named export

const router = require('express').Router();

router.post('/', ratelimit({ windowMs: 15_000, max: 3 }), (req, res) => {
  res.json({ ok: true, note: 'simulate placeholder' });
});

module.exports = router;
