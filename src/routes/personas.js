const { Router } = require('express');
const { ping } = require('../controllers/personas.controller');
const { list } = require('../models/personas.store');

const router = Router();

router.get('/ping', ping);

// List all personas (in-memory for now)
router.get('/', (_req, res) => {
  res.json({ count: list().length, items: list() });
});

module.exports = router;
