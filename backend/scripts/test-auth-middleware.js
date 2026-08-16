'use strict';

/**
 * Lightweight JWT/RBAC checks that do not require MySQL or a running server.
 * Run with: npm run test:middleware
 */
const jwt = require('jsonwebtoken');
const { protect, authorize } = require('../src/middleware/auth.middleware');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-secret';

let passed = 0;
let failed = 0;

function assert(name, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}`);
  }
}

function response() {
  return {
    statusCode: null,
    payload: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; }
  };
}

function runMiddleware(middleware, req) {
  const res = response();
  let nextCalled = false;
  middleware(req, res, () => { nextCalled = true; });
  return { req, res, nextCalled };
}

const noToken = runMiddleware(protect, { headers: {} });
assert('missing token returns 401', noToken.res.statusCode === 401 && !noToken.nextCalled);

const invalidToken = runMiddleware(protect, {
  headers: { authorization: 'Bearer invalid.token.value' }
});
assert('invalid token returns 401', invalidToken.res.statusCode === 401 && !invalidToken.nextCalled);

const patientToken = jwt.sign({ userId: 42, role: 'patient' }, process.env.JWT_SECRET, { expiresIn: '1h' });
const authenticated = runMiddleware(protect, {
  headers: { authorization: `Bearer ${patientToken}` }
});
assert(
  'valid token identifies patient and calls next',
  authenticated.nextCalled && authenticated.res.statusCode === null &&
    authenticated.req.user.userId === 42 && authenticated.req.user.role === 'patient'
);

const patientRequest = { user: { userId: 42, role: 'patient' } };
const denied = runMiddleware(authorize('admin'), patientRequest);
assert('patient cannot access admin route', denied.res.statusCode === 403 && !denied.nextCalled);

const adminRequest = { user: { userId: 1, role: 'admin' } };
const allowed = runMiddleware(authorize('admin'), adminRequest);
assert('admin can access admin route', allowed.nextCalled && allowed.res.statusCode === null);

console.log(`\n${passed}/${passed + failed} checks passed.`);
process.exitCode = failed === 0 ? 0 : 1;
