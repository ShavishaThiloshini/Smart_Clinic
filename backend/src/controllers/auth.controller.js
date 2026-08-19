'use strict';

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { pool } = require('../config/db');

// Shared email regex used by both register and login
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Allowed roles a user can self-register as
const SELF_REGISTER_ROLES = ['patient', 'doctor'];

// Password policy: minimum 8 chars, at least one letter and one digit
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

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

    if (!EMAIL_REGEX.test(email)) {
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

// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 *
 * Public — no token required.
 *
 * Flow:
 *   name + email + password + role
 *       ↓
 *   Validate all fields
 *       ↓
 *   Check email not already taken  → 409 if duplicate
 *       ↓
 *   bcrypt.hash(password)
 *       ↓
 *   INSERT INTO users
 *       ↓
 *   Auto-create profile row:
 *     role=patient → INSERT INTO patients
 *     role=doctor  → INSERT INTO doctors (approval_status='pending')
 *       ↓
 *   201 { message, user }
 */
async function register(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { name, email, password, role } = req.body;

    // ── 1. Validate all required fields ────────────────────────────────────
    if (!name || !email || !password || !role) {
      return res.status(422).json({
        message: 'name, email, password, and role are all required.'
      });
    }

    if (name.trim().length < 2) {
      return res.status(422).json({
        message: 'Name must be at least 2 characters.'
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(422).json({
        message: 'Please provide a valid email address.'
      });
    }

    if (!PASSWORD_REGEX.test(password)) {
      return res.status(422).json({
        message: 'Password must be at least 8 characters and contain at least one letter and one number.'
      });
    }

    if (!SELF_REGISTER_ROLES.includes(role)) {
      return res.status(422).json({
        message: `Role must be one of: ${SELF_REGISTER_ROLES.join(', ')}.`
      });
    }

    // ── 2. Check for duplicate email ───────────────────────────────────────
    const [existing] = await connection.query(
      'SELECT user_id FROM users WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: 'An account with that email already exists.'
      });
    }

    // ── 3. Hash password ───────────────────────────────────────────────────
    const password_hash = await bcrypt.hash(password, 10);

    // ── 4. Insert user inside a transaction ────────────────────────────────
    await connection.beginTransaction();

    const [userResult] = await connection.query(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES (?, ?, ?, ?, 'active')`,
      [name.trim(), email.trim().toLowerCase(), password_hash, role]
    );

    const newUserId = userResult.insertId;

    // ── 5. Auto-create the role-specific profile row ───────────────────────
    if (role === 'patient') {
      await connection.query(
        'INSERT INTO patients (user_id) VALUES (?)',
        [newUserId]
      );
    } else if (role === 'doctor') {
      // Doctors start as 'pending' — an admin must approve before they can operate
      await connection.query(
        `INSERT INTO doctors (user_id, approval_status) VALUES (?, 'pending')`,
        [newUserId]
      );
    }

    await connection.commit();

    // ── 6. Return safe user info (no token — user must log in) ─────────────
    return res.status(201).json({
      message: 'Account created successfully. Please log in.',
      user: {
        userId: newUserId,
        name:   name.trim(),
        email:  email.trim().toLowerCase(),
        role
      }
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/logout
 *
 * Protected — valid JWT required.
 *
 * JWT is stateless so the real logout happens client-side (delete the token).
 * This endpoint gives the frontend a clean API to call and lets us log the
 * action server-side for audit purposes.
 */
async function logout(req, res) {
  // The protect middleware already verified the token by this point.
  // Nothing to invalidate server-side with stateless JWTs.
  return res.status(200).json({
    message: 'Logged out successfully. Please delete the token on the client.'
  });
}

// ─────────────────────────────────────────────────────────────────────────────
module.exports = { login, register, logout, getMe };
