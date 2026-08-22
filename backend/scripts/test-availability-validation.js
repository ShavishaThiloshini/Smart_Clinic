'use strict';

const assert = require('node:assert/strict');
const { validateAvailability, formatTime, mapAvailabilityRow } = require('../src/controllers/doctor-availability.controller');

function expectError(payload, field) {
  const result = validateAvailability(payload);
  assert.ok(result.error, `Expected ${field} to fail validation.`);
  assert.ok(result.error.errors[field], `Expected an error for ${field}.`);
}

const validSlots = [
  {
    dayOfWeek: 'Monday',
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 30,
    status: true
  },
  {
    dayOfWeek: 'Tuesday',
    startTime: '10:30',
    endTime: '14:00',
    slotDuration: 15,
    status: false
  }
];

const validResult = validateAvailability(validSlots);
assert.deepEqual(validResult.value, [
  {
    dayOfWeek: 'Monday',
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 30,
    status: true
  },
  {
    dayOfWeek: 'Tuesday',
    startTime: '10:30',
    endTime: '14:00',
    slotDuration: 15,
    status: false
  }
]);

expectError('not-an-array', 'availability');
expectError([{ dayOfWeek: 'Funday', startTime: '09:00', endTime: '17:00', slotDuration: 30 }], 'availability[0].dayOfWeek');
expectError([{ dayOfWeek: 'Monday', startTime: '25:00', endTime: '17:00', slotDuration: 30 }], 'availability[0].startTime');
expectError([{ dayOfWeek: 'Monday', startTime: '09:00', endTime: '08:00', slotDuration: 30 }], 'availability[0].endTime');
expectError([{ dayOfWeek: 'Monday', startTime: '09:00', endTime: '17:00', slotDuration: 10 }], 'availability[0].slotDuration');

assert.equal(formatTime('09:00:00'), '09:00');
assert.equal(formatTime('17:30'), '17:30');
assert.deepEqual(mapAvailabilityRow({
  id: 1,
  dayOfWeek: 'Monday',
  startTime: '09:00:00',
  endTime: '17:00:00',
  slotDuration: 30,
  status: 1
}), {
  id: 1,
  dayOfWeek: 'Monday',
  startTime: '09:00',
  endTime: '17:00',
  slotDuration: 30,
  status: true
});

console.log('Doctor availability validation: all checks passed.');
