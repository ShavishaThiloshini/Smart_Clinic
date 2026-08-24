/**
 * test-auth.js
 *
 * Automated test script for JWT authentication + role-based middleware.
 *
 * Usage:
 *   node scripts/test-auth.js
 *
 * Requires the server to already be running:
 *   npm run dev      (in a separate terminal)
 */

'use strict';

const {
  SEED_USERS,
  resetCounters,
  assert,
  request,
  printHeader,
  printSummary
} = require('./test-helpers');

async function run() {
  resetCounters();
  printHeader('Smart Clinic — Auth + RBAC Middleware Tests');

  console.log('── Protected Route (No Token) ──────────────────────');
  {
    const { status, json } = await request('GET', '/api/auth/me');
    assert('GET /api/auth/me without token → 401', status === 401, `got ${status}: ${json?.message}`);
    assert('Response has success:false', json?.success === false, JSON.stringify(json));
  }

  {
    const { status, json } = await request('GET', '/api/auth/me', { token: 'this.is.a.fake.token' });
    assert('GET /api/auth/me with invalid token → 401', status === 401, `got ${status}: ${json?.message}`);
  }

  console.log('\n── Admin Route (No Token) ───────────────────────────');
  {
    const { status, json } = await request('GET', '/api/admin/dashboard');
    assert('GET /api/admin/dashboard without token → 401', status === 401, `got ${status}: ${json?.message}`);
  }

  console.log('\n── Login Validation ─────────────────────────────────');
  {
    const { status, json } = await request('POST', '/api/auth/login', {
      body: { email: 'nobody@example.com', password: 'WrongPass99' }
    });
    assert('POST /api/auth/login with bad credentials → 401', status === 401, `got ${status}: ${json?.message}`);
  }

  {
    const { status, json } = await request('POST', '/api/auth/login', { body: {} });
    assert('POST /api/auth/login with empty body → 422', status === 422, `got ${status}: ${json?.message}`);
  }

  console.log('\n── Valid Login + Protected Routes ───────────────────');
  let patientToken = null;
  {
    const { status, json } = await request('POST', '/api/auth/login', { body: SEED_USERS.patient });
    assert('POST /api/auth/login with valid credentials → 200', status === 200, `got ${status}: ${json?.message}`);
    assert(
      'Response contains a token string',
      typeof json?.token === 'string' && json.token.length > 0,
      JSON.stringify(json)
    );
    if (json?.token) patientToken = json.token;
  }

  if (!patientToken) {
    console.log('\n  ⚠️  Skipping token-dependent tests (login failed).');
    console.log('     → Run npm run db:seed and start the server with npm run dev.\n');
  } else {
    {
      const { status, json } = await request('GET', '/api/auth/me', { token: patientToken });
      assert('GET /api/auth/me with valid token → 200', status === 200, `got ${status}: ${json?.message}`);
      assert(
        'Response contains user object',
        typeof json?.user === 'object' && json.user !== null,
        JSON.stringify(json)
      );
      assert(
        'User object has no password_hash (safe)',
        !Object.keys(json?.user || {}).includes('password_hash'),
        'password_hash must never be exposed'
      );
    }

    console.log('\n── Role-Based Access Control ────────────────────────');
    {
      const { status, json } = await request('GET', '/api/admin/dashboard', { token: patientToken });
      assert('GET /api/admin/dashboard with patient token → 403', status === 403, `got ${status}: ${json?.message}`);
      assert('Response has success:false', json?.success === false, JSON.stringify(json));
    }
  }

  if (printSummary() > 0) process.exit(1);
}

run().catch((error) => {
  console.error('\n  Fatal error running tests:', error.message);
  if (error.cause?.code === 'ECONNREFUSED') {
    console.error('  → Is the server running? Start it with: npm run dev\n');
  }
  process.exit(1);
});
