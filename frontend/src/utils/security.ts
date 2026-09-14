import { SECURITY_CONFIG } from './constants';

// Security utilities for frontend

// XSS Prevention
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// SQL Injection Prevention (basic input sanitization)
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes that could be used for injection
    .trim();
}

// CSRF Token Management
export class CSRFProtection {
  private static token: string | null = null;

  static generateToken(): string {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    this.token = token;
    return token;
  }

  static getToken(): string | null {
    return this.token;
  }

  static validateToken(token: string): boolean {
    return this.token === token;
  }

  static clearToken(): void {
    this.token = null;
  }
}

// Session Management
export class SessionManager {
  private static readonly SESSION_KEY = 'sc_session';
  private static readonly ACTIVITY_KEY = 'sc_last_activity';

  static setSession(sessionData: any): void {
    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
      this.updateActivity();
    } catch (error) {
      console.error('Failed to set session:', error);
    }
  }

  static getSession(): any | null {
    try {
      const session = localStorage.getItem(this.SESSION_KEY);
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }

  static clearSession(): void {
    try {
      localStorage.removeItem(this.SESSION_KEY);
      localStorage.removeItem(this.ACTIVITY_KEY);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  static updateActivity(): void {
    try {
      localStorage.setItem(this.ACTIVITY_KEY, Date.now().toString());
    } catch (error) {
      console.error('Failed to update activity:', error);
    }
  }

  static isSessionValid(): boolean {
    try {
      const lastActivity = localStorage.getItem(this.ACTIVITY_KEY);
      if (!lastActivity) return false;

      const elapsed = Date.now() - parseInt(lastActivity, 10);
      const timeoutMs = SECURITY_CONFIG.SESSION_TIMEOUT_MINUTES * 60 * 1000;

      return elapsed < timeoutMs;
    } catch (error) {
      console.error('Failed to check session validity:', error);
      return false;
    }
  }

  static startActivityTracking(): void {
    // Update activity on user interactions
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    const updateActivity = () => {
      this.updateActivity();
    };

    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Check session validity periodically
    setInterval(() => {
      if (!this.isSessionValid()) {
        this.clearSession();
        window.location.href = '/login';
      }
    }, 60000); // Check every minute
  }
}

// Content Security Policy helpers
export function setCSPHeaders(): void {
  // This would typically be set on the server, but we can add meta tags dynamically
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self';";
  document.head.appendChild(meta);
}

// Input validation
export function validateInput(input: string, type: 'email' | 'phone' | 'name' | 'text'): boolean {
  const patterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[\d\s\-\+\(\)]{10,20}$/,
    name: /^[a-zA-Z\s\-']{2,100}$/,
    text: /^[\w\s\-',.!?@#$%^&*()]{1,500}$/
  };

  return patterns[type].test(input);
}

// Secure localStorage wrapper
export class SecureStorage {
  private static prefix = 'sc_';

  static setItem(key: string, value: any): void {
    try {
      const fullKey = this.prefix + key;
      const encrypted = btoa(JSON.stringify(value)); // Basic encoding (use proper encryption in production)
      localStorage.setItem(fullKey, encrypted);
    } catch (error) {
      console.error('Failed to set secure storage item:', error);
    }
  }

  static getItem<T>(key: string): T | null {
    try {
      const fullKey = this.prefix + key;
      const encrypted = localStorage.getItem(fullKey);
      if (!encrypted) return null;

      const decrypted = atob(encrypted);
      return JSON.parse(decrypted) as T;
    } catch (error) {
      console.error('Failed to get secure storage item:', error);
      return null;
    }
  }

  static removeItem(key: string): void {
    try {
      const fullKey = this.prefix + key;
      localStorage.removeItem(fullKey);
    } catch (error) {
      console.error('Failed to remove secure storage item:', error);
    }
  }

  static clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
    }
  }
}

// Password strength checker
export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length < 8) {
    feedback.push('Password should be at least 8 characters');
  } else {
    score += 1;
  }

  if (!/[a-z]/.test(password)) {
    feedback.push('Add lowercase letters');
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push('Add uppercase letters');
  } else {
    score += 1;
  }

  if (!/\d/.test(password)) {
    feedback.push('Add numbers');
  } else {
    score += 1;
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    feedback.push('Add special characters');
  } else {
    score += 1;
  }

  return { score, feedback };
}

// Rate limiting for frontend actions
export class RateLimiter {
  private static limits: Map<string, { count: number; resetTime: number }> = new Map();

  static checkLimit(action: string, maxRequests: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const limit = this.limits.get(action);

    if (!limit || now > limit.resetTime) {
      this.limits.set(action, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }

    if (limit.count >= maxRequests) {
      return false;
    }

    limit.count++;
    return true;
  }

  static getRemainingRequests(action: string, maxRequests: number = 5): number {
    const limit = this.limits.get(action);
    if (!limit) return maxRequests;
    return Math.max(0, maxRequests - limit.count);
  }

  static resetLimit(action: string): void {
    this.limits.delete(action);
  }
}

// Security headers helper
export function addSecurityHeaders(): void {
  // Add security-related meta tags
  const metaTags = [
    { httpEquiv: 'X-Content-Type-Options', content: 'nosniff' },
    { httpEquiv: 'X-Frame-Options', content: 'DENY' },
    { httpEquiv: 'X-XSS-Protection', content: '1; mode=block' },
    { name: 'referrer', content: 'strict-origin-when-cross-origin' }
  ];

  metaTags.forEach(tag => {
    const meta = document.createElement('meta');
    if (tag.httpEquiv) meta.httpEquiv = tag.httpEquiv;
    if (tag.name) meta.name = tag.name;
    meta.content = tag.content;
    document.head.appendChild(meta);
  });
}

// URL parameter sanitization
export function sanitizeUrlParams(params: URLSearchParams): Record<string, string> {
  const sanitized: Record<string, string> = {};
  
  params.forEach((value, key) => {
    sanitized[key] = sanitizeInput(value);
  });

  return sanitized;
}

// File upload validation
export function validateFileUpload(file: File, allowedTypes: string[], maxSizeMB: number = 5): {
  valid: boolean;
  error?: string;
} {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`
    };
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`
    };
  }

  return { valid: true };
}