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
  printHeader('Smart Clinic — Patient Profile API Tests');

  console.log('── Auth guards ────────────────────────────────────');
  {
    const { status } = await request('GET', '/api/patient/profile');
    assert('GET /api/patient/profile without token → 401', status === 401);
  }

  let patientToken;
  let doctorToken;
  try {
    patientToken = await login(SEED_USERS.patient);
    doctorToken = await login(SEED_USERS.doctor);
  } catch (error) {
    console.log(`\n  ⚠️  ${error.message}`);
    console.log('     → Run npm run db:seed and start the server with npm run dev.\n');
    process.exit(1);
  }

  console.log('\n── Role-based access ──────────────────────────────');
  {
    const { status } = await request('GET', '/api/patient/profile', { token: doctorToken });
    assert('GET /api/patient/profile with doctor token → 403', status === 403);
  }

  console.log('\n── Patient profile CRUD ───────────────────────────');
  {
    const { status, json } = await request('GET', '/api/patient/profile', { token: patientToken });
    assert('GET patient profile → 200', status === 200, json?.message);
    assert('Response includes profile object', typeof json?.profile === 'object', JSON.stringify(json));
  }

  {
    const { status, json } = await request('PUT', '/api/patient/profile', {
      token: patientToken,
      body: {
        name: 'Sample Patient',
        phone: '+94 77 123 4567',
        dateOfBirth: '1995-04-12',
        gender: 'female',
        address: '12 Main Street, Colombo',
        medicalInfo: 'No known allergies.',
        bloodGroup: 'O+',
        emergencyContactName: 'Kamal Perera',
        emergencyContactRelation: 'Father',
        emergencyContactPhone: '+94 77 987 6543'
      }
    });
    assert('PUT patient profile with valid payload → 200', status === 200, json?.message);
    assert('Updated profile returns saved phone', json?.profile?.phone === '+94 77 123 4567', JSON.stringify(json?.profile));
  }

  {
    const { status, json } = await request('PUT', '/api/patient/profile', {
      token: patientToken,
      body: { name: 'A', phone: 'invalid' }
    });
    assert('PUT patient profile with invalid payload → 422', status === 422, json?.message);
    assert('Validation errors are returned', typeof json?.errors === 'object', JSON.stringify(json));
  }

  if (printSummary() > 0) process.exit(1);
}

run().catch((error) => {
  console.error('\n  Fatal error running tests:', error.message);
  process.exit(1);
});
