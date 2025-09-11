// src/models/messages.store.js
const { readJsonSync, writeJsonAtomicSync } = require('../utils/storefile');

const FILE = 'messages.json';
let rows = readJsonSync(FILE, []);  // [{ postId, viewerId, text?, createdAt }]
const save = () => writeJsonAtomicSync(FILE, rows);

function add(postId, viewerId, text = '') {
  // idempotent per viewer (one “message sent” per viewer per post in the stub)
  const exists = rows.some(r => r.postId === postId && r.viewerId === viewerId);
  if (!exists) {
    rows.unshift({ postId, viewerId, text: String(text).slice(0, 500), createdAt: new Date().toISOString() });
    save();
  }
  return { count: countFor(postId), messagedByMe: sentBy(postId, viewerId) };
}

const countFor = postId => rows.reduce((n, r) => n + (r.postId === postId ? 1 : 0), 0);
const sentBy   = (postId, viewerId) => rows.some(r => r.postId === postId && r.viewerId === viewerId);
function clear() { rows = []; save(); }

module.exports = { add, countFor, sentBy, clear };
