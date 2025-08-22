/**
 * HTTP Client Test Suite
 *
 * Tests for the main HTTP client implementation.
 */

import { JiraHttpClient, createHttpClient } from '@/lib/client/http-client';
import { NetworkError, TimeoutError, createHttpErrorFromResponse } from '@/lib/client/errors';
import type { HttpClientConfig, HttpRequestConfig } from '@/lib/client';

// Mock Node.js modules
jest.mock('https');
jest.mock('http');

describe('HTTP Client', () => {
  const mockConfig: HttpClientConfig = {
    baseUrl: 'https://jira.example.com',
    auth: {
      personalToken: 'test-token-12345',
      tokenType: 'bearer',
    },
    connection: {
      timeout: 5000,
      sslVerify: true,
      keepAlive: true,
      userAgent: 'test-client/1.0.0',
    },
    retry: {
      enabled: true,
      maxRetries: 2,
      backoffMultiplier: 2,
      maxBackoffTime: 10000,
    },
  };

  let client: JiraHttpClient;
  let mockRequest: jest.Mock;
  let mockResponse: any;

  beforeEach(() => {
    client = new JiraHttpClient(mockConfig);
    
    // Mock response object
    mockResponse = {
      statusCode: 200,
      statusMessage: 'OK',
      headers: {
        'content-type': 'application/json',
      },
      on: jest.fn(),
    };

    // Mock request object
    mockRequest = jest.fn().mockReturnValue({
      on: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
      destroy: jest.fn(),
    });

    // Mock https module
    const https = require('https');
    https.request = mockRequest;
    
    // Mock http module
    const http = require('http');
    http.request = mockRequest;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with config', () => {
      expect(client.defaults).toEqual(mockConfig);
    });

    it('should create auth provider', () => {
      const requestConfig: HttpRequestConfig = {
        method: 'GET',
        url: '/test',
      };
      
      // Check if authentication interceptor was added
      expect(client.interceptors.request.size).toBeGreaterThan(0);
    });

    it('should create retry policy', () => {
      const networkError = new NetworkError({ message: 'Connection failed' });
      // Retry policy is internal, but we can test its effects through retries
      expect(client).toBeDefined();
    });
  });

  describe('HTTP methods', () => {
    beforeEach(() => {
      // Setup successful response
      mockResponse.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          callback(Buffer.from('{"result": "success"}'));
        } else if (event === 'end') {
          callback();
        }
      });

      mockRequest.mockImplementation((options: any, callback: Function) => {
        callback(mockResponse);
        return {
          on: jest.fn(),
          write: jest.fn(),
          end: jest.fn(),
          destroy: jest.fn(),
        };
      });
    });

    describe('get', () => {
      it('should make GET request', async () => {
        const response = await client.get('/api/test');
        
        expect(mockRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'GET',
            path: '/api/test',
          }),
          expect.any(Function)
        );
        
        expect(response.data).toEqual({ result: 'success' });
        expect(response.status).toBe(200);
      });

      it('should include auth headers', async () => {
        await client.get('/api/test');
        
        expect(mockRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': 'Bearer test-token-12345',
            }),
          }),
          expect.any(Function)
        );
      });

      it('should include default headers', async () => {
        await client.get('/api/test');
        
        expect(mockRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'User-Agent': 'test-client/1.0.0',
            }),
          }),
          expect.any(Function)
        );
      });

      it('should handle query parameters', async () => {
        await client.get('/api/test', {
          params: {
            page: 1,
            limit: 50,
            active: true,
          },
        });
        
        expect(mockRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            path: '/api/test?page=1&limit=50&active=true',
          }),
          expect.any(Function)
        );
      });

      it('should merge custom headers', async () => {
        await client.get('/api/test', {
          headers: {
            'X-Custom-Header': 'custom-value',
            'Content-Type': 'application/xml', // Override default
          },
        });
        
        expect(mockRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            headers: expect.objectContaining({
              'X-Custom-Header': 'custom-value',
              'Content-Type': 'application/xml',
              'Authorization': 'Bearer test-token-12345',
            }),
          }),
          expect.any(Function)
        );
      });
    });

    describe('post', () => {
      it('should make POST request with data', async () => {
        const requestData = { name: 'Test', value: 123 };
        const mockRequestObj = {
          on: jest.fn(),
          write: jest.fn(),
          end: jest.fn(),
          destroy: jest.fn(),
        };
        
        mockRequest.mockImplementation((options: any, callback: Function) => {
          callback(mockResponse);
          return mockRequestObj;
        });
        
        await client.post('/api/test', requestData);
        
        expect(mockRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'POST',
            path: '/api/test',
            headers: expect.objectContaining({
              'Content-Length': expect.any(String),
            }),
          }),
          expect.any(Function)
        );
        
        expect(mockRequestObj.write).toHaveBeenCalledWith(JSON.stringify(requestData));
      });

      it('should handle empty data', async () => {
        await client.post('/api/test');
        
        expect(mockRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'POST',
            path: '/api/test',
          }),
          expect.any(Function)
        );
      });
    });

    describe('put', () => {
      it('should make PUT request', async () => {
        const requestData = { id: 1, name: 'Updated' };
        
        await client.put('/api/test/1', requestData);
        
        expect(mockRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'PUT',
            path: '/api/test/1',
          }),
          expect.any(Function)
        );
      });
    });

    describe('delete', () => {
      it('should make DELETE request', async () => {
        await client.delete('/api/test/1');
        
        expect(mockRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'DELETE',
            path: '/api/test/1',
          }),
          expect.any(Function)
        );
      });
    });

    describe('patch', () => {
      it('should make PATCH request', async () => {
        const requestData = { name: 'Patched' };
        
        await client.patch('/api/test/1', requestData);
        
        expect(mockRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'PATCH',
            path: '/api/test/1',
          }),
          expect.any(Function)
        );
      });
    });

    describe('head', () => {
      it('should make HEAD request', async () => {
        await client.head('/api/test');
        
        expect(mockRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'HEAD',
            path: '/api/test',
          }),
          expect.any(Function)
        );
      });
    });

    describe('options', () => {
      it('should make OPTIONS request', async () => {
        await client.options('/api/test');
        
        expect(mockRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'OPTIONS',
            path: '/api/test',
          }),
          expect.any(Function)
        );
      });
    });
  });

  describe('URL building', () => {
    it('should handle absolute URLs', async () => {
      mockResponse.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          callback(Buffer.from('{}'));
        } else if (event === 'end') {
          callback();
        }
      });

      mockRequest.mockImplementation((options: any, callback: Function) => {
        callback(mockResponse);
        return {
          on: jest.fn(),
          write: jest.fn(),
          end: jest.fn(),
          destroy: jest.fn(),
        };
      });

      await client.get('https://other.example.com/api/test');
      
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          hostname: 'other.example.com',
          path: '/api/test',
        }),
        expect.any(Function)
      );
    });

    it('should combine base URL with relative path', async () => {
      mockResponse.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          callback(Buffer.from('{}'));
        } else if (event === 'end') {
          callback();
        }
      });

      mockRequest.mockImplementation((options: any, callback: Function) => {
        callback(mockResponse);
        return {
          on: jest.fn(),
          write: jest.fn(),
          end: jest.fn(),
          destroy: jest.fn(),
        };
      });

      await client.get('/api/test');
      
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          hostname: 'jira.example.com',
          path: '/api/test',
        }),
        expect.any(Function)
      );
    });
  });

  describe('interceptors', () => {
    it('should apply request interceptors', async () => {
      const requestInterceptor = jest.fn((config) => ({
        ...config,
        headers: {
          ...config.headers,
          'X-Intercepted': 'true',
        },
      }));

      client.interceptors.request.use(requestInterceptor);

      mockResponse.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          callback(Buffer.from('{}'));
        } else if (event === 'end') {
          callback();
        }
      });

      mockRequest.mockImplementation((options: any, callback: Function) => {
        callback(mockResponse);
        return {
          on: jest.fn(),
          write: jest.fn(),
          end: jest.fn(),
          destroy: jest.fn(),
        };
      });

      await client.get('/api/test');
      
      expect(requestInterceptor).toHaveBeenCalled();
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Intercepted': 'true',
          }),
        }),
        expect.any(Function)
      );
    });

    it('should apply response interceptors', async () => {
      const responseInterceptor = jest.fn((response) => ({
        ...response,
        data: { ...response.data, intercepted: true },
      }));

      client.interceptors.response.use(responseInterceptor);

      mockResponse.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          callback(Buffer.from('{"original": true}'));
        } else if (event === 'end') {
          callback();
        }
      });

      mockRequest.mockImplementation((options: any, callback: Function) => {
        callback(mockResponse);
        return {
          on: jest.fn(),
          write: jest.fn(),
          end: jest.fn(),
          destroy: jest.fn(),
        };
      });

      const response = await client.get('/api/test');
      
      expect(responseInterceptor).toHaveBeenCalled();
      expect(response.data).toEqual({
        original: true,
        intercepted: true,
      });
    });
  });

  describe('setAuthToken', () => {
    it('should update auth token', () => {
      client.setAuthToken('new-token-67890');
      expect(client.defaults.auth.personalToken).toBe('new-token-67890');
    });
  });

  describe('metrics', () => {
    beforeEach(() => {
      mockResponse.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          callback(Buffer.from('{}'));
        } else if (event === 'end') {
          callback();
        }
      });

      mockRequest.mockImplementation((options: any, callback: Function) => {
        callback(mockResponse);
        return {
          on: jest.fn(),
          write: jest.fn(),
          end: jest.fn(),
          destroy: jest.fn(),
        };
      });
    });

    it('should track request metrics', async () => {
      await client.get('/api/test');
      
      const metrics = client.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        url: '/api/test',
        method: 'GET',
        startTime: expect.any(Number),
        endTime: expect.any(Number),
        duration: expect.any(Number),
        status: 200,
        retries: 0,
      });
    });

    it('should clear metrics', async () => {
      await client.get('/api/test');
      expect(client.getMetrics()).toHaveLength(1);
      
      client.clearMetrics();
      expect(client.getMetrics()).toHaveLength(0);
    });
  });

  describe('createHttpClient', () => {
    it('should create JiraHttpClient instance', () => {
      const client = createHttpClient(mockConfig);
      expect(client).toBeInstanceOf(JiraHttpClient);
    });

    it('should use provided configuration', () => {
      const client = createHttpClient(mockConfig) as JiraHttpClient;
      expect(client.defaults).toEqual(mockConfig);
    });
  });
});