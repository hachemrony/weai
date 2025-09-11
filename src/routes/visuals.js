// src/routes/visuals.js
const router = require('express').Router();
const posts = require('../models/posts.store');
const jobs = require('../models/visuals.store');
const audit = require('../models/audit.store');
const { getVisualProviderName } = require('../services/visualProviders');

// constants
const MODES  = new Set(['image_edit', 'animate', 'text2video']);
const ALLOW  = new Set(['mock', 'pika', 'comfy']); // allowed provider overrides


router.post('/', (req, res) => {
    try {
      const { postId, mode, instruction = '', imageUrl = '', preset = '', durationSec = 4 } = req.body || {};
      if (!postId) return res.status(400).json({ error: 'postId is required' });
      if (!MODES.has(mode)) return res.status(400).json({ error: 'mode must be image_edit | animate | text2video' });
  
      const post = posts.get(postId);
      if (!post) return res.status(404).json({ error: 'post not found' });
  
      // provider override via ?provider= or header x-visual-provider
      const raw = String(req.query.provider || req.headers['x-visual-provider'] || '')
                    .trim().toLowerCase();
      const providerOverride = ALLOW.has(raw) ? raw : '';
  
      const job = jobs.create(postId, mode, instruction, imageUrl, preset, durationSec);
      if (providerOverride) job.provider = providerOverride;
  
      audit.add({
        type: 'visual_enqueued',
        postId,
        jobId: job.id,
        provider: providerOverride || getVisualProviderName(),
        mode,
      });
  
      return res.status(202).json({ id: job.id, status: job.status });
    } catch (e) {
      console.error('visuals.post error', e);
      return res.status(500).json({ error: 'internal_error' });
    }
  });

router.get('/health', (req, res) => {
    try {
      const name = getVisualProviderName();
      let fallback = null;
      if (name === 'pika' && !process.env.PIKA_API_KEY) fallback = 'mock';
      if (name === 'comfy' && !process.env.COMFY_URL)  fallback = 'mock';
  
      const ready =
        (name === 'pika'  && !!process.env.PIKA_API_KEY) ||
        (name === 'comfy' && !!process.env.COMFY_URL) ||
        name === 'mock';
  
      res.json({ name, fallback, ready });
    } catch (e) {
      res.status(500).json({ error: 'health_check_failed' });
    }
  });
  

router.get('/:id', (req, res) => {
  const j = jobs.get(req.params.id);
  if (!j) return res.status(404).json({ error: 'not found' });
  res.json(j);
});

  
module.exports = router;
