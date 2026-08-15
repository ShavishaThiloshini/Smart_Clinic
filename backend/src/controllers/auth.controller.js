const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

/**
 * POST /api/auth/login
 *
 * Flow:
 *   Email + Password
 *       ↓
 *   Verify user exists in DB
 *       ↓
 *   Compare password with bcrypt
 *       ↓
 *   Check account is active
 *       ↓
 *   Generate JWT
 *       ↓
 *   Return token + user info
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // ── 1. Input validation ─────────────────────────────────────────────────
    if (!email || !password) {
      return res.status(422).json({
        message: 'Email and password are required.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(422).json({
        message: 'Please provide a valid email address.'
      });
    }

    // ── 2. Verify user exists ────────────────────────────────────────────────
    const [rows] = await pool.query(
      'SELECT user_id, name, email, password_hash, role, status FROM users WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (rows.length === 0) {
      // Return generic message to prevent user enumeration
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const user = rows[0];

    // ── 3. Compare password ──────────────────────────────────────────────────
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // ── 4. Check account status ──────────────────────────────────────────────
    if (user.status !== 'active') {
      return res.status(403).json({
        message: 'Your account is inactive. Please contact support.'
      });
    }

    // ── 5. Generate JWT ──────────────────────────────────────────────────────
    const payload = {
      userId: user.user_id,
      role: user.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    // ── 6. Return token + safe user info ─────────────────────────────────────
    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        userId: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 *
 * Protected route — requires valid JWT (via protect middleware).
 * Returns the profile of the currently logged-in user.
 *
 * req.user is injected by protect middleware:
 *   { userId, role }
 */
async function getMe(req, res, next) {
  try {
    const { userId } = req.user;

    const [rows] = await pool.query(
      `SELECT
         user_id   AS userId,
         name,
         email,
         role,
         status,
         created_at AS createdAt
       FROM users
       WHERE user_id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      user: rows[0]
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, getMe };
