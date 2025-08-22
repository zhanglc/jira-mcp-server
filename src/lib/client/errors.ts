/**
 * HTTP Client Error Classes
 *
 * Comprehensive error handling for HTTP client operations including
 * network errors, authentication failures, and retry logic.
 */

import type { HttpRequestConfig, HttpClientError, HttpResponse } from './types';

/**
 * Base HTTP client error class
 */
export class HttpError extends Error implements HttpClientError {
  public readonly type: 'http_client_error' = 'http_client_error';
  public readonly code: string;
  public readonly timestamp: string;
  public readonly config?: HttpRequestConfig | undefined;
  public readonly response?: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: unknown;
  } | undefined;
  public readonly isRetryableError?: boolean | undefined;
  public readonly retryCount?: number | undefined;
  public readonly requestDuration?: number | undefined;
  public readonly details?: Record<string, unknown> | undefined;

  constructor(data: {
    code: string;
    message: string;
    config?: HttpRequestConfig;
    response?: HttpResponse;
    isRetryableError?: boolean;
    retryCount?: number;
    requestDuration?: number;
    details?: Record<string, unknown>;
  }) {
    super(data.message);
    this.name = 'HttpError';
    this.code = data.code;
    this.timestamp = new Date().toISOString();
    this.config = data.config;
    this.isRetryableError = data.isRetryableError ?? false;
    this.retryCount = data.retryCount ?? 0;
    this.requestDuration = data.requestDuration;
    this.details = data.details;

    if (data.response) {
      this.response = {
        status: data.response.status,
        statusText: data.response.statusText,
        headers: data.response.headers,
        data: data.response.data,
      };
    }

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

/**
 * Network-related HTTP errors
 */
export class NetworkError extends HttpError {
  constructor(data: {
    message: string;
    config?: HttpRequestConfig;
    requestDuration?: number;
    details?: Record<string, unknown>;
  }) {
    const superData: any = {
      code: 'NETWORK_ERROR',
      message: data.message,
      isRetryableError: true,
    };
    
    if (data.config !== undefined) {
      superData.config = data.config;
    }
    if (data.requestDuration !== undefined) {
      superData.requestDuration = data.requestDuration;
    }
    if (data.details !== undefined) {
      superData.details = data.details;
    }
    
    super(superData);
    this.name = 'NetworkError';
  }
}

/**
 * Timeout-related HTTP errors
 */
export class TimeoutError extends HttpError {
  constructor(data: {
    timeout: number;
    config?: HttpRequestConfig;
    requestDuration?: number;
  }) {
    const superData: any = {
      code: 'TIMEOUT_ERROR',
      message: `Request timeout after ${data.timeout}ms`,
      isRetryableError: true,
      details: { timeout: data.timeout },
    };
    
    if (data.config !== undefined) {
      superData.config = data.config;
    }
    if (data.requestDuration !== undefined) {
      superData.requestDuration = data.requestDuration;
    }
    
    super(superData);
    this.name = 'TimeoutError';
  }
}

/**
 * Authentication-related HTTP errors
 */
export class AuthenticationError extends HttpError {
  constructor(data: {
    message: string;
    config?: HttpRequestConfig;
    response?: HttpResponse;
    authMethod?: string;
  }) {
    const superData: any = {
      code: 'AUTHENTICATION_ERROR',
      message: data.message,
      isRetryableError: false,
      details: { authMethod: data.authMethod },
    };
    
    if (data.config !== undefined) {
      superData.config = data.config;
    }
    if (data.response !== undefined) {
      superData.response = data.response;
    }
    
    super(superData);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization-related HTTP errors (403)
 */
export class AuthorizationError extends HttpError {
  constructor(data: {
    message: string;
    config?: HttpRequestConfig;
    response?: HttpResponse;
    resource?: string;
  }) {
    const superData: any = {
      code: 'AUTHORIZATION_ERROR',
      message: data.message,
      isRetryableError: false,
      details: { resource: data.resource },
    };
    
    if (data.config !== undefined) {
      superData.config = data.config;
    }
    if (data.response !== undefined) {
      superData.response = data.response;
    }
    
    super(superData);
    this.name = 'AuthorizationError';
  }
}

/**
 * Request validation errors (400)
 */
export class BadRequestError extends HttpError {
  constructor(data: {
    message: string;
    config?: HttpRequestConfig;
    response?: HttpResponse;
    validationErrors?: string[];
  }) {
    const superData: any = {
      code: 'BAD_REQUEST_ERROR',
      message: data.message,
      isRetryableError: false,
      details: { validationErrors: data.validationErrors },
    };
    
    if (data.config !== undefined) {
      superData.config = data.config;
    }
    if (data.response !== undefined) {
      superData.response = data.response;
    }
    
    super(superData);
    this.name = 'BadRequestError';
  }
}

/**
 * Resource not found errors (404)
 */
export class NotFoundError extends HttpError {
  constructor(data: {
    resource: string;
    config?: HttpRequestConfig;
    response?: HttpResponse;
  }) {
    const superData: any = {
      code: 'NOT_FOUND_ERROR',
      message: `Resource not found: ${data.resource}`,
      isRetryableError: false,
      details: { resource: data.resource },
    };
    
    if (data.config !== undefined) {
      superData.config = data.config;
    }
    if (data.response !== undefined) {
      superData.response = data.response;
    }
    
    super(superData);
    this.name = 'NotFoundError';
  }
}

/**
 * Rate limiting errors (429)
 */
export class RateLimitError extends HttpError {
  public readonly retryAfter?: number | undefined;

  constructor(data: {
    message: string;
    config?: HttpRequestConfig;
    response?: HttpResponse;
    retryAfter?: number;
  }) {
    const superData: any = {
      code: 'RATE_LIMIT_ERROR',
      message: data.message,
      isRetryableError: true,
      details: { retryAfter: data.retryAfter },
    };
    
    if (data.config !== undefined) {
      superData.config = data.config;
    }
    if (data.response !== undefined) {
      superData.response = data.response;
    }
    
    super(superData);
    this.name = 'RateLimitError';
    this.retryAfter = data.retryAfter;
  }
}

/**
 * Server errors (5xx)
 */
export class ServerError extends HttpError {
  constructor(data: {
    message: string;
    config?: HttpRequestConfig;
    response?: HttpResponse;
    isRetryableError?: boolean;
  }) {
    const superData: any = {
      code: 'SERVER_ERROR',
      message: data.message,
      isRetryableError: data.isRetryableError ?? true,
    };
    
    if (data.config !== undefined) {
      superData.config = data.config;
    }
    if (data.response !== undefined) {
      superData.response = data.response;
    }
    
    super(superData);
    this.name = 'ServerError';
  }
}

/**
 * Configuration errors
 */
export class ConfigurationError extends HttpError {
  constructor(data: {
    message: string;
    config?: HttpRequestConfig;
    parameter?: string;
  }) {
    const superData: any = {
      code: 'CONFIGURATION_ERROR',
      message: data.message,
      isRetryableError: false,
      details: { parameter: data.parameter },
    };
    
    if (data.config !== undefined) {
      superData.config = data.config;
    }
    
    super(superData);
    this.name = 'ConfigurationError';
  }
}

/**
 * Utility function to create appropriate error from HTTP response
 */
export function createHttpErrorFromResponse(
  response: HttpResponse,
  config?: HttpRequestConfig,
  requestDuration?: number
): HttpError {
  const { status, statusText, data } = response;
  const message = `HTTP ${status}: ${statusText}`;

  switch (status) {
    case 400:
      const badRequestData: any = {
        message,
        validationErrors: Array.isArray(data) ? data : undefined,
      };
      if (config !== undefined) badRequestData.config = config;
      if (response !== undefined) badRequestData.response = response;
      return new BadRequestError(badRequestData);

    case 401:
      const authData: any = {
        message,
        authMethod: 'PAT',
      };
      if (config !== undefined) authData.config = config;
      if (response !== undefined) authData.response = response;
      return new AuthenticationError(authData);

    case 403:
      const authzData: any = {
        message,
        resource: config?.url,
      };
      if (config !== undefined) authzData.config = config;
      if (response !== undefined) authzData.response = response;
      return new AuthorizationError(authzData);

    case 404:
      const notFoundData: any = {
        resource: config?.url || 'Unknown',
      };
      if (config !== undefined) notFoundData.config = config;
      if (response !== undefined) notFoundData.response = response;
      return new NotFoundError(notFoundData);

    case 429:
      const retryAfter = response.headers['retry-after']
        ? parseInt(response.headers['retry-after'], 10)
        : undefined;
      const rateLimitData: any = {
        message,
        retryAfter,
      };
      if (config !== undefined) rateLimitData.config = config;
      if (response !== undefined) rateLimitData.response = response;
      return new RateLimitError(rateLimitData);

    default:
      if (status >= 500) {
        const serverErrorData: any = {
          message,
          isRetryableError: status >= 500 && status < 600,
        };
        if (config !== undefined) serverErrorData.config = config;
        if (response !== undefined) serverErrorData.response = response;
        return new ServerError(serverErrorData);
      }

      const errorData: any = {
        code: 'HTTP_ERROR',
        message,
        isRetryableError: false,
      };
      
      if (config !== undefined) {
        errorData.config = config;
      }
      if (response !== undefined) {
        errorData.response = response;
      }
      if (requestDuration !== undefined) {
        errorData.requestDuration = requestDuration;
      }
      
      return new HttpError(errorData);
  }
}

/**
 * Type guard for retryable errors
 */
export function isRetryableError(error: Error): boolean {
  if (error instanceof HttpError) {
    return error.isRetryableError ?? false;
  }

  // Network errors, timeouts, and some system errors are retryable
  if (error instanceof NetworkError || error instanceof TimeoutError) {
    return true;
  }

  // ECONNRESET, ENOTFOUND, etc.
  if ('code' in error) {
    const retryableCodes = [
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENETUNREACH',
      'EPROTO',
    ];
    return retryableCodes.includes(error.code as string);
  }

  return false;
}

/**
 * Type guard for authentication errors
 */
export function isAuthenticationError(error: Error): boolean {
  return error instanceof AuthenticationError;
}

/**
 * Type guard for authorization errors
 */
export function isAuthorizationError(error: Error): boolean {
  return error instanceof AuthorizationError;
}

/**
 * Type guard for rate limit errors
 */
export function isRateLimitError(error: Error): boolean {
  return error instanceof RateLimitError;
}