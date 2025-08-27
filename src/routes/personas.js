const { Router } = require('express');
const { ping } = require('../controllers/personas.controller');

const router = Router();

router.get('/ping', ping); // GET /api/v1/personas/ping

module.exports = router;
