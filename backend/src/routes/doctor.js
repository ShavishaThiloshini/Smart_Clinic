'use strict';

const express = require('express');
const { getProfile, updateProfile } = require('../controllers/doctor.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

function createDoctorRouter() {
  const router = express.Router();
  router.use(protect, authorize('doctor'));
  router.get('/profile', getProfile);
  router.put('/profile', updateProfile);
  return router;
}

module.exports = { createDoctorRouter };
