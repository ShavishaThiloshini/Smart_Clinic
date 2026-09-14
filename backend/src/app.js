const express = require('express');
const cors = require('cors');
const { createHealthRouter } = require('./routes/health');
const { createAuthRouter }  = require('./routes/auth');
const { createAdminRouter } = require('./routes/admin');
const { createPatientRouter } = require('./routes/patient');
const { createDoctorRouter } = require('./routes/doctor');
const { createDoctorSearchRouter } = require('./routes/doctor-search');
const { createSpecializationRouter } = require('./routes/specialization');
const { createDoctorAvailabilityRouter } = require('./routes/doctor-availability');
const { createAppointmentRouter } = require('./routes/appointment');
const { createMedicalRecordRouter } = require('./routes/medical-record');
const { createPrescriptionRouter } = require('./routes/prescription');
const { createNotificationRouter } = require('./routes/notification');
const { createReviewRouter } = require('./routes/review');
const { 
  createRateLimiter, 
  authRateLimiter, 
  sanitizeInput, 
  securityHeaders,
  requestLogger,
  preventSqlInjection,
  preventXSS 
} = require('./middleware/security.middleware');

const app = express();

// Security middleware stack
app.use(securityHeaders);
app.use(requestLogger);
app.use(sanitizeInput);
app.use(preventSqlInjection);
app.use(preventXSS);

// Rate limiting
const limiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

app.use(limiter);

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : null;

app.use(cors(allowedOrigins ? { 
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
} : {
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Smart Clinic Backend',
    status: 'running',
    version: '1.0.0',
    message: 'Express.js server is active.',
    timestamp: new Date().toISOString()
  });
});

// Apply stricter rate limiting to auth routes
app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/register', authRateLimiter);

// API routes
app.use('/api',                  createHealthRouter());
app.use('/api/auth',             createAuthRouter());
app.use('/api/admin',            createAdminRouter());
app.use('/api/patient',          createPatientRouter());
app.use('/api/doctor',           createDoctorRouter());
app.use('/api/doctor/availability', createDoctorAvailabilityRouter());
app.use('/api/appointments',     createAppointmentRouter());
app.use('/api/medical-records',  createMedicalRecordRouter());
app.use('/api/prescriptions',    createPrescriptionRouter());
app.use('/api/notifications',    createNotificationRouter());
app.use('/api/reviews',          createReviewRouter());
app.use('/api/doctors',          createDoctorSearchRouter());
app.use('/api/specializations',  createSpecializationRouter());

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found.',
    path: req.path,
    method: req.method
  });
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: err.message
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized access'
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Database errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry. This record already exists.'
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist.'
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

module.exports = app;
