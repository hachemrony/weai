// src/services/visualProviders/index.js
const mock  = require('./mock');
const comfy = require('./comfy'); // stub for later
const pika  = require('./pika');  // stub for later
const seedance = require('./seedance');

const providers = { mock, comfy, pika, seedance };

function getVisualProviderName() {
    const raw = (process.env.VISUAL_PROVIDER || process.env.VIDEO_PROVIDER || '')
      .trim()
      .toLowerCase();
  
    if (providers[raw]) return raw;          // explicit override
  
    // auto-select if no override
    if (process.env.SEEDANCE_API_KEY) return 'seedance';
    if (process.env.PIKA_API_KEY)     return 'pika';
    return 'mock';
  }
  
  
function getVisualProvider() {
    return providers[getVisualProviderName()];
}
  // NEW: pick a provider explicitly by name (or null if bad)
function getVisualProviderByName(name) {
    const key = String(name || '').trim().toLowerCase();
    return providers[key] || null;
}
  
module.exports = {
    getVisualProvider,
    getVisualProviderName,
    getVisualProviderByName,   // <-- export this
  };