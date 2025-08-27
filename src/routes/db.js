const { Router } = require('express');
const { checkDb } = require('../utils/db');

const router = Router();

router.get('/health', async (_req, res) => {
  const status = await checkDb();
  res.json({ service: 'postgres', ...status, timestamp: new Date().toISOString() });
});

module.exports = router;
