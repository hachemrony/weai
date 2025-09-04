// src/workers/visuals.worker.js

const jobs  = require('../models/visuals.store');
const posts = require('../models/posts.store');
const audit = require('../models/audit.store'); // you already use audit.add elsewhere
const path = require('path');
const fs  = require('fs');
const fsp = require('fs/promises');


const MOCK_DIR = path.resolve(__dirname, '..', '..', 'mock', 'visuals');
const SAMPLE_MP4 = path.resolve(__dirname, '..', '..', 'examples', 'demo.mp4');

function materializeMockVideo(jobId) {
  if (!fs.existsSync(MOCK_DIR)) fs.mkdirSync(MOCK_DIR, { recursive: true });
  const dest = path.join(MOCK_DIR, `${jobId}.mp4`);
  fs.copyFileSync(SAMPLE_MP4, dest);
  return `/mock/visuals/${jobId}.mp4`;
}

function simulateProviderUrl(job) {
  // Fake URL so we can see something in the data; swap to real provider later
  const ext = job.mode === 'animate' ? 'mp4' : 'jpg';
  return `/mock/visuals/${job.id}.${ext}`;
}

async function writeMockAsset(job) {
    const outDir  = path.resolve(process.cwd(), 'mock', 'visuals');
    await fsp.mkdir(outDir, { recursive: true });                 // <-- use fsp here
  
    const ext     = job.mode === 'animate' ? 'mp4' : 'jpg';
    const outFile = path.join(outDir, `${job.id}.${ext}`);
    const demoSrc = path.resolve(process.cwd(), 'examples', ext === 'mp4' ? 'demo.mp4' : 'demo.jpg');
  
    try {
      await fsp.access(outFile, fs.constants.F_OK);               // ok if it already exists
    } catch {
      await fsp.copyFile(demoSrc, outFile);                       // create the mock file
    }
  
    return `/mock/visuals/${path.basename(outFile)}`;             // leading slash matters
}
  
  
async function processOne(job) {
  // mark processing + audit
  jobs.update(job.id, { status: 'processing' });
  audit.add({ type: 'visual_started', postId: job.postId, jobId: job.id, mode: job.mode });

  try {
    // simulate generation latency
    await new Promise(r => setTimeout(r, 1500));
    const url = await writeMockAsset(job); 

    const mediaItem = {
        kind: 'video', type: 'video/mp4', url,
        provider: 'mock',
        meta: { mode: job.mode, preset: job.preset, durationSec: job.durationSec }
    };

    posts.attachMedia(job.postId, mediaItem);            // you added this in posts.store.js
    jobs.update(job.id, { status: 'finished', result: mediaItem });
    audit.add({ type: 'visual_finished', postId: job.postId, jobId: job.id, meta: mediaItem });
  } catch (err) {
    jobs.update(job.id, { status: 'failed', error: String(err && err.message || err) });
    audit.add({ type: 'visual_failed', postId: job.postId, jobId: job.id, error: String(err && err.message || err) });
  }
}

let _timer = null;
function startVisualsWorker({ intervalMs = 1000 } = {}) {
  if (_timer) return; // already running
  _timer = setInterval(async () => {
    const j = jobs.nextQueued();
    if (!j) return;
    // process sequentially
    await processOne(j);
  }, intervalMs);
  // eslint-disable-next-line no-console
  console.log('[visuals.worker] started');
}

module.exports = { startVisualsWorker };
