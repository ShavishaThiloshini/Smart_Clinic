'use strict';

const express = require('express');
const { createAppointment, getAppointments, getAppointmentHistory, cancelAppointment, rescheduleAppointment, getQueueStatus, updateAppointmentStatus } = require('../controllers/appointment.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

function createAppointmentRouter() {
  const router = express.Router();
  router.use(protect, authorize('patient', 'doctor', 'admin'));
  router.get('/', getAppointments);
  router.get('/history', authorize('patient'), getAppointmentHistory);
  router.post('/', authorize('patient'), createAppointment);
  router.patch('/:appointmentId/cancel', authorize('patient'), cancelAppointment);
  router.put('/:appointmentId/reschedule', authorize('patient'), rescheduleAppointment);
  router.get('/:appointmentId/queue-status', getQueueStatus);
  router.patch('/:appointmentId/status', authorize('doctor', 'admin'), updateAppointmentStatus);
  return router;
}

module.exports = { createAppointmentRouter };