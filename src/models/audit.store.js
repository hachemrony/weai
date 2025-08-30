// src/models/audit.store.js
const { randomUUID } = require('node:crypto');

const _items = []; // newest first

function add(evt = {}) {
  const rec = {
    id: randomUUID(),
    ts: new Date().toISOString(),
    ...evt,            // e.g. { type, personaId, content?, reason?, scores? }
  };
  _items.unshift(rec);
  return rec;
}

function list(page = 1, limit = 20) {
  page = Math.max(parseInt(page || '1', 10), 1);
  limit = Math.max(parseInt(limit || '20', 10), 1);
  const start = (page - 1) * limit;
  return { page, limit, total: _items.length, items: _items.slice(start, start + limit) };
}

module.exports = { add, list };

