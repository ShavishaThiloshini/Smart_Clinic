'use strict';

require('dotenv').config();
const mysql = require('mysql2/promise');
const columns = [['blood_group', 'VARCHAR(5) NULL'], ['emergency_contact_name', 'VARCHAR(100) NULL'], ['emergency_contact_relation', 'VARCHAR(100) NULL'], ['emergency_contact_phone', 'VARCHAR(50) NULL']];

async function migrate() {
  const connection = await mysql.createConnection({ host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 3306), database: process.env.DB_NAME || 'smart_clinic', user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '' });
  for (const [name, definition] of columns) {
    const [existing] = await connection.query(`SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'patients' AND column_name = ?`, [name]);
    if (!existing.length) { await connection.query(`ALTER TABLE patients ADD COLUMN ${name} ${definition}`); console.log(`Added patients.${name}`); }
  }
  await connection.end();
  console.log('Patient profile migration completed.');
}
migrate().catch((error) => { console.error('Migration failed:', error.message); process.exitCode = 1; });
