const express = require('express');
const cors = require('cors');
const { createHealthRouter } = require('./routes/health');
const { createAuthRouter }  = require('./routes/auth');
const { createAdminRouter } = require('./routes/admin');
const { createPatientRouter } = require('./routes/patient');
const { createDoctorRouter } = require('./routes/doctor');
const { createDoctorSearchRouter } = require('./routes/doctor-search');
const { createSpecializationRouter } = require('./routes/specialization');
const { createDoctorAvailabilityRouter } = require('./routes/doctor-availability');
const { createAppointmentRouter } = require('./routes/appointment');
const { createMedicalRecordRouter } = require('./routes/medical-record');
const { createPrescriptionRouter } = require('./routes/prescription');
const { createNotificationRouter } = require('./routes/notification');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    name: 'Smart Clinic Backend',
    status: 'running',
    message: 'Express.js server is active.'
  });
});

app.use('/api',                  createHealthRouter());
app.use('/api/auth',             createAuthRouter());
app.use('/api/admin',            createAdminRouter());
app.use('/api/patient',          createPatientRouter());
app.use('/api/doctor',           createDoctorRouter());
app.use('/api/doctor/availability', createDoctorAvailabilityRouter());
app.use('/api/appointments',     createAppointmentRouter());
app.use('/api/medical-records',  createMedicalRecordRouter());
app.use('/api/prescriptions',    createPrescriptionRouter());
app.use('/api/notifications',    createNotificationRouter());
app.use('/api/doctors',          createDoctorSearchRouter());
app.use('/api/specializations',  createSpecializationRouter());

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong on the server.'
  });
});

module.exports = app;
