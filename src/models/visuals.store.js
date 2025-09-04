// src/models/visuals.store.js
const { randomUUID } = require('crypto');

const JOBS = []; // { id, postId, mode, instruction, imageUrl, preset, durationSec, status, createdAt, updatedAt, result?, error? }

function create({ postId, mode, instruction = '', imageUrl = '', preset = '', durationSec = 4 }) {
  const job = {
    id: randomUUID(),
    postId,
    mode,                 // 'image_edit' | 'animate' | 'text2video'
    instruction,
    imageUrl,
    preset,
    durationSec,
    status: 'queued',     // 'queued' | 'processing' | 'finished' | 'failed'
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    result: null,
    error: null,
  };
  JOBS.unshift(job);
  return job;
}

function get(id)           { return JOBS.find(j => j.id === id) || null; }
function list({ page=1, limit=20 } = {}) {
  const start = (page - 1) * limit;
  return { page, limit, total: JOBS.length, items: JOBS.slice(start, start + limit) };
}
function update(id, patch) {
  const j = get(id); if (!j) return null;
  Object.assign(j, patch, { updatedAt: new Date().toISOString() });
  return j;
}
function nextQueued()      { return JOBS.find(j => j.status === 'queued'); }

module.exports = { create, get, list, update, nextQueued, _data: JOBS };
