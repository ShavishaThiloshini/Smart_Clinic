'use strict';

const express = require('express');
const { searchDoctors, getDoctorById } = require('../controllers/doctor-search.controller');

// Public discovery routes. They deliberately expose only approved, active doctors.
function createDoctorSearchRouter() {
  const router = express.Router();
  router.get('/', searchDoctors);
  router.get('/:doctorId', getDoctorById);
  return router;
}

module.exports = { createDoctorSearchRouter };
