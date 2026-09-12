// Email validation with stricter regex
export function isValidEmail(value: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value.trim());
}

// Password validation with complexity requirements
export function validatePassword(value: string): string {
  if (value.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  if (!/[A-Za-z]/.test(value)) {
    return 'Password must contain at least one letter.';
  }
  if (!/\d/.test(value)) {
    return 'Password must contain at least one number.';
  }
  return '';
}

// Name validation
export function validateName(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length < 2) {
    return 'Name must be at least 2 characters.';
  }
  if (trimmed.length > 100) {
    return 'Name must be less than 100 characters.';
  }
  if (!/^[a-zA-Z\s\-']+$/.test(trimmed)) {
    return 'Name can only contain letters, spaces, hyphens, and apostrophes.';
  }
  return '';
}

// Phone number validation
export function validatePhone(value: string): string {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,20}$/;
  if (!phoneRegex.test(value.trim())) {
    return 'Please enter a valid phone number.';
  }
  return '';
}

// Date validation
export function isValidDate(value: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(value)) return false;
  
  const date = new Date(value);
  return !isNaN(date.getTime()) && value === date.toISOString().split('T')[0];
}

// Future date validation
export function isFutureDate(value: string): boolean {
  if (!isValidDate(value)) return false;
  const date = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

// Time validation (HH:MM format)
export function isValidTime(value: string): boolean {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(value);
}

// Numeric validation
export function isPositiveNumber(value: string | number): boolean {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num > 0;
}

// Text length validation
export function validateTextLength(value: string, min: number, max: number, fieldName: string): string {
  const trimmed = value.trim();
  if (trimmed.length < min) {
    return `${fieldName} must be at least ${min} characters.`;
  }
  if (trimmed.length > max) {
    return `${fieldName} must be less than ${max} characters.`;
  }
  return '';
}

// Sanitize input to prevent XSS
export function sanitizeInput(value: string): string {
  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Validate specialization
export function isValidSpecialization(value: string): boolean {
  const validSpecializations = [
    'Cardiologist',
    'Dermatologist', 
    'Neurologist',
    'Pediatrician',
    'General Practitioner'
  ];
  return validSpecializations.includes(value);
}

// Validate rating (1-5 stars)
export function isValidRating(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

// Validate consultation fee
export function validateConsultationFee(value: string | number): string {
  const fee = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(fee) || fee < 0) {
    return 'Consultation fee must be a valid positive number.';
  }
  if (fee > 100000) {
    return 'Consultation fee seems unusually high. Please verify.';
  }
  return '';
}

// Validate experience years
export function validateExperience(value: string | number): string {
  const exp = typeof value === 'string' ? parseInt(value, 10) : value;
  if (isNaN(exp) || exp < 0) {
    return 'Experience must be a valid positive number.';
  }
  if (exp > 80) {
    return 'Experience years seem unrealistic. Please verify.';
  }
  return '';
}
