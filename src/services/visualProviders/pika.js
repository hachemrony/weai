// src/services/visualProviders/pika.js
const name = 'pika';

/**
 * Skeleton adapter for Pika.
 * Step 39: only environment checks + deliberate failure so the worker
 *          retries with the mock provider. We'll wire the real HTTP
 *          call in the next step.
 */
async function animate({ jobId, instruction, preset = 'pan', durationSec = 4 }) {
  console.log(`[provider:${name}] animate called job=${jobId}`);

  const apiKey = process.env.PIKA_API_KEY;
  if (!apiKey) {
    // Worker will catch this and use the mock fallback
    throw new Error('pika: missing PIKA_API_KEY');
  }

  // Not wired yet (intentionally). Next step = real HTTP call.
  throw new Error('pika: adapter not wired yet');
}

module.exports = { animate };
