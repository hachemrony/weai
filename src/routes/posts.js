const { Router } = require('express');
const { list, add, remove } = require('../models/posts.store');
const { list: listPersonas } = require('../models/personas.store');
const { checkText } = require('../utils/moderation');

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
      const MAX_LEN = 300;
      const { personaId, content = '', tags = [] } = req.body || {};
  
      if (!personaId) return res.status(400).json({ error: 'personaId is required' });
      const personaExists = listPersonas().some((p) => p.id === personaId);
      if (!personaExists) return res.status(404).json({ error: 'persona not found' });
  
      let clean = String(content).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
      if (!clean) return res.status(400).json({ error: 'content is empty' });
      if (clean.length > MAX_LEN) clean = clean.slice(0, MAX_LEN - 1) + '…';
  
      // NEW: moderation check
      const verdict = checkText(clean);
      if (!verdict.ok) return res.status(400).json({ error: `blocked: ${verdict.reason}` });
  
      const safeTags = Array.isArray(tags) ? tags.slice(0, 5) : [];
      const post = add({ personaId, content: clean, tags: safeTags });
      return res.status(201).json(post);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  });

// DELETE /api/v1/posts/:id
router.delete('/:id', (req, res) => {
  const ok = remove(req.params.id);
  if (!ok) return res.status(404).json({ error: 'post not found' });
  res.json({ deleted: req.params.id });
});

module.exports = router;
