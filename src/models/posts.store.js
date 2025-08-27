const { randomUUID } = require('crypto');

let posts = []; // { id, personaId, content, tags, createdAt }

function add({ personaId, content, tags = [] }) {
  if (!personaId) throw new Error('personaId is required');
  if (!content || typeof content !== 'string') throw new Error('content is required');

  const post = {
    id: randomUUID(),
    personaId,
    content: content.trim(),
    tags,
    createdAt: new Date().toISOString(),
  };
  posts.unshift(post); // newest first
  return post;
}

function list({ page = 1, limit = 10, personaId } = {}) {
  const source = personaId ? posts.filter(p => p.personaId === personaId) : posts;
  const start = (page - 1) * limit;
  return {
    page,
    limit,
    total: source.length,
    items: source.slice(start, start + limit),
  };
}

function remove(id) {
  const i = posts.findIndex(p => p.id === id);
  if (i === -1) return false;
  posts.splice(i, 1);
  return true;
}

function clear() { posts = []; }

module.exports = { add, list, remove, clear };
