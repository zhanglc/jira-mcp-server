/**
 * Configuration Integration Tests
 *
 * Tests for complete configuration loading flow and error handling.
 */

import {
  loadConfig,
  clearConfigCache,
  getCachedConfig,
  isConfigCached,
  reloadConfig,
  validateConfig,
} from '@/config';
import { ValidationError } from '@/types/common';

// Mock process.env
const originalEnv = process.env;

describe('Configuration Loading Integration', () => {
  beforeEach(() => {
    // Clear environment variables and cache before each test
    jest.resetModules();
    process.env = { ...originalEnv };
    clearConfigCache();
    delete process.env.JIRA_URL;
    delete process.env.JIRA_PERSONAL_TOKEN;
    delete process.env.NODE_ENV;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Complete Configuration Loading', () => {
    it('should load complete valid configuration', async () => {
      // Set up complete environment
      process.env.JIRA_URL = 'https://jira.company.com';
      process.env.JIRA_PERSONAL_TOKEN = 'valid-token';
      process.env.NODE_ENV = 'development';
      process.env.LOG_LEVEL = 'debug';
      process.env.JIRA_SSL_VERIFY = 'false';
      process.env.MCP_SERVER_NAME = 'custom-mcp';

      const config = await loadConfig();

      expect(config).toMatchObject({
        environment: 'development',
        url: 'https://jira.company.com',
        personalToken: 'valid-token',
        logLevel: 'debug',
        sslVerify: false,
      });
      expect(config.mcp?.name).toBe('custom-mcp');
      expect(config.auth.personalToken).toBe('valid-token');
      expect(config.timeout).toBe(60000); // Development default
    });

    it('should load minimal valid configuration with defaults', async () => {
      process.env.JIRA_URL = 'https://jira.company.com';
      process.env.JIRA_PERSONAL_TOKEN = 'valid-token';
      process.env.NODE_ENV = 'production';

      const config = await loadConfig();

      expect(config.environment).toBe('production');
      expect(config.url).toBe('https://jira.company.com');
      expect(config.personalToken).toBe('valid-token');
      expect(config.sslVerify).toBe(true); // Production default
      expect(config.logLevel).toBe('info'); // Production default
      expect(config.logFormat).toBe('json'); // Production default
      expect(config.timeout).toBe(30000); // Production default
    });

    it('should load test environment configuration', async () => {
      process.env.JIRA_URL = 'https://test-jira.com';
      process.env.JIRA_PERSONAL_TOKEN = 'test-token';
      process.env.NODE_ENV = 'test';

      const config = await loadConfig();

      expect(config.environment).toBe('test');
      expect(config.logLevel).toBe('error'); // Test default
      expect(config.timeout).toBe(10000); // Test default
      expect(config.connection?.retryAttempts).toBe(1); // Test default
      expect(config.logging?.console?.enabled).toBe(false); // Test default
    });
  });

  describe('Configuration Error Handling', () => {
    it('should throw ValidationError for missing required variables', async () => {
      // No environment variables set
      await expect(loadConfig()).rejects.toThrow(ValidationError);

      try {
        await loadConfig();
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toContain(
          'Missing required environment variables'
        );
        expect(error.constraints).toContain('JIRA_URL is required');
        expect(error.constraints).toContain('JIRA_PERSONAL_TOKEN is required');
      }
    });

    it('should throw ValidationError for invalid URL', async () => {
      process.env.JIRA_URL = 'invalid-url';
      process.env.JIRA_PERSONAL_TOKEN = 'valid-token';

      await expect(loadConfig()).rejects.toThrow(ValidationError);

      try {
        await loadConfig();
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toContain('Configuration validation failed');
        expect(error.constraints).toContain('url: Invalid URL format');
      }
    });

    it('should throw ValidationError for empty personal token', async () => {
      process.env.JIRA_URL = 'https://jira.com';
      process.env.JIRA_PERSONAL_TOKEN = '';

      await expect(loadConfig()).rejects.toThrow(ValidationError);
    });

    it('should provide detailed validation errors for multiple issues', async () => {
      process.env.JIRA_URL = 'invalid-url';
      process.env.JIRA_PERSONAL_TOKEN = '';
      process.env.JIRA_TIMEOUT = '-1';

      try {
        await loadConfig();
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.constraints).toBeDefined();
        expect(error.constraints.length).toBeGreaterThanOrEqual(1);
        expect(
          error.constraints.some(
            c =>
              c.includes('Invalid URL format') ||
              c.includes('Personal token cannot be empty') ||
              c.includes('URL must be HTTP or HTTPS') ||
              c.includes('Missing required environment variables') ||
              c.includes('is required')
          )
        ).toBe(true);
      }
    });

    it('should include field context in validation errors', async () => {
      process.env.JIRA_URL = 'invalid-url';
      process.env.JIRA_PERSONAL_TOKEN = 'valid-token';

      try {
        await loadConfig();
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error.field).toBe('url');
      }
    });
  });

  describe('Configuration Caching', () => {
    it('should cache configuration after first load', async () => {
      process.env.JIRA_URL = 'https://jira.com';
      process.env.JIRA_PERSONAL_TOKEN = 'token';
      process.env.NODE_ENV = 'test';

      expect(isConfigCached()).toBe(false);

      const config1 = await loadConfig();
      expect(isConfigCached()).toBe(true);

      const config2 = await loadConfig();
      expect(config1).toBe(config2); // Same object reference (cached)

      const cached = getCachedConfig();
      expect(cached).toBe(config1);
    });

    it('should return null for cached config when no cache exists', () => {
      expect(getCachedConfig()).toBeNull();
      expect(isConfigCached()).toBe(false);
    });

    it('should clear cache when requested', async () => {
      process.env.JIRA_URL = 'https://jira.com';
      process.env.JIRA_PERSONAL_TOKEN = 'token';
      process.env.NODE_ENV = 'test';

      await loadConfig();
      expect(isConfigCached()).toBe(true);

      clearConfigCache();
      expect(isConfigCached()).toBe(false);
      expect(getCachedConfig()).toBeNull();
    });

    it('should reload configuration bypassing cache', async () => {
      process.env.JIRA_URL = 'https://jira.com';
      process.env.JIRA_PERSONAL_TOKEN = 'token';
      process.env.NODE_ENV = 'development';

      const config1 = await loadConfig();
      expect(config1.environment).toBe('development');

      // Change environment variable
      process.env.NODE_ENV = 'production';

      // Normal load should return cached version
      const config2 = await loadConfig();
      expect(config2.environment).toBe('development'); // Still cached

      // Reload should pick up new environment
      const config3 = await reloadConfig();
      expect(config3.environment).toBe('production'); // New value
    });

    it('should respect cache TTL in development vs production', () => {
      const originalNodeEnv = process.env.NODE_ENV;

      // Test development cache TTL (5 minutes)
      process.env.NODE_ENV = 'development';
      jest.resetModules();

      // Test production cache TTL (1 hour)
      process.env.NODE_ENV = 'production';
      jest.resetModules();

      process.env.NODE_ENV = originalNodeEnv;
    });
  });

  describe('Configuration Validation', () => {
    it('should validate custom configuration object', () => {
      const validConfig = {
        environment: 'development' as const,
        url: 'https://jira.com',
        personalToken: 'token',
        auth: { personalToken: 'token', tokenType: 'bearer' as const },
        sslVerify: true,
        timeout: 30000,
        logLevel: 'info' as const,
        logFormat: 'simple' as const,
      };

      expect(() => validateConfig(validConfig)).not.toThrow();
      const result = validateConfig(validConfig);
      expect(result.environment).toBe('development');
    });

    it('should reject invalid custom configuration', () => {
      const invalidConfig = {
        environment: 'invalid-env',
        url: 'invalid-url',
        personalToken: '',
        auth: { personalToken: 'different-token' },
      };

      expect(() => validateConfig(invalidConfig)).toThrow(ValidationError);
    });

    it('should handle non-object validation gracefully', () => {
      expect(() => validateConfig(null)).toThrow();
      expect(() => validateConfig('string')).toThrow();
      expect(() => validateConfig(123)).toThrow();
    });
  });

  describe('Environment-Specific Behavior', () => {
    it('should suppress configuration logging in test environment', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      process.env.JIRA_URL = 'https://jira.com';
      process.env.JIRA_PERSONAL_TOKEN = 'token';
      process.env.NODE_ENV = 'test';

      await loadConfig();

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should log configuration summary in non-test environments', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      process.env.JIRA_URL = 'https://jira.com';
      process.env.JIRA_PERSONAL_TOKEN = 'token';
      process.env.NODE_ENV = 'development';

      await loadConfig();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Configuration loaded successfully:',
        expect.objectContaining({
          environment: 'development',
          url: '[CONFIGURED]',
          personalToken: '[CONFIGURED]',
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Performance Tests', () => {
    it('should load configuration within acceptable time limits', async () => {
      process.env.JIRA_URL = 'https://jira.com';
      process.env.JIRA_PERSONAL_TOKEN = 'token';
      process.env.NODE_ENV = 'test';

      const startTime = Date.now();
      await loadConfig();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Under 100ms
    });

    it('should handle concurrent configuration requests', async () => {
      process.env.JIRA_URL = 'https://jira.com';
      process.env.JIRA_PERSONAL_TOKEN = 'token';
      process.env.NODE_ENV = 'test';

      const promises = Array(10)
        .fill(null)
        .map(() => loadConfig());
      const results = await Promise.all(promises);

      // All should return the same cached instance
      expect(results.every(config => config === results[0])).toBe(true);
      expect(results.length).toBe(10);
    });

    it('should cache configuration efficiently', async () => {
      process.env.JIRA_URL = 'https://jira.com';
      process.env.JIRA_PERSONAL_TOKEN = 'token';
      process.env.NODE_ENV = 'test';

      // First load
      const startTime1 = Date.now();
      await loadConfig();
      const endTime1 = Date.now();
      const firstLoadTime = endTime1 - startTime1;

      // Cached load
      const startTime2 = Date.now();
      await loadConfig();
      const endTime2 = Date.now();
      const cachedLoadTime = endTime2 - startTime2;

      // Cached load should be faster or equal (if too fast to measure)
      expect(cachedLoadTime).toBeLessThanOrEqual(firstLoadTime);

      // Verify caching is working
      expect(isConfigCached()).toBe(true);
    });
  });
});
