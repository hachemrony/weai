const { Router } = require('express');
const { list, add, remove } = require('../models/posts.store');
const { list: listPersonas } = require('../models/personas.store');
const { checkText } = require('../services/moderation.service');
const { push: enqueueModeration } = require('../models/modqueue.store');
const router = Router();
const { rateLimit } = require('../utils/ratelimit');
const audit = require('../models/audit.store');


router.get('/', (req, res) => {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.max(parseInt(req.query.limit || '10', 10), 1);
  const personaId = req.query.personaId;
  res.json(list({ page, limit, personaId }));
});

router.post('/', rateLimit({ windowMs: 15_000, max: 5 }), async (req, res) => {
    try {
      const MAX_LEN = 300;
      const { personaId, content = '', tags = [] } = req.body || {};
  
      if (!personaId) return res.status(400).json({ error: 'personaId is required' });
      const personaExists = listPersonas().some(p => p.id === personaId);
      if (!personaExists) return res.status(404).json({ error: 'persona not found' });
  
      let clean = String(content)
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
        .trim();
      if (!clean) return res.status(400).json({ error: 'content is empty' });
      if (clean.length > MAX_LEN) clean = clean.slice(0, MAX_LEN - 1) + '…';
  
      const safeTags = Array.isArray(tags) ? tags.slice(0, 5) : [];
  
    const verdict = await checkText(clean);

    if (!verdict.ok) {
        const queued = enqueueModeration({ personaId, content: clean, tags: safeTags, verdict, status: 'queued',  media: [], });

        // audit: queued for moderation
        audit.add({
            type: 'mod_queue',
            personaId,
            content: clean,
            reason: verdict.reason || 'flagged',
            categories: verdict.categories,
            scores: verdict.scores,
        });

        return res.status(202).json({ queued: queued.id });
    }
  
     // otherwise: created
    const post = add({ personaId, content: clean, tags: safeTags, status: 'posted', media: [], });

    // audit: post created
    audit.add({
    type: 'post_created',
    personaId,
    tags: safeTags,
    content: clean,
    });

    return res.status(201).json(post);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  });
  

router.delete('/:id', (req, res) => {
  const ok = remove(req.params.id);
  if (!ok) return res.status(404).json({ error: 'post not found' });
  res.json({ deleted: req.params.id });
});

module.exports = router;
