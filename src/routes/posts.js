const { Router } = require('express');
const { list, add, remove } = require('../models/posts.store');

const router = Router();

// GET /api/v1/posts?page=1&limit=10&personaId=TEMP-ALFA
router.get('/', (req, res) => {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.max(parseInt(req.query.limit || '10', 10), 1);
  const personaId = req.query.personaId;
  res.json(list({ page, limit, personaId }));
});

// POST /api/v1/posts { personaId, content, tags? }
router.post('/', (req, res) => {
  try {
    const post = add(req.body);
    res.status(201).json(post);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE /api/v1/posts/:id
router.delete('/:id', (req, res) => {
  const ok = remove(req.params.id);
  if (!ok) return res.status(404).json({ error: 'post not found' });
  res.json({ deleted: req.params.id });
});

module.exports = router;
