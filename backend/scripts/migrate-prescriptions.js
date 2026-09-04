require('dotenv').config();
const mysql = require('mysql2/promise');

const dbName = process.env.DB_NAME || 'smart_clinic';
const indexes = [
  ['prescriptions', 'idx_prescriptions_patient_created', 'patient_id, created_at'],
  ['prescriptions', 'idx_prescriptions_doctor_created', 'doctor_id, created_at'],
  ['prescriptions', 'idx_prescriptions_appointment', 'appointment_id'],
  ['prescription_items', 'idx_prescription_items_prescription', 'prescription_id']
];

async function migrate() {
  const connection = await mysql.createConnection({ host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '', database: dbName });
  try {
    for (const [table, name, columns] of indexes) {
      const [rows] = await connection.query('SELECT 1 FROM information_schema.statistics WHERE table_schema = ? AND table_name = ? AND index_name = ? LIMIT 1', [dbName, table, name]);
      if (!rows.length) await connection.query(`ALTER TABLE \`${table}\` ADD INDEX \`${name}\` (${columns})`);
    }
    console.log('Prescription indexes are ready.');
  } finally { await connection.end(); }
}

migrate().catch((error) => { console.error('Prescription migration failed:', error.message); process.exitCode = 1; });
