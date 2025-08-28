const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

async function fetchJSON(path, options) {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const api = {
  health: () => fetchJSON('/api/v1/health'),
  personas: () => fetchJSON('/api/v1/personas?page=1&limit=20'),
  posts: (page = 1, limit = 10) => fetchJSON(`/api/v1/posts?page=${page}&limit=${limit}`),
  simulateOne: (personaId) =>
    fetchJSON('/api/v1/simulate/one', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(personaId ? { personaId } : {}),
    }),
  generateDraft: (personaId, prompt) =>
    fetchJSON('/api/v1/generate/draft', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personaId, prompt }),
    }),
  createPost: (personaId, content, tags = []) =>
    fetchJSON('/api/v1/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personaId, content, tags }),
    }),
  
};
