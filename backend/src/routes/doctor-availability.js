'use strict';

const express = require('express');
const { getAvailability, setAvailability } = require('../controllers/doctor-availability.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

function createDoctorAvailabilityRouter() {
  const router = express.Router();
  router.use(protect, authorize('doctor'));
  router.get('/', getAvailability);
  router.put('/', setAvailability);
  return router;
}

module.exports = { createDoctorAvailabilityRouter };
