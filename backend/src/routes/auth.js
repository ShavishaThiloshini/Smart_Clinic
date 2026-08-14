const express  = require('express');
const { body } = require('express-validator');
const { register, login, getMe } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ─── Validation Rules ────────────────────────────────────────────────────────

const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
    .matches(/\d/).withMessage('Password must contain at least one number.'),

  body('role')
    .optional()
    .isIn(['patient', 'doctor', 'admin']).withMessage('Role must be patient, doctor, or admin.'),
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.'),
];

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Public — Create a new user account
 */
router.post('/register', registerValidation, register);

/**
 * POST /api/auth/login
 * Public — Authenticate and receive JWT
 */
router.post('/login', loginValidation, login);

/**
 * GET /api/auth/me
 * Protected — Get current user profile
 */
router.get('/me', verifyToken, getMe);

module.exports = router;
