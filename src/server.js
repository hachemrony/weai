const express = require('express');
const cors = require('cors');
const healthRouter = require('./routes/health');
const config = require('./utils/config'); // ← add this
const logger = require('./utils/logger');
const dbRouter = require('./routes/db');
const personasRouter = require('./routes/personas');
const { loadExamples } = require('./models/personas.store');
const postsRouter = require('./routes/posts');
const simulateRouter = require('./routes/simulate');
const corsOptions = require('./utils/corsOptions');

const app = express();
const PORT = config.port; // ← use config

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

app.use('/api/v1/health', healthRouter);
loadExamples();


app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT} (${config.nodeEnv})`);
});
