'use strict';

require('dotenv').config();

const BASE_URL = `http://localhost:${process.env.PORT || 5000}`;

const SEED_USERS = {
  admin: { email: 'admin@smartclinic.com', password: 'Admin@1234' },
  doctor: { email: 'doctor@smartclinic.com', password: 'Doctor@1234' },
  patient: { email: 'patient@smartclinic.com', password: 'Patient@1234' }
};

let passed = 0;
let failed = 0;

function resetCounters() {
  passed = 0;
  failed = 0;
}

function assert(testName, condition, detail = '') {
  if (condition) {
    console.log(`  ✅  PASS  ${testName}`);
    passed += 1;
  } else {
    console.log(`  ❌  FAIL  ${testName}${detail ? ` — ${detail}` : ''}`);
    failed += 1;
  }
}

async function request(method, path, { body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  let json = null;
  try {
    json = await response.json();
  } catch (_) {}

  return { status: response.status, json };
}

async function login(credentials) {
  const { status, json } = await request('POST', '/api/auth/login', { body: credentials });
  if (status !== 200 || !json?.token) {
    throw new Error(`Login failed for ${credentials.email}: ${json?.message || status}`);
  }
  return json.token;
}

function printHeader(title) {
  console.log('\n══════════════════════════════════════════════════');
  console.log(`  ${title}`);
  console.log(`  Server: ${BASE_URL}`);
  console.log('══════════════════════════════════════════════════\n');
}

function printSummary() {
  const total = passed + failed;
  console.log('\n══════════════════════════════════════════════════');
  console.log(`  Results: ${passed}/${total} passed  |  ${failed} failed`);
  console.log('══════════════════════════════════════════════════\n');
  return failed;
}

async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    return response.ok;
  } catch (_) {
    return false;
  }
}

module.exports = {
  BASE_URL,
  SEED_USERS,
  resetCounters,
  assert,
  request,
  login,
  printHeader,
  printSummary,
  checkServer,
  get passed() { return passed; },
  get failed() { return failed; }
};
