'use strict';

const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const {
  createRecord,
  getPatientRecords,
  getRecordById,
  updateRecord
} = require('../controllers/medical-record.controller');

function createMedicalRecordRouter() {
  const router = express.Router();

  router.post('/', protect, authorize('doctor'), createRecord);
  router.get('/patient/:patientId', protect, authorize('patient', 'doctor', 'admin'), getPatientRecords);
  router.get('/:recordId', protect, authorize('patient', 'doctor', 'admin'), getRecordById);
  router.put('/:recordId', protect, authorize('doctor'), updateRecord);

  return router;
}

module.exports = { createMedicalRecordRouter };
