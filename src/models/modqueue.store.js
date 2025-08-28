const { randomUUID } = require("crypto");
const { add: addPost } = require("./posts.store");

const pending = []; // { id, personaId, content, tags, verdict, createdAt }

function list(page = 1, limit = 20) {
  const start = (page - 1) * limit;
  const items = pending.slice(start, start + limit);
  return { page, limit, total: pending.length, items };
}

function push({ personaId, content, tags = [], verdict }) {
  const item = {
    id: randomUUID(),
    personaId, content, tags, verdict,
    createdAt: new Date().toISOString(),
  };
  pending.unshift(item);
  return item;
}

function remove(id) {
  const i = pending.findIndex(x => x.id === id);
  return i >= 0 ? pending.splice(i, 1)[0] : null;
}

function approve(id) {
  const item = remove(id);
  if (!item) return null;
  return addPost({ personaId: item.personaId, content: item.content, tags: item.tags });
}

function reject(id) {
  const item = remove(id);
  return item ? { id: item.id, status: "rejected" } : null;
}

module.exports = { list, push, approve, reject };
