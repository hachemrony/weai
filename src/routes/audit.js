// src/routes/audit.js
const router = require('express').Router();
const { list } = require('../models/audit.store');
const { rateLimit } = require('../utils/ratelimit'); // use your working import form

router.get('/',
  rateLimit({ windowMs: 60_000, max: 30 }),
  (req, res) => {
    const { page = '1', limit = '20' } = req.query || {};
    res.json(list(page, limit));
  },
);

module.exports = router;
