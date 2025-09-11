const { Router } = require('express');
const { list, add, remove, get, attachMedia } =
  require('../models/posts.store');
const { list: listPersonas } = require('../models/personas.store');
const { checkText } = require('../services/moderation.service');
const { push: enqueueModeration } = require('../models/modqueue.store');
const RL = require('../utils/ratelimit');
const ratelimit = RL.ratelimit || RL.rateLimit || RL;

const router = Router();
const audit = require('../models/audit.store');

const posts    = require('../models/posts.store');
const Likes    = require('../models/likes.store');
const Saves    = require('../models/saves.store');
const Shares   = require('../models/shares.store');
const Messages = require('../models/messages.store');

console.log('simulate ratelimit type:', typeof ratelimit);



// at top: const { list } = require('../models/posts.store'); // or your store
router.get('/', (req, res) => {
    const page  = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.max(parseInt(req.query.limit || '20', 10), 1);
    const personaId = (req.query.personaId || '').trim();
  
    const { total, items } = list({ page, limit, personaId });
    res.json({ page, limit, total, items });
});

// toggle save
router.post('/:id/save',
  ratelimit({ windowMs: 15_000, max: 20 }),
  (req, res) => {    
    const postId = req.params.id;
    const post = posts.get(postId);
    if (!post) return res.status(404).json({ error: 'post not found' });
    const viewerId = req.viewerId || 'anon';
    const { saved, count } = Saves.toggle(postId, viewerId);
    res.status(200).json({ saved, count });
  });
  
  // counts (and whether I saved it)
  router.get('/:id/saves', (req, res) => {
    const postId = req.params.id;
    const post = posts.get(postId);
    if (!post) return res.status(404).json({ error: 'post not found' });
    const viewerId = req.viewerId || 'anon';
    res.json({ count: Saves.countFor(postId), savedByMe: Saves.savedBy(postId, viewerId) });
  });
  
// POST /api/v1/posts/:id/share
router.post('/:id/share',
  ratelimit({ windowMs: 15_000, max: 20 }),
  (req, res) => {
  const postId = req.params.id;
  const post = posts.get(postId);
  if (!post) return res.status(404).json({ error: 'post not found' });

  const viewerId = req.viewerId || 'anon';
  const provider = String((req.body && req.body.provider) || 'generic').toLowerCase();
  const out = Shares.add(postId, viewerId, provider);

  audit.add({ type: 'share', postId, viewerId, provider });
  res.json({ shared: true, count: out.count, totals: out.totals, sharedByMe: out.sharedByMe });
});

// GET /api/v1/posts/:id/shares
router.get('/:id/shares', (req, res) => {
  const postId = req.params.id;
  const post = posts.get(postId);
  if (!post) return res.status(404).json({ error: 'post not found' });

  const viewerId = req.viewerId || 'anon';
  res.json({
    count: Shares.countFor(postId),
    totals: Shares.totalsFor(postId),
    sharedByMe: Shares.sharedBy(postId, viewerId)
  });
});

// POST /api/v1/posts/:id/message
router.post('/:id/message',
  ratelimit({ windowMs: 15_000, max: 10 }),
  (req, res) => {
  const postId = req.params.id;
  const post = posts.get(postId);
  if (!post) return res.status(404).json({ error: 'post not found' });

  const viewerId = req.viewerId || 'anon';
  const text = (req.body && req.body.text) || '';
  const out = Messages.add(postId, viewerId, text);

  audit.add({ type: 'message', postId, viewerId });
  res.json({ sent: true, count: out.count, messagedByMe: out.messagedByMe });
});

// GET /api/v1/posts/:id/messages
router.get('/:id/messages', (req, res) => {
  const postId = req.params.id;
  const post = posts.get(postId);
  if (!post) return res.status(404).json({ error: 'post not found' });

  const viewerId = req.viewerId || 'anon';
  res.json({
    count: Messages.countFor(postId),
    messagedByMe: Messages.sentBy(postId, viewerId)
  });
});

router.post('/', ratelimit({ windowMs: 15_000, max: 5 }), async (req, res) => {
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

  router.post('/:id/like',
    ratelimit({ windowMs: 15_000, max: 20 }),
    (req, res) => {
      const postId = req.params.id;
      const post = posts.get(postId);
      if (!post) return res.status(404).json({ error: 'post not found' });
  
      const viewerId = req.viewerId || 'anon';
      try {
        const out = Likes.toggle(postId, viewerId); // { liked, count }
        res.json(out);
      } catch (e) {
        console.error('like failed:', e);
        res.status(500).json({ error: 'like failed' });
      }
    }
  );
  

// get counts
router.get('/:id/likes', (req, res) => {
    const postId = req.params.id;
    const post = posts.get(postId);
    if (!post) return res.status(404).json({ error: 'post not found' });
  
    const viewerId = req.viewerId || 'anon';
    res.json({ count: likes.countFor(postId), likedByMe: likes.likedBy(postId, viewerId) });
});

  // POST /api/v1/posts/:id/media
router.post('/:id/media', (req, res) => {
    try {
      const { id } = req.params;
      const post = posts.get(id);
      if (!post) return res.status(404).json({ error: 'post not found' });
  
      const body = req.body || {};
      const url = typeof body.url === 'string' ? body.url.trim() : '';
      if (!url) return res.status(400).json({ error: 'url is required' });
  
      const item = posts.attachMedia(id, {
        url,
        provider: body.provider || 'manual',
        kind: body.kind || 'video',
        type: body.type || 'video/mp4',
        meta: body.meta ?? null,
        thumb: body.thumb ?? null,
      });
  
      return res.json({ ok: true, media: item });
    } catch (e) {
      console.error('attach_media_failed:', e);
      return res.status(500).json({ error: 'attach_media_failed' });
    }
  });
  
router.delete('/:id', (req, res) => {
  const ok = remove(req.params.id);
  if (!ok) return res.status(404).json({ error: 'post not found' });
  res.json({ deleted: req.params.id });
});

router.get('/:id/stats', (req, res) => {
  const id = req.params.id;
  const post = posts.get(id);
  if (!post) return res.status(404).json({ error: 'post not found' });

  const viewerId = req.viewerId || 'anon';
  res.json({
    likes:    { count: Likes.countFor(id),  likedByMe: Likes.likedBy(id, viewerId) },
    saves:    { count: Saves.countFor(id),  savedByMe: Saves.savedBy(id, viewerId) },
    shares:   { count: Shares.countFor(id), totals: Shares.totalsFor(id), sharedByMe: Shares.sharedBy(id, viewerId) },
    messages: { count: Messages.countFor(id), messagedByMe: Messages.sentBy(id, viewerId) }
  });
});

// Place ABOVE `router.get('/:id', ...)`
router.get('/:id/summary', (req, res) => {
  const id = req.params.id;
  const post = posts.get(id);
  if (!post) return res.status(404).json({ error: 'post not found' });

  const viewerId = req.viewerId || 'anon';
  const stats = {
    likes:    { count: Likes.countFor(id),  likedByMe: Likes.likedBy(id, viewerId) },
    saves:    { count: Saves.countFor(id),  savedByMe: Saves.savedBy(id, viewerId) },
    shares:   { count: Shares.countFor(id), totals: Shares.totalsFor(id), sharedByMe: Shares.sharedBy(id, viewerId) },
    messages: { count: Messages.countFor(id), messagedByMe: Messages.sentBy(id, viewerId) }
  };

  res.json({
    id: post.id,
    content: post.content,
    createdAt: post.createdAt,   // note the “d”
    status: post.status,
    media: post.media,
    stats
  });
});


// GET one post by id
router.get('/:id', (req, res) => {
    const post = get(req.params.id);
    if (!post) return res.status(404).json({ error: 'post not found' });
    res.json(post);
});

  
module.exports = router;
