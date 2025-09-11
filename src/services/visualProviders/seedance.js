// Seedance provider (stub). Safe to keep in repo even without a key.
const { SEEDANCE_API_KEY = '' } = process.env;

module.exports = {
  name: 'seedance',

  // Only “on” when a key is present
  enabled() {
    return !!SEEDANCE_API_KEY;
  },

  // Image API shape (adjust later to real API)
  async generateImage({ prompt, width = 1024, height = 1024, seed = null }) {
    if (!SEEDANCE_API_KEY) throw new Error('seedance_not_configured');
    // TODO: call real Seedance image endpoint here
    return {
      url: null,           // real URL later
      provider: 'seedance',
      kind: 'image',
      type: 'generated',
      jobId: null,         // fill when API returns job IDs
      meta: { width, height, seed, prompt }
    };
  },

  // Video API shape (adjust later to real API)
  async generateVideo({ prompt, durationSec = 5, preset = 'short' }) {
    if (!SEEDANCE_API_KEY) throw new Error('seedance_not_configured');
    // TODO: call real Seedance video endpoint here
    return {
      url: null,
      provider: 'seedance',
      kind: 'video',
      type: 'generated',
      jobId: null,
      meta: { durationSec, preset, prompt }
    };
  }
};
