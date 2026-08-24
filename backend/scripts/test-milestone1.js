'use strict';

const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { checkServer, BASE_URL } = require('./test-helpers');

const UNIT_TESTS = [
  'test-auth-middleware.js',
  'test-patient-profile-validation.js',
  'test-availability-validation.js'
];

const API_TESTS = [
  'test-auth.js',
  'test-patient-profile-api.js',
  'test-doctor-profile-api.js',
  'test-doctor-search.js',
  'test-availability.js'
];

function runScript(scriptName) {
  const scriptPath = path.join(__dirname, scriptName);
  console.log(`\n▶ Running ${scriptName}`);
  const result = spawnSync(process.execPath, [scriptPath], {
    stdio: 'inherit',
    env: process.env
  });
  return result.status === 0;
}

async function run() {
  console.log('\n══════════════════════════════════════════════════');
  console.log('  Smart Clinic — Milestone 1 / Day 10 Test Suite');
  console.log('══════════════════════════════════════════════════');

  let failedSuites = 0;

  console.log('\nPhase 1: Unit and validation tests (no server required)');
  for (const scriptName of UNIT_TESTS) {
    if (!runScript(scriptName)) failedSuites += 1;
  }

  console.log('\nPhase 2: API integration tests (server + MySQL required)');
  const serverReady = await checkServer();
  if (!serverReady) {
    console.log('\n⚠️  Backend server is not reachable.');
    console.log(`   Start it first: cd backend && npm run dev`);
    console.log(`   Expected health check: ${BASE_URL}/api/health\n`);
    process.exit(failedSuites > 0 ? 1 : 0);
  }

  for (const scriptName of API_TESTS) {
    if (!runScript(scriptName)) failedSuites += 1;
  }

  console.log('\n══════════════════════════════════════════════════');
  if (failedSuites === 0) {
    console.log('  Milestone 1 backend tests: ALL PASSED');
  } else {
    console.log(`  Milestone 1 backend tests: ${failedSuites} suite(s) failed`);
  }
  console.log('══════════════════════════════════════════════════\n');

  process.exit(failedSuites > 0 ? 1 : 0);
}

run().catch((error) => {
  console.error('\nFatal error running milestone tests:', error.message);
  process.exit(1);
});
