/**
 * seed.js
 *
 * Creates one test user for each role so you can test the login API
 * immediately without writing any SQL manually.
 *
 * Usage:
 *   node scripts/seed.js
 *
 * Test credentials created:
 * ┌──────────┬────────────────────────────────┬────────────────┐
 * │ Role     │ Email                          │ Password       │
 * ├──────────┼────────────────────────────────┼────────────────┤
 * │ admin    │ admin@smartclinic.com          │ Admin@1234     │
 * │ doctor   │ doctor@smartclinic.com         │ Doctor@1234    │
 * │ patient  │ patient@smartclinic.com        │ Patient@1234   │
 * └──────────┴────────────────────────────────┴────────────────┘
 *
 * Safe to run multiple times — skips users whose email already exists.
 */

'use strict';

require('dotenv').config();

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const SEEDS = [
  {
    name: 'Admin User',
    email: 'admin@smartclinic.com',
    password: 'Admin@1234',
    role: 'admin'
  },
  {
    name: 'Dr. Sample Doctor',
    email: 'doctor@smartclinic.com',
    password: 'Doctor@1234',
    role: 'doctor'
  },
  {
    name: 'Sample Patient',
    email: 'patient@smartclinic.com',
    password: 'Patient@1234',
    role: 'patient'
  }
];

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME || 'smart_clinic',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  console.log('\n🌱  Smart Clinic — Seeding test users\n');

  for (const seed of SEEDS) {
    // Skip if email already exists
    const [existing] = await connection.query(
      'SELECT user_id FROM users WHERE email = ?',
      [seed.email]
    );

    if (existing.length > 0) {
      console.log(`  ⏭️   Skipped  ${seed.role.padEnd(8)}  ${seed.email}  (already exists)`);
      continue;
    }

    const password_hash = await bcrypt.hash(seed.password, 10);

    await connection.beginTransaction();
    try {
      // Insert into users
      const [result] = await connection.query(
        `INSERT INTO users (name, email, password_hash, role, status)
         VALUES (?, ?, ?, ?, 'active')`,
        [seed.name, seed.email, password_hash, seed.role]
      );
      const userId = result.insertId;

      // Create role-specific profile row
      if (seed.role === 'patient') {
        await connection.query(
          'INSERT INTO patients (user_id) VALUES (?)',
          [userId]
        );
      } else if (seed.role === 'doctor') {
        await connection.query(
          `INSERT INTO doctors (user_id, approval_status) VALUES (?, 'pending')`,
          [userId]
        );
      }
      // admin has no extra profile table

      await connection.commit();
      console.log(`  ✅  Created  ${seed.role.padEnd(8)}  ${seed.email}  (id: ${userId})`);
    } catch (err) {
      await connection.rollback();
      console.error(`  ❌  Failed   ${seed.role.padEnd(8)}  ${seed.email}  — ${err.message}`);
    }
  }

  await connection.end();

  console.log('\n══════════════════════════════════════════════════');
  console.log('  Test credentials:');
  console.log('');
  console.log('  admin   → admin@smartclinic.com    / Admin@1234');
  console.log('  doctor  → doctor@smartclinic.com   / Doctor@1234');
  console.log('  patient → patient@smartclinic.com  / Patient@1234');
  console.log('══════════════════════════════════════════════════\n');
}

seed().catch(err => {
  console.error('\n  Fatal:', err.message);
  if (err.code === 'ECONNREFUSED' || err.code === 'ER_ACCESS_DENIED_ERROR') {
    console.error('  → Check your DB_HOST, DB_USER, DB_PASSWORD in .env\n');
  }
  process.exit(1);
});
