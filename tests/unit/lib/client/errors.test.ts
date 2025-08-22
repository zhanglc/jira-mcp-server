/**
 * HTTP Client Errors Test Suite
 *
 * Tests for HTTP client error classes and error handling utilities.
 */

import {
  HttpError,
  NetworkError,
  TimeoutError,
  AuthenticationError,
  AuthorizationError,
  BadRequestError,
  NotFoundError,
  RateLimitError,
  ServerError,
  ConfigurationError,
  createHttpErrorFromResponse,
  isRetryableError,
  isAuthenticationError,
  isAuthorizationError,
  isRateLimitError,
} from '@/lib/client/errors';
import type { HttpResponse, HttpRequestConfig } from '@/lib/client/types';

describe('HTTP Client Errors', () => {
  const mockConfig: HttpRequestConfig = {
    method: 'GET',
    url: '/test',
    headers: {},
  };

  const mockResponse: HttpResponse = {
    data: { error: 'Test error' },
    status: 500,
    statusText: 'Internal Server Error',
    headers: {},
    config: mockConfig,
  };

  describe('HttpError', () => {
    it('should create basic HTTP error', () => {
      const error = new HttpError({
        code: 'TEST_ERROR',
        message: 'Test error message',
        config: mockConfig,
      });

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(HttpError);
      expect(error.name).toBe('HttpError');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test error message');
      expect(error.type).toBe('http_client_error');
      expect(error.config).toBe(mockConfig);
      expect(error.isRetryableError).toBe(false);
      expect(error.timestamp).toBeDefined();
    });

    it('should handle response data in error', () => {
      const error = new HttpError({
        code: 'HTTP_ERROR',
        message: 'HTTP error',
        response: mockResponse,
      });

      expect(error.response).toEqual({
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        data: { error: 'Test error' },
      });
    });

    it('should handle retry information', () => {
      const error = new HttpError({
        code: 'RETRY_ERROR',
        message: 'Retryable error',
        isRetryableError: true,
        retryCount: 2,
        requestDuration: 1500,
      });

      expect(error.isRetryableError).toBe(true);
      expect(error.retryCount).toBe(2);
      expect(error.requestDuration).toBe(1500);
    });
  });

  describe('NetworkError', () => {
    it('should create network error', () => {
      const error = new NetworkError({
        message: 'Connection failed',
        config: mockConfig,
        requestDuration: 1000,
      });

      expect(error).toBeInstanceOf(HttpError);
      expect(error).toBeInstanceOf(NetworkError);
      expect(error.name).toBe('NetworkError');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.isRetryableError).toBe(true);
    });
  });

  describe('TimeoutError', () => {
    it('should create timeout error', () => {
      const error = new TimeoutError({
        timeout: 5000,
        config: mockConfig,
        requestDuration: 5100,
      });

      expect(error).toBeInstanceOf(HttpError);
      expect(error).toBeInstanceOf(TimeoutError);
      expect(error.name).toBe('TimeoutError');
      expect(error.code).toBe('TIMEOUT_ERROR');
      expect(error.message).toBe('Request timeout after 5000ms');
      expect(error.isRetryableError).toBe(true);
      expect(error.details).toEqual({ timeout: 5000 });
    });
  });

  describe('AuthenticationError', () => {
    it('should create authentication error', () => {
      const error = new AuthenticationError({
        message: 'Invalid token',
        config: mockConfig,
        authMethod: 'PAT',
      });

      expect(error).toBeInstanceOf(HttpError);
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.name).toBe('AuthenticationError');
      expect(error.code).toBe('AUTHENTICATION_ERROR');
      expect(error.isRetryableError).toBe(false);
      expect(error.details).toEqual({ authMethod: 'PAT' });
    });
  });

  describe('AuthorizationError', () => {
    it('should create authorization error', () => {
      const error = new AuthorizationError({
        message: 'Access denied',
        config: mockConfig,
        resource: '/api/projects',
      });

      expect(error).toBeInstanceOf(HttpError);
      expect(error).toBeInstanceOf(AuthorizationError);
      expect(error.name).toBe('AuthorizationError');
      expect(error.code).toBe('AUTHORIZATION_ERROR');
      expect(error.isRetryableError).toBe(false);
      expect(error.details).toEqual({ resource: '/api/projects' });
    });
  });

  describe('BadRequestError', () => {
    it('should create bad request error', () => {
      const validationErrors = ['Field is required', 'Invalid format'];
      const error = new BadRequestError({
        message: 'Validation failed',
        config: mockConfig,
        validationErrors,
      });

      expect(error).toBeInstanceOf(HttpError);
      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.name).toBe('BadRequestError');
      expect(error.code).toBe('BAD_REQUEST_ERROR');
      expect(error.isRetryableError).toBe(false);
      expect(error.details).toEqual({ validationErrors });
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error', () => {
      const error = new NotFoundError({
        resource: '/api/issue/TEST-123',
        config: mockConfig,
      });

      expect(error).toBeInstanceOf(HttpError);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.name).toBe('NotFoundError');
      expect(error.code).toBe('NOT_FOUND_ERROR');
      expect(error.message).toBe('Resource not found: /api/issue/TEST-123');
      expect(error.isRetryableError).toBe(false);
      expect(error.details).toEqual({ resource: '/api/issue/TEST-123' });
    });
  });

  describe('RateLimitError', () => {
    it('should create rate limit error', () => {
      const error = new RateLimitError({
        message: 'Rate limit exceeded',
        config: mockConfig,
        retryAfter: 60,
      });

      expect(error).toBeInstanceOf(HttpError);
      expect(error).toBeInstanceOf(RateLimitError);
      expect(error.name).toBe('RateLimitError');
      expect(error.code).toBe('RATE_LIMIT_ERROR');
      expect(error.isRetryableError).toBe(true);
      expect(error.retryAfter).toBe(60);
      expect(error.details).toEqual({ retryAfter: 60 });
    });

    it('should handle missing retry-after', () => {
      const error = new RateLimitError({
        message: 'Rate limit exceeded',
        config: mockConfig,
      });

      expect(error.retryAfter).toBeUndefined();
    });
  });

  describe('ServerError', () => {
    it('should create server error with default retryable', () => {
      const error = new ServerError({
        message: 'Internal server error',
        config: mockConfig,
      });

      expect(error).toBeInstanceOf(HttpError);
      expect(error).toBeInstanceOf(ServerError);
      expect(error.name).toBe('ServerError');
      expect(error.code).toBe('SERVER_ERROR');
      expect(error.isRetryableError).toBe(true);
    });

    it('should create server error with custom retryable', () => {
      const error = new ServerError({
        message: 'Bad gateway',
        config: mockConfig,
        isRetryableError: false,
      });

      expect(error.isRetryableError).toBe(false);
    });
  });

  describe('ConfigurationError', () => {
    it('should create configuration error', () => {
      const error = new ConfigurationError({
        message: 'Invalid URL',
        config: mockConfig,
        parameter: 'baseUrl',
      });

      expect(error).toBeInstanceOf(HttpError);
      expect(error).toBeInstanceOf(ConfigurationError);
      expect(error.name).toBe('ConfigurationError');
      expect(error.code).toBe('CONFIGURATION_ERROR');
      expect(error.isRetryableError).toBe(false);
      expect(error.details).toEqual({ parameter: 'baseUrl' });
    });
  });

  describe('createHttpErrorFromResponse', () => {
    it('should create BadRequestError for 400 status', () => {
      const response = { ...mockResponse, status: 400, statusText: 'Bad Request' };
      const error = createHttpErrorFromResponse(response, mockConfig);

      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.code).toBe('BAD_REQUEST_ERROR');
    });

    it('should create AuthenticationError for 401 status', () => {
      const response = { ...mockResponse, status: 401, statusText: 'Unauthorized' };
      const error = createHttpErrorFromResponse(response, mockConfig);

      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should create AuthorizationError for 403 status', () => {
      const response = { ...mockResponse, status: 403, statusText: 'Forbidden' };
      const error = createHttpErrorFromResponse(response, mockConfig);

      expect(error).toBeInstanceOf(AuthorizationError);
      expect(error.code).toBe('AUTHORIZATION_ERROR');
    });

    it('should create NotFoundError for 404 status', () => {
      const response = { ...mockResponse, status: 404, statusText: 'Not Found' };
      const error = createHttpErrorFromResponse(response, mockConfig);

      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.code).toBe('NOT_FOUND_ERROR');
    });

    it('should create RateLimitError for 429 status', () => {
      const response = {
        ...mockResponse,
        status: 429,
        statusText: 'Too Many Requests',
        headers: { 'retry-after': '60' },
      };
      const error = createHttpErrorFromResponse(response, mockConfig);

      expect(error).toBeInstanceOf(RateLimitError);
      expect(error.code).toBe('RATE_LIMIT_ERROR');
      expect((error as RateLimitError).retryAfter).toBe(60);
    });

    it('should create ServerError for 5xx status', () => {
      const response = { ...mockResponse, status: 503, statusText: 'Service Unavailable' };
      const error = createHttpErrorFromResponse(response, mockConfig);

      expect(error).toBeInstanceOf(ServerError);
      expect(error.code).toBe('SERVER_ERROR');
      expect(error.isRetryableError).toBe(true);
    });

    it('should create generic HttpError for other status codes', () => {
      const response = { ...mockResponse, status: 418, statusText: 'I\'m a teapot' };
      const error = createHttpErrorFromResponse(response, mockConfig);

      expect(error).toBeInstanceOf(HttpError);
      expect(error.code).toBe('HTTP_ERROR');
      expect(error.isRetryableError).toBe(false);
    });
  });

  describe('Type Guards', () => {
    describe('isRetryableError', () => {
      it('should return true for retryable errors', () => {
        const networkError = new NetworkError({ message: 'Connection failed' });
        const timeoutError = new TimeoutError({ timeout: 5000 });
        const serverError = new ServerError({ message: 'Server error' });

        expect(isRetryableError(networkError)).toBe(true);
        expect(isRetryableError(timeoutError)).toBe(true);
        expect(isRetryableError(serverError)).toBe(true);
      });

      it('should return false for non-retryable errors', () => {
        const authError = new AuthenticationError({ message: 'Auth failed' });
        const notFoundError = new NotFoundError({ resource: '/test' });

        expect(isRetryableError(authError)).toBe(false);
        expect(isRetryableError(notFoundError)).toBe(false);
      });

      it('should handle system errors by code', () => {
        const econnresetError = new Error('Connection reset');
        (econnresetError as any).code = 'ECONNRESET';

        const enotfoundError = new Error('Not found');
        (enotfoundError as any).code = 'ENOTFOUND';

        const unknownError = new Error('Unknown error');

        expect(isRetryableError(econnresetError)).toBe(true);
        expect(isRetryableError(enotfoundError)).toBe(true);
        expect(isRetryableError(unknownError)).toBe(false);
      });
    });

    describe('isAuthenticationError', () => {
      it('should return true for authentication errors', () => {
        const authError = new AuthenticationError({ message: 'Auth failed' });
        expect(isAuthenticationError(authError)).toBe(true);
      });

      it('should return false for other errors', () => {
        const networkError = new NetworkError({ message: 'Network failed' });
        expect(isAuthenticationError(networkError)).toBe(false);
      });
    });

    describe('isAuthorizationError', () => {
      it('should return true for authorization errors', () => {
        const authzError = new AuthorizationError({ message: 'Access denied', resource: '/test' });
        expect(isAuthorizationError(authzError)).toBe(true);
      });

      it('should return false for other errors', () => {
        const networkError = new NetworkError({ message: 'Network failed' });
        expect(isAuthorizationError(networkError)).toBe(false);
      });
    });

    describe('isRateLimitError', () => {
      it('should return true for rate limit errors', () => {
        const rateLimitError = new RateLimitError({ message: 'Rate limited' });
        expect(isRateLimitError(rateLimitError)).toBe(true);
      });

      it('should return false for other errors', () => {
        const networkError = new NetworkError({ message: 'Network failed' });
        expect(isRateLimitError(networkError)).toBe(false);
      });
    });
  });
});