const express  = require('express');
const cors     = require('cors');
const { createHealthRouter } = require('./routes/health');
const authRouter = require('./routes/auth');

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────────

// Root info
app.get('/', (req, res) => {
  res.json({
    name:    'Smart Clinic Backend',
    version: '1.0.0',
    status:  'running',
    message: 'Express.js server is active.',
  });
});

// Health check
app.use('/api', createHealthRouter());

// Authentication (register, login, me)
app.use('/api/auth', authRouter);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found.` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[App Error]', err.stack);
  res.status(500).json({ message: 'Something went wrong on the server.' });
});

module.exports = app;
