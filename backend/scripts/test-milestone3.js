'use strict';
const { spawnSync } = require('node:child_process'); const path = require('node:path'); const { checkServer, BASE_URL } = require('./test-helpers');
function runScript(name) { return spawnSync(process.execPath, [path.join(__dirname, name)], { stdio: 'inherit', env: process.env }).status === 0; }
async function run() { let failed = 0; console.log('\nSmart Clinic - Milestone 3 Prescription Integration Suite'); if (!runScript('test-prescription-validation.js')) failed += 1; if (!await checkServer()) { console.log(`Backend server is not reachable at ${BASE_URL}. API integration test skipped; start the backend and run npm run test:milestone3 again.`); process.exit(failed ? 1 : 0); } if (!runScript('test-prescription-api.js')) failed += 1; process.exit(failed ? 1 : 0); }
run().catch((error) => { console.error('Milestone 3 test suite failed:', error.message); process.exit(1); });
