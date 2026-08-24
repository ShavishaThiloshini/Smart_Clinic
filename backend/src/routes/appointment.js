'use strict';

const express = require('express');
const { createAppointment, getAppointments } = require('../controllers/appointment.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

function createAppointmentRouter() {
  const router = express.Router();
  router.use(protect, authorize('patient', 'doctor', 'admin'));
  router.get('/', getAppointments);
  router.post('/', authorize('patient'), createAppointment);
  return router;
}

module.exports = { createAppointmentRouter };