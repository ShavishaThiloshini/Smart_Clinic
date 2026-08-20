'use strict';

const assert = require('node:assert/strict');
const { validateProfile } = require('../src/controllers/patient.controller');

function expectError(payload, field) {
  const result = validateProfile(payload);
  assert.ok(result.error, `Expected ${field} to fail validation.`);
  assert.ok(result.error.errors[field], `Expected an error for ${field}.`);
}

const validProfile = {
  name: 'Asha Perera',
  phone: '+94 77 123 4567',
  dateOfBirth: '1998-05-14',
  gender: 'female',
  address: '12 Main Street, Colombo',
  medicalInfo: 'No known allergies.',
  bloodGroup: 'O+',
  emergencyContactName: 'Kamal Perera',
  emergencyContactRelation: 'Father',
  emergencyContactPhone: '+94 77 123 4567'
};

const validResult = validateProfile(validProfile);
assert.deepEqual(validResult.value, validProfile);
expectError({ ...validProfile, name: 'A' }, 'name');
expectError({ ...validProfile, phone: 'invalid' }, 'phone');
expectError({ ...validProfile, dateOfBirth: '2026-02-30' }, 'dateOfBirth');
expectError({ ...validProfile, gender: 'unknown' }, 'gender');
expectError({ ...validProfile, address: 'a'.repeat(1001) }, 'address');
expectError({ ...validProfile, medicalInfo: 'a'.repeat(5001) }, 'medicalInfo');

console.log('Patient profile validation: all checks passed.');
