const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), override: true });

if (!process.env.ADMIN_API_TOKEN && process.env.NODE_ENV !== 'production') {
  process.env.ADMIN_API_TOKEN = 'weai-admin-dev-123';
  console.warn('[DEV ONLY] ADMIN_API_TOKEN defaulted');
}


const express = require('express');
const app = express();

app.head('/api/v1/health', (_req, res) => res.sendStatus(200)); // no body
app.get('/api/v1/health',  (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use((req, res, next) => {
  console.log('[REQ]', req.method, req.url);
  next();
});
// const healthRouter = require('./routes/health');
// app.use('/api/v1/health', healthRouter);   // mount first, before other middleware

const corsOptions = require('./utils/corsOptions');
const viewerId = require('./middleware/viewerId');
const logger = require('./utils/logger');
// app.use(require('cors')(corsOptions));
app.use(express.json());

// app.use(viewerId);
app.use(logger); 


const cors = require('cors');
const config = require('./utils/config');

const meRouter = require('./routes/me');
app.use('/api/v1/me', meRouter);

const dbRouter = require('./routes/db');
const personasRouter = require('./routes/personas');
const { loadExamples } = require('./models/personas.store');
const postsRouter = require('./routes/posts');
const simulateRouter = require('./routes/simulate');
const generateRouter = require('./routes/generate');
const diagRouter = require('./routes/diag');
const HOST = process.env.HOST || '127.0.0.1';
const modqueueRouter = require('./routes/modqueue');
const adminAuth = require('./utils/adminAuth');
const auditRouter = require('./routes/audit');
const visualsRouter = require('./routes/visuals');
const { getVisualProviderName } = require('./services/visualProviders');
console.log('[boot] visual provider:', getVisualProviderName());

if ((process.env.VISUAL_PROVIDER || process.env.VIDEO_PROVIDER) === 'pika' && !process.env.PIKA_API_KEY) {
  console.warn('[boot] VISUAL_PROVIDER=pika but PIKA_API_KEY is not set. Using local mock data if the provider errors.');
}


const PORT = parseInt(process.env.PORT || '13080', 10);

const WEB_DIR = path.resolve(__dirname, '../web');
app.use(express.static(WEB_DIR));

app.use(cors(corsOptions));


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
app.use(express.json());
app.use(viewerId);
app.use(logger);


loadExamples();

// --- boot logs so we KNOW what it's binding to ---
console.log('[boot] HOST=%s PORT=%s NODE_ENV=%s', HOST, PORT, config.nodeEnv);

// normalize worker import once
const W = require('./workers/visuals.worker');
const startVisualsWorker = W.startVisualsWorker || W;

// ...
console.log('[boot] ENV', { HOST: process.env.HOST, PORT: process.env.PORT, NODE_ENV: process.env.NODE_ENV });

const server = app.listen(PORT, HOST);

server.once('listening', () => {
  const a = server.address(); // can be object | string | null
  let where = `${HOST}:${PORT}`;
  if (a && typeof a === 'object') where = `${a.address}:${a.port}`;
  else if (typeof a === 'string') where = a;

  console.log(`[boot] API Listening at http://${where} (${process.env.NODE_ENV || 'development'})`);

  try { startVisualsWorker?.(); } catch (e) {
    console.error('[boot] worker start failed:', e);
  }
});

server.on('error', (err) => {
  console.error('[boot] listen error:', err);
  process.exit(1);
});

