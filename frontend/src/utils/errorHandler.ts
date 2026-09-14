import { ERROR_MESSAGES } from './constants';

// Custom error class for application-specific errors
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Network error
export class NetworkError extends AppError {
  constructor(message: string = ERROR_MESSAGES.NETWORK_ERROR) {
    super(message, 'NETWORK_ERROR', 0);
    this.name = 'NetworkError';
  }
}

// Authentication error
export class AuthError extends AppError {
  constructor(message: string = ERROR_MESSAGES.UNAUTHORIZED) {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthError';
  }
}

// Authorization error
export class AuthorizationError extends AppError {
  constructor(message: string = ERROR_MESSAGES.FORBIDDEN) {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

// Validation error
export class ValidationError extends AppError {
  constructor(message: string = ERROR_MESSAGES.VALIDATION_ERROR, details?: any) {
    super(message, 'VALIDATION_ERROR', 422, details);
    this.name = 'ValidationError';
  }
}

// Not found error
export class NotFoundError extends AppError {
  constructor(message: string = ERROR_MESSAGES.NOT_FOUND) {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

// Conflict error
export class ConflictError extends AppError {
  constructor(message: string = ERROR_MESSAGES.CONFLICT) {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}

// Server error
export class ServerError extends AppError {
  constructor(message: string = ERROR_MESSAGES.SERVER_ERROR) {
    super(message, 'SERVER_ERROR', 500);
    this.name = 'ServerError';
  }
}

// Error handler utility
export class ErrorHandler {
  static handle(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return new NetworkError(error.message);
      }

      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        return new AuthError(error.message);
      }

      if (error.message.includes('403') || error.message.includes('forbidden')) {
        return new AuthorizationError(error.message);
      }

      if (error.message.includes('404') || error.message.includes('not found')) {
        return new NotFoundError(error.message);
      }

      if (error.message.includes('409') || error.message.includes('conflict')) {
        return new ConflictError(error.message);
      }

      if (error.message.includes('422') || error.message.includes('validation')) {
        return new ValidationError(error.message);
      }

      // Default to server error
      return new ServerError(error.message);
    }

    // Unknown error type
    return new ServerError('An unexpected error occurred');
  }

  static getUserMessage(error: AppError): string {
    return error.message;
  }

  static getErrorCode(error: AppError): string {
    return error.code;
  }

  static getStatusCode(error: AppError): number {
    return error.statusCode;
  }

  static logError(error: AppError, context?: any): void {
    console.error('Application Error:', {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
      context,
      timestamp: new Date().toISOString()
    });
  }
}

// Error boundary component support
export interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
}

export function componentDidCatch(error: Error, errorInfo: any): AppError {
  const appError = ErrorHandler.handle(error);
  ErrorHandler.logError(appError, { errorInfo });
  return appError;
}

// Async error handler for promises
export function handleAsyncError(
  promise: Promise<any>,
  onError?: (error: AppError) => void
): Promise<any> {
  return promise.catch((error) => {
    const appError = ErrorHandler.handle(error);
    ErrorHandler.logError(appError);
    if (onError) {
      onError(appError);
    }
    throw appError;
  });
}

// Retry mechanism for failed requests
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: AppError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = ErrorHandler.handle(error);
      
      // Don't retry on client errors (4xx)
      if (lastError.statusCode >= 400 && lastError.statusCode < 500) {
        throw lastError;
      }

      // Wait before retrying
      if (i < maxRetries - 1) {
        await new Promise(resolve => window.setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  throw lastError!;
}

// Debounce error reporting to avoid spam
export function debounceErrorReporting(
  errorFn: (error: AppError) => void,
  delay: number = 1000
): (error: AppError) => void {
  let timeoutId: number | null = null;
  let lastError: AppError | null = null;

  return (error: AppError) => {
    lastError = error;
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = window.setTimeout(() => {
      if (lastError) {
        errorFn(lastError);
      }
      timeoutId = null;
      lastError = null;
    }, delay);
  };
}