const { Router } = require('express');
const config = require('../utils/config');

const router = Router();
router.get('/openai', (_req, res) => {
  res.json({
    enabled: config.openai.enabled,
    hasKey: !!config.openai.apiKey,
    model: config.openai.model,
  });
});

module.exports = router;
