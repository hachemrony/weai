const router = require('express').Router();
const { list, approve, reject } = require('../models/modqueue.store');
const { rateLimit } = require('../utils/ratelimit');   // <-- named import
const audit = require('../models/audit.store');


router.use(rateLimit({ windowMs: 60_000, max: 30 }));


router.get('/', (req, res) => {
  const page  = Math.max(parseInt(req.query.page  || '1', 10), 1);
  const limit = Math.max(parseInt(req.query.limit || '20', 10), 1);
  res.json(list(page, limit));
});

router.post('/:id/approve', (req, res) => {
  const post = approve(req.params.id);
  if (!post) return res.status(404).json({ error: 'not found' });
  res.status(201).json(post);
  audit.add({
    type: 'mod.approve',
    id,
    personaId: post.personaId,
  });
  
});

router.post('/:id/reject', (req, res) => {
  const out = reject(req.params.id);
  if (!out) return res.status(404).json({ error: 'not found' });
  res.json(out);
  audit.add({
    type: 'mod.reject',
    id,
  });
  
});

module.exports = router;
