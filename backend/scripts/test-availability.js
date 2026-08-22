/**
 * test-availability.js
 *
 * Integration tests for doctor availability API + database.
 *
 * Usage:
 *   node scripts/test-availability.js
 *
 * Requires:
 *   - Server running: npm run dev
 *   - Seeded users: npm run db:seed
 */

'use strict';

require('dotenv').config();

const BASE_URL = `http://localhost:${process.env.PORT || 5000}`;

const TEST_DOCTOR = {
  email: 'doctor@smartclinic.com',
  password: 'Doctor@1234'
};

const TEST_PATIENT = {
  email: 'patient@smartclinic.com',
  password: 'Patient@1234'
};

let passed = 0;
let failed = 0;

function assert(testName, condition, detail = '') {
  if (condition) {
    console.log(`  ✅  PASS  ${testName}`);
    passed++;
  } else {
    console.log(`  ❌  FAIL  ${testName}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

async function request(method, path, { body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  let json = null;
  try { json = await res.json(); } catch (_) {}

  return { status: res.status, json };
}

async function login(credentials) {
  const { status, json } = await request('POST', '/api/auth/login', { body: credentials });
  if (status !== 200 || !json?.token) {
    throw new Error(`Login failed for ${credentials.email}: ${json?.message || status}`);
  }
  return json.token;
}

async function run() {
  console.log('\n══════════════════════════════════════════════════');
  console.log('  Smart Clinic — Doctor Availability API Tests');
  console.log(`  Server: ${BASE_URL}`);
  console.log('══════════════════════════════════════════════════\n');

  console.log('── Auth guards ────────────────────────────────────');
  {
    const { status } = await request('GET', '/api/doctor/availability');
    assert('GET /api/doctor/availability without token → 401', status === 401);
  }

  let doctorToken;
  let patientToken;
  try {
    doctorToken = await login(TEST_DOCTOR);
    patientToken = await login(TEST_PATIENT);
  } catch (error) {
    console.log(`\n  ⚠️  ${error.message}`);
    console.log('     → Run npm run db:seed and start the server with npm run dev.\n');
    process.exit(1);
  }

  console.log('\n── Role-based access ──────────────────────────────');
  {
    const { status } = await request('GET', '/api/doctor/availability', { token: patientToken });
    assert('GET /api/doctor/availability with patient token → 403', status === 403);
  }

  console.log('\n── Doctor availability CRUD ───────────────────────');
  let doctorId = null;
  {
    const { status, json } = await request('GET', '/api/doctor/availability', { token: doctorToken });
    assert('GET availability for doctor → 200', status === 200, json?.message);
    assert('Response includes availability array', Array.isArray(json?.availability), JSON.stringify(json));
  }

  {
    const { status, json } = await request('PUT', '/api/doctor/availability', {
      token: doctorToken,
      body: {
        availability: [
          { dayOfWeek: 'Monday', startTime: '09:00', endTime: '12:00', slotDuration: 30, status: true },
          { dayOfWeek: 'Wednesday', startTime: '14:00', endTime: '18:00', slotDuration: 45, status: true }
        ]
      }
    });
    assert('PUT availability with valid payload → 200', status === 200, json?.message);
    assert('Saved availability has 2 slots', json?.availability?.length === 2, JSON.stringify(json?.availability));
    assert('Times are normalized to HH:mm', json?.availability?.[0]?.startTime === '09:00', JSON.stringify(json?.availability?.[0]));
    assert('Status is returned as boolean', json?.availability?.[0]?.status === true, JSON.stringify(json?.availability?.[0]?.status));
  }

  {
    const { status, json } = await request('PUT', '/api/doctor/availability', {
      token: doctorToken,
      body: {
        availability: [
          { dayOfWeek: 'Monday', startTime: '17:00', endTime: '09:00', slotDuration: 30, status: true }
        ]
      }
    });
    assert('PUT availability with invalid times → 422', status === 422, json?.message);
  }

  {
    const { status, json } = await request('GET', '/api/doctor/availability', { token: doctorToken });
    assert('GET after save returns persisted slots → 200', status === 200, json?.message);
    assert('Persisted slots count is 2', json?.availability?.length === 2, JSON.stringify(json?.availability));
  }

  console.log('\n── Public availability lookup ─────────────────────');
  {
    const { status, json } = await request('GET', '/api/doctors/999999/availability');
    assert('GET unknown doctor availability → 404', status === 404, json?.message);
  }

  {
    const profile = await request('GET', '/api/doctor/profile', { token: doctorToken });
    if (profile.status === 200) {
      const search = await request('GET', '/api/doctors?limit=50');
      const doctor = search.json?.doctors?.find((item) => item.name === 'Dr. Sample Doctor');
      doctorId = doctor?.doctorId || null;
    }
  }

  if (!doctorId) {
    console.log('  ⚠️  Skipping public availability test — doctor is not approved yet.');
  } else {
    const { status, json } = await request('GET', `/api/doctors/${doctorId}/availability`);
    assert('GET public doctor availability → 200', status === 200, json?.message);
    assert('Public response includes active slots only', Array.isArray(json?.availability), JSON.stringify(json));
    assert('Public slots exclude disabled entries', json?.availability?.every((slot) => slot.status === true), JSON.stringify(json?.availability));
  }

  const total = passed + failed;
  console.log('\n══════════════════════════════════════════════════');
  console.log(`  Results: ${passed}/${total} passed  |  ${failed} failed`);
  console.log('══════════════════════════════════════════════════\n');

  if (failed > 0) process.exit(1);
}

run().catch((error) => {
  console.error('\n  Fatal error running tests:', error.message);
  if (error.cause?.code === 'ECONNREFUSED') {
    console.error('  → Is the server running? Start it with: npm run dev\n');
  }
  process.exit(1);
});
