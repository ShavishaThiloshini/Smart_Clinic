const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SELF_REGISTERED_ROLES = ['patient', 'doctor'];

function createToken(userId, role) {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

function toPublicUser(user) {
  return { userId: user.user_id, name: user.name, email: user.email, role: user.role };
}

async function register(req, res, next) {
  const connection = await pool.getConnection();

  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const role = typeof req.body.role === 'string' ? req.body.role.trim().toLowerCase() : '';
    const errors = [];

    if (!name) errors.push({ field: 'name', message: 'Name is required.' });
    if (!email) errors.push({ field: 'email', message: 'Email is required.' });
    else if (!EMAIL_PATTERN.test(email)) errors.push({ field: 'email', message: 'Please provide a valid email address.' });
    if (!password) errors.push({ field: 'password', message: 'Password is required.' });
    else if (password.length < 8) errors.push({ field: 'password', message: 'Password must be at least 8 characters long.' });
    if (!role) errors.push({ field: 'role', message: 'Role is required.' });
    else if (!SELF_REGISTERED_ROLES.includes(role)) errors.push({ field: 'role', message: 'Only patient or doctor accounts can be self-registered.' });

    if (errors.length > 0) return res.status(422).json({ message: 'Please correct the highlighted fields.', errors });

    const [existingUsers] = await connection.query('SELECT user_id FROM users WHERE email = ? LIMIT 1', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'An account with this email address already exists.', errors: [{ field: 'email', message: 'Email is already registered.' }] });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await connection.beginTransaction();
    const [result] = await connection.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, role]
    );

    if (role === 'patient') await connection.query('INSERT INTO patients (user_id) VALUES (?)', [result.insertId]);
    else await connection.query('INSERT INTO doctors (user_id) VALUES (?)', [result.insertId]);

    await connection.commit();
    const user = { user_id: result.insertId, name, email, role };
    return res.status(201).json({ message: 'Registration successful.', token: createToken(user.user_id, user.role), user: toPublicUser(user) });
  } catch (err) {
    await connection.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'An account with this email address already exists.', errors: [{ field: 'email', message: 'Email is already registered.' }] });
    }
    next(err);
  } finally {
    connection.release();
  }
}

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

    if (!EMAIL_PATTERN.test(email)) {
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
    const token = createToken(user.user_id, user.role);

    // ── 6. Return token + safe user info ─────────────────────────────────────
    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: toPublicUser(user)
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

module.exports = { register, login, getMe };
