const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

// Only create a pool if a URL is provided
const pool = connectionString
  ? new Pool({ connectionString, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false })
  : null;

async function checkDb() {
  if (!pool) {
    return { connected: false, message: 'DATABASE_URL not set' };
  }
  try {
    const res = await pool.query('SELECT 1');
    return { connected: true, result: res.rows[0] };
  } catch (err) {
    return { connected: false, error: err.message };
  }
}

module.exports = { pool, checkDb };
