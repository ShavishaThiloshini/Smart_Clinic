const express = require('express');
const { login, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

/**
 * Auth router
 *
 * Endpoints:
 *   POST /api/auth/login  — Email + Password → JWT
 */
function createAuthRouter() {
  const router = express.Router();

  /**
   * POST /api/auth/login
   * Public — no token required
   */
  router.post('/login', login);

  /**
   * GET /api/auth/me
   * Protected — valid JWT required (any role: patient | doctor | admin)
   * Returns the currently logged-in user's profile.
   */
  router.get('/me', protect, getMe);

  return router;
}

module.exports = { createAuthRouter };
