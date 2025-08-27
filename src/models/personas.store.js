const fs = require('fs');
const path = require('path');
const { createPersona } = require('./persona.schema');

let personas = [];

// Load all example JSON personas on startup (optional if folder missing)
function loadExamples() {
  try {
    const dir = path.join(process.cwd(), 'examples');
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
    const loaded = files.map((f) => {
      const raw = fs.readFileSync(path.join(dir, f), 'utf8');
      const data = JSON.parse(raw);
      // Merge with defaults so all fields exist
      return createPersona(data);
    });
    personas = loaded;
    console.log(`[personas.store] loaded ${loaded.length} example persona(s)`);
  } catch (err) {
    console.error('[personas.store] failed to load examples:', err.message);
  }
}

function list() {
  return personas;
}

function add(p) {
  personas.push(createPersona(p));
  return personas[personas.length - 1];
}

function clear() {
  personas = [];
}

module.exports = { loadExamples, list, add, clear };
