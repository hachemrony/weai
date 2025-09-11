// src/models/posts.store.js
const { randomUUID } = require('crypto');
const { readJsonSync, writeJsonAtomicSync } = require('../utils/storefile');

const FILE = 'posts.json';
let posts = readJsonSync(FILE, []); // { id, personaId, content, tags, createdAt, media?[], status? }

function save() { writeJsonAtomicSync(FILE, posts); }

function add({ personaId, content, tags = [], status = 'queued', personaSnapshot = null }) {
  if (!personaId) throw new Error('personaId is required');
  if (!content || typeof content !== 'string') throw new Error('content is required');

  const post = {
    id: randomUUID(),
    personaId,
    content: content.trim(),
    tags,
    status, // queued | review | posted (you already use queue/review in Admin)
    personaSnapshot,
    media: [],
    createdAt: new Date().toISOString(),
  };
  posts.unshift(post);
  save();
  return post;
}

function get(id) {
  return posts.find(p => p.id === id) || null;
}

function attachMedia(id, mediaItem) {
  const post = get(id);
  if (!post) return false;
  post.media = post.media || [];
  post.media.unshift(mediaItem); // newest first
  save();
  return true;
}

function setStatus(id, status) {
  const post = get(id);
  if (!post) return false;
  post.status = status;
  save();
  return true;
}

function list({ page = 1, limit = 10, personaId, status } = {}) {
  let src = posts;
  if (personaId) src = src.filter(p => p.personaId === personaId);
  if (status)    src = src.filter(p => p.status === status);

  const start = (page - 1) * limit;
  return {
    page,
    limit,
    total: src.length,
    items: src.slice(start, start + limit),
  };
}

function remove(id) {
  const i = posts.findIndex(p => p.id === id);
  if (i === -1) return false;
  posts.splice(i, 1);
  save();
  return true;
}

function clear() { posts = []; save(); }

module.exports = { add, get, list, remove, clear, attachMedia, setStatus };
