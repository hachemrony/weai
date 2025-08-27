import { useEffect, useState } from 'react';
import { api } from './lib/api';

export default function App() {
  const [health, setHealth] = useState(null);
  const [persons, setPersons] = useState([]);
  const [posts, setPosts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function refresh() {
    try {
      setErr('');
      setHealth(await api.health());
      const p = await api.personas();
      setPersons(p.items || []);
      const feed = await api.posts(1, 10);
      setPosts(feed.items || []);
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleSimulate() {
    try {
      setBusy(true);
      setErr('');
      // Let server pick a random persona (or pass one: api.simulateOne('TEMP-ALFA'))
      await api.simulateOne();
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
      {err && <div style={{ color: 'crimson', marginBottom: 8 }}>Error: {err}</div>}

      <section style={{ marginTop: 12 }}>
        <h2>Health</h2>
        <pre style={{ background: '#f6f6f6', padding: 12 }}>
          {health ? JSON.stringify(health, null, 2) : 'Loading...'}
        </pre>
      </section>

      <section style={{ marginTop: 12 }}>
        <h2>Personas</h2>
        {!persons.length ? (
          <div>Loading personas…</div>
        ) : (
          <ul>
            {persons.map((p) => (
              <li key={p.id}>
                <strong>{p.name}</strong> — {p.bio}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ marginTop: 12 }}>
        <h2>Posts</h2>
        <button onClick={handleSimulate} disabled={busy} style={{ padding: '8px 12px' }}>
          {busy ? 'Simulating…' : 'Simulate Post'}
        </button>
        <div style={{ marginTop: 12 }}>
          {!posts.length ? (
            <div>No posts yet.</div>
          ) : (
            <ul>
              {posts.map((post) => (
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
