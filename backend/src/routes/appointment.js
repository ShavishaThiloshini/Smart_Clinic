'use strict';

const express = require('express');
const { createAppointment, getAppointments, getAppointmentHistory, cancelAppointment, rescheduleAppointment } = require('../controllers/appointment.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

function createAppointmentRouter() {
  const router = express.Router();
  router.use(protect, authorize('patient', 'doctor', 'admin'));
  router.get('/', getAppointments);
  router.get('/history', authorize('patient'), getAppointmentHistory);
  router.post('/', authorize('patient'), createAppointment);
  router.patch('/:appointmentId/cancel', authorize('patient'), cancelAppointment);
  router.put('/:appointmentId/reschedule', authorize('patient'), rescheduleAppointment);
  return router;
}

module.exports = { createAppointmentRouter };