// src/models/shares.store.js
const { readJsonSync, writeJsonAtomicSync } = require('../utils/storefile');

const FILE = 'shares.json';
let rows = readJsonSync(FILE, []);  // [{ postId, viewerId, provider, createdAt }]
const save = () => writeJsonAtomicSync(FILE, rows);

function add(postId, viewerId, provider = 'generic') {
  // idempotent per viewer+provider
  const exists = rows.some(r => r.postId === postId && r.viewerId === viewerId && r.provider === provider);
  if (!exists) {
    rows.unshift({ postId, viewerId, provider, createdAt: new Date().toISOString() });
    save();
  }
  return { count: countFor(postId), totals: totalsFor(postId), sharedByMe: sharedBy(postId, viewerId) };
}

const countFor  = postId => rows.reduce((n, r) => n + (r.postId === postId ? 1 : 0), 0);
const sharedBy  = (postId, viewerId) => rows.some(r => r.postId === postId && r.viewerId === viewerId);
function totalsFor(postId) {
  const t = {};
  rows.forEach(r => { if (r.postId === postId) t[r.provider] = (t[r.provider] || 0) + 1; });
  return t;
}
function clear() { rows = []; save(); }

module.exports = { add, countFor, totalsFor, sharedBy, clear };
