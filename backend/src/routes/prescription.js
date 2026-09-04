'use strict';

const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const {
  createPrescription,
  getPatientPrescriptions,
  getPrescriptionById,
  getPrescriptionsByAppointment
} = require('../controllers/prescription.controller');

function createPrescriptionRouter() {
  const router = express.Router();

  // Doctor creates a prescription
  router.post('/', protect, authorize('doctor'), createPrescription);

  // Prescriptions by appointment (must be before /:prescriptionId to avoid conflict)
  router.get(
    '/appointment/:appointmentId',
    protect,
    authorize('patient', 'doctor', 'admin'),
    getPrescriptionsByAppointment
  );

  // All prescriptions for a patient
  router.get(
    '/patient/:patientId',
    protect,
    authorize('patient', 'doctor', 'admin'),
    getPatientPrescriptions
  );

  // Single prescription by ID
  router.get(
    '/:prescriptionId',
    protect,
    authorize('patient', 'doctor', 'admin'),
    getPrescriptionById
  );

  return router;
}

module.exports = { createPrescriptionRouter };
