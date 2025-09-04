// src/routes/visuals.js
const router = require('express').Router();
const jobs   = require('../models/visuals.store');
const posts  = require('../models/posts.store');
const audit  = require('../models/audit.store');

// If you have a moderation helper, import it (optional but recommended)
// const { checkText, sanitizeText } = require('../services/moderation');

const MODES = new Set(['image_edit', 'animate', 'text2video']);

router.post('/', (req, res) => {
  const { postId, mode, instruction = '', imageUrl = '', preset = '', durationSec = 4 } = req.body || {};
  if (!postId) return res.status(400).json({ error: 'postId is required' });
  if (!MODES.has(mode)) return res.status(400).json({ error: 'mode must be image_edit | animate | text2video' });

  const post = posts.get(postId);
  if (!post) return res.status(404).json({ error: 'post not found' });

  // Optional: moderate instruction text
  // const clean = sanitizeText(instruction || '');
  // const verdict = checkText(clean);
  // if (!verdict.ok) return res.status(400).json({ error: `blocked: ${verdict.reason}` });

  const job = jobs.create({ postId, mode, instruction, imageUrl, preset, durationSec });
  audit.add({ type: 'visual_enqueued', postId, jobId: job.id, mode });

  return res.status(202).json({ id: job.id, status: job.status });
});

router.get('/:id', (req, res) => {
  const j = jobs.get(req.params.id);
  if (!j) return res.status(404).json({ error: 'not found' });
  res.json(j);
});

module.exports = router;
