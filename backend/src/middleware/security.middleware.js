'use strict';

// Security middleware for Express.js
// Provides comprehensive security measures

const rateLimit = require('express-rate-limit');

// Rate limiting configuration
const createRateLimiter = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes default
    max: options.max || 100, // 100 requests default
    message: {
      success: false,
      message: options.message || 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/api/health' || req.path === '/';
    },
    ...options
  });
};

// Auth-specific rate limiter (stricter)
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many authentication attempts, please try again later.'
});

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    return str
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .replace(/['"]/g, '') // Remove quotes
      .trim();
  };

  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'string') {
          sanitized[key] = sanitizeString(obj[key]);
        } else if (Array.isArray(obj[key])) {
          sanitized[key] = obj[key].map(item => 
            typeof item === 'string' ? sanitizeString(item) : item
          );
        } else if (typeof obj[key] === 'object') {
          sanitized[key] = sanitizeObject(obj[key]);
        } else {
          sanitized[key] = obj[key];
        }
      }
    }
    return sanitized;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize request query
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize request params
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Restrict referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Content Security Policy (basic for API)
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  
  next();
};

// Request size limiter
const requestSizeLimiter = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = req.headers['content-length'];
    const maxBytes = parseSize(maxSize);
    
    if (contentLength && parseInt(contentLength) > maxBytes) {
      return res.status(413).json({
        success: false,
        message: 'Request entity too large'
      });
    }
    
    next();
  };
};

// Helper function to parse size strings (e.g., '10mb' to bytes)
function parseSize(size) {
  const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
  const match = size.toString().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';
  
  return value * (units[unit] || 1);
}

// SQL injection prevention middleware
const preventSqlInjection = (req, res, next) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|UNION|SCRIPT)\b)/gi,
    /(;|\-\-|\/\*|\*\/)/g,
    /(\bOR\b|\bAND\b).*=.*=/gi,
    /(\bWHERE\b.+\bOR\b)/gi
  ];

  const checkForSqlInjection = (value) => {
    if (typeof value !== 'string') return false;
    
    for (const pattern of sqlPatterns) {
      if (pattern.test(value)) {
        return true;
      }
    }
    return false;
  };

  const scanObject = (obj) => {
    if (!obj || typeof obj !== 'object') return false;
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'string') {
          if (checkForSqlInjection(obj[key])) {
            return true;
          }
        } else if (typeof obj[key] === 'object') {
          if (scanObject(obj[key])) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Scan request body, query, and params
  if (scanObject(req.body) || scanObject(req.query) || scanObject(req.params)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input detected'
    });
  }

  next();
};

// XSS prevention middleware
const preventXSS = (req, res, next) => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]+src[^>]*>/gi,
    /<embed[^>]*>/gi,
    /<object[^>]*>/gi
  ];

  const checkForXSS = (value) => {
    if (typeof value !== 'string') return false;
    
    for (const pattern of xssPatterns) {
      if (pattern.test(value)) {
        return true;
      }
    }
    return false;
  };

  const scanObject = (obj) => {
    if (!obj || typeof obj !== 'object') return false;
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'string') {
          if (checkForXSS(obj[key])) {
            return true;
          }
        } else if (typeof obj[key] === 'object') {
          if (scanObject(obj[key])) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Scan request body, query, and params
  if (scanObject(req.body) || scanObject(req.query) || scanObject(req.params)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input detected'
    });
  }

  next();
};

// Request logger middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request details
  console.log('Incoming Request:', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString()
  });

  // Log response details
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log('Request Completed:', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  });

  next();
};

// CORS validation middleware
const validateOrigin = (allowedOrigins) => {
  return (req, res, next) => {
    const origin = req.headers.origin;
    
    if (origin && allowedOrigins && allowedOrigins.length > 0) {
      if (!allowedOrigins.includes(origin)) {
        return res.status(403).json({
          success: false,
          message: 'Origin not allowed'
        });
      }
    }
    
    next();
  };
};

// File upload validation middleware
const validateFileUpload = (options = {}) => {
  const {
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    maxSize = 5 * 1024 * 1024 // 5MB default
  } = options;

  return (req, res, next) => {
    if (!req.file && !req.files) {
      return next();
    }

    const files = req.files || (req.file ? [req.file] : []);

    for (const file of files) {
      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: `File type ${file.mimetype} is not allowed`
        });
      }

      // Check file size
      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: `File size exceeds ${maxSize / (1024 * 1024)}MB limit`
        });
      }
    }

    next();
  };
};

// Comprehensive security middleware factory
const securityMiddleware = (options = {}) => {
  const middleware = [];

  // Add security headers
  if (options.securityHeaders !== false) {
    middleware.push(securityHeaders);
  }

  // Add request logging
  if (options.requestLogging !== false) {
    middleware.push(requestLogger);
  }

  // Add input sanitization
  if (options.sanitizeInput !== false) {
    middleware.push(sanitizeInput);
  }

  // Add SQL injection prevention
  if (options.preventSqlInjection !== false) {
    middleware.push(preventSqlInjection);
  }

  // Add XSS prevention
  if (options.preventXSS !== false) {
    middleware.push(preventXSS);
  }

  // Add request size limiting
  if (options.requestSizeLimit) {
    middleware.push(requestSizeLimiter(options.requestSizeLimit));
  }

  // Add CORS validation
  if (options.allowedOrigins) {
    middleware.push(validateOrigin(options.allowedOrigins));
  }

  return middleware;
};

module.exports = {
  createRateLimiter,
  authRateLimiter,
  sanitizeInput,
  securityHeaders,
  requestSizeLimiter,
  preventSqlInjection,
  preventXSS,
  requestLogger,
  validateOrigin,
  validateFileUpload,
  securityMiddleware
};