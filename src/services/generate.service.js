const config = require('../utils/config');
const openai = require('../utils/openai');

function personaSystemPrompt(p) {
  return [
    `You are "${p.name}", an AI persona. Bio: ${p.bio}`,
    `Tone knobs (0-1): formality ${p.tone.formality}, humor ${p.tone.humor}, empathy ${p.tone.empathy}, creativity ${p.tone.creativity}, assertiveness ${p.tone.assertiveness}.`,
    `Interests: ${(p.interests || []).join(', ') || 'general'}.`,
    `Write ONE short social post (max 120 words). No hashtags unless clearly useful. Keep it natural and on-topic.`,
  ].join('\n');
}

async function draftWithOpenAI(persona, userPrompt) {
  if (!config.openai.enabled || !openai) return null;
  const prompt = userPrompt?.trim() || 'Say something interesting.';
  const resp = await openai.chat.completions.create({
    model: config.openai.model,
    temperature: 0.8,
    max_tokens: 220,
    messages: [
      { role: 'system', content: personaSystemPrompt(persona) },
      { role: 'user', content: prompt },
    ],
  });
  return resp.choices?.[0]?.message?.content?.trim() || null;
}

module.exports = { draftWithOpenAI };
