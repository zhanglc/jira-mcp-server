/**
 * HTTP Client Type Definitions
 *
 * Type definitions for HTTP client including request/response interfaces,
 * authentication, and error handling.
 */

import type { AuthConfig, ConnectionConfig } from '@/types/config';
import type { RetryConfig } from '@/types/common';
import type { BaseError } from '@/types/common';

/**
 * HTTP Methods supported by the client
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

/**
 * HTTP request configuration
 */
export interface HttpRequestConfig {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  data?: unknown;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
  retries?: number;
  validateStatus?: (status: number) => boolean;
}

/**
 * HTTP response interface
 */
export interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: HttpRequestConfig;
  request?: {
    url: string;
    method: string;
    timestamp: string;
    duration: number;
  };
}

/**
 * HTTP client configuration
 */
export interface HttpClientConfig {
  baseUrl: string;
  auth: AuthConfig;
  connection: ConnectionConfig;
  retry?: RetryConfig;
  defaultHeaders?: Record<string, string>;
}

/**
 * Request interceptor function
 */
export type RequestInterceptor = (
  config: HttpRequestConfig
) => HttpRequestConfig | Promise<HttpRequestConfig>;

/**
 * Response interceptor function
 */
export type ResponseInterceptor = (
  response: HttpResponse
) => HttpResponse | Promise<HttpResponse>;

/**
 * Error interceptor function
 */
export type ErrorInterceptor = (error: HttpClientError) => HttpClientError | Promise<HttpClientError>;

/**
 * HTTP client error interface extending BaseError
 */
export interface HttpClientError extends BaseError {
  type: 'http_client_error';
  name: string;
  config?: HttpRequestConfig | undefined;
  response?: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: unknown;
  } | undefined;
  isRetryableError?: boolean | undefined;
  retryCount?: number | undefined;
  requestDuration?: number | undefined;
  details?: Record<string, unknown> | undefined;
}

/**
 * Authentication provider interface
 */
export interface AuthProvider {
  authenticate(config: HttpRequestConfig): HttpRequestConfig | Promise<HttpRequestConfig>;
  isAuthenticationError(error: HttpClientError): boolean;
  refreshToken?(): Promise<void>;
}

/**
 * Retry policy interface
 */
export interface RetryPolicy {
  shouldRetry(error: HttpClientError, attempt: number): boolean;
  getDelay(attempt: number): number;
  maxRetries: number;
}

/**
 * Request metrics interface
 */
export interface RequestMetrics {
  url: string;
  method: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status?: number;
  retries: number;
  error?: string;
}

/**
 * HTTP client interface
 */
export interface HttpClient {
  // Core HTTP methods
  get<T = unknown>(url: string, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>>;
  post<T = unknown>(url: string, data?: unknown, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>>;
  put<T = unknown>(url: string, data?: unknown, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>>;
  delete<T = unknown>(url: string, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>>;
  patch<T = unknown>(url: string, data?: unknown, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>>;
  head(url: string, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<void>>;
  options(url: string, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<void>>;

  // Generic request method
  request<T = unknown>(config: HttpRequestConfig): Promise<HttpResponse<T>>;

  // Interceptors
  interceptors: {
    request: {
      use(interceptor: RequestInterceptor): number;
      eject(id: number): void;
    };
    response: {
      use(interceptor: ResponseInterceptor, errorInterceptor?: ErrorInterceptor): number;
      eject(id: number): void;
    };
  };

  // Configuration
  defaults: HttpClientConfig;
  
  // Utility methods
  setAuthToken(token: string): void;
  getMetrics(): RequestMetrics[];
  clearMetrics(): void;
}