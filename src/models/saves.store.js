const { readJsonSync, writeJsonAtomicSync } = require('../utils/storefile');
const FILE = 'saves.json';
let rows = readJsonSync(FILE, []);          // [{ postId, viewerId, createdAt }]
const save = () => writeJsonAtomicSync(FILE, rows);

function toggle(postId, viewerId) {
  const i = rows.findIndex(r => r.postId === postId && r.viewerId === viewerId);
  if (i >= 0) { rows.splice(i, 1); save(); return { saved: false, count: countFor(postId) }; }
  rows.unshift({ postId, viewerId, createdAt: new Date().toISOString() });
  save(); return { saved: true, count: countFor(postId) };
}
const countFor = postId => rows.reduce((n, r) => n + (r.postId === postId), 0);
const savedBy  = (postId, viewerId) => rows.some(r => r.postId === postId && r.viewerId === viewerId);

function listByViewer(viewerId, page = 1, limit = 20) {
  const s = rows.filter(r => r.viewerId === viewerId);
  const start = (page - 1) * limit;
  return { page, limit, total: s.length, items: s.slice(start, start + limit) };
}
function clear() { rows = []; save(); }

module.exports = { toggle, countFor, savedBy, listByViewer, clear };
