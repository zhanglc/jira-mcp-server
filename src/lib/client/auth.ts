/**
 * Authentication Provider for HTTP Client
 *
 * Handles Personal Access Token (PAT) authentication for Jira Server requests.
 */

import type { AuthConfig } from '@/types/config';
import type { HttpRequestConfig, AuthProvider, HttpClientError } from './types';
import { AuthenticationError, isAuthenticationError } from './errors';

/**
 * Personal Access Token authentication provider
 */
export class PATAuthProvider implements AuthProvider {
  private readonly token: string;
  private readonly tokenType: 'bearer' | 'basic' | 'pat';

  constructor(config: AuthConfig) {
    this.token = config.personalToken;
    this.tokenType = config.tokenType || 'bearer';

    if (!this.token) {
      throw new AuthenticationError({
        message: 'Personal access token is required',
        authMethod: 'PAT',
      });
    }
  }

  /**
   * Add authentication headers to the request
   */
  public authenticate(config: HttpRequestConfig): HttpRequestConfig {
    const authHeaders = this.buildAuthHeaders();
    
    return {
      ...config,
      headers: {
        ...config.headers,
        ...authHeaders,
      },
    };
  }

  /**
   * Check if error is an authentication error
   */
  public isAuthenticationError(error: HttpClientError): boolean {
    return isAuthenticationError(error) || 
           (error.response?.status === 401);
  }

  /**
   * Build authentication headers based on token type
   */
  private buildAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    switch (this.tokenType) {
      case 'bearer':
        headers['Authorization'] = `Bearer ${this.token}`;
        break;
      
      case 'basic':
        // For basic auth with PAT, typically use token as password with empty username
        const encoded = Buffer.from(`:${this.token}`).toString('base64');
        headers['Authorization'] = `Basic ${encoded}`;
        break;
      
      case 'pat':
      default:
        // Default to Bearer for PAT
        headers['Authorization'] = `Bearer ${this.token}`;
        break;
    }

    return headers;
  }

  /**
   * Validate token format (basic validation)
   */
  public validateToken(): boolean {
    if (!this.token || typeof this.token !== 'string') {
      return false;
    }

    // Basic length check - PATs are typically 22+ characters
    if (this.token.length < 8) {
      return false;
    }

    // Check for obviously invalid tokens
    if (this.token.includes(' ') || this.token.includes('\n')) {
      return false;
    }

    return true;
  }

  /**
   * Get masked token for logging (shows only first/last few characters)
   */
  public getMaskedToken(): string {
    if (this.token.length <= 8) {
      return '*'.repeat(this.token.length);
    }
    
    const start = this.token.substring(0, 3);
    const end = this.token.substring(this.token.length - 3);
    const middle = '*'.repeat(this.token.length - 6);
    
    return `${start}${middle}${end}`;
  }

  /**
   * Get authentication method name
   */
  public getAuthMethod(): string {
    return `PAT (${this.tokenType})`;
  }
}

/**
 * Factory function to create auth provider
 */
export function createAuthProvider(config: AuthConfig): AuthProvider {
  return new PATAuthProvider(config);
}

/**
 * Utility function to extract auth info from error for logging
 */
export function getAuthErrorInfo(error: HttpClientError): {
  isAuthError: boolean;
  statusCode?: number;
  suggestion?: string;
} {
  const isAuthError = isAuthenticationError(error) || error.response?.status === 401;
  
  if (!isAuthError) {
    return { isAuthError: false };
  }

  const suggestions = {
    401: 'Check if your Personal Access Token is valid and has not expired',
    403: 'Your token may not have sufficient permissions for this resource',
  };

  const result: {
    isAuthError: boolean;
    statusCode?: number;
    suggestion?: string;
  } = {
    isAuthError: true,
  };
  
  if (error.response?.status !== undefined) {
    result.statusCode = error.response.status;
    result.suggestion = suggestions[error.response.status as keyof typeof suggestions];
  }
  
  return result;
}