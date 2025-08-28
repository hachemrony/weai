// src/services/moderation.service.js
const OpenAI = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function checkText(input) {
  try {
    const text = (input ?? "").toString();
    if (!text.trim()) return { ok: true, allowed: true, flagged: false };

    const res = await client.moderations.create({
      model: "omni-moderation-latest",
      input: text,
    });

    const r = res && res.results && res.results[0];
    const flagged = !!(r && r.flagged);

    return {
      ok: !flagged,                          // ← critical for your posts.js
      allowed: !flagged,
      flagged,
      reason: flagged ? "Content blocked by moderation." : undefined,
      categories: r && r.categories,
      scores: r && (r.category_scores || r?.category_scores_v2),
    };
  } catch (e) {
    console.error("moderation error:", e?.message || e);
    // Fail-closed: block when moderation can’t run
    return { ok: false, flagged: true, reason: "Moderation unavailable." };
  }
}

module.exports = { checkText };
