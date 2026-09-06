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
  printHeader('Smart Clinic - Admin Dashboard API Tests');

  const adminToken = await login(SEED_USERS.admin);
  const patientToken = await login(SEED_USERS.patient);

  {
    const { status, json } = await request('GET', '/api/admin/dashboard');
    assert('GET admin dashboard without token -> 401', status === 401, JSON.stringify(json));
  }

  {
    const { status, json } = await request('GET', '/api/admin/dashboard', { token: patientToken });
    assert('Patient cannot access admin dashboard -> 403', status === 403, JSON.stringify(json));
    assert('Forbidden response has success:false', json?.success === false, JSON.stringify(json));
  }

  {
    const { status, json } = await request('GET', '/api/admin/dashboard', { token: adminToken });
    assert('Admin can access dashboard -> 200', status === 200, JSON.stringify(json));
    assert('Dashboard response is successful', json?.success === true, JSON.stringify(json));
    assert('Dashboard identifies admin requester', json?.requestedBy?.role === 'admin', JSON.stringify(json));

    const expectedMetrics = [
      'totalUsers',
      'totalPatients',
      'totalDoctors',
      'activeUsers',
      'totalAppointments',
      'pendingAppointments',
      'confirmedAppointments',
      'completedAppointments'
    ];
    assert(
      'Dashboard includes all system metrics',
      expectedMetrics.every((metric) => Object.prototype.hasOwnProperty.call(json?.stats || {}, metric)),
      JSON.stringify(json)
    );
    assert(
      'Dashboard metrics are non-negative numbers',
      expectedMetrics.every((metric) => Number(json?.stats?.[metric]) >= 0),
      JSON.stringify(json)
    );
  }

  if (printSummary() > 0) process.exit(1);
}

run().catch((error) => {
  console.error('\n  Fatal error running tests:', error.message);
  process.exit(1);
});