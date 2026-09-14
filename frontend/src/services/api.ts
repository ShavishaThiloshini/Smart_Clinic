import { ErrorHandler, NetworkError, AuthError } from '../utils/errorHandler';
import { ERROR_MESSAGES } from '../utils/constants';

export class ApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

const TOKEN_KEY = 'sc_token';
const USER_KEY = 'sc_user';
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export function clearStoredSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function messageForStatus(status: number): string {
  const messages: Record<number, string> = {
    400: ERROR_MESSAGES.VALIDATION_ERROR,
    401: ERROR_MESSAGES.UNAUTHORIZED,
    403: ERROR_MESSAGES.FORBIDDEN,
    404: ERROR_MESSAGES.NOT_FOUND,
    409: ERROR_MESSAGES.CONFLICT,
    422: ERROR_MESSAGES.VALIDATION_ERROR,
    429: 'Too many requests. Please wait a moment and try again.',
    500: ERROR_MESSAGES.SERVER_ERROR,
    503: 'Service unavailable. Please try again later.'
  };
  return messages[status] || ERROR_MESSAGES.SERVER_ERROR;
}

async function readJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  return null;
}

export async function apiRequest<T>(url: string, options: RequestInit = {}, authenticated = true): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = new Headers(options.headers);
  
  if (authenticated && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  
  try {
    response = await fetch(`${API_BASE_URL}${url}`, { 
      ...options, 
      headers,
      credentials: 'include' // Include cookies for CORS
    });
  } catch (error) {
    ErrorHandler.logError(new NetworkError(), { url, options });
    throw new NetworkError();
  }

  const data = await readJson(response).catch(() => null);
  
  if (!response.ok) {
    if (response.status === 401) {
      clearStoredSession();
      window.dispatchEvent(new Event('sc:auth-expired'));
      throw new AuthError();
    }
    
    const errorMessage = data && typeof data === 'object' && 'message' in data 
      ? (data as { message: string }).message 
      : messageForStatus(response.status);
    
    throw new ApiError(errorMessage, response.status);
  }
  
  return data as T;
}

// Enhanced API request with retry logic
export async function apiRequestWithRetry<T>(
  url: string, 
  options: RequestInit = {}, 
  authenticated = true,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiRequest<T>(url, options, authenticated);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on client errors (4xx)
      if (lastError instanceof ApiError && lastError.status && lastError.status >= 400 && lastError.status < 500) {
        throw lastError;
      }
      
      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }
  
  throw lastError!;
}

// API request with timeout
export async function apiRequestWithTimeout<T>(
  url: string,
  options: RequestInit = {},
  authenticated = true,
  timeout: number = 30000
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const result = await apiRequest<T>(url, {
      ...options,
      signal: controller.signal
    }, authenticated);
    
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Request timeout. Please try again.');
    }
    
    throw error;
  }
}
