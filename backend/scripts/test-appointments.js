'use strict';

require('dotenv').config();
const mysql = require('mysql2/promise');

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
  printHeader('Smart Clinic - Appointment Booking API Tests');

  const patientToken = await login(SEED_USERS.patient);
  const doctorToken = await login(SEED_USERS.doctor);

  {
    const { status } = await request('GET', '/api/appointments');
    assert('GET appointments without token -> 401', status === 401);
  }

  {
    const { status } = await request('POST', '/api/appointments', {
      token: doctorToken,
      body: { doctorId: 1, appointmentDate: '2099-01-05', startTime: '09:00' }
    });
    assert('POST appointments with doctor token -> 403', status === 403);
  }

  {
    const { status } = await request('PUT', '/api/doctor/availability', {
      token: doctorToken,
      body: { availability: [{ dayOfWeek: 'Monday', startTime: '09:00', endTime: '12:00', slotDuration: 30, status: true }] }
    });
    assert('Set known doctor schedule -> 200', status === 200);
  }

  const doctorSearch = await request('GET', '/api/doctors?q=Sample');
  const doctorId = doctorSearch.json?.doctors?.[0]?.doctorId;
  assert('Find approved doctor for booking', Number.isInteger(doctorId), JSON.stringify(doctorSearch.json));

  let appointmentId;
  if (doctorId) {
    const cleanup = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      database: process.env.DB_NAME || 'smart_clinic',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });
    await cleanup.query(
      'DELETE FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND start_time = ?',
      [doctorId, '2099-01-05', '09:00']
    );
    await cleanup.end();

    const booking = await request('POST', '/api/appointments', {
      token: patientToken,
      body: {
        doctorId,
        appointmentDate: '2099-01-05',
        startTime: '09:00',
        reason: 'Routine consultation'
      }
    });
    assert('Book an available slot -> 201', booking.status === 201, booking.json?.message);
    assert('Booking returns appointment details', booking.json?.appointment?.doctorId === doctorId, JSON.stringify(booking.json));
    assert('Booking calculates 30-minute end time', booking.json?.appointment?.endTime === '09:30', JSON.stringify(booking.json));
    assert('Booking starts with pending status', booking.json?.appointment?.status === 'pending', JSON.stringify(booking.json));
    appointmentId = booking.json?.appointment?.appointmentId;

    const duplicate = await request('POST', '/api/appointments', {
      token: patientToken,
      body: { doctorId, appointmentDate: '2099-01-05', startTime: '09:00' }
    });
    assert('Duplicate slot -> 409', duplicate.status === 409, duplicate.json?.message);

    const unavailable = await request('POST', '/api/appointments', {
      token: patientToken,
      body: { doctorId, appointmentDate: '2099-01-05', startTime: '13:00' }
    });
    assert('Outside availability -> 409', unavailable.status === 409, unavailable.json?.message);
  }

  const appointments = await request('GET', '/api/appointments', { token: patientToken });
  assert('Patient can list appointments -> 200', appointments.status === 200, appointments.json?.message);
  assert('Patient list contains the new booking', appointments.json?.appointments?.some((item) => item.appointmentId === appointmentId), JSON.stringify(appointments.json));

  if (appointmentId) {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      database: process.env.DB_NAME || 'smart_clinic',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });
    await connection.query('DELETE FROM appointments WHERE appointment_id = ?', [appointmentId]);
    await connection.end();
  }

  if (printSummary() > 0) process.exit(1);
}

run().catch((error) => {
  console.error('\n  Fatal error running tests:', error.message);
  process.exit(1);
});