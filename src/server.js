const express = require('express');
const cors = require('cors');
const healthRouter = require('./routes/health');
const config = require('./utils/config'); // ← add this

const app = express();
const PORT = config.port; // ← use config

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send(`${config.appName} is running full power 🚀`);
});

app.use('/health', healthRouter);

app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT} (${config.nodeEnv})`);
});
