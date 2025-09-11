// src/models/audit.store.js
const { readJsonSync, writeJsonAtomicSync } = require('../utils/storefile');

const FILE = 'audit.json';
const MAX = 1000;

let AUDIT = readJsonSync(FILE, []); // newest first
function save() { writeJsonAtomicSync(FILE, AUDIT.slice(0, MAX)); }

function add(evt) {
  AUDIT.unshift({ time: new Date().toISOString(), ...evt });
  if (AUDIT.length > MAX) AUDIT.length = MAX;
  save();
  return true;
}

function list({ page = 1, limit = 50 } = {}) {
  const start = (page - 1) * limit;
  return { page, limit, total: AUDIT.length, items: AUDIT.slice(start, start + limit) };
}

function clear() { AUDIT = []; save(); }

module.exports = { add, list, clear };
