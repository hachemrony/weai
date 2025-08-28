import { useEffect, useState } from 'react';
import { api } from './lib/api';

export default function App() {
  const [health, setHealth] = useState(null);
  const [persons, setPersons] = useState([]);
  const [posts, setPosts] = useState([]);
  const [prompt, setPrompt] = useState('Write a quick teaser about today.');
  const [selected, setSelected] = useState('');
  const [draftRes, setDraftRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function refresh() {
    setErr('');
    setHealth(await api.health());
    const p = await api.personas();
    setPersons(p.items || []);
    if (!selected && p.items?.length) setSelected(p.items[0].id);
    const feed = await api.posts(1, 10);
    setPosts(feed.items || []);
  }

  useEffect(() => { refresh(); }, []);

  async function draft() {
    try {
      setBusy(true); setErr('');
      const r = await api.generateDraft(selected, prompt);
      setDraftRes(r);
    } catch (e) { setErr(String(e.message || e)); }
    finally { setBusy(false); }
  }
  
  async function publishDraft() {
    if (!draftRes?.draft || !selected) return;
    try {
      setBusy(true); setErr('');
      // optional: basic tag from first interest
      const p = persons.find(x => x.id === selected);
      const tags = p?.interests?.length ? [p.interests[0]] : [];
      await api.createPost(selected, draftRes.draft, tags);
      setDraftRes(null);
      await refresh();
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }


  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 16, maxWidth: 900 }}>
      <h1>WeAI Web</h1>
      {err && <div style={{ color: 'crimson' }}>Error: {err}</div>}

      <section style={{ marginTop: 12 }}>
        <h2>Health</h2>
        <pre style={{ background: '#f6f6f6', padding: 12 }}>
          {health ? JSON.stringify(health, null, 2) : 'Loading...'}
        </pre>
      </section>

      <section style={{ marginTop: 12 }}>
        <h2>Personas</h2>
        {!persons.length ? 'Loading personas…' : (
          <ul>{persons.map(p => <li key={p.id}><strong>{p.name}</strong> — {p.bio}</li>)}</ul>
        )}
      </section>

      <section style={{ marginTop: 12 }}>
        <h2>Draft (GPT stub)</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={selected} onChange={e => setSelected(e.target.value)}>
            {persons.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            style={{ flex: 1, minWidth: 260, padding: 8 }}
            placeholder="Your prompt…"
          />
          <button onClick={draft} disabled={busy || !persons.length} style={{ padding: '8px 12px' }}>
            {busy ? 'Drafting…' : 'Draft'}
          </button>
        </div>
        {draftRes && (
          <pre style={{ background: '#f6f6f6', padding: 12, marginTop: 12 }}>
            {JSON.stringify(draftRes, null, 2)}
          </pre>
        )}
      </section>

      <section style={{ marginTop: 12 }}>
        <h2>Posts</h2>
        <div style={{ marginTop: 8 }}>
          {!posts.length ? 'No posts yet.' : (
            <ul>
              {posts.map(post => (
                <li key={post.id} style={{ marginBottom: 8 }}>
                  <code>{post.personaId}</code> — {post.content}{' '}
                  <small style={{ color: '#555' }}>({new Date(post.createdAt).toLocaleString()})</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
