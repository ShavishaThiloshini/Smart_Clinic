'use strict';

require('dotenv').config();

const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { pool } = require('../src/config/db');
const { checkServer, BASE_URL } = require('./test-helpers');

const VALIDATION_SUITES = [
  'test-auth-middleware.js',
  'test-patient-profile-validation.js',
  'test-availability-validation.js',
  'test-prescription-validation.js'
];

const API_SUITES = [
  'test-auth.js',
  'test-patient-profile-api.js',
  'test-doctor-profile-api.js',
  'test-doctor-search.js',
  'test-availability.js',
  'test-appointments.js',
  'test-medical-record-security.js',
  'test-prescription-api.js',
  'test-review-api.js',
  'test-notifications.js',
  'test-admin.js'
];

function runSuite(scriptName) {
  console.log(`\n▶ Running ${scriptName}`);
  const result = spawnSync(process.execPath, [path.join(__dirname, scriptName)], {
    stdio: 'inherit',
    env: process.env
  });
  return result.status === 0;
}

async function checkDatabaseIntegrity() {
  const requiredTables = [
    'users', 'specializations', 'clinics', 'patients', 'doctors',
    'doctor_availability', 'appointments', 'medical_records', 'prescriptions',
    'prescription_items', 'notifications', 'reviews', 'audit_logs'
  ];
  const [tableRows] = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name IN (?)`,
    [requiredTables]
  );
  const presentTables = new Set(tableRows.map((row) => row.TABLE_NAME || row.table_name));
  const missingTables = requiredTables.filter((table) => !presentTables.has(table));
  if (missingTables.length > 0) {
    throw new Error(`Missing required tables: ${missingTables.join(', ')}`);
  }

  const [orphanRows] = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM patients p LEFT JOIN users u ON u.user_id = p.user_id WHERE u.user_id IS NULL) AS orphan_patients,
      (SELECT COUNT(*) FROM doctors d LEFT JOIN users u ON u.user_id = d.user_id WHERE u.user_id IS NULL) AS orphan_doctors,
      (SELECT COUNT(*) FROM doctor_availability a LEFT JOIN doctors d ON d.doctor_id = a.doctor_id WHERE d.doctor_id IS NULL) AS orphan_availability,
      (SELECT COUNT(*) FROM appointments a LEFT JOIN patients p ON p.patient_id = a.patient_id LEFT JOIN doctors d ON d.doctor_id = a.doctor_id WHERE p.patient_id IS NULL OR d.doctor_id IS NULL) AS orphan_appointments,
      (SELECT COALESCE(SUM(duplicate_count), 0) FROM (SELECT COUNT(*) - 1 AS duplicate_count FROM appointments GROUP BY doctor_id, appointment_date, start_time HAVING COUNT(*) > 1) duplicates) AS duplicate_appointment_slots
  `);
  const integrity = orphanRows[0];
  const failures = Object.entries(integrity)
    .filter(([, count]) => Number(count) > 0)
    .map(([name, count]) => `${name}=${count}`);
  if (failures.length > 0) {
    throw new Error(`Database integrity checks failed: ${failures.join(', ')}`);
  }
  console.log(`✅ Database integrity: ${requiredTables.length} required tables present; no orphan records or duplicate appointment slots.`);
}

async function run() {
  console.log('\n══════════════════════════════════════════════════');
  console.log('  Smart Clinic — Day 27 Full API/Database Integration');
  console.log('══════════════════════════════════════════════════');

  let failedSuites = 0;
  console.log('\nPhase 1: validation suites');
  for (const suite of VALIDATION_SUITES) {
    if (!runSuite(suite)) failedSuites += 1;
  }

  console.log('\nPhase 2: server and database prerequisites');
  if (!await checkServer()) {
    throw new Error(`Backend server is not reachable at ${BASE_URL}; start MySQL and the backend first.`);
  }
  await pool.query('SELECT 1');
  console.log('✅ Backend health endpoint and MySQL connection are available.');

  console.log('\nPhase 3: API integration suites');
  for (const suite of API_SUITES) {
    if (!runSuite(suite)) failedSuites += 1;
  }

  console.log('\nPhase 4: database integrity');
  try {
    await checkDatabaseIntegrity();
  } catch (error) {
    failedSuites += 1;
    console.error(`❌ ${error.message}`);
  }

  await pool.end();
  console.log('\n══════════════════════════════════════════════════');
  console.log(failedSuites === 0
    ? '  Day 27 integration testing: ALL PASSED'
    : `  Day 27 integration testing: ${failedSuites} suite(s) failed`);
  console.log('══════════════════════════════════════════════════\n');
  process.exit(failedSuites === 0 ? 0 : 1);
}

run().catch(async (error) => {
  console.error(`\nDay 27 integration testing blocked: ${error.message}`);
  await pool.end();
  process.exit(1);
});