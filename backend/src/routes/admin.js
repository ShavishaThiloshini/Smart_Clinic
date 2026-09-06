'use strict';

const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const { 
  getDashboard,
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

  // User Management
  router.get('/users', getUsers);
  router.get('/users/:userId', getUserById);
  router.put('/users/:userId/status', updateUserStatus);

  // Doctor Management
  router.get('/doctors', getDoctors);
  router.get('/doctors/:doctorId', getDoctorById);
  router.put('/doctors/:doctorId/approval', updateDoctorApproval);

  return router;
}

module.exports = { createAdminRouter };
