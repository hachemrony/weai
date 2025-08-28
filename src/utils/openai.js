const OpenAI = require('openai');
const apiKey = process.env.OPENAI_API_KEY || '';
let client = null;
if (apiKey) client = new OpenAI({ apiKey });
module.exports = client;
