/**
 * HTTP Client Implementation
 *
 * Feature-rich HTTP client with PAT authentication, retry logic, interceptors,
 * and comprehensive error handling for Jira Server API interactions.
 */

import https from 'https';
import { URL } from 'url';
import type {
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
} from './types';
import {
  HttpError,
  NetworkError,
  TimeoutError,
  ConfigurationError,
  createHttpErrorFromResponse,
} from './errors';
import { createAuthProvider } from './auth';
import { createRetryPolicy, withRetry } from './retry';

/**
 * Interceptor management class
 */
class InterceptorManager<T> {
  private interceptors: Map<number, T> = new Map();
  private nextId = 0;

  public use(interceptor: T): number {
    const id = this.nextId++;
    this.interceptors.set(id, interceptor);
    return id;
  }

  public eject(id: number): void {
    this.interceptors.delete(id);
  }

  public forEach(callback: (interceptor: T) => void): void {
    this.interceptors.forEach(callback);
  }

  public get size(): number {
    return this.interceptors.size;
  }
}

/**
 * Main HTTP client implementation
 */
export class JiraHttpClient implements HttpClient {
  public readonly defaults: HttpClientConfig;
  private readonly authProvider: AuthProvider;
  private readonly retryPolicy: RetryPolicy;
  private readonly requestMetrics: RequestMetrics[] = [];
  private readonly httpsAgent?: https.Agent;

  // Interceptor managers
  public readonly interceptors = {
    request: new InterceptorManager<RequestInterceptor>(),
    response: new InterceptorManager<ResponseInterceptor>(),
    error: new InterceptorManager<ErrorInterceptor>(),
  };

  constructor(config: HttpClientConfig) {
    this.defaults = { ...config };
    this.authProvider = createAuthProvider(config.auth);
    this.retryPolicy = createRetryPolicy(config.retry || { enabled: false, maxRetries: 0, backoffMultiplier: 2, maxBackoffTime: 30000 });

    // Configure HTTPS agent for SSL settings
    if (config.baseUrl.startsWith('https://')) {
      this.httpsAgent = new https.Agent({
        rejectUnauthorized: config.connection.sslVerify,
        keepAlive: config.connection.keepAlive ?? true,
        timeout: config.connection.timeout,
      });
    }

    // Add default request interceptor for authentication
    this.interceptors.request.use((config) => this.authProvider.authenticate(config));
  }

  /**
   * HTTP GET request
   */
  public async get<T = unknown>(url: string, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'GET', url, ...config });
  }

  /**
   * HTTP POST request
   */
  public async post<T = unknown>(url: string, data?: unknown, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'POST', url, data, ...config });
  }

  /**
   * HTTP PUT request
   */
  public async put<T = unknown>(url: string, data?: unknown, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'PUT', url, data, ...config });
  }

  /**
   * HTTP DELETE request
   */
  public async delete<T = unknown>(url: string, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'DELETE', url, ...config });
  }

  /**
   * HTTP PATCH request
   */
  public async patch<T = unknown>(url: string, data?: unknown, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'PATCH', url, data, ...config });
  }

  /**
   * HTTP HEAD request
   */
  public async head(url: string, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<void>> {
    return this.request<void>({ method: 'HEAD', url, ...config });
  }

  /**
   * HTTP OPTIONS request
   */
  public async options(url: string, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<void>> {
    return this.request<void>({ method: 'OPTIONS', url, ...config });
  }

  /**
   * Generic HTTP request with full configuration
   */
  public async request<T = unknown>(config: HttpRequestConfig): Promise<HttpResponse<T>> {
    return withRetry(
      () => this.performRequest<T>(config),
      this.retryPolicy,
      (error, attempt, delay) => {
        // Log retry attempt (could be enhanced with actual logger)
        console.debug(`Retrying request (attempt ${attempt}) after ${delay}ms:`, {
          url: config.url,
          method: config.method,
          error: error.message,
        });
      }
    );
  }

  /**
   * Set authentication token
   */
  public setAuthToken(token: string): void {
    this.defaults.auth.personalToken = token;
  }

  /**
   * Get request metrics
   */
  public getMetrics(): RequestMetrics[] {
    return [...this.requestMetrics];
  }

  /**
   * Clear request metrics
   */
  public clearMetrics(): void {
    this.requestMetrics.length = 0;
  }

  /**
   * Perform the actual HTTP request
   */
  private async performRequest<T>(inputConfig: HttpRequestConfig): Promise<HttpResponse<T>> {
    const startTime = Date.now();
    let processedConfig = this.mergeConfig(inputConfig);

    // Apply request interceptors
    for (const [, interceptor] of this.interceptors.request['interceptors']) {
      const result = interceptor(processedConfig);
      processedConfig = result instanceof Promise ? await result : result;
    }

    const metrics: RequestMetrics = {
      url: processedConfig.url,
      method: processedConfig.method,
      startTime,
      retries: 0,
    };

    try {
      const response = await this.makeHttpRequest<T>(processedConfig);
      
      // Apply response interceptors
      let processedResponse: HttpResponse<T> = response as HttpResponse<T>;
      for (const [, interceptor] of this.interceptors.response['interceptors']) {
        const result = interceptor(processedResponse);
        processedResponse = (result instanceof Promise ? await result : result) as HttpResponse<T>;
      }

      // Update metrics
      const endTime = Date.now();
      metrics.endTime = endTime;
      metrics.duration = endTime - startTime;
      metrics.status = response.status;
      
      this.requestMetrics.push(metrics);

      return processedResponse;
    } catch (error) {
      const endTime = Date.now();
      metrics.endTime = endTime;
      metrics.duration = endTime - startTime;
      metrics.error = (error as Error).message;
      
      this.requestMetrics.push(metrics);

      // Apply error interceptors
      let processedError = error as HttpError;
      for (const [, interceptor] of this.interceptors.error['interceptors']) {
        const result = interceptor(processedError);
        processedError = result instanceof Promise ? await result : result;
      }

      throw processedError;
    }
  }

  /**
   * Make the actual HTTP request using Node.js built-in modules
   */
  private async makeHttpRequest<T>(config: HttpRequestConfig): Promise<HttpResponse<T>> {
    return new Promise((resolve, reject) => {
      try {
        const url = this.buildFullUrl(config.url, config.params);
        const urlObj = new URL(url);
        
        const requestOptions: https.RequestOptions = {
          hostname: urlObj.hostname,
          port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
          path: urlObj.pathname + urlObj.search,
          method: config.method,
          headers: this.buildHeaders(config),
          timeout: config.timeout || this.defaults.connection.timeout,
          agent: this.httpsAgent,
        };

        const startTime = Date.now();
        let responseReceived = false;

        const request = (urlObj.protocol === 'https:' ? https : require('http')).request(
          requestOptions,
          (response: any) => {
            responseReceived = true;
            this.handleResponse<T>(response, config, startTime, resolve, reject);
          }
        );

        // Handle request timeout
        request.on('timeout', () => {
          if (!responseReceived) {
            request.destroy();
            reject(new TimeoutError({
              timeout: config.timeout || this.defaults.connection.timeout,
              config,
              requestDuration: Date.now() - startTime,
            }));
          }
        });

        // Handle request errors
        request.on('error', (error: Error) => {
          if (!responseReceived) {
            reject(new NetworkError({
              message: `Request failed: ${error.message}`,
              config,
              requestDuration: Date.now() - startTime,
              details: { originalError: error.message },
            }));
          }
        });

        // Send request body if present
        if (config.data) {
          const body = this.serializeRequestBody(config.data, config.headers);
          request.write(body);
        }

        request.end();
      } catch (error) {
        reject(new ConfigurationError({
          message: `Failed to create request: ${(error as Error).message}`,
          config,
        }));
      }
    });
  }

  /**
   * Handle HTTP response
   */
  private handleResponse<T>(
    response: any,
    config: HttpRequestConfig,
    startTime: number,
    resolve: (value: HttpResponse<T>) => void,
    reject: (error: HttpError) => void
  ): void {
    const chunks: Buffer[] = [];
    const requestDuration = Date.now() - startTime;

    response.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    response.on('end', () => {
      try {
        const rawData = Buffer.concat(chunks);
        const responseData = this.parseResponseBody<T>(rawData, response.headers['content-type']);
        
        const httpResponse: HttpResponse<T> = {
          data: responseData,
          status: response.statusCode,
          statusText: response.statusMessage || '',
          headers: this.normalizeHeaders(response.headers),
          config,
          request: {
            url: config.url,
            method: config.method,
            timestamp: new Date(startTime).toISOString(),
            duration: requestDuration,
          },
        };

        // Check if status code indicates success
        const isSuccessStatus = config.validateStatus
          ? config.validateStatus(response.statusCode)
          : (response.statusCode >= 200 && response.statusCode < 300);

        if (isSuccessStatus) {
          resolve(httpResponse);
        } else {
          reject(createHttpErrorFromResponse(httpResponse, config, requestDuration));
        }
      } catch (error) {
        reject(new HttpError({
          code: 'RESPONSE_PARSE_ERROR',
          message: `Failed to parse response: ${(error as Error).message}`,
          config,
          requestDuration,
        }));
      }
    });

    response.on('error', (error: Error) => {
      reject(new NetworkError({
        message: `Response error: ${error.message}`,
        config,
        requestDuration,
        details: { originalError: error.message },
      }));
    });
  }

  /**
   * Merge request configuration with defaults
   */
  private mergeConfig(config: HttpRequestConfig): HttpRequestConfig {
    const merged: HttpRequestConfig = {
      method: config.method,
      url: config.url,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': this.defaults.connection.userAgent || 'jira-server-mcp/1.0.0',
        ...this.defaults.defaultHeaders,
        ...config.headers,
      },
      data: config.data,
      timeout: config.timeout || this.defaults.connection.timeout,
    };
    
    if (config.params !== undefined) {
      merged.params = config.params;
    }
    if (config.retries !== undefined) {
      merged.retries = config.retries;
    }
    if (config.validateStatus !== undefined) {
      merged.validateStatus = config.validateStatus;
    }
    
    return merged;
  }

  /**
   * Build full URL with base URL and query parameters
   */
  private buildFullUrl(path: string, params?: Record<string, string | number | boolean>): string {
    let url = path.startsWith('http') ? path : `${this.defaults.baseUrl}${path}`;
    
    if (params && Object.keys(params).length > 0) {
      const urlObj = new URL(url);
      Object.entries(params).forEach(([key, value]) => {
        urlObj.searchParams.set(key, String(value));
      });
      url = urlObj.toString();
    }
    
    return url;
  }

  /**
   * Build request headers
   */
  private buildHeaders(config: HttpRequestConfig): Record<string, string> {
    const headers = { ...config.headers };
    
    // Set content-length for requests with body
    if (config.data && config.method !== 'GET' && config.method !== 'HEAD') {
      const body = this.serializeRequestBody(config.data, headers);
      headers['Content-Length'] = String(Buffer.byteLength(body));
    }
    
    return headers;
  }

  /**
   * Serialize request body based on content type
   */
  private serializeRequestBody(data: unknown, headers?: Record<string, string>): string {
    const contentType = headers?.['Content-Type'] || headers?.['content-type'] || 'application/json';
    
    if (contentType.includes('application/json')) {
      return JSON.stringify(data);
    }
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      if (typeof data === 'object' && data !== null) {
        return new URLSearchParams(data as Record<string, string>).toString();
      }
    }
    
    // Default to string conversion
    return String(data);
  }

  /**
   * Parse response body based on content type
   */
  private parseResponseBody<T>(data: Buffer, contentType?: string): T {
    if (!data || data.length === 0) {
      return undefined as T;
    }

    const textData = data.toString('utf8');
    
    if (!contentType || contentType.includes('application/json')) {
      try {
        return JSON.parse(textData);
      } catch {
        // If JSON parsing fails, return as text
        return textData as T;
      }
    }
    
    // Return as text for other content types
    return textData as T;
  }

  /**
   * Normalize response headers to lowercase keys
   */
  private normalizeHeaders(headers: Record<string, string | string[]>): Record<string, string> {
    const normalized: Record<string, string> = {};
    
    Object.entries(headers).forEach(([key, value]) => {
      normalized[key.toLowerCase()] = Array.isArray(value) ? value.join(', ') : value;
    });
    
    return normalized;
  }
}

/**
 * Factory function to create HTTP client
 */
export function createHttpClient(config: HttpClientConfig): HttpClient {
  return new JiraHttpClient(config);
}