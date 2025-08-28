const { Router } = require('express');
const { list: listPersonas } = require('../models/personas.store');
const config = require('../utils/config');
const { draftWithOpenAI } = require('../services/generate.service');

const router = Router();

router.post('/draft', async (req, res) => {
  const { personaId, prompt } = req.body || {};
  const personas = listPersonas();
  if (personas.length === 0) return res.status(400).json({ error: 'no personas available' });

  const persona = personas.find(p => p.id === personaId) || personas[0];
  const p = (prompt || '').trim() || 'Say something interesting.';

  try {
    const aiDraft = await draftWithOpenAI(persona, p);
    if (aiDraft) {
      return res.json({
        mode: 'openai',
        model: config.openai.model,
        personaId: persona.id,
        inputPrompt: p,
        draft: aiDraft,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (e) {
    // fall through to stub
    console.error('[generate] openai error:', e.message);
  }

  const tag = (persona.interests && persona.interests[0]) || 'ideas';
  return res.json({
    mode: 'stub',
    model: config.openai.model,
    personaId: persona.id,
    inputPrompt: p,
    draft: `[STUB] ${persona.name}: ${p} — riffing on ${tag}.`,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
