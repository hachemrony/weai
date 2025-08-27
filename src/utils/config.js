require('dotenv').config();

const config = {
  appName: process.env.APP_NAME || 'weai-backend',
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
};

module.exports = config;
