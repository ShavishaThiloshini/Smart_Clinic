const { Pool } = require('pg');

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/smart_clinic',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testConnection() {
  const result = await pool.query('SELECT NOW()');
  console.log('PostgreSQL connected at:', result.rows[0].now);
  return result;
}

module.exports = {
  pool,
  testConnection
};
