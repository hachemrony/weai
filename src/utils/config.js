require('dotenv').config();
const config = {
  appName: process.env.APP_NAME || 'weai-backend',
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    enabled: process.env.OPENAI_ENABLED === 'true',
  },
};
module.exports = config;
