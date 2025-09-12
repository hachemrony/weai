const router = require('express').Router();

router.head('/', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.sendStatus(200);                 // ends the response
});

router.get('/', (req, res) => {
  res.cookie('weai_vid', req.viewerId || 'anon', { sameSite: 'lax', maxAge: 31536000000 });
  res.set('Cache-Control', 'no-store');
  res.status(200).json({ ok: true, ts: Date.now() });
});

module.exports = router;
