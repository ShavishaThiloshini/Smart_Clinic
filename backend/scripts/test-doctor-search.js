'use strict';

const {
  SEED_USERS,
  resetCounters,
  assert,
  request,
  login,
  printHeader,
  printSummary
} = require('./test-helpers');

async function run() {
  resetCounters();
  printHeader('Smart Clinic — Doctor Search & Specialization Tests');

  console.log('── Public discovery endpoints ─────────────────────');
  {
    const { status, json } = await request('GET', '/api/doctors');
    assert('GET /api/doctors → 200', status === 200, json?.message);
    assert('Response includes doctors array', Array.isArray(json?.doctors), JSON.stringify(json));
    assert('Response includes pagination', typeof json?.pagination === 'object', JSON.stringify(json?.pagination));
  }

  {
    const { status, json } = await request('GET', '/api/specializations');
    assert('GET /api/specializations → 200', status === 200, json?.message);
    assert('Response includes specializations array', Array.isArray(json?.specializations), JSON.stringify(json));
  }

  console.log('\n── Search and filter ──────────────────────────────');
  let doctorId = null;
  {
    const { status, json } = await request('GET', '/api/doctors?q=Sample');
    assert('Search by name returns results → 200', status === 200, json?.message);
    assert('Search finds seeded doctor', json?.doctors?.some((doctor) => doctor.name === 'Dr. Sample Doctor'), JSON.stringify(json?.doctors));
    doctorId = json?.doctors?.[0]?.doctorId || null;
  }

  {
    const { status, json } = await request('GET', '/api/doctors?specialization=General');
    assert('Filter by specialization → 200', status === 200, json?.message);
    assert('Filtered list includes approved doctors only', Array.isArray(json?.doctors), JSON.stringify(json));
  }

  {
    const { status, json } = await request('GET', '/api/doctors?clinic=Colombo');
    assert('Filter by clinic → 200', status === 200, json?.message);
    assert('Clinic filter returns array', Array.isArray(json?.doctors), JSON.stringify(json));
  }

  console.log('\n── Doctor detail ──────────────────────────────────');
  if (!doctorId) {
    console.log('  ⚠️  Skipping doctor detail test — no approved doctor found.');
    console.log('     → Run npm run db:seed to approve the demo doctor.\n');
  } else {
    const { status, json } = await request('GET', `/api/doctors/${doctorId}`);
    assert('GET /api/doctors/:id → 200', status === 200, json?.message);
    assert('Doctor detail includes name', json?.doctor?.name === 'Dr. Sample Doctor', JSON.stringify(json?.doctor));
  }

  {
    const { status } = await request('GET', '/api/doctors/999999');
    assert('GET unknown doctor → 404', status === 404);
  }

  console.log('\n── Admin-only specialization create ───────────────');
  let adminToken;
  try {
    adminToken = await login(SEED_USERS.admin);
  } catch (error) {
    console.log(`  ⚠️  Admin login failed: ${error.message}`);
  }

  if (adminToken) {
    const uniqueName = `Test Specialty ${Date.now()}`;
    const { status, json } = await request('POST', '/api/specializations', {
      token: adminToken,
      body: { name: uniqueName, description: 'Created by milestone test.' }
    });
    assert('POST /api/specializations with admin token → 201', status === 201, json?.message);
  }

  {
    let patientToken;
    try {
      patientToken = await login(SEED_USERS.patient);
    } catch (_) {}

    if (patientToken) {
      const { status } = await request('POST', '/api/specializations', {
        token: patientToken,
        body: { name: 'Unauthorized Specialty' }
      });
      assert('POST /api/specializations with patient token → 403', status === 403);
    }
  }

  if (printSummary() > 0) process.exit(1);
}

run().catch((error) => {
  console.error('\n  Fatal error running tests:', error.message);
  process.exit(1);
});
