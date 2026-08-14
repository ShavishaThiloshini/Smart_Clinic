const bcrypt       = require('bcryptjs');
const jwt          = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { pool }     = require('../config/db');

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Generate a signed JWT for the given user.
 */
function generateToken(user) {
  return jwt.sign(
    {
      user_id: user.user_id,
      email:   user.email,
      role:    user.role,
      name:    user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * Return validation errors if any exist.
 * Returns true (errors sent) or false (no errors).
 */
function handleValidationErrors(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({
      message: 'Validation failed.',
      errors:  errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
    return true;
  }
  return false;
}

// ─── Controllers ────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 *
 * Body: { name, email, password, role }
 * - role is optional, defaults to 'patient'
 * - password is hashed with bcrypt (salt rounds = 12)
 * - Returns JWT + user info (no password_hash)
 */
async function register(req, res) {
  if (handleValidationErrors(req, res)) return;

  const { name, email, password, role = 'patient' } = req.body;

  try {
    // 1. Check for duplicate email
    const [existing] = await pool.query(
      'SELECT user_id FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    // 2. Hash password securely (bcrypt, 12 rounds)
    const password_hash = await bcrypt.hash(password, 12);

    // 3. Insert new user
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES (?, ?, ?, ?, 'active')`,
      [name.trim(), email.toLowerCase().trim(), password_hash, role]
    );

    const user_id = result.insertId;

    // 4. Generate JWT
    const token = generateToken({ user_id, email, role, name });

    return res.status(201).json({
      message: 'Registration successful.',
      token,
      user: {
        user_id,
        name:  name.trim(),
        email: email.toLowerCase().trim(),
        role,
        status: 'active',
      },
    });
  } catch (err) {
    console.error('[register] Error:', err.message);
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
}

/**
 * POST /api/auth/login
 *
 * Body: { email, password }
 * - Finds user by email
 * - Compares password with bcrypt
 * - Returns JWT + user info (no password_hash)
 */
async function login(req, res) {
  if (handleValidationErrors(req, res)) return;

  const { email, password } = req.body;

  try {
    // 1. Find user by email
    const [rows] = await pool.query(
      'SELECT user_id, name, email, password_hash, role, status FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      // Generic message — do not reveal whether email exists
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = rows[0];

    // 2. Check account status
    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Your account has been suspended. Please contact support.' });
    }

    // 3. Compare password with stored hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // 4. Generate JWT
    const token = generateToken(user);

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        user_id: user.user_id,
        name:    user.name,
        email:   user.email,
        role:    user.role,
        status:  user.status,
      },
    });
  } catch (err) {
    console.error('[login] Error:', err.message);
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
}

/**
 * GET /api/auth/me  (protected — requires verifyToken middleware)
 *
 * Returns the currently authenticated user's profile.
 */
async function getMe(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT user_id, name, email, role, status, created_at FROM users WHERE user_id = ?',
      [req.user.user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    return res.status(200).json({ user: rows[0] });
  } catch (err) {
    console.error('[getMe] Error:', err.message);
    return res.status(500).json({ message: 'Server error.' });
  }
}

module.exports = { register, login, getMe };
