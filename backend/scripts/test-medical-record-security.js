'use strict';

require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const {
  resetCounters,
  assert,
  request,
  login,
  printHeader,
  printSummary
} = require('./test-helpers');

async function createUserWithProfile(connection, { name, email, password, role }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const [userResult] = await connection.query(
    `INSERT INTO users (name, email, password_hash, role, status)
     VALUES (?, ?, ?, ?, 'active')`,
    [name, email, passwordHash, role]
  );

  if (role === 'patient') {
    const [patientResult] = await connection.query('INSERT INTO patients (user_id) VALUES (?)', [userResult.insertId]);
    return { userId: userResult.insertId, patientId: patientResult.insertId, email, password, name };
  }

  if (role === 'doctor') {
    const [doctorResult] = await connection.query(
      `INSERT INTO doctors (user_id, approval_status)
       VALUES (?, 'approved')`,
      [userResult.insertId]
    );
    return { userId: userResult.insertId, doctorId: doctorResult.insertId, email, password, name };
  }

  return { userId: userResult.insertId, email, password, name };
}

async function run() {
  resetCounters();
  printHeader('Smart Clinic - Medical Record Security Tests');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME || 'smart_clinic',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  try {
    const suffix = Date.now();

    const patient = await createUserWithProfile(connection, {
      name: 'Medical Patient',
      email: `medical.patient.${suffix}@clinic.test`,
      password: 'PatientSecurity@123',
      role: 'patient'
    });

    const doctor = await createUserWithProfile(connection, {
      name: 'Primary Doctor',
      email: `medical.doctor.${suffix}@clinic.test`,
      password: 'DoctorSecurity@123',
      role: 'doctor'
    });

    const otherDoctor = await createUserWithProfile(connection, {
      name: 'Other Doctor',
      email: `medical.otherdoctor.${suffix}@clinic.test`,
      password: 'OtherDoctor@123',
      role: 'doctor'
    });

    const appointmentDate = '2099-01-10';
    const [appointmentResult] = await connection.query(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, start_time, end_time, queue_number, status, reason)
       VALUES (?, ?, ?, '09:00', '09:30', 1, 'completed', 'Follow-up consultation')`,
      [patient.patientId, doctor.doctorId, appointmentDate]
    );

    const doctorToken = await login({ email: doctor.email, password: doctor.password });
    const otherDoctorToken = await login({ email: otherDoctor.email, password: otherDoctor.password });
    const patientToken = await login({ email: patient.email, password: patient.password });

    const invalidCreate = await request('POST', '/api/medical-records', {
      token: doctorToken,
      body: {
        patientId: patient.patientId,
        appointmentId: appointmentResult.insertId,
        diagnosis: '   ',
        notes: 'Missing diagnosis should fail validation.',
        treatment: 'This should be rejected.'
      }
    });
    assert('Doctor input validation rejects blank diagnosis -> 422', invalidCreate.status === 422, JSON.stringify(invalidCreate.json));

    const unauthorizedList = await request('GET', `/api/medical-records/patient/${patient.patientId}`, { token: otherDoctorToken });
    assert('Unauthorized doctor cannot list another doctor\'s patient records -> 403', unauthorizedList.status === 403, JSON.stringify(unauthorizedList.json));

    const createRes = await request('POST', '/api/medical-records', {
      token: doctorToken,
      body: {
        patientId: patient.patientId,
        appointmentId: appointmentResult.insertId,
        diagnosis: 'Mild hypertension',
        notes: 'Patient reports occasional dizziness and stress.',
        treatment: 'Continue lifestyle changes and monitor blood pressure.'
      }
    });
    assert('Authorized doctor can create a patient record -> 201', createRes.status === 201, JSON.stringify(createRes.json));

    const recordId = createRes.json?.record?.recordId;
    assert('Create response returns record details', Number.isInteger(recordId), JSON.stringify(createRes.json));

    const patientView = await request('GET', `/api/medical-records/${recordId}`, { token: patientToken });
    assert('Patient can view their own record -> 200', patientView.status === 200, JSON.stringify(patientView.json));

    const otherDoctorView = await request('GET', `/api/medical-records/${recordId}`, { token: otherDoctorToken });
    assert('Other doctor cannot view a different doctor\'s record -> 403', otherDoctorView.status === 403, JSON.stringify(otherDoctorView.json));

    const doctorUpdate = await request('PUT', `/api/medical-records/${recordId}`, {
      token: doctorToken,
      body: {
        diagnosis: 'Mild hypertension follow-up',
        notes: 'Patient responded well to the plan.',
        treatment: 'Continue monitoring and re-check in 2 weeks.'
      }
    });
    assert('Authorized doctor can update their own record -> 200', doctorUpdate.status === 200, JSON.stringify(doctorUpdate.json));
  } finally {
    await connection.end();
  }

  if (printSummary() > 0) process.exit(1);
}

run().catch((error) => {
  console.error('\n  Fatal error running medical record security tests:', error.message);
  process.exit(1);
});
