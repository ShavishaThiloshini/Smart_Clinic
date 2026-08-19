'use strict';

const express = require('express');
<<<<<<< HEAD
const { login, register, logout, getMe } = require('../controllers/auth.controller');
=======
const { register, login, getMe } = require('../controllers/auth.controller');
>>>>>>> e868153090c4a54327e500b007a8fbc128066b01
const { protect } = require('../middleware/auth.middleware');

/**
 * Auth router
 *
 * Public endpoints (no token):
 *   POST /api/auth/register   — create a new patient or doctor account
 *   POST /api/auth/login      — email + password → JWT
 *
 * Protected endpoints (valid JWT required):
 *   GET  /api/auth/me         — return the logged-in user's profile
 *   POST /api/auth/logout     — server-side logout acknowledgement
 */
function createAuthRouter() {
  const router = express.Router();

<<<<<<< HEAD
  // ── Public ────────────────────────────────────────────────────────────────

  /**
   * POST /api/auth/register
   * Body: { name, email, password, role }
   * role must be 'patient' or 'doctor' (admin accounts are created by admins only)
   */
=======
>>>>>>> e868153090c4a54327e500b007a8fbc128066b01
  router.post('/register', register);

  /**
   * POST /api/auth/login
   * Body: { email, password }
   * Returns: { token, user }
   */
  router.post('/login', login);

  // ── Protected ─────────────────────────────────────────────────────────────

  /**
   * GET /api/auth/me
   * Header: Authorization: Bearer <token>
   * Returns the currently logged-in user's profile (no password hash).
   */
  router.get('/me', protect, getMe);

  /**
   * POST /api/auth/logout
   * Header: Authorization: Bearer <token>
   * Acknowledges logout — client must delete the token locally.
   */
  router.post('/logout', protect, logout);

  return router;
}

module.exports = { createAuthRouter };
