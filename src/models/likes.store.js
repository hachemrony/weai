// src/models/likes.store.js
const { readJsonSync, writeJsonAtomicSync } = require('../utils/storefile');

const FILE = 'likes.json';
let likes = readJsonSync(FILE, []);
const save = () => writeJsonAtomicSync(FILE, likes);

const key = (postId, viewerId) => `${postId}:${viewerId}`;

function toggle(postId, viewerId) {
  const k = key(postId, viewerId);
  // IMPORTANT: compare against each record's *own* viewerId
  const idx = likes.findIndex(r => key(r.postId, r.viewerId) === k);
  if (idx >= 0) {
    likes.splice(idx, 1);
    save();
    return { liked: false, count: countFor(postId) };
  }
  likes.push({ postId, viewerId, createdAt: new Date().toISOString() });
  save();
  return { liked: true, count: countFor(postId) };
}

function countFor(postId) {
  return likes.reduce((n, r) => n + (r.postId === postId ? 1 : 0), 0);
}

function LikedBy(postId, viewerId) {
  const k = key(postId, viewerId);
  return likes.some(r => key(r.postId, r.viewerId) === k);
}

module.exports = { toggle, countFor, LikedBy };
