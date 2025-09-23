// src/services/visualProviders/index.js
const comfy = require('./comfy');
const pika  = require('./pika');
const mock  = require('./mock');

// NOTE: these three live one level up, in src/services/
function safeRequire(p) { try { return require(p); } catch { return null; } }
const seedream4  = safeRequire('../seedream4');
const nanobanana = safeRequire('../nanobanana');
const seedance   = safeRequire('../seedance'); 

// registry
const PROVIDERS = new Map([
  ['seedream4',  seedream4],
  ['nanobanana', nanobanana],
  ['seedance',   seedance],
  ['pika',       pika],
  ['comfy',      comfy],
  ['mock',       mock],
]);

const get = (name) => getVisualProviderByName(name);
module.exports = { listProviders, getVisualProviderName, getVisualProviderByName, get };


function listProviders() {
  return [...PROVIDERS.entries()]
    .filter(([,mod]) => !!mod)       // only loaded modules
    .map(([name]) => name);
}

function safeRequire(p) {
  try { return require(p); }
  catch (e) { console.error('[prov] failed to load', p, e.message); return null; }
}

// ---- helpers ----
function getVisualProviderByName(name) {
  const norm = String(name || '').toLowerCase();
  return PROVIDERS.get(norm) || null;
}


function getVisualProviderName() {
  // explicit override first
  const raw = (process.env.VISUAL_PROVIDER || process.env.VIDEO_PROVIDER || '').trim().toLowerCase();
  if (PROVIDERS.has(raw)) return raw;

  // auto-pick by available env (order: seedream4 → nanobanana → seedance → pika → mock)
  if (process.env.SEEDREAM_API_BASE && process.env.SEEDREAM_API_KEY) return 'seedream4';
  if (process.env.NANOBANANA_API_URL && process.env.NANOBANANA_API_KEY) return 'nanobanana';
  if (process.env.SEEDANCE_BASE && process.env.SEEDANCE_API_KEY) return 'seedance';
  if (process.env.PIKA_API_KEY) return 'pika';
  return 'mock';
}



// add near other helpers
function providerReady(name) {
  switch (name) {
    case 'seedream4':
      return !!(process.env.SEEDREAM_API_BASE && process.env.SEEDREAM_API_KEY);
    case 'nanobanana':
      return !!(process.env.NANOBANANA_API_URL && process.env.NANOBANANA_API_KEY);
    case 'seedance':
      return !!(process.env.SEEDANCE_API_URL && process.env.SEEDANCE_API_KEY);
    case 'pika':
      return !!process.env.PIKA_API_KEY;
    case 'comfy':
      return !!process.env.COMFY_URL;
    case 'mock':
      return true;
    default:
      return false;
  }
}

// expose a “get” alias if other code expects it
const getVisualProvider = getVisualProviderByName;

// at bottom, include in exports:
module.exports = {
  listProviders,
  getVisualProviderName,
  getVisualProviderByName,
  providerReady,   // optional export
  get: getVisualProviderByName
};