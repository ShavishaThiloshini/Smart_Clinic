'use strict';

// Validation middleware for Express.js
// Provides comprehensive input validation and sanitization

// Validation patterns
const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\d\s\-\+\(\)]{10,20}$/,
  name: /^[a-zA-Z\s\-']{2,100}$/,
  password: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  time: /^([01]\d|2[0-3]):([0-5]\d)$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  positiveInteger: /^[1-9]\d*$/,
  nonNegativeInteger: /^\d+$/,
  amount: /^\d+(\.\d{1,2})?$/,
  specialization: /^(Cardiologist|Dermatologist|Neurologist|Pediatrician|General Practitioner)$/i,
  role: /^(patient|doctor|admin)$/,
  appointmentStatus: /^(pending|confirmed|completed|cancelled|no-show)$/,
  reviewStatus: /^(pending|approved|rejected)$/
};

// Sanitization functions
const sanitizers = {
  trim: (value) => typeof value === 'string' ? value.trim() : value,
  lowercase: (value) => typeof value === 'string' ? value.toLowerCase() : value,
  uppercase: (value) => typeof value === 'string' ? value.toUpperCase() : value,
  escapeHtml: (value) => {
    if (typeof value !== 'string') return value;
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },
  removeScriptTags: (value) => {
    if (typeof value !== 'string') return value;
    return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  },
  sanitizeSql: (value) => {
    if (typeof value !== 'string') return value;
    return value.replace(/['";\\]/g, '');
  }
};

// Validation functions
const validators = {
  required: (value) => {
    if (value === null || value === undefined || value === '') {
      return 'This field is required';
    }
    return null;
  },
  
  email: (value) => {
    if (value && !PATTERNS.email.test(value)) {
      return 'Please provide a valid email address';
    }
    return null;
  },
  
  phone: (value) => {
    if (value && !PATTERNS.phone.test(value)) {
      return 'Please provide a valid phone number';
    }
    return null;
  },
  
  name: (value) => {
    if (value && !PATTERNS.name.test(value)) {
      return 'Name can only contain letters, spaces, hyphens, and apostrophes';
    }
    return null;
  },
  
  password: (value) => {
    if (value && !PATTERNS.password.test(value)) {
      return 'Password must be at least 8 characters with at least one letter and one number';
    }
    return null;
  },
  
  minLength: (value, min) => {
    if (value && value.length < min) {
      return `Must be at least ${min} characters`;
    }
    return null;
  },
  
  maxLength: (value, max) => {
    if (value && value.length > max) {
      return `Must be less than ${max} characters`;
    }
    return null;
  },
  
  min: (value, min) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num < min) {
      return `Must be at least ${min}`;
    }
    return null;
  },
  
  max: (value, max) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num > max) {
      return `Must be at most ${max}`;
    }
    return null;
  },
  
  date: (value) => {
    if (value && !PATTERNS.date.test(value)) {
      return 'Please provide a valid date (YYYY-MM-DD)';
    }
    return null;
  },
  
  time: (value) => {
    if (value && !PATTERNS.time.test(value)) {
      return 'Please provide a valid time (HH:MM)';
    }
    return null;
  },
  
  futureDate: (value) => {
    if (value) {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        return 'Date must be in the future';
      }
    }
    return null;
  },
  
  positiveInteger: (value) => {
    if (value && !PATTERNS.positiveInteger.test(value)) {
      return 'Must be a positive integer';
    }
    return null;
  },
  
  amount: (value) => {
    if (value && !PATTERNS.amount.test(value)) {
      return 'Please provide a valid amount';
    }
    return null;
  },
  
  specialization: (value) => {
    if (value && !PATTERNS.specialization.test(value)) {
      return 'Please select a valid specialization';
    }
    return null;
  },
  
  role: (value) => {
    if (value && !PATTERNS.role.test(value)) {
      return 'Please select a valid role';
    }
    return null;
  },
  
  appointmentStatus: (value) => {
    if (value && !PATTERNS.appointmentStatus.test(value)) {
      return 'Please select a valid appointment status';
    }
    return null;
  },
  
  reviewStatus: (value) => {
    if (value && !PATTERNS.reviewStatus.test(value)) {
      return 'Please select a valid review status';
    }
    return null;
  },
  
  rating: (value) => {
    const rating = parseInt(value);
    if (value && (isNaN(rating) || rating < 1 || rating > 5)) {
      return 'Rating must be between 1 and 5';
    }
    return null;
  },
  
  in: (value, allowedValues) => {
    if (value && !allowedValues.includes(value)) {
      return `Please select a valid value`;
    }
    return null;
  }
};

// Main validation middleware factory
function validate(validationRules) {
  return (req, res, next) => {
    const errors = {};
    let hasErrors = false;

    // Validate request body
    if (validationRules.body && req.body) {
      for (const [field, rules] of Object.entries(validationRules.body)) {
        const value = req.body[field];
        const fieldErrors = [];

        // Apply sanitizers
        if (rules.sanitize) {
          if (Array.isArray(rules.sanitize)) {
            rules.sanitize.forEach(sanitizer => {
              if (sanitizers[sanitizer]) {
                req.body[field] = sanitizers[sanitizer](value);
              }
            });
          } else if (sanitizers[rules.sanitize]) {
            req.body[field] = sanitizers[rules.sanitize](value);
          }
        }

        // Apply validators
        if (rules.validators) {
          for (const [validatorName, validatorArgs] of Object.entries(rules.validators)) {
            const validator = validators[validatorName];
            if (validator) {
              const error = validator(req.body[field], validatorArgs);
              if (error) {
                fieldErrors.push(error);
              }
            }
          }
        }

        if (fieldErrors.length > 0) {
          errors[field] = fieldErrors;
          hasErrors = true;
        }
      }
    }

    // Validate request query parameters
    if (validationRules.query && req.query) {
      for (const [field, rules] of Object.entries(validationRules.query)) {
        const value = req.query[field];
        const fieldErrors = [];

        if (rules.validators) {
          for (const [validatorName, validatorArgs] of Object.entries(rules.validators)) {
            const validator = validators[validatorName];
            if (validator) {
              const error = validator(value, validatorArgs);
              if (error) {
                fieldErrors.push(error);
              }
            }
          }
        }

        if (fieldErrors.length > 0) {
          errors[field] = fieldErrors;
          hasErrors = true;
        }
      }
    }

    // Validate request parameters
    if (validationRules.params && req.params) {
      for (const [field, rules] of Object.entries(validationRules.params)) {
        const value = req.params[field];
        const fieldErrors = [];

        if (rules.validators) {
          for (const [validatorName, validatorArgs] of Object.entries(rules.validators)) {
            const validator = validators[validatorName];
            if (validator) {
              const error = validator(value, validatorArgs);
              if (error) {
                fieldErrors.push(error);
              }
            }
          }
        }

        if (fieldErrors.length > 0) {
          errors[field] = fieldErrors;
          hasErrors = true;
        }
      }
    }

    if (hasErrors) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    next();
  };
}

// Common validation rule sets
const commonRules = {
  email: {
    sanitize: ['trim', 'lowercase'],
    validators: {
      required: true,
      email: true
    }
  },
  
  password: {
    validators: {
      required: true,
      password: true,
      minLength: 8,
      maxLength: 128
    }
  },
  
  name: {
    sanitize: ['trim'],
    validators: {
      required: true,
      name: true,
      minLength: 2,
      maxLength: 100
    }
  },
  
  phone: {
    sanitize: ['trim'],
    validators: {
      phone: true
    }
  },
  
  date: {
    validators: {
      date: true
    }
  },
  
  positiveInteger: {
    validators: {
      required: true,
      positiveInteger: true
    }
  },
  
  appointmentId: {
    validators: {
      required: true,
      positiveInteger: true
    }
  },
  
  rating: {
    validators: {
      required: true,
      rating: true
    }
  }
};

module.exports = {
  validate,
  validators,
  sanitizers,
  PATTERNS,
  commonRules
};