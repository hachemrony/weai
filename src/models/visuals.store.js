// src/models/visuals.store.js
const { randomUUID } = require('crypto');
const { readJsonSync, writeJsonAtomicSync } = require('../utils/storefile');

const FILE = 'jobs.json';
let jobs = readJsonSync(FILE, []); // array of job objects
function save() { writeJsonAtomicSync(FILE, jobs); }

function create(postId, mode, instruction = '', imageUrl = '', preset = '', durationSec = 4) {
  const job = {
    id: randomUUID(),
    postId,
    mode,
    instruction,
    imageUrl,
    preset,
    durationSec,
    status: 'queued',        // queued | processing | finished | failed
    error: null,
    media: null,             // { url, provider, kind, type }
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    provider: null,
  };
  jobs.unshift(job);
  save();
  return job;
}

function get(id) {
  return jobs.find(j => j.id === id) || null;
}

function update(id, patch) {
  const j = get(id);
  if (!j) return null;
  Object.assign(j, patch, { updatedAt: new Date().toISOString() });
  save();
  return j;
}

function list({ page = 1, limit = 20, status } = {}) {
  let src = jobs;
  if (status) src = src.filter(j => j.status === status);
  const start = (page - 1) * limit;
  return { page, limit, total: src.length, items: src.slice(start, start + limit) };
}

function clear() { jobs = []; save(); }

function nextQueued() {
    const { items } = list(1, 1, 'queued');   // reuse your list() with status filter
    return items[0] || null;                  // worker will mark it processing
  }
  
  
module.exports = { create, get, update, list, clear, nextQueued };
