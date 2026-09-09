export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function validatePassword(value: string) {
  return value.length >= 8 ? '' : 'Password must be at least 8 characters.';
}
