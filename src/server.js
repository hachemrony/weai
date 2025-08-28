const express = require('express');
const cors = require('cors');
const healthRouter = require('./routes/health');
const config = require('./utils/config');
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

const app = express();
const PORT = config.port;

app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
  res.send(`${config.appName} is running full power 🚀`);
});
app.use(logger); 
app.use('/api/v1/db', dbRouter);
app.use('/api/v1/personas', personasRouter);
app.use('/api/v1/posts', postsRouter); 
app.use('/api/v1/simulate', simulateRouter); 
app.use('/api/v1/generate', generateRouter);
app.use('/api/v1/diag', diagRouter);
app.use('/api/v1/modqueue', modqueueRouter);

app.use('/api/v1/health', healthRouter);
loadExamples();


app.listen(PORT, HOST, () => { 
  console.log(`API listening on http://${HOST}:${PORT} (${config.nodeEnv})`);
});
