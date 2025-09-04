const { randomUUID } = require('crypto');

const MAX_POSTS = 1000; // keep newest 1000 in memory

let posts = []; // { id, personaId, content, tags, createdAt, media?[] }

function add({ personaId, content, tags = [] }) {
    if (!personaId) throw new Error('personaId is required');
    if (!content || typeof content !== 'string') throw new Error('content is required');
    const post = {
      id: randomUUID(),
      personaId,
      content: content.trim(),
      tags,
      createdAt: new Date().toISOString(),
      media: [], // <-- optional, but nice to initialize
    };
    posts.unshift(post);
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

function get(id) {
    return posts.find(p => p.id === id) || null;
}

function remove(id) {
    const i = posts.findIndex(p => p.id === id);
    if (i === -1) return false;
    posts.splice(i, 1);
    return true;
}

function clear() { posts = []; }

/**
 * Attach a media item (video/image) to a post.
 * @param {string} postId
 * @param {{ url:string, kind?:'video'|'image'|'gif', thumb?:string, meta?:object, id?:string }} media
 */

function attachMedia(postId, media) {
    const p = posts.find(x => x.id === postId);
    if (!p) throw new Error('post not found');
    const item = {
      id: randomUUID(),
      kind: media.kind || 'video',
      type: media.type || 'video/mp4',
      url: media.url,
      thumb: media.thumb || null,
      meta: media.meta || null,
      createdAt: new Date().toISOString()
    };
    p.media ||= [];
    p.media.unshift(item);
    return item;
  }  
  
  module.exports = { add, list, get, remove, clear, attachMedia };
