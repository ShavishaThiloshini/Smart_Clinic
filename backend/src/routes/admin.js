'use strict';

const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const { getDashboard } = require('../controllers/admin.controller');

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
 */
function createAdminRouter() {
  const router = express.Router();

  // Apply protect + authorize to every route in this router
  router.use(protect, authorize('admin'));

  router.get('/dashboard', getDashboard);

  return router;
}

module.exports = { createAdminRouter };
