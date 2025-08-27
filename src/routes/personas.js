const { Router } = require('express');
const { ping } = require('../controllers/personas.controller');
const { list, add, remove } = require('../models/personas.store');


const router = Router();

router.get('/ping', ping);

// List all personas
router.get('/', (req, res) => {
    const items = list();
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.max(parseInt(req.query.limit || '10', 10), 1);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paged = items.slice(start, end);
  
    res.json({
      page,
      limit,
      total: items.length,
      count: paged.length,
      items: paged,
    });
  });

// Create new persona (in-memory)
router.post('/', (req, res) => {
  try {
    const newPersona = add(req.body);
    res.status(201).json(newPersona);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// Delete persona by id
router.delete('/:id', (req, res) => {
    const ok = remove(req.params.id);
    if (!ok) return res.status(404).json({ error: 'persona not found' });
    return res.json({ deleted: req.params.id });
  });

module.exports = router;
