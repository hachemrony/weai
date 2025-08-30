// src/utils/adminAuth.js
module.exports = function adminAuth(req, res, next) {
    const expected = (process.env.ADMIN_API_TOKEN || '').trim();
    if (!expected) return res.status(500).json({ error: 'ADMIN_API_TOKEN not set' });
  
    const auth = req.headers.authorization || '';
    const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const headerAlt = req.headers['x-admin-token'] || '';
    const token = String(bearer || headerAlt || '').trim();
  
    if (token !== expected) return res.status(401).json({ error: 'unauthorized' });
    next();
  };
  