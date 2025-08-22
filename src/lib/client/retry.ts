/**
 * Retry Policy Implementation
 *
 * Configurable retry logic with exponential backoff for HTTP requests.
 */

import type { RetryConfig } from '@/types/common';
import type { RetryPolicy, HttpClientError } from './types';
import { isRetryableError, RateLimitError } from './errors';

/**
 * Default retry policy implementation
 */
export class DefaultRetryPolicy implements RetryPolicy {
  public readonly maxRetries: number;
  private readonly backoffMultiplier: number;
  private readonly maxBackoffTime: number;
  private readonly retryableErrors: string[];

  constructor(config: RetryConfig) {
    this.maxRetries = config.maxRetries;
    this.backoffMultiplier = config.backoffMultiplier;
    this.maxBackoffTime = config.maxBackoffTime;
    this.retryableErrors = config.retryableErrors || [
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
      'RATE_LIMIT_ERROR',
      'SERVER_ERROR',
    ];
  }

  /**
   * Determine if an error should trigger a retry
   */
  public shouldRetry(error: HttpClientError, attempt: number): boolean {
    // Don't retry if we've exceeded max attempts
    if (attempt >= this.maxRetries) {
      return false;
    }

    // Use the error's retryable flag if available
    if (typeof error.isRetryableError === 'boolean') {
      return error.isRetryableError;
    }

    // Check if error code is in retryable list
    if (this.retryableErrors.includes(error.code)) {
      return true;
    }

    // Use the utility function to check for retryable errors
    return isRetryableError(error);
  }

  /**
   * Calculate delay before next retry attempt
   */
  public getDelay(attempt: number): number {
    // Base delay starts at 1 second
    const baseDelay = 1000;
    
    // Calculate exponential backoff
    const exponentialDelay = baseDelay * Math.pow(this.backoffMultiplier, attempt);
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * exponentialDelay;
    
    // Apply maximum backoff time limit
    const totalDelay = Math.min(exponentialDelay + jitter, this.maxBackoffTime);
    
    return Math.floor(totalDelay);
  }

  /**
   * Get delay for rate limit errors using Retry-After header
   */
  public getRateLimitDelay(error: RateLimitError): number {
    if (error.retryAfter) {
      // Retry-After is in seconds, convert to milliseconds
      const retryAfterMs = error.retryAfter * 1000;
      
      // Respect the server's guidance but apply maximum backoff
      return Math.min(retryAfterMs, this.maxBackoffTime);
    }
    
    // Fall back to exponential backoff if no Retry-After header
    return this.getDelay(error.retryCount || 0);
  }
}

/**
 * No-retry policy for when retries should be disabled
 */
export class NoRetryPolicy implements RetryPolicy {
  public readonly maxRetries = 0;

  public shouldRetry(): boolean {
    return false;
  }

  public getDelay(): number {
    return 0;
  }
}

/**
 * Conservative retry policy with longer delays
 */
export class ConservativeRetryPolicy extends DefaultRetryPolicy {
  constructor(config: RetryConfig) {
    super({
      ...config,
      maxRetries: Math.min(config.maxRetries, 2), // Limit to 2 retries
      backoffMultiplier: Math.max(config.backoffMultiplier, 3), // Minimum 3x backoff
    });
  }
}

/**
 * Aggressive retry policy with more attempts and shorter delays
 */
export class AggressiveRetryPolicy extends DefaultRetryPolicy {
  constructor(config: RetryConfig) {
    super({
      ...config,
      maxRetries: Math.max(config.maxRetries, 5), // At least 5 retries
      backoffMultiplier: Math.min(config.backoffMultiplier, 1.5), // Maximum 1.5x backoff
    });
  }
}

/**
 * Factory function to create retry policy
 */
export function createRetryPolicy(config: RetryConfig, type: 'default' | 'none' | 'conservative' | 'aggressive' = 'default'): RetryPolicy {
  if (!config.enabled) {
    return new NoRetryPolicy();
  }

  switch (type) {
    case 'none':
      return new NoRetryPolicy();
    case 'conservative':
      return new ConservativeRetryPolicy(config);
    case 'aggressive':
      return new AggressiveRetryPolicy(config);
    case 'default':
    default:
      return new DefaultRetryPolicy(config);
  }
}

/**
 * Sleep utility for retry delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper function for any async operation
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  policy: RetryPolicy,
  onRetry?: (error: Error, attempt: number, delay: number) => void
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // If this is the last attempt or we shouldn't retry, throw the error
      if (attempt === policy.maxRetries || !policy.shouldRetry(error as HttpClientError, attempt)) {
        throw error;
      }
      
      // Calculate delay and wait before retrying
      const delay = error instanceof RateLimitError && 'getRateLimitDelay' in policy
        ? (policy as DefaultRetryPolicy).getRateLimitDelay(error)
        : policy.getDelay(attempt);
      
      // Call retry callback if provided
      onRetry?.(error as Error, attempt + 1, delay);
      
      // Wait before retrying
      if (delay > 0) {
        await sleep(delay);
      }
    }
  }
  
  // This should never be reached, but TypeScript requires it
  throw lastError!;
}