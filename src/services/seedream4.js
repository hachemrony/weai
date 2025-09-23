// src/services/seedream4.js
const NAME = 'seedream4';
const { fetchJson } = require('../utils/http');

async function animate({ instruction, imageUrl, preset, durationSec }, opts = {}) {
  const base = process.env.SEEDREAM_API_BASE;
  const key  = process.env.SEEDREAM_API_KEY;
  if (!base || !key) throw new Error(`${NAME} not configured`);

  const url = `${base.replace(/\/$/, '')}/v1/generate`;

  const body = {
    prompt:    instruction,
    image_url: imageUrl || undefined,
    preset:    preset || undefined,
    duration:  durationSec || undefined,
  };

  const data = await fetchJson(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
    name: 'seedream4', // or 'seedance' / 'nanobanana'
  });
  

  // Try a few common shapes for the output URL / id
  const urlOut =
    data.url ||
    data.output?.[0] ||
    data.result?.video_url ||
    data.result?.url;

  if (!urlOut) throw new Error(`${NAME} returned no url`);

  const jobId = data.jobId || data.id || data.job_id;

  return {
    type:        'video',
    url:         urlOut,
    durationSec,
    provider:    'seedream4',
    jobId,
  };
}

module.exports = { name: NAME, animate };
