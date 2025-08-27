// Personas controller (skeleton)
async function ping(_req, res) {
    res.json({ ok: true, service: 'personas', ts: new Date().toISOString() });
  }
  
  module.exports = { ping };
  