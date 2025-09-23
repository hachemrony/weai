// src/services/visualProviders/nanobanana.js
const NAME = 'nanobanana';
const { fetchJson } = require('../utils/http');


async function animate({ instruction, imageUrl, preset, durationSec }) {
  const base  = process.env.NANOBANANA_API_URL;
  const key   = process.env.NANOBANANA_API_KEY;
  const model = process.env.NANOBANANA_MODEL || 'flux-1.1-pro';
  if (!base || !key) throw new Error(`${NAME} not configured`);

  const body = {
    model,
    prompt: instruction,
    image_url: imageUrl || undefined,
    // if their API needs a frame count, derive one from duration:
    frames: durationSec ? Math.max(8, Math.min(180, durationSec * 30)) : undefined,
    preset: preset || undefined,
  };

  const data = await fetchJson(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
    name: 'nanobanana', // or 'seedance' / 'nanobanana'
  });
  

  const resp = await fetch(`${base.replace(/\/$/, '')}/images`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`${NAME} HTTP ${resp.status}`);



  return {
    type: 'image',            // or 'video'
    url,                      // remote URL if you got one
    path,                     // or local path if you wrote to disk
    width, height,
    durationSec,              // for video/gif; omit for stills
    provider: 'seedream4',    // or 'nanobanana' / 'mock'
    jobId: opts.jobId
  };
  
}

module.exports = { name: NAME, animate };
