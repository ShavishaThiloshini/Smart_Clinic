'use strict';

const jwt = require('jsonwebtoken');

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * getTokenFromRequest
 *
 * Requirement 1 — Gets the JWT from the request.
 *
 * Reads the Authorization header and extracts the Bearer token.
 * Returns null when the header is absent or malformed so the caller
 * can respond with a clear 401.
 *
 * Accepted format:
 *   Authorization: Bearer <token>
 *
 * @param {import('express').Request} req
 * @returns {string|null}
 */
function getTokenFromRequest(req) {
  const authHeader = req.headers['authorization'] || '';

  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim(); // remove "Bearer " prefix
    return token.length > 0 ? token : null;
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// protect  (authentication middleware)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * protect
 *
 * Express middleware that authenticates every incoming request.
 *
 * Covers all four requirements:
 *
 *  1. Gets the JWT from the request         → getTokenFromRequest()
 *  2. Verifies the token                    → jwt.verify()
 *  3. Identifies the logged-in user         → req.user = { userId, role, name }
 *  4. Rejects requests with missing/invalid tokens → 401 responses below
 *
 * On success attaches req.user and calls next().
 * On failure returns a 401 JSON response — never calls next().
 *
 * Usage:
 *   router.get('/dashboard', protect, handler);
 *
 * @type {import('express').RequestHandler}
 */
function protect(req, res, next) {
  // ── Requirement 1: Get the JWT from the request ───────────────────────────
  const token = getTokenFromRequest(req);

  // ── Requirement 4 (missing token): Reject if no token found ──────────────
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided. Please log in.'
    });
  }

  // ── Requirement 2 & 4: Verify the token; reject if invalid ───────────────
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ── Requirement 3: Identify the logged-in user ──────────────────────────
    // Attach decoded claims to req.user so every downstream handler
    // knows exactly who is making the request without another DB round-trip.
    req.user = {
      userId: decoded.userId, // users.user_id
      role:   decoded.role,   // 'patient' | 'doctor' | 'admin'
    };

    next();
  } catch (err) {
    // ── Requirement 4 (invalid token): Differentiate error types ─────────────
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please log in again.'
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please log in again.'
      });
    }

    if (err.name === 'NotBeforeError') {
      return res.status(401).json({
        success: false,
        message: 'Token is not yet active.'
      });
    }

    // Catch-all for any other JWT / unexpected error
    return res.status(401).json({
      success: false,
      message: 'Authentication failed.'
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// authorize  (role-based access control middleware)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * authorize
 *
 * Role-based access control factory.
 * MUST be placed AFTER protect in the middleware chain.
 *
 * Usage:
 *   router.get('/admin/users',  protect, authorize('admin'),            handler);
 *   router.post('/records',     protect, authorize('doctor', 'admin'),  handler);
 *   router.get('/appointments', protect, authorize('patient', 'doctor', 'admin'), handler);
 *
 * Allowed role values (mirrors users.role ENUM in schema.sql):
 *   'patient' | 'doctor' | 'admin'
 *
 * @param  {...string} roles - One or more allowed roles.
 * @returns {import('express').RequestHandler}
 */
function authorize(...roles) {
  return (req, res, next) => {
    // Guard: protect must run first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This resource requires one of the following roles: ${roles.join(', ')}.`
      });
    }

    next();
  };
}

// ─────────────────────────────────────────────────────────────────────────────
module.exports = { protect, authorize, getTokenFromRequest };
