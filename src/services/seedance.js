// src/services/seedance.js
const NAME = 'seedance';
const { fetchJson } = require('../utils/http');

async function animate(instruction, imageUrl, preset, durationSec, opts = {}) {
  const base = process.env.SEEDANCE_BASE;
  const key  = process.env.SEEDANCE_API_KEY;
  if (!base || !key) throw new Error(`${NAME} not configured`);

  const url  = `${base.replace(/\/$/,'')}/v1/generate`;
  const body = {
    prompt: instruction,
    image_url: imageUrl || undefined,
    preset: preset || undefined,
    duration: durationSec || undefined,
  };

  const data = await fetchJson(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  const outUrl = data.result?.video_url || data.output?.[0]?.url;
  if (!outUrl) throw new Error(`${NAME} returned no url`);

  return {
    type: 'video',
    url: outUrl,
    provider: NAME,
    jobId: data.jobId || data.id,
  };
}

module.exports = { name: NAME, animate };
