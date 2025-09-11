// s../utils/storefile.js
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');

function ensureDirSync(dir = DATA_DIR) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function filePath(name) {
  ensureDirSync();
  return path.join(DATA_DIR, name);
}

function readJsonSync(name, fallback) {
  try {
    const p = filePath(name);
    if (!fs.existsSync(p)) return fallback;
    const buf = fs.readFileSync(p, 'utf8');
    return buf ? JSON.parse(buf) : fallback;
  } catch {
    return fallback;
  }
}

function writeJsonAtomicSync(name, data) {
  const p = filePath(name);
  const tmp = p + '.' + process.pid + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, p);
}

module.exports = {
  filePath,
  readJsonSync,
  writeJsonAtomicSync,
  ensureDirSync,
};
