const { Router } = require('express');
const { list: listPersonas } = require('../models/personas.store');
const { add: addPost } = require('../models/posts.store');
const { synthesizeContent, pickTags } = require('../utils/simulator');
const { simulateLimiter } = require('../utils/ratelimit');

const router = Router();

router.use(simulateLimiter);

/**
 * POST /api/v1/simulate/one
 * body: { personaId?: string }
 * Creates one synthetic post for the specified personaId or a random persona.
 */
router.post('/one', (req, res) => {
  let { personaId } = req.body || {};
  const personas = listPersonas();

  if (!personaId) {
    if (personas.length === 0) return res.status(400).json({ error: 'no personas available' });
    personaId = personas[Math.floor(Math.random() * personas.length)].id;
  }

  const persona = personas.find((p) => p.id === personaId);
  if (!persona) return res.status(404).json({ error: 'persona not found' });

  const content = synthesizeContent(persona);
  const tags = pickTags(persona);

  const post = addPost({ personaId, content, tags });
  return res.status(201).json({ created: post });
});

module.exports = router;
