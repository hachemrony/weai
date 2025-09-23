// src/routes/visuals.js
const router = require('express').Router();
const posts = require('../models/posts.store');
const audit = require('../models/audit.store');

const jobs = require('../models/visuals.store');
// const { getVisualProviderName, getVisualProviderByName } = jobs;

const vprov = require('../services/visualProviders'); // add this


// constants
const MODES  = new Set(['image_edit', 'animate', 'text2video']);
const ALLOW = new Set(['mock','comfy','pika','seedance','nanobanana','seedream4']); // keep consistent


router.post('/', async (req, res) => {
  try {
    const b = req.body || {};

    const postid = b.postid || b.post_id || b.postId;
    if (!postid) return res.status(400).json({ error: 'post id is required' });

    const { mode, instruction = '', imageUrl = '', preset = '', durationSec = 4 } = b;
    if (!mode) return res.status(400).json({ error: 'mode must be image_edit | animate | text2video' });

    // expand providers
    // pick provider from query/header, else default via service
    const rawProvider = String(req.query.provider || req.headers['x-visual-provider'] || '')
      .trim()
      .toLowerCase();    

    // allow special "both" to fan out to our two engines
    const requestedProviders =
    rawProvider === 'both'
      ? ['seedream4', 'nanobanana']
      : [rawProvider || vprov.getVisualProviderName()];

    // sanity filter by those we actually have registered
    const providers = requestedProviders.filter(p => vprov.getVisualProviderByName(p));
    if (providers.length === 0) {
      return res.status(400).json({ error: 'unknown provider', requested: rawProvider });
    }

    // enqueue jobs (your existing logic)
    const jobIds = [];
    for (const p of providers) {
      const j = jobs.create(postid, mode, instruction, imageUrl, preset, Number(durationSec) || 4);
      jobs.update(j.id, { provider: p });
      audit.add({ type: 'visual_job_enqueued', postId: postid, jobId: j.id, provider: p, mode });
      jobIds.push(j.id);
    }

    return providers.length === 1
      ? res.status(202).json({ jobId: jobIds[0], provider: providers[0], mode })
      : res.status(202).json({ jobIds, providers, mode });
  } catch (err) {
    console.error('[visuals.post] error', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});


  // next queued job (204 = none)
router.get('/_next/queued', (_req, res) => {
  const j = jobs.nextQueued();
  if (!j) return res.status(204).end();
  res.json(j);
});

// Update status and/or attach result/error
router.patch('/:id', (req, res) => {
  const ok = jobs.update(req.params.id, {
    ...req.body,
    updatedAt: new Date().toISOString()
  });
  if (!ok) return res.status(404).json({ error: 'not found' });
  res.json(jobs.get(req.params.id));
});

router.get('/health', (_req, res) => {
  const name = vprov.getVisualProviderName();

  const ready = {
    seedream4: Boolean(process.env.SEEDREAM_API_BASE && process.env.SEEDREAM_API_KEY),
    nanobanana: Boolean(process.env.NANOBANANA_API_URL && process.env.NANOBANANA_API_KEY),
    pika:       Boolean(process.env.PIKA_API_KEY),
    comfy:      Boolean(process.env.COMFY_URL),
    mock:       true,
  };

  const fallback = !ready[name] && name !== 'mock' ? 'mock' : null;

  res.json({ name, fallback, ready: true });
});


router.get('/providers', (_req, res) => {
  res.json({ items: vprov.listProviders() });
});


router.get('/:id', (req, res) => {
  const j = jobs.get(req.params.id);
  if (!j) return res.status(404).json({ error: 'not found' });
  res.json(j);
});

  
module.exports = router;
