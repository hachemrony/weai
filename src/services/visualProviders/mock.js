const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');

const name = 'mock';

const OUT_DIR = path.resolve(process.cwd(), 'mock', 'visuals');
const DEMO_MP4 = path.resolve(process.cwd(), 'examples', 'demo.mp4');

async function animate({ jobId, instruction, preset = 'pan', durationSec = 4 }) {
  await fsp.mkdir(OUT_DIR, { recursive: true });
  const dest = path.join(OUT_DIR, `${jobId}.mp4`);

  console.log(`[provider:${name}] animate() job=${jobId}`);

  try {
    await fsp.access(dest, fs.constants.F_OK);
  } catch {
    await fsp.copyFile(DEMO_MP4, dest);
  }

  return {
    kind: 'video',
    type: 'video/mp4',
    url: `/mock/visuals/${jobId}.mp4`,
    provider: name,
    meta: { instruction, preset, durationSec },
  };
}

module.exports = { animate };
