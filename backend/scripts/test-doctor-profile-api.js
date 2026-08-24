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
  printHeader('Smart Clinic — Doctor Profile API Tests');

  console.log('── Auth guards ────────────────────────────────────');
  {
    const { status } = await request('GET', '/api/doctor/profile');
    assert('GET /api/doctor/profile without token → 401', status === 401);
  }

  let doctorToken;
  let patientToken;
  try {
    doctorToken = await login(SEED_USERS.doctor);
    patientToken = await login(SEED_USERS.patient);
  } catch (error) {
    console.log(`\n  ⚠️  ${error.message}`);
    console.log('     → Run npm run db:seed and start the server with npm run dev.\n');
    process.exit(1);
  }

  console.log('\n── Role-based access ──────────────────────────────');
  {
    const { status } = await request('GET', '/api/doctor/profile', { token: patientToken });
    assert('GET /api/doctor/profile with patient token → 403', status === 403);
  }

  console.log('\n── Doctor profile CRUD ────────────────────────────');
  {
    const { status, json } = await request('GET', '/api/doctor/profile', { token: doctorToken });
    assert('GET doctor profile → 200', status === 200, json?.message);
    assert('Response includes profile object', typeof json?.profile === 'object', JSON.stringify(json));
  }

  {
    const { status, json } = await request('PUT', '/api/doctor/profile', {
      token: doctorToken,
      body: {
        name: 'Dr. Sample Doctor',
        specialization: 'General Practitioner',
        clinic: 'Smart Clinic Colombo',
        qualifications: 'MBBS, MD (General Medicine)',
        experience: 10,
        consultationFee: 2500,
        bio: 'Experienced general practitioner available for online appointments.'
      }
    });
    assert('PUT doctor profile with valid payload → 200', status === 200, json?.message);
    assert('Updated profile returns specialization', json?.profile?.specialization === 'General Practitioner', JSON.stringify(json?.profile));
    assert('Updated profile returns clinic', json?.profile?.clinic === 'Smart Clinic Colombo', JSON.stringify(json?.profile));
  }

  {
    const { status, json } = await request('PUT', '/api/doctor/profile', {
      token: doctorToken,
      body: { name: 'A', experience: -1 }
    });
    assert('PUT doctor profile with invalid payload → 422', status === 422, json?.message);
  }

  if (printSummary() > 0) process.exit(1);
}

run().catch((error) => {
  console.error('\n  Fatal error running tests:', error.message);
  process.exit(1);
});
