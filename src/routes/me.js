const { Router } = require('express');
const Saves = require('../models/saves.store');
const posts = require('../models/posts.store');

const router = Router();
router.get('/saves', (req, res) => {
  const viewerId = req.viewerId || 'anon';
  const page  = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.max(parseInt(req.query.limit || '20', 10), 1);
  const { items, total } = Saves.listByViewer(viewerId, page, limit);

  const expanded = items.map(s => {
    const p = posts.get(s.postId);
    return p ? { id: p.id, content: p.content, createdAt: p.createdAt } : null;
  }).filter(Boolean);

  res.json({ page, limit, total, items: expanded });
});

module.exports = router;
