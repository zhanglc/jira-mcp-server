/**
 * HTTP Client Retry Test Suite
 *
 * Tests for retry policies and retry logic.
 */

import {
  DefaultRetryPolicy,
  NoRetryPolicy,
  ConservativeRetryPolicy,
  AggressiveRetryPolicy,
  createRetryPolicy,
  withRetry,
  sleep,
} from '@/lib/client/retry';
import { RateLimitError, NetworkError, AuthenticationError } from '@/lib/client/errors';
import type { RetryConfig, HttpClientError } from '@/lib/client';

describe('HTTP Client Retry', () => {
  const mockRetryConfig: RetryConfig = {
    enabled: true,
    maxRetries: 3,
    backoffMultiplier: 2,
    maxBackoffTime: 30000,
  };

  describe('DefaultRetryPolicy', () => {
    let policy: DefaultRetryPolicy;

    beforeEach(() => {
      policy = new DefaultRetryPolicy(mockRetryConfig);
    });

    describe('constructor', () => {
      it('should initialize with config values', () => {
        expect(policy.maxRetries).toBe(3);
      });

      it('should use default retryable errors', () => {
        const networkError = new NetworkError({ message: 'Connection failed' }) as HttpClientError;
        expect(policy.shouldRetry(networkError, 0)).toBe(true);
      });

      it('should use custom retryable errors', () => {
        const customConfig: RetryConfig = {
          ...mockRetryConfig,
          retryableErrors: ['CUSTOM_ERROR'],
        };
        const customPolicy = new DefaultRetryPolicy(customConfig);
        
        const customError = {
          type: 'http_client_error' as const,
          code: 'CUSTOM_ERROR',
          message: 'Custom error',
          timestamp: new Date().toISOString(),
        } as HttpClientError;

        expect(customPolicy.shouldRetry(customError, 0)).toBe(true);
      });
    });

    describe('shouldRetry', () => {
      it('should not retry beyond max attempts', () => {
        const networkError = new NetworkError({ message: 'Connection failed' }) as HttpClientError;
        
        expect(policy.shouldRetry(networkError, 0)).toBe(true);
        expect(policy.shouldRetry(networkError, 2)).toBe(true);
        expect(policy.shouldRetry(networkError, 3)).toBe(false);
        expect(policy.shouldRetry(networkError, 5)).toBe(false);
      });

      it('should respect error retryable flag', () => {
        const retryableError = {
          type: 'http_client_error' as const,
          code: 'CUSTOM_ERROR',
          message: 'Retryable error',
          timestamp: new Date().toISOString(),
          isRetryableError: true,
        } as HttpClientError;

        const nonRetryableError = {
          type: 'http_client_error' as const,
          code: 'CUSTOM_ERROR',
          message: 'Non-retryable error',
          timestamp: new Date().toISOString(),
          isRetryableError: false,
        } as HttpClientError;

        expect(policy.shouldRetry(retryableError, 0)).toBe(true);
        expect(policy.shouldRetry(nonRetryableError, 0)).toBe(false);
      });

      it('should retry known retryable error codes', () => {
        const networkError = {
          type: 'http_client_error' as const,
          code: 'NETWORK_ERROR',
          message: 'Network error',
          timestamp: new Date().toISOString(),
        } as HttpClientError;

        const serverError = {
          type: 'http_client_error' as const,
          code: 'SERVER_ERROR',
          message: 'Server error',
          timestamp: new Date().toISOString(),
        } as HttpClientError;

        expect(policy.shouldRetry(networkError, 0)).toBe(true);
        expect(policy.shouldRetry(serverError, 0)).toBe(true);
      });

      it('should not retry non-retryable errors', () => {
        const authError = new AuthenticationError({
          message: 'Invalid token',
        }) as HttpClientError;

        expect(policy.shouldRetry(authError, 0)).toBe(false);
      });
    });

    describe('getDelay', () => {
      it('should calculate exponential backoff', () => {
        const delay0 = policy.getDelay(0);
        const delay1 = policy.getDelay(1);
        const delay2 = policy.getDelay(2);

        // Base delay is 1000ms, with backoff multiplier of 2
        expect(delay0).toBeGreaterThanOrEqual(1000);
        expect(delay0).toBeLessThan(1500); // With jitter
        
        expect(delay1).toBeGreaterThanOrEqual(2000);
        expect(delay1).toBeLessThan(2500);
        
        expect(delay2).toBeGreaterThanOrEqual(4000);
        expect(delay2).toBeLessThan(4500);
      });

      it('should respect maximum backoff time', () => {
        const config: RetryConfig = {
          ...mockRetryConfig,
          maxBackoffTime: 5000,
        };
        const limitedPolicy = new DefaultRetryPolicy(config);
        
        const delay = limitedPolicy.getDelay(10); // Very high attempt
        expect(delay).toBeLessThanOrEqual(5000);
      });

      it('should add jitter to prevent thundering herd', () => {
        const delays = Array.from({ length: 10 }, () => policy.getDelay(1));
        
        // All delays should be in the expected range but slightly different due to jitter
        const uniqueDelays = new Set(delays);
        expect(uniqueDelays.size).toBeGreaterThan(1); // Should have some variation
      });
    });

    describe('getRateLimitDelay', () => {
      it('should use Retry-After header value', () => {
        const rateLimitError = new RateLimitError({
          message: 'Rate limited',
          retryAfter: 60, // seconds
        }) as RateLimitError;

        const delay = policy.getRateLimitDelay(rateLimitError);
        expect(delay).toBe(30000); // Should be capped at maxBackoffTime
      });

      it('should respect maximum backoff time for rate limits', () => {
        const config: RetryConfig = {
          ...mockRetryConfig,
          maxBackoffTime: 30000,
        };
        const limitedPolicy = new DefaultRetryPolicy(config);
        
        const rateLimitError = new RateLimitError({
          message: 'Rate limited',
          retryAfter: 60, // 60 seconds = 60000ms
        }) as RateLimitError;

        const delay = limitedPolicy.getRateLimitDelay(rateLimitError);
        expect(delay).toBe(30000); // Should be capped at maxBackoffTime
      });

      it('should fall back to exponential backoff without Retry-After', () => {
        const rateLimitError = new RateLimitError({
          message: 'Rate limited',
          // No retryAfter specified
        }) as RateLimitError;
        rateLimitError.retryCount = 1;

        const delay = policy.getRateLimitDelay(rateLimitError);
        const expectedDelay = policy.getDelay(1);
        
        // Should be similar to exponential backoff (accounting for jitter)
        expect(delay).toBeGreaterThanOrEqual(expectedDelay - 500);
        expect(delay).toBeLessThanOrEqual(expectedDelay + 500);
      });
    });
  });

  describe('NoRetryPolicy', () => {
    let policy: NoRetryPolicy;

    beforeEach(() => {
      policy = new NoRetryPolicy();
    });

    it('should never retry', () => {
      const networkError = new NetworkError({ message: 'Connection failed' }) as HttpClientError;
      
      expect(policy.maxRetries).toBe(0);
      expect(policy.shouldRetry(networkError, 0)).toBe(false);
      expect(policy.shouldRetry(networkError, 1)).toBe(false);
    });

    it('should return zero delay', () => {
      expect(policy.getDelay(0)).toBe(0);
      expect(policy.getDelay(1)).toBe(0);
    });
  });

  describe('ConservativeRetryPolicy', () => {
    it('should limit max retries', () => {
      const config: RetryConfig = {
        enabled: true,
        maxRetries: 5,
        backoffMultiplier: 2,
        maxBackoffTime: 30000,
      };
      
      const policy = new ConservativeRetryPolicy(config);
      expect(policy.maxRetries).toBe(2); // Should be limited to 2
    });

    it('should use minimum backoff multiplier', () => {
      const config: RetryConfig = {
        enabled: true,
        maxRetries: 3,
        backoffMultiplier: 1.5,
        maxBackoffTime: 30000,
      };
      
      const policy = new ConservativeRetryPolicy(config);
      const delay1 = policy.getDelay(1);
      const delay2 = policy.getDelay(2);
      
      // Should use at least 3x backoff multiplier
      expect(delay2).toBeGreaterThanOrEqual(delay1 * 2.5); // Account for jitter
    });
  });

  describe('AggressiveRetryPolicy', () => {
    it('should ensure minimum retries', () => {
      const config: RetryConfig = {
        enabled: true,
        maxRetries: 2,
        backoffMultiplier: 3,
        maxBackoffTime: 30000,
      };
      
      const policy = new AggressiveRetryPolicy(config);
      expect(policy.maxRetries).toBe(5); // Should be increased to 5
    });

    it('should limit backoff multiplier', () => {
      const config: RetryConfig = {
        enabled: true,
        maxRetries: 5,
        backoffMultiplier: 3,
        maxBackoffTime: 30000,
      };
      
      const policy = new AggressiveRetryPolicy(config);
      const delay1 = policy.getDelay(1);
      const delay2 = policy.getDelay(2);
      
      // Should use maximum 1.5x backoff multiplier
      expect(delay2).toBeLessThanOrEqual(delay1 * 2); // Account for jitter
    });
  });

  describe('createRetryPolicy', () => {
    it('should create NoRetryPolicy when disabled', () => {
      const config: RetryConfig = {
        enabled: false,
        maxRetries: 3,
        backoffMultiplier: 2,
        maxBackoffTime: 30000,
      };
      
      const policy = createRetryPolicy(config);
      expect(policy).toBeInstanceOf(NoRetryPolicy);
    });

    it('should create DefaultRetryPolicy by default', () => {
      const policy = createRetryPolicy(mockRetryConfig);
      expect(policy).toBeInstanceOf(DefaultRetryPolicy);
    });

    it('should create DefaultRetryPolicy for default type', () => {
      const policy = createRetryPolicy(mockRetryConfig, 'default');
      expect(policy).toBeInstanceOf(DefaultRetryPolicy);
    });

    it('should create NoRetryPolicy for none type', () => {
      const policy = createRetryPolicy(mockRetryConfig, 'none');
      expect(policy).toBeInstanceOf(NoRetryPolicy);
    });

    it('should create ConservativeRetryPolicy for conservative type', () => {
      const policy = createRetryPolicy(mockRetryConfig, 'conservative');
      expect(policy).toBeInstanceOf(ConservativeRetryPolicy);
    });

    it('should create AggressiveRetryPolicy for aggressive type', () => {
      const policy = createRetryPolicy(mockRetryConfig, 'aggressive');
      expect(policy).toBeInstanceOf(AggressiveRetryPolicy);
    });
  });

  describe('sleep', () => {
    it('should wait for specified duration', async () => {
      const start = Date.now();
      await sleep(100);
      const end = Date.now();
      
      expect(end - start).toBeGreaterThanOrEqual(90); // Allow some timing tolerance
      expect(end - start).toBeLessThan(150);
    });

    it('should handle zero delay', async () => {
      const start = Date.now();
      await sleep(0);
      const end = Date.now();
      
      expect(end - start).toBeLessThan(10);
    });
  });

  describe('withRetry', () => {
    let attempts: number;
    let mockOperation: jest.Mock;
    let mockOnRetry: jest.Mock;

    beforeEach(() => {
      attempts = 0;
      mockOperation = jest.fn();
      mockOnRetry = jest.fn();
    });

    it('should succeed on first attempt', async () => {
      mockOperation.mockResolvedValue('success');
      
      const policy = new DefaultRetryPolicy(mockRetryConfig);
      const result = await withRetry(mockOperation, policy, mockOnRetry);
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(mockOnRetry).not.toHaveBeenCalled();
    });

    it('should retry on retryable errors', async () => {
      const networkError = new NetworkError({ message: 'Connection failed' });
      
      mockOperation
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue('success');
      
      const policy = new DefaultRetryPolicy(mockRetryConfig);
      const result = await withRetry(mockOperation, policy, mockOnRetry);
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
      expect(mockOnRetry).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-retryable errors', async () => {
      const authError = new AuthenticationError({ message: 'Invalid token' });
      mockOperation.mockRejectedValue(authError);
      
      const policy = new DefaultRetryPolicy(mockRetryConfig);
      
      await expect(withRetry(mockOperation, policy, mockOnRetry)).rejects.toThrow(authError);
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(mockOnRetry).not.toHaveBeenCalled();
    });

    it('should respect max retries', async () => {
      const networkError = new NetworkError({ message: 'Connection failed' });
      mockOperation.mockRejectedValue(networkError);
      
      const policy = new DefaultRetryPolicy({ ...mockRetryConfig, maxRetries: 2 });
      
      await expect(withRetry(mockOperation, policy, mockOnRetry)).rejects.toThrow(networkError);
      expect(mockOperation).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
      expect(mockOnRetry).toHaveBeenCalledTimes(2);
    });

    it('should call onRetry callback with correct parameters', async () => {
      const networkError = new NetworkError({ message: 'Connection failed' });
      
      mockOperation
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue('success');
      
      const policy = new DefaultRetryPolicy(mockRetryConfig);
      await withRetry(mockOperation, policy, mockOnRetry);
      
      expect(mockOnRetry).toHaveBeenCalledWith(
        networkError,
        1, // attempt number
        expect.any(Number) // delay
      );
    });

    it('should handle rate limit errors with custom delay', async () => {
      const rateLimitError = new RateLimitError({
        message: 'Rate limited',
        retryAfter: 1, // 1 second
      });
      
      mockOperation
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValue('success');
      
      const policy = new DefaultRetryPolicy(mockRetryConfig);
      
      const start = Date.now();
      const result = await withRetry(mockOperation, policy);
      const end = Date.now();
      
      expect(result).toBe('success');
      expect(end - start).toBeGreaterThanOrEqual(950); // Allow timing tolerance
    });

    it('should work without onRetry callback', async () => {
      const networkError = new NetworkError({ message: 'Connection failed' });
      
      mockOperation
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue('success');
      
      const policy = new DefaultRetryPolicy(mockRetryConfig);
      const result = await withRetry(mockOperation, policy);
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });
  });
});