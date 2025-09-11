const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), override: true });

if (!process.env.ADMIN_API_TOKEN && process.env.NODE_ENV !== 'production') {
  process.env.ADMIN_API_TOKEN = 'weai-admin-dev-123';
  console.warn('[DEV ONLY] ADMIN_API_TOKEN defaulted');
}


const express = require('express');
const cors = require('cors');
const healthRouter = require('./routes/health');
const config = require('./utils/config');

const viewerId = require('./middleware/viewerId');
const app = express();

const meRouter = require('./routes/me');
app.use('/api/v1/me', meRouter);

const logger = require('./utils/logger');
const dbRouter = require('./routes/db');
const personasRouter = require('./routes/personas');
const { loadExamples } = require('./models/personas.store');
const postsRouter = require('./routes/posts');
const simulateRouter = require('./routes/simulate');
const corsOptions = require('./utils/corsOptions');
const generateRouter = require('./routes/generate');
const diagRouter = require('./routes/diag');
const HOST = process.env.HOST || '127.0.0.1';
const modqueueRouter = require('./routes/modqueue');
const adminAuth = require('./utils/adminAuth');
const auditRouter = require('./routes/audit');
const visualsRouter = require('./routes/visuals');
const { startVisualsWorker } = require('./workers/visuals.worker');
const { getVisualProviderName } = require('./services/visualProviders');
console.log('[boot] visual provider:', getVisualProviderName());

if ((process.env.VISUAL_PROVIDER || process.env.VIDEO_PROVIDER) === 'pika' && !process.env.PIKA_API_KEY) {
  console.warn('[boot] VISUAL_PROVIDER=pika but PIKA_API_KEY is not set. Using local mock data if the provider errors.');
}


const PORT = config.port;

const WEB_DIR = path.resolve(__dirname, '../web');
app.use(express.static(WEB_DIR));

app.use(cors(corsOptions));
app.use(express.json());
app.use(viewerId);
app.use(logger); 

app.get('/admin', (_req, res) => {
  res.sendFile(path.join(WEB_DIR, 'admin.html'));
});

app.get('/', (req, res) => {
  res.send(`${config.appName} is running full power 🚀`);
});
app.use('/api/v1/db', dbRouter);
app.use('/api/v1/personas', personasRouter);
app.use('/api/v1/posts', postsRouter); 
// app.use('/api/v1/simulate', simulateRouter); 
app.use('/api/v1/generate', generateRouter);
app.use('/api/v1/diag', diagRouter);

app.use('/api/v1/modqueue', adminAuth, modqueueRouter);
app.use('/api/v1/audit', adminAuth, auditRouter);
app.use(express.static(path.resolve(__dirname, 'web')));
app.use('/api/v1/visuals', visualsRouter);
app.use('/mock', express.static(path.resolve(__dirname, '..', 'mock')));


app.use('/api/v1/health', healthRouter);
loadExamples();

startVisualsWorker();
app.listen(PORT, HOST, () => { 
  console.log(`API listening on http://${HOST}:${PORT} (${config.nodeEnv})`);
});
