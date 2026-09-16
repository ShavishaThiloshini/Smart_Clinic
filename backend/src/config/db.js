const mysql = require('mysql2/promise');

const useTls = process.env.DB_SSL === 'true';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || 'smart_clinic',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  ...(useTls && {
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
    }
  }),
  waitForConnections: true,
  connectionLimit: 10,
  enableKeepAlive: true
});

async function testConnection() {
  const [rows] = await pool.query('SELECT NOW() AS connected_at');
  console.log('MySQL connected at:', rows[0].connected_at);
  return rows[0];
}

module.exports = {
  pool,
  testConnection
};
