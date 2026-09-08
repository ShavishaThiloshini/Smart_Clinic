'use strict';

const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const {
  getDashboard,
  getReports,
  getUsers,
  getUserById,
  updateUserStatus,
  getDoctors,
  getDoctorById,
  updateDoctorApproval
} = require('../controllers/admin.controller');

/**
 * Admin router
 *
 * ALL routes in this file are automatically protected by:
 *   1. protect   — valid JWT required
 *   2. authorize('admin') — role must be 'admin'
 *
 * Any other role (patient, doctor) will receive:
 *   403 — "You do not have permission to perform this action."
 *
 * Endpoints:
 *   GET /api/admin/dashboard  — system-wide stats
 *   GET /api/admin/reports?from=YYYY-MM-DD&to=YYYY-MM-DD — operational report
 *   GET /api/admin/users
 *   GET /api/admin/users/:userId
 *   PUT /api/admin/users/:userId/status
 *   GET /api/admin/doctors
 *   GET /api/admin/doctors/:doctorId
 *   PUT /api/admin/doctors/:doctorId/approval
 */
function createAdminRouter() {
  const router = express.Router();

  // Apply protect + authorize to every route in this router
  router.use(protect, authorize('admin'));

  // Dashboard
  router.get('/dashboard', getDashboard);
  router.get('/reports', getReports);
  router.get('/users', getUsers);
  router.get('/users/:userId', getUserById);
  router.patch('/users/:userId/status', updateUserStatus);
  router.put('/users/:userId/status', updateUserStatus);
  router.get('/doctors', getDoctors);
  router.get('/doctors/:doctorId', getDoctorById);
  router.patch('/doctors/:doctorId/approval', updateDoctorApproval);
  router.put('/doctors/:doctorId/approval', updateDoctorApproval);

  return router;
}

module.exports = { createAdminRouter };
