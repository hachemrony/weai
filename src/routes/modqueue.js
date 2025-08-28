const router = require('express').Router();
const { list, approve, reject } = require('../models/modqueue.store');

router.get('/', (req, res) => {
  const page  = Math.max(parseInt(req.query.page  || '1', 10), 1);
  const limit = Math.max(parseInt(req.query.limit || '20', 10), 1);
  res.json(list(page, limit));
});

router.post('/:id/approve', (req, res) => {
  const post = approve(req.params.id);
  if (!post) return res.status(404).json({ error: 'not found' });
  res.status(201).json(post);
});

router.post('/:id/reject', (req, res) => {
  const out = reject(req.params.id);
  if (!out) return res.status(404).json({ error: 'not found' });
  res.json(out);
});

module.exports = router;
