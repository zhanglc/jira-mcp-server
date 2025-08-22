/**
 * HTTP Client Module Index Test Suite
 *
 * Tests for the main client module exports and convenience functions.
 */

import {
  createJiraHttpClient,
  JiraHttpClient,
  createHttpClient,
  HttpError,
  NetworkError,
  PATAuthProvider,
  DefaultRetryPolicy,
} from '@/lib/client';
import type { HttpClient } from '@/lib/client';

describe('HTTP Client Module', () => {
  describe('exports', () => {
    it('should export main client class', () => {
      expect(JiraHttpClient).toBeDefined();
      expect(typeof JiraHttpClient).toBe('function');
    });

    it('should export factory function', () => {
      expect(createHttpClient).toBeDefined();
      expect(typeof createHttpClient).toBe('function');
    });

    it('should export error classes', () => {
      expect(HttpError).toBeDefined();
      expect(NetworkError).toBeDefined();
      expect(typeof HttpError).toBe('function');
      expect(typeof NetworkError).toBe('function');
    });

    it('should export auth provider', () => {
      expect(PATAuthProvider).toBeDefined();
      expect(typeof PATAuthProvider).toBe('function');
    });

    it('should export retry policy', () => {
      expect(DefaultRetryPolicy).toBeDefined();
      expect(typeof DefaultRetryPolicy).toBe('function');
    });
  });

  describe('createJiraHttpClient', () => {
    const basicConfig = {
      baseUrl: 'https://jira.example.com',
      personalToken: 'test-token-12345',
    };

    it('should create HTTP client with minimal config', () => {
      const client = createJiraHttpClient(basicConfig);
      
      expect(client).toBeDefined();
      expect(client).toHaveProperty('get');
      expect(client).toHaveProperty('post');
      expect(client).toHaveProperty('defaults');
    });

    it('should use default values for optional config', () => {
      const client = createJiraHttpClient(basicConfig) as JiraHttpClient;
      
      expect(client.defaults.baseUrl).toBe('https://jira.example.com');
      expect(client.defaults.auth.personalToken).toBe('test-token-12345');
      expect(client.defaults.auth.tokenType).toBe('bearer');
      expect(client.defaults.connection.timeout).toBe(30000);
      expect(client.defaults.connection.sslVerify).toBe(true);
      expect(client.defaults.connection.keepAlive).toBe(true);
      expect(client.defaults.connection.userAgent).toBe('jira-server-mcp/1.0.0');
      expect(client.defaults.retry?.enabled).toBe(false);
    });

    it('should apply custom SSL and timeout settings', () => {
      const customConfig = {
        ...basicConfig,
        sslVerify: false,
        timeout: 60000,
      };
      
      const client = createJiraHttpClient(customConfig) as JiraHttpClient;
      
      expect(client.defaults.connection.sslVerify).toBe(false);
      expect(client.defaults.connection.timeout).toBe(60000);
    });

    it('should enable retry when requested', () => {
      const retryConfig = {
        ...basicConfig,
        enableRetry: true,
        maxRetries: 5,
      };
      
      const client = createJiraHttpClient(retryConfig) as JiraHttpClient;
      
      expect(client.defaults.retry?.enabled).toBe(true);
      expect(client.defaults.retry?.maxRetries).toBe(5);
      expect(client.defaults.retry?.backoffMultiplier).toBe(2);
      expect(client.defaults.retry?.maxBackoffTime).toBe(30000);
    });

    it('should disable retry by default', () => {
      const client = createJiraHttpClient(basicConfig) as JiraHttpClient;
      
      expect(client.defaults.retry?.enabled).toBe(false);
      expect(client.defaults.retry?.maxRetries).toBe(0);
    });

    it('should use default max retries when retry enabled', () => {
      const retryConfig = {
        ...basicConfig,
        enableRetry: true,
        // maxRetries not specified
      };
      
      const client = createJiraHttpClient(retryConfig) as JiraHttpClient;
      
      expect(client.defaults.retry?.enabled).toBe(true);
      expect(client.defaults.retry?.maxRetries).toBe(3);
    });

    it('should create working HTTP client interface', () => {
      const client = createJiraHttpClient(basicConfig);
      
      // Verify the client implements the HttpClient interface
      expect(typeof client.get).toBe('function');
      expect(typeof client.post).toBe('function');
      expect(typeof client.put).toBe('function');
      expect(typeof client.delete).toBe('function');
      expect(typeof client.patch).toBe('function');
      expect(typeof client.head).toBe('function');
      expect(typeof client.options).toBe('function');
      expect(typeof client.request).toBe('function');
      expect(typeof client.setAuthToken).toBe('function');
      expect(typeof client.getMetrics).toBe('function');
      expect(typeof client.clearMetrics).toBe('function');
      
      // Check interceptors
      expect(client.interceptors).toBeDefined();
      expect(client.interceptors.request).toBeDefined();
      expect(client.interceptors.response).toBeDefined();
      expect(typeof client.interceptors.request.use).toBe('function');
      expect(typeof client.interceptors.request.eject).toBe('function');
      expect(typeof client.interceptors.response.use).toBe('function');
      expect(typeof client.interceptors.response.eject).toBe('function');
    });

    it('should set correct user agent', () => {
      const client = createJiraHttpClient(basicConfig) as JiraHttpClient;
      
      expect(client.defaults.connection.userAgent).toBe('jira-server-mcp/1.0.0');
    });

    it('should configure auth correctly', () => {
      const client = createJiraHttpClient(basicConfig) as JiraHttpClient;
      
      expect(client.defaults.auth.personalToken).toBe('test-token-12345');
      expect(client.defaults.auth.tokenType).toBe('bearer');
    });

    it('should handle all optional parameters', () => {
      const fullConfig = {
        baseUrl: 'https://custom-jira.com',
        personalToken: 'custom-token-abc123',
        sslVerify: false,
        timeout: 45000,
        enableRetry: true,
        maxRetries: 7,
      };
      
      const client = createJiraHttpClient(fullConfig) as JiraHttpClient;
      
      expect(client.defaults.baseUrl).toBe('https://custom-jira.com');
      expect(client.defaults.auth.personalToken).toBe('custom-token-abc123');
      expect(client.defaults.connection.sslVerify).toBe(false);
      expect(client.defaults.connection.timeout).toBe(45000);
      expect(client.defaults.retry?.enabled).toBe(true);
      expect(client.defaults.retry?.maxRetries).toBe(7);
    });
  });

  describe('type compatibility', () => {
    it('should be compatible with HttpClient interface', () => {
      const client = createJiraHttpClient({
        baseUrl: 'https://jira.example.com',
        personalToken: 'test-token',
      });
      
      // This should compile without TypeScript errors
      const httpClient: HttpClient = client;
      expect(httpClient).toBeDefined();
    });

    it('should maintain all required HttpClient methods', () => {
      const client = createJiraHttpClient({
        baseUrl: 'https://jira.example.com',
        personalToken: 'test-token',
      });
      
      // Test method signatures exist and are callable
      expect(() => {
        client.get('/test');
        client.post('/test', {});
        client.put('/test', {});
        client.delete('/test');
        client.patch('/test', {});
        client.head('/test');
        client.options('/test');
        client.request({ method: 'GET', url: '/test' });
        client.setAuthToken('new-token');
        client.getMetrics();
        client.clearMetrics();
      }).not.toThrow();
    });
  });
});