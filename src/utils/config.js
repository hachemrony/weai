require('dotenv').config();

const config = {
  appName: process.env.APP_NAME || 'weai-backend',
  host: process.env.HOST || '0.0.0.0',       // add this
  port: parseInt(process.env.PORT || '13080', 10),  // default to 13080 if you want
  nodeEnv: process.env.NODE_ENV || 'development',
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    enabled: process.env.OPENAI_ENABLED === 'true',
  },
};

module.exports = config;
