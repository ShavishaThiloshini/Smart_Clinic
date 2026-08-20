/**
 * test-doctor.js
 *
 * Automated test script for the Smart Clinic Doctor module.
 *
 * Covers all 7 steps from the Doctor API spec:
 *   Step 1 — DB structure is exercised via profile/availability queries
 *   Step 2 — Model functions tested through API responses
 *   Step 3 — Controller handlers tested for correct logic & status codes
 *   Step 4 — All routes verified (protected + public)
 *   Step 5 — Authentication enforced (401 without token, 403 wrong role)
 *   Step 6 — Database integration (CRUD profile, availability, appointments)
 *   Step 7 — Full test run with results summary
 *
 * Usage:
 *   1.  Start the server:  npm run dev
 *   2.  Run this script:   node scripts/test-doctor.js
 *
 * Requires at least one doctor account to exist in the database.
 * If the credentials below don't match, update DOCTOR_CREDS and PATIENT_CREDS.
 */

'use strict';

require('dotenv').config();

const BASE_URL = `http://localhost:${process.env.PORT || 5000}`;

// ─────────────────────────────────────────────────────────────────────────────
// Test credentials — edit to match real accounts in your DB
// ─────────────────────────────────────────────────────────────────────────────

const DOCTOR_CREDS = {
  email:    'doctor@smartclinic.com',
  password: 'Doctor@1234'
};

const PATIENT_CREDS = {
  email:    'patient@smartclinic.com',
  password: 'Patient@1234'
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
let skipped = 0;

function assert(testName, condition, detail = '') {
  if (condition) {
    console.log(`  ✅  PASS  ${testName}`);
    passed++;
  } else {
    console.log(`  ❌  FAIL  ${testName}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

function skip(testName, reason) {
  console.log(`  ⏭️  SKIP  ${testName} — ${reason}`);
  skipped++;
}

async function request(method, path, { body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    let json = null;
    try { json = await res.json(); } catch (_) {}

    return { status: res.status, json };
  } catch (err) {
    return { status: 0, json: null, error: err.message };
  }
}

async function login(creds) {
  const { status, json } = await request('POST', '/api/auth/login', { body: creds });
  if (status === 200 && json?.token) return json.token;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Test runner
// ─────────────────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('  Smart Clinic — Doctor Module Tests (Steps 1–7)');
  console.log(`  Server: ${BASE_URL}`);
  console.log('══════════════════════════════════════════════════════════════\n');

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 5 — Authentication: obtain tokens
  // ──────────────────────────────────────────────────────────────────────────
  console.log('─── Step 5: Authentication ─────────────────────────────────────\n');

  const doctorToken  = await login(DOCTOR_CREDS);
  const patientToken = await login(PATIENT_CREDS);

  assert(
    'Doctor login returns token',
    typeof doctorToken === 'string' && doctorToken.length > 10,
    'Could not obtain doctor token — check DOCTOR_CREDS at top of file'
  );
  assert(
    'Patient login returns token',
    typeof patientToken === 'string' && patientToken.length > 10,
    'Could not obtain patient token — check PATIENT_CREDS at top of file'
  );
  console.log();

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 4 — Routes: auth enforcement
  // ──────────────────────────────────────────────────────────────────────────
  console.log('─── Step 4 + 5: Route protection ───────────────────────────────\n');

  // No token → 401
  const noTokenProfile = await request('GET', '/api/doctor/profile');
  assert('GET /api/doctor/profile — no token → 401', noTokenProfile.status === 401);

  // Wrong role (patient token on doctor route) → 403
  if (patientToken) {
    const wrongRole = await request('GET', '/api/doctor/profile', { token: patientToken });
    assert('GET /api/doctor/profile — patient token → 403', wrongRole.status === 403);
  } else {
    skip('Wrong role test', 'patient token not available');
  }

  // No token on PUT availability → 401
  const noTokenAvail = await request('PUT', '/api/doctor/availability', { body: { slots: [] } });
  assert('PUT /api/doctor/availability — no token → 401', noTokenAvail.status === 401);
  console.log();

  // ──────────────────────────────────────────────────────────────────────────
  // Remaining tests require doctor token
  // ──────────────────────────────────────────────────────────────────────────

  if (!doctorToken) {
    console.log('  ⚠️  Doctor token unavailable — skipping protected route tests.\n');
    console.log('  Update DOCTOR_CREDS in this file to a valid doctor account.\n');
  } else {

    // ────────────────────────────────────────────────────────────────────────
    // STEP 3 + 6 — Doctor profile CRUD
    // ────────────────────────────────────────────────────────────────────────
    console.log('─── Step 3 + 6: Doctor profile ──────────────────────────────────\n');

    // GET own profile
    const profileRes = await request('GET', '/api/doctor/profile', { token: doctorToken });
    assert('GET /api/doctor/profile → 200', profileRes.status === 200);
    assert(
      'Profile has required fields',
      profileRes.json?.profile?.name && profileRes.json?.profile?.approvalStatus !== undefined,
      JSON.stringify(profileRes.json?.profile)
    );

    // PUT profile — validation error (name too short)
    const badProfile = await request('PUT', '/api/doctor/profile', {
      token: doctorToken,
      body: { name: 'X' }
    });
    assert('PUT /api/doctor/profile — name too short → 422', badProfile.status === 422);
    assert('Validation error has errors object', badProfile.json?.errors?.name !== undefined);

    // PUT profile — valid update
    const goodProfile = await request('PUT', '/api/doctor/profile', {
      token: doctorToken,
      body: {
        name: 'Dr. Smart Test',
        specialization: 'General Medicine',
        clinic: 'Smart Clinic Main',
        qualifications: 'MBBS, MD',
        experience: 5,
        consultationFee: 1500,
        bio: 'Test doctor bio updated by automated test.'
      }
    });
    assert('PUT /api/doctor/profile — valid → 200', goodProfile.status === 200);
    assert(
      'Updated profile reflects changes',
      goodProfile.json?.profile?.name === 'Dr. Smart Test' &&
      goodProfile.json?.profile?.specialization === 'General Medicine',
      JSON.stringify(goodProfile.json?.profile)
    );
    console.log();

    // ────────────────────────────────────────────────────────────────────────
    // STEP 3 + 6 — Availability CRUD
    // ────────────────────────────────────────────────────────────────────────
    console.log('─── Step 3 + 6: Availability ────────────────────────────────────\n');

    // GET current availability
    const availGet = await request('GET', '/api/doctor/availability', { token: doctorToken });
    assert('GET /api/doctor/availability → 200', availGet.status === 200);
    assert('Availability is an array', Array.isArray(availGet.json?.availability));

    // PUT availability — invalid slot (bad day)
    const badAvail = await request('PUT', '/api/doctor/availability', {
      token: doctorToken,
      body: { slots: [{ dayOfWeek: 'Funday', startTime: '09:00', endTime: '17:00' }] }
    });
    assert('PUT /api/doctor/availability — bad dayOfWeek → 422', badAvail.status === 422);

    // PUT availability — startTime >= endTime
    const badTimes = await request('PUT', '/api/doctor/availability', {
      token: doctorToken,
      body: { slots: [{ dayOfWeek: 'Monday', startTime: '17:00', endTime: '09:00' }] }
    });
    assert('PUT /api/doctor/availability — start >= end → 422', badTimes.status === 422);

    // PUT availability — valid schedule
    const validAvail = await request('PUT', '/api/doctor/availability', {
      token: doctorToken,
      body: {
        slots: [
          { dayOfWeek: 'Monday',    startTime: '09:00', endTime: '12:00', slotDuration: 30 },
          { dayOfWeek: 'Wednesday', startTime: '14:00', endTime: '17:00', slotDuration: 30 },
          { dayOfWeek: 'Friday',    startTime: '09:00', endTime: '13:00', slotDuration: 30 }
        ]
      }
    });
    assert('PUT /api/doctor/availability — valid → 200', validAvail.status === 200);
    assert(
      'Saved 3 slots',
      validAvail.json?.availability?.length === 3,
      `Got ${validAvail.json?.availability?.length}`
    );

    // Clear availability
    const clearAvail = await request('PUT', '/api/doctor/availability', {
      token: doctorToken,
      body: { slots: [] }
    });
    assert('PUT /api/doctor/availability — empty → 200 (clears slots)', clearAvail.status === 200);
    assert(
      'Availability cleared to 0 slots',
      clearAvail.json?.availability?.length === 0,
      `Got ${clearAvail.json?.availability?.length}`
    );

    // Restore one slot for further tests
    await request('PUT', '/api/doctor/availability', {
      token: doctorToken,
      body: {
        slots: [
          { dayOfWeek: 'Monday',    startTime: '09:00', endTime: '12:00', slotDuration: 30 },
          { dayOfWeek: 'Wednesday', startTime: '14:00', endTime: '17:00', slotDuration: 30 }
        ]
      }
    });
    console.log();

    // ────────────────────────────────────────────────────────────────────────
    // STEP 3 + 6 — Appointments
    // ────────────────────────────────────────────────────────────────────────
    console.log('─── Step 3 + 6: Appointments ────────────────────────────────────\n');

    const apptRes = await request('GET', '/api/doctor/appointments', { token: doctorToken });
    assert('GET /api/doctor/appointments → 200', apptRes.status === 200);
    assert(
      'Appointments response has pagination fields',
      apptRes.json?.total !== undefined && Array.isArray(apptRes.json?.appointments),
      JSON.stringify(apptRes.json)
    );

    // Filter by status
    const apptFiltered = await request(
      'GET',
      '/api/doctor/appointments?status=pending&limit=5',
      { token: doctorToken }
    );
    assert('GET /api/doctor/appointments?status=pending → 200', apptFiltered.status === 200);

    // Try updating a non-existent appointment
    const badApptStatus = await request('PATCH', '/api/doctor/appointments/999999/status', {
      token: doctorToken,
      body: { status: 'confirmed' }
    });
    assert(
      'PATCH /api/doctor/appointments/999999/status → 404',
      badApptStatus.status === 404
    );

    // Invalid status value
    if (apptRes.json?.appointments?.length > 0) {
      const firstId = apptRes.json.appointments[0].appointmentId;
      const invalidStatus = await request(`PATCH`, `/api/doctor/appointments/${firstId}/status`, {
        token: doctorToken,
        body: { status: 'invalid_value' }
      });
      assert('PATCH with invalid status value → 422', invalidStatus.status === 422);
    } else {
      skip('PATCH invalid status test', 'no appointments in DB');
    }
    console.log();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 4 + 6 — Public Routes (no auth)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('─── Step 4 + 6: Public doctor listing ───────────────────────────\n');

  // List all approved doctors
  const listRes = await request('GET', '/api/doctors');
  assert('GET /api/doctors — no token → 200', listRes.status === 200);
  assert(
    'Listing has pagination fields',
    listRes.json?.total !== undefined && Array.isArray(listRes.json?.doctors),
    JSON.stringify(listRes.json)
  );

  // Search by name
  const nameSearch = await request('GET', '/api/doctors?name=Dr');
  assert('GET /api/doctors?name=Dr → 200', nameSearch.status === 200);

  // Search by specialization
  const specSearch = await request('GET', '/api/doctors?specialization=General');
  assert('GET /api/doctors?specialization=General → 200', specSearch.status === 200);

  // Pagination
  const page2 = await request('GET', '/api/doctors?page=2&limit=5');
  assert('GET /api/doctors?page=2&limit=5 → 200', page2.status === 200);

  // Invalid doctor ID
  const badId = await request('GET', '/api/doctors/999999');
  assert('GET /api/doctors/999999 → 404', badId.status === 404);

  // Non-numeric doctor ID
  const nanId = await request('GET', '/api/doctors/not-a-number');
  assert('GET /api/doctors/not-a-number → 400', nanId.status === 400);

  // If any doctors exist, test the public profile endpoint
  if (listRes.json?.doctors?.length > 0) {
    const firstDoctorId = listRes.json.doctors[0].doctorId;
    const pubProfile = await request('GET', `/api/doctors/${firstDoctorId}`);
    assert(`GET /api/doctors/${firstDoctorId} → 200`, pubProfile.status === 200);
    assert(
      'Public profile has availability array',
      Array.isArray(pubProfile.json?.availability),
      JSON.stringify(pubProfile.json)
    );
  } else {
    skip('Public doctor profile test', 'no approved doctors in DB — approve a doctor account first');
  }
  console.log();

  // ──────────────────────────────────────────────────────────────────────────
  // Summary
  // ──────────────────────────────────────────────────────────────────────────
  const total = passed + failed + skipped;
  console.log('══════════════════════════════════════════════════════════════');
  console.log(`  Results: ${passed} passed  |  ${failed} failed  |  ${skipped} skipped  |  ${total} total`);
  console.log('══════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    console.log('  ⚠️  Some tests failed. Common causes:');
    console.log('       • Wrong credentials in DOCTOR_CREDS / PATIENT_CREDS');
    console.log('       • Doctor account not approved (admin must set approval_status = approved)');
    console.log('       • MySQL is not running or DB_* env vars are incorrect\n');
    process.exit(1);
  } else {
    console.log('  🎉  All tests passed!\n');
    process.exit(0);
  }
}

run().catch(err => {
  console.error('\n  Fatal error:', err.message);
  process.exit(1);
});
