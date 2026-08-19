'use strict';

const express = require('express');
const { getProfile, updateProfile } = require('../controllers/patient.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

function createPatientRouter() {
  const router = express.Router();

  // All patient routes require authentication and 'patient' role
  router.use(protect);
  router.use(authorize('patient'));

  router.get('/profile', getProfile);
  router.put('/profile', updateProfile);

  return router;
}

module.exports = { createPatientRouter };
