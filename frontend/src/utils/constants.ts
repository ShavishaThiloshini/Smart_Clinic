// Security constants
export const SECURITY_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,
  SESSION_TIMEOUT_MINUTES: 30,
  TOKEN_REFRESH_MINUTES: 15,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  MAX_TEXT_LENGTH: 2000,
  MAX_COMMENT_LENGTH: 500,
} as const;

// Role constants
export const ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor', 
  ADMIN: 'admin',
} as const;

// Appointment status constants
export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  'NO_SHOW': 'no-show',
} as const;

// Review status constants
export const REVIEW_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

// Specialization constants
export const SPECIALIZATIONS = [
  'Cardiologist',
  'Dermatologist',
  'Neurologist', 
  'Pediatrician',
  'General Practitioner',
] as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to reach the server. Please check your connection and try again.',
  UNAUTHORIZED: 'Your session has expired. Please sign in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested information could not be found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  DUPLICATE_ENTRY: 'This information already exists.',
  CONFLICT: 'This time slot is no longer available. Please select another slot.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Profile updated successfully.',
  APPOINTMENT_BOOKED: 'Appointment booked successfully.',
  APPOINTMENT_CANCELLED: 'Appointment cancelled successfully.',
  APPOINTMENT_RESCHEDULED: 'Appointment rescheduled successfully.',
  REVIEW_SUBMITTED: 'Review submitted successfully.',
  PRESCRIPTION_CREATED: 'Prescription created successfully.',
  AVAILABILITY_SAVED: 'Availability saved successfully.',
} as const;