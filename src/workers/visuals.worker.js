// src/workers/visuals.worker.js

const jobs  = require('../models/visuals.store');
const posts = require('../models/posts.store');
const audit = require('../models/audit.store'); // you already use audit.add elsewhere
const path = require('path');
const fs  = require('fs');
const fsp = require('fs/promises');
const { getVisualProvider, getVisualProviderName, getVisualProviderByName } =
  require('../services/visualProviders');

const mockProvider = require('../services/visualProviders/mock');

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
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    if (getVisualProviderName() !== 'mock') await sleep(1200);

    const providerName = (job.provider || getVisualProviderName());
    const provider = getVisualProviderByName(providerName) || getVisualProvider();

    console.log('[visuals] provider=', providerName, 'job=', job.id);
    audit.add({ type: 'visual_provider',
        postId: job.postId, jobId: job.id, provider: providerName });

    if (!job.postId) {
        throw new Error('job missing postId');
        }
        const post = posts.get(job.postId);
        if (!post) {
        throw new Error(`post not found: ${job.postId}`);
        }    

    const opts = {
        jobId: job.id,
        postId: job.postId,
        instruction: job.instruction,
        preset: job.preset,
        durationSec: job.durationSec,
    };

    let mediaItem;
    try {
        mediaItem = await provider.animate(opts);
    } catch (err) {
        console.warn('[visuals] provider=%s failed; retrying with mock. err=%s', providerName, err && err.message);
        audit.add({ type: 'visual_failed', postId: job.postId, jobId: job.id, meta: { provider: providerName, error: String(err && err.message || err) } });

        mediaItem = await mockProvider.animate(opts);
        audit.add({ type: 'visual_retry_mock', postId: job.postId, jobId: job.id });
    }

    posts.attachMedia(job.postId, mediaItem);
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
    await processOne(j);
  }, intervalMs);
  console.log('[visuals.worker] started');
}

module.exports = { startVisualsWorker };
