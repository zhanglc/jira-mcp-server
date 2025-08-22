/**
 * HTTP Client Module
 *
 * Comprehensive HTTP client for Jira Server API interactions with
 * authentication, retry logic, and error handling.
 */

// Core HTTP client
export { JiraHttpClient, createHttpClient } from './http-client';

// Types
export type {
  HttpClient,
  HttpClientConfig,
  HttpRequestConfig,
  HttpResponse,
  HttpMethod,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  RequestMetrics,
  AuthProvider,
  RetryPolicy,
  HttpClientError,
} from './types';

// Error classes and utilities
export {
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
} from './errors';

// Authentication
export { PATAuthProvider, createAuthProvider, getAuthErrorInfo } from './auth';

// Retry logic
export {
  DefaultRetryPolicy,
  NoRetryPolicy,
  ConservativeRetryPolicy,
  AggressiveRetryPolicy,
  createRetryPolicy,
  withRetry,
  sleep,
} from './retry';

// Import the type and factory function for use in function signature
import type { HttpClient } from './types';
import { createHttpClient } from './http-client';

/**
 * Create a configured HTTP client for Jira Server
 */
export function createJiraHttpClient(config: {
  baseUrl: string;
  personalToken: string;
  sslVerify?: boolean;
  timeout?: number;
  enableRetry?: boolean;
  maxRetries?: number;
}): HttpClient {
  return createHttpClient({
    baseUrl: config.baseUrl,
    auth: {
      personalToken: config.personalToken,
      tokenType: 'bearer',
    },
    connection: {
      timeout: config.timeout || 30000,
      sslVerify: config.sslVerify ?? true,
      keepAlive: true,
      userAgent: 'jira-server-mcp/1.0.0',
    },
    retry: config.enableRetry ? {
      enabled: true,
      maxRetries: config.maxRetries || 3,
      backoffMultiplier: 2,
      maxBackoffTime: 30000,
    } : {
      enabled: false,
      maxRetries: 0,
      backoffMultiplier: 2,
      maxBackoffTime: 30000,
    },
  });
}