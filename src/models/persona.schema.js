// Minimal persona schema (shape + defaults). No DB yet.
const PersonaSchema = {
    id: 'string', // uuid to be assigned later
    name: 'string',
    avatarUrl: 'string?', // optional
    bio: 'string',
    // Tone & behavior knobs (0–1 floats unless noted)
    tone: {
      formality: 0.5,
      humor: 0.5,
      empathy: 0.5,
      creativity: 0.5,
      assertiveness: 0.5,
    },
    interests: [], // array of strings (topics/tags)
    // Activity rhythm
    rhythm: {
      postsPerDayMin: 1,
      postsPerDayMax: 3,
      activeHoursLocal: [9, 22], // 24h range
      timezone: 'UTC',
    },
    // Triggers that cause actions
    triggers: {
      followTrends: true,
      trendTags: [], // seed tags it cares about
      reactToMentions: true,
      replyProbability: 0.4,
      likeProbability: 0.6,
    },
    // Lifecycle / autonomy
    lifecycle: {
      ttlDays: 30, // persona expires after this if inactive
      decayRate: 0.01, // reduces activity each day without engagement
      evolveOnThreshold: true, // adopt traits when engagement spikes
    },
    // Safety & messaging
    safety: {
      allowDM: true,
      contentRating: 'PG-13', // PG, PG-13, R (we’ll gate later)
    },
    // Memory handles (for embeddings/vector DB later)
    memory: {
      summary: '', // running synopsis
      vectorKey: null, // id in vector store (later)
    },
  };
  
  // Lightweight helper to create a persona with overrides
  function createPersona(overrides = {}) {
    // Deep-ish merge without external deps (shallow for nested objects)
    const base = JSON.parse(JSON.stringify(PersonaSchema));
    return {
      ...base,
      ...overrides,
      tone: { ...base.tone, ...(overrides.tone || {}) },
      rhythm: { ...base.rhythm, ...(overrides.rhythm || {}) },
      triggers: { ...base.triggers, ...(overrides.triggers || {}) },
      lifecycle: { ...base.lifecycle, ...(overrides.lifecycle || {}) },
      safety: { ...base.safety, ...(overrides.safety || {}) },
      memory: { ...base.memory, ...(overrides.memory || {}) },
    };
  }
  
  module.exports = { PersonaSchema, createPersona };
  