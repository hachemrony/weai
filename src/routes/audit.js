const RL = require('../utils/ratelimit');
const ratelimit = RL.ratelimit || RL.rateLimit || RL;


const router = require('express').Router();
const { list } = require('../models/audit.store');

router.get('/',
  ratelimit({ windowMs: 60_000, max: 30 }),
  (req, res) => {
    const page  = Math.max(parseInt(req.query.page  || '1', 10), 1);
    const limit = Math.min(100, Math.max(parseInt(req.query.limit || '50', 10), 1));
    res.json(list(page, limit));
  }
);

module.exports = router;
