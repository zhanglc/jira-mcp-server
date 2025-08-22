/**
 * HTTP Client Authentication Test Suite
 *
 * Tests for PAT authentication provider and auth utilities.
 */

import {
  PATAuthProvider,
  createAuthProvider,
  getAuthErrorInfo,
} from '@/lib/client/auth';
import { AuthenticationError } from '@/lib/client/errors';
import type { AuthConfig, HttpRequestConfig, HttpClientError } from '@/lib/client';

describe('HTTP Client Authentication', () => {
  const mockAuthConfig: AuthConfig = {
    personalToken: 'test-token-12345',
    tokenType: 'bearer',
  };

  const mockRequestConfig: HttpRequestConfig = {
    method: 'GET',
    url: '/api/test',
    headers: {},
  };

  describe('PATAuthProvider', () => {
    describe('constructor', () => {
      it('should create provider with valid config', () => {
        const provider = new PATAuthProvider(mockAuthConfig);
        expect(provider).toBeInstanceOf(PATAuthProvider);
      });

      it('should throw error with missing token', () => {
        const invalidConfig: AuthConfig = {
          personalToken: '',
        };

        expect(() => new PATAuthProvider(invalidConfig)).toThrow(AuthenticationError);
        expect(() => new PATAuthProvider(invalidConfig)).toThrow('Personal access token is required');
      });
    });

    describe('authenticate', () => {
      it('should add Bearer auth header by default', () => {
        const provider = new PATAuthProvider(mockAuthConfig);
        const result = provider.authenticate(mockRequestConfig);

        expect(result.headers?.['Authorization']).toBe('Bearer test-token-12345');
        expect(result.method).toBe('GET');
        expect(result.url).toBe('/api/test');
      });

      it('should add Bearer auth header for bearer type', () => {
        const config: AuthConfig = {
          personalToken: 'bearer-token-123',
          tokenType: 'bearer',
        };
        const provider = new PATAuthProvider(config);
        const result = provider.authenticate(mockRequestConfig);

        expect(result.headers?.['Authorization']).toBe('Bearer bearer-token-123');
      });

      it('should add Basic auth header for basic type', () => {
        const config: AuthConfig = {
          personalToken: 'basic-token-123',
          tokenType: 'basic',
        };
        const provider = new PATAuthProvider(config);
        const result = provider.authenticate(mockRequestConfig);

        // Basic auth with empty username and token as password
        const expectedAuth = Buffer.from(':basic-token-123').toString('base64');
        expect(result.headers?.['Authorization']).toBe(`Basic ${expectedAuth}`);
      });

      it('should add Bearer auth header for pat type', () => {
        const config: AuthConfig = {
          personalToken: 'pat-token-123',
          tokenType: 'pat',
        };
        const provider = new PATAuthProvider(config);
        const result = provider.authenticate(mockRequestConfig);

        expect(result.headers?.['Authorization']).toBe('Bearer pat-token-123');
      });

      it('should preserve existing headers', () => {
        const configWithHeaders: HttpRequestConfig = {
          ...mockRequestConfig,
          headers: {
            'Content-Type': 'application/json',
            'Custom-Header': 'test-value',
          },
        };

        const provider = new PATAuthProvider(mockAuthConfig);
        const result = provider.authenticate(configWithHeaders);

        expect(result.headers).toEqual({
          'Content-Type': 'application/json',
          'Custom-Header': 'test-value',
          'Authorization': 'Bearer test-token-12345',
        });
      });

      it('should override existing Authorization header', () => {
        const configWithAuth: HttpRequestConfig = {
          ...mockRequestConfig,
          headers: {
            'Authorization': 'Bearer old-token',
          },
        };

        const provider = new PATAuthProvider(mockAuthConfig);
        const result = provider.authenticate(configWithAuth);

        expect(result.headers?.['Authorization']).toBe('Bearer test-token-12345');
      });
    });

    describe('isAuthenticationError', () => {
      const provider = new PATAuthProvider(mockAuthConfig);

      it('should return true for AuthenticationError', () => {
        const authError = new AuthenticationError({
          message: 'Invalid token',
        }) as HttpClientError;

        expect(provider.isAuthenticationError(authError)).toBe(true);
      });

      it('should return true for 401 status code', () => {
        const httpError = {
          type: 'http_client_error' as const,
          code: 'HTTP_ERROR',
          message: 'Unauthorized',
          timestamp: new Date().toISOString(),
          response: {
            status: 401,
            statusText: 'Unauthorized',
            headers: {},
            data: {},
          },
        } as HttpClientError;

        expect(provider.isAuthenticationError(httpError)).toBe(true);
      });

      it('should return false for other errors', () => {
        const otherError = {
          type: 'http_client_error' as const,
          code: 'NETWORK_ERROR',
          message: 'Network failed',
          timestamp: new Date().toISOString(),
          response: {
            status: 500,
            statusText: 'Internal Server Error',
            headers: {},
            data: {},
          },
        } as HttpClientError;

        expect(provider.isAuthenticationError(otherError)).toBe(false);
      });

      it('should return false for error without response', () => {
        const networkError = {
          type: 'http_client_error' as const,
          code: 'NETWORK_ERROR',
          message: 'Network failed',
          timestamp: new Date().toISOString(),
        } as HttpClientError;

        expect(provider.isAuthenticationError(networkError)).toBe(false);
      });
    });

    describe('validateToken', () => {
      it('should return true for valid token', () => {
        const provider = new PATAuthProvider(mockAuthConfig);
        expect(provider.validateToken()).toBe(true);
      });

      it('should return false for short token', () => {
        const config: AuthConfig = {
          personalToken: 'short',
        };
        const provider = new PATAuthProvider(config);
        expect(provider.validateToken()).toBe(false);
      });

      it('should return false for token with spaces', () => {
        const config: AuthConfig = {
          personalToken: 'token with spaces',
        };
        const provider = new PATAuthProvider(config);
        expect(provider.validateToken()).toBe(false);
      });

      it('should return false for token with newlines', () => {
        const config: AuthConfig = {
          personalToken: 'token\nwith\nnewlines',
        };
        const provider = new PATAuthProvider(config);
        expect(provider.validateToken()).toBe(false);
      });

      it('should return false for non-string token', () => {
        const config = {
          personalToken: null as any,
        };
        const provider = new PATAuthProvider(config);
        expect(provider.validateToken()).toBe(false);
      });
    });

    describe('getMaskedToken', () => {
      it('should mask long token correctly', () => {
        const provider = new PATAuthProvider(mockAuthConfig);
        const masked = provider.getMaskedToken();
        
        expect(masked).toBe('tes**********345');
        expect(masked.length).toBe(mockAuthConfig.personalToken.length);
      });

      it('should mask short token completely', () => {
        const config: AuthConfig = {
          personalToken: 'short',
        };
        const provider = new PATAuthProvider(config);
        const masked = provider.getMaskedToken();
        
        expect(masked).toBe('*****');
        expect(masked.length).toBe(5);
      });

      it('should handle edge case tokens', () => {
        const config: AuthConfig = {
          personalToken: '12345678',
        };
        const provider = new PATAuthProvider(config);
        const masked = provider.getMaskedToken();
        
        expect(masked).toBe('********');
      });
    });

    describe('getAuthMethod', () => {
      it('should return correct method for bearer', () => {
        const provider = new PATAuthProvider({ personalToken: 'test', tokenType: 'bearer' });
        expect(provider.getAuthMethod()).toBe('PAT (bearer)');
      });

      it('should return correct method for basic', () => {
        const provider = new PATAuthProvider({ personalToken: 'test', tokenType: 'basic' });
        expect(provider.getAuthMethod()).toBe('PAT (basic)');
      });

      it('should return default method for undefined type', () => {
        const provider = new PATAuthProvider({ personalToken: 'test' });
        expect(provider.getAuthMethod()).toBe('PAT (bearer)');
      });
    });
  });

  describe('createAuthProvider', () => {
    it('should create PATAuthProvider', () => {
      const provider = createAuthProvider(mockAuthConfig);
      expect(provider).toBeInstanceOf(PATAuthProvider);
    });

    it('should pass config to provider', () => {
      const provider = createAuthProvider(mockAuthConfig) as PATAuthProvider;
      const result = provider.authenticate(mockRequestConfig);
      
      expect(result.headers?.['Authorization']).toBe('Bearer test-token-12345');
    });
  });

  describe('getAuthErrorInfo', () => {
    it('should detect authentication error', () => {
      const authError = new AuthenticationError({
        message: 'Invalid token',
      }) as HttpClientError;

      const info = getAuthErrorInfo(authError);
      expect(info.isAuthError).toBe(true);
      expect(info.statusCode).toBeUndefined();
      expect(info.suggestion).toBeUndefined();
    });

    it('should detect 401 error with suggestion', () => {
      const httpError = {
        type: 'http_client_error' as const,
        code: 'HTTP_ERROR',
        message: 'Unauthorized',
        timestamp: new Date().toISOString(),
        response: {
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          data: {},
        },
      } as HttpClientError;

      const info = getAuthErrorInfo(httpError);
      expect(info.isAuthError).toBe(true);
      expect(info.statusCode).toBe(401);
      expect(info.suggestion).toBe('Check if your Personal Access Token is valid and has not expired');
    });

    it('should detect 403 error with suggestion', () => {
      const httpError = {
        type: 'http_client_error' as const,
        code: 'HTTP_ERROR',
        message: 'Forbidden',
        timestamp: new Date().toISOString(),
        response: {
          status: 403,
          statusText: 'Forbidden',
          headers: {},
          data: {},
        },
      } as HttpClientError;

      const info = getAuthErrorInfo(httpError);
      expect(info.isAuthError).toBe(true);
      expect(info.statusCode).toBe(403);
      expect(info.suggestion).toBe('Your token may not have sufficient permissions for this resource');
    });

    it('should not detect non-auth errors', () => {
      const networkError = {
        type: 'http_client_error' as const,
        code: 'NETWORK_ERROR',
        message: 'Network failed',
        timestamp: new Date().toISOString(),
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          headers: {},
          data: {},
        },
      } as HttpClientError;

      const info = getAuthErrorInfo(networkError);
      expect(info.isAuthError).toBe(false);
      expect(info.statusCode).toBeUndefined();
      expect(info.suggestion).toBeUndefined();
    });

    it('should handle error without response', () => {
      const networkError = {
        type: 'http_client_error' as const,
        code: 'NETWORK_ERROR',
        message: 'Network failed',
        timestamp: new Date().toISOString(),
      } as HttpClientError;

      const info = getAuthErrorInfo(networkError);
      expect(info.isAuthError).toBe(false);
    });
  });
});