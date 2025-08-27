// src/utils/corsOptions.js
const parseList = (s) =>
    (s || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  
  const ALLOWED = parseList(process.env.CORS_ORIGINS);
  
  const corsOptions = {
    origin(origin, callback) {
      // allow curl/server-to-server (no Origin header)
      if (!origin) return callback(null, true);
      if (ALLOWED.length === 0 || ALLOWED.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200,
  };
  
  module.exports = corsOptions;
  