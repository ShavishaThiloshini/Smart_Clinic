'use strict';

const express = require('express');
const { getAllSpecializations, createSpecialization } = require('../controllers/specialization.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

function createSpecializationRouter() {
  const router = express.Router();
  router.get('/', getAllSpecializations);
  router.post('/', protect, authorize('admin'), createSpecialization);
  return router;
}

module.exports = { createSpecializationRouter };
