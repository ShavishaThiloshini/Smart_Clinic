/**
 * test-auth.js
 *
 * Automated test script for JWT authentication + role-based middleware.
 *
 * Tests all cases without Postman:
 *   1.  GET  /api/auth/me          — no token              → expect 401
 *   2.  GET  /api/auth/me          — tampered token         → expect 401
 *   3.  GET  /api/admin/dashboard  — no token              → expect 401
 *   4.  POST /api/auth/login       — bad credentials       → expect 401
 *   5.  POST /api/auth/login       — missing fields        → expect 422
 *   6.  POST /api/auth/login       — valid patient login   → expect 200 + token
 *   7.  GET  /api/auth/me          — valid patient token   → expect 200
 *   8.  GET  /api/admin/dashboard  — patient token (wrong role) → expect 403
 *
 * Usage:
 *   node scripts/test-auth.js
 *
 * Requires the server to already be running:
 *   npm run dev      (in a separate terminal)
 */

'use strict';

require('dotenv').config();

const BASE_URL = `http://localhost:${process.env.PORT || 5000}`;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

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
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  let json = null;
  try { json = await res.json(); } catch (_) {}

  return { status: res.status, json };
}

// ─────────────────────────────────────────────────────────────────────────────
// Edit these credentials to match a real user in your DB
// ─────────────────────────────────────────────────────────────────────────────
const TEST_PATIENT = {
  email:    'patient@smartclinic.com',  // ← change to a real patient email
  password: 'Test@1234'                  // ← change to the real password
};

// ─────────────────────────────────────────────────────────────────────────────
// Test runner
// ─────────────────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n══════════════════════════════════════════════════');
  console.log('  Smart Clinic — Auth + RBAC Middleware Tests');
  console.log(`  Server: ${BASE_URL}`);
  console.log('══════════════════════════════════════════════════\n');

  // ── Test 1: GET /api/auth/me — no token ──────────────────────────────────
  console.log('── Protected Route (No Token) ──────────────────────');
  {
    const { status, json } = await request('GET', '/api/auth/me');
    assert(
      'GET /api/auth/me without token → 401',
      status === 401,
      `got ${status}: ${json?.message}`
    );
    assert(
      'Response has success:false',
      json?.success === false,
      JSON.stringify(json)
    );
  }

  // ── Test 2: GET /api/auth/me — tampered/invalid token ────────────────────
  {
    const { status, json } = await request('GET', '/api/auth/me', {
      token: 'this.is.a.fake.token'
    });
    assert(
      'GET /api/auth/me with invalid token → 401',
      status === 401,
      `got ${status}: ${json?.message}`
    );
  }

  // ── Test 3: GET /api/admin/dashboard — no token ───────────────────────────
  console.log('\n── Admin Route (No Token) ───────────────────────────');
  {
    const { status, json } = await request('GET', '/api/admin/dashboard');
    assert(
      'GET /api/admin/dashboard without token → 401',
      status === 401,
      `got ${status}: ${json?.message}`
    );
  }

  // ── Test 4: Login — bad credentials ──────────────────────────────────────
  console.log('\n── Login Validation ─────────────────────────────────');
  {
    const { status, json } = await request('POST', '/api/auth/login', {
      body: { email: 'nobody@example.com', password: 'WrongPass99' }
    });
    assert(
      'POST /api/auth/login with bad credentials → 401',
      status === 401,
      `got ${status}: ${json?.message}`
    );
  }

  // ── Test 5: Login — missing fields ────────────────────────────────────────
  {
    const { status, json } = await request('POST', '/api/auth/login', {
      body: {}
    });
    assert(
      'POST /api/auth/login with empty body → 422',
      status === 422,
      `got ${status}: ${json?.message}`
    );
  }

  // ── Test 6: Login — valid credentials ────────────────────────────────────
  console.log('\n── Valid Login + Protected Routes ───────────────────');
  let patientToken = null;
  {
    const { status, json } = await request('POST', '/api/auth/login', {
      body: TEST_PATIENT
    });
    assert(
      'POST /api/auth/login with valid credentials → 200',
      status === 200,
      `got ${status}: ${json?.message}`
    );
    assert(
      'Response contains a token string',
      typeof json?.token === 'string' && json.token.length > 0,
      JSON.stringify(json)
    );
    if (json?.token) patientToken = json.token;
  }

  if (!patientToken) {
    console.log('\n  ⚠️  Skipping token-dependent tests (login failed).');
    console.log('     → Update TEST_PATIENT credentials at the top of this file.\n');
  } else {
    // ── Test 7: GET /api/auth/me — valid token ──────────────────────────────
    {
      const { status, json } = await request('GET', '/api/auth/me', {
        token: patientToken
      });
      assert(
        'GET /api/auth/me with valid token → 200',
        status === 200,
        `got ${status}: ${json?.message}`
      );
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
      if (json?.user) {
        console.log(`         👤  Logged in as: ${json.user.name} (${json.user.role})`);
      }
    }

    // ── Test 8: GET /api/admin/dashboard — patient token (wrong role) ────────
    console.log('\n── Role-Based Access Control ────────────────────────');
    {
      const { status, json } = await request('GET', '/api/admin/dashboard', {
        token: patientToken
      });
      assert(
        'GET /api/admin/dashboard with patient token → 403',
        status === 403,
        `got ${status}: ${json?.message}`
      );
      assert(
        'Response has success:false',
        json?.success === false,
        JSON.stringify(json)
      );
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const total = passed + failed;
  console.log('\n══════════════════════════════════════════════════');
  console.log(`  Results: ${passed}/${total} passed  |  ${failed} failed`);
  console.log('══════════════════════════════════════════════════\n');

  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error('\n  Fatal error running tests:', err.message);
  if (err.cause?.code === 'ECONNREFUSED') {
    console.error('  → Is the server running? Start it with: npm run dev\n');
  }
  process.exit(1);
});
