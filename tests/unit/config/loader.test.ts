/**
 * Configuration Loader Tests
 * 
 * Tests for environment variable loading and processing.
 */

import { 
  loadEnvironmentVariables, 
  mergeWithDefaults, 
  validateRequiredEnvironmentVariables,
  getConfigurationSummary 
} from '@/config/loader';
import { ValidationError } from '@/types/common';

// Mock process.env
const originalEnv = process.env;

describe('Environment Variable Loading', () => {
  beforeEach(() => {
    // Clear environment variables before each test
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.JIRA_URL;
    delete process.env.JIRA_PERSONAL_TOKEN;
    delete process.env.NODE_ENV;
    delete process.env.JIRA_SSL_VERIFY;
    delete process.env.JIRA_TIMEOUT;
    delete process.env.LOG_LEVEL;
    delete process.env.MCP_SERVER_NAME;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Basic Environment Variable Mapping', () => {
    it('should correctly map basic environment variables', () => {
      process.env.JIRA_URL = 'https://test-jira.com';
      process.env.JIRA_PERSONAL_TOKEN = 'test-token';
      process.env.NODE_ENV = 'test';
      
      const config = loadEnvironmentVariables();
      expect(config.url).toBe('https://test-jira.com');
      expect(config.personalToken).toBe('test-token');
      expect(config.environment).toBe('test');
      expect(config.auth?.personalToken).toBe('test-token');
      expect(config.auth?.tokenType).toBe('bearer');
    });

    it('should handle nested configuration paths', () => {
      process.env.JIRA_URL = 'https://jira.com';
      process.env.JIRA_PERSONAL_TOKEN = 'token';
      process.env.JIRA_SSL_VERIFY = 'false';
      process.env.LOG_LEVEL = 'debug';
      process.env.MCP_SERVER_NAME = 'custom-mcp';
      
      const config = loadEnvironmentVariables();
      expect(config.sslVerify).toBe(false);
      expect(config.logLevel).toBe('debug');
      expect(config.mcp?.name).toBe('custom-mcp');
    });

    it('should ignore empty environment variables', () => {
      process.env.JIRA_URL = 'https://jira.com';
      process.env.JIRA_PERSONAL_TOKEN = 'token';
      process.env.JIRA_SSL_VERIFY = ''; // Empty string
      process.env.LOG_LEVEL = '   '; // Whitespace only
      
      const config = loadEnvironmentVariables();
      expect(config.url).toBe('https://jira.com');
      expect(config.personalToken).toBe('token');
      expect(config.sslVerify).toBeUndefined();
      expect(config.logLevel).toBeUndefined();
    });
  });

  describe('Type Conversion', () => {
    it('should convert string numbers to numbers', () => {
      process.env.JIRA_URL = 'https://jira.com';
      process.env.JIRA_PERSONAL_TOKEN = 'token';
      process.env.JIRA_TIMEOUT = '45000';
      process.env.JIRA_RETRY_ATTEMPTS = '5';
      
      const config = loadEnvironmentVariables();
      expect(config.timeout).toBe(45000);
      expect(typeof config.timeout).toBe('number');
      expect(config.connection?.retryAttempts).toBe(5);
      expect(typeof config.connection?.retryAttempts).toBe('number');
    });

    it('should convert string booleans to booleans', () => {
      process.env.JIRA_URL = 'https://jira.com';
      process.env.JIRA_PERSONAL_TOKEN = 'token';
      process.env.JIRA_SSL_VERIFY = 'false';
      process.env.LOG_CONSOLE_ENABLED = 'true';
      process.env.JIRA_KEEP_ALIVE = 'false';
      
      const config = loadEnvironmentVariables();
      expect(config.sslVerify).toBe(false);
      expect(typeof config.sslVerify).toBe('boolean');
      expect(config.logging?.console?.enabled).toBe(true);
      expect(typeof config.logging?.console?.enabled).toBe('boolean');
      expect(config.connection?.keepAlive).toBe(false);
    });

    it('should handle invalid type conversions gracefully', () => {
      process.env.JIRA_URL = 'https://jira.com';
      process.env.JIRA_PERSONAL_TOKEN = 'token';
      process.env.JIRA_TIMEOUT = 'not-a-number';
      
      expect(() => loadEnvironmentVariables()).toThrow(ValidationError);
    });

    it('should handle invalid number values', () => {
      process.env.JIRA_URL = 'https://jira.com';
      process.env.JIRA_PERSONAL_TOKEN = 'token';
      process.env.JIRA_RETRY_DELAY = 'invalid-number';
      
      expect(() => loadEnvironmentVariables()).toThrow(ValidationError);
      try {
        loadEnvironmentVariables();
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe('connection.retryDelay');
        expect(error.constraints).toContain('must be a valid number');
      }
    });
  });

  describe('Required Environment Variables Validation', () => {
    it('should pass validation when all required variables are present', () => {
      process.env.JIRA_URL = 'https://jira.com';
      process.env.JIRA_PERSONAL_TOKEN = 'token';
      
      expect(() => validateRequiredEnvironmentVariables()).not.toThrow();
    });

    it('should throw error when required variables are missing', () => {
      delete process.env.JIRA_URL;
      delete process.env.JIRA_PERSONAL_TOKEN;
      
      expect(() => validateRequiredEnvironmentVariables()).toThrow(ValidationError);
      try {
        validateRequiredEnvironmentVariables();
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toContain('Missing required environment variables');
        expect(error.constraints).toContain('JIRA_URL is required');
        expect(error.constraints).toContain('JIRA_PERSONAL_TOKEN is required');
      }
    });

    it('should throw error when required variables are empty', () => {
      process.env.JIRA_URL = '';
      process.env.JIRA_PERSONAL_TOKEN = '   '; // Whitespace only
      
      expect(() => validateRequiredEnvironmentVariables()).toThrow(ValidationError);
    });

    it('should throw error when only some required variables are missing', () => {
      process.env.JIRA_URL = 'https://jira.com';
      delete process.env.JIRA_PERSONAL_TOKEN;
      
      expect(() => validateRequiredEnvironmentVariables()).toThrow(ValidationError);
      try {
        validateRequiredEnvironmentVariables();
      } catch (error) {
        expect(error.field).toBe('JIRA_PERSONAL_TOKEN');
      }
    });
  });

  describe('Configuration Merging', () => {
    it('should merge environment config with development defaults', () => {
      const envConfig = {
        environment: 'development' as const,
        url: 'https://jira.com',
        personalToken: 'token',
        timeout: 45000
      };
      
      const merged = mergeWithDefaults(envConfig);
      expect(merged.environment).toBe('development');
      expect(merged.url).toBe('https://jira.com');
      expect(merged.timeout).toBe(45000); // From env config
      expect(merged.logLevel).toBe('debug'); // From development defaults
      expect(merged.sslVerify).toBe(false); // From development defaults
    });

    it('should merge environment config with production defaults', () => {
      const envConfig = {
        environment: 'production' as const,
        url: 'https://jira.com',
        personalToken: 'token'
      };
      
      const merged = mergeWithDefaults(envConfig);
      expect(merged.environment).toBe('production');
      expect(merged.logLevel).toBe('info'); // From production defaults
      expect(merged.sslVerify).toBe(true); // From production defaults
      expect(merged.logFormat).toBe('json'); // From production defaults
    });

    it('should perform deep merge for nested objects', () => {
      const envConfig = {
        environment: 'development' as const,
        url: 'https://jira.com',
        personalToken: 'token',
        logging: {
          level: 'warn' as const,
          console: {
            enabled: false
          }
        }
      };
      
      const merged = mergeWithDefaults(envConfig);
      expect(merged.logging?.level).toBe('warn'); // From env config
      expect(merged.logging?.console?.enabled).toBe(false); // From env config
      expect(merged.logging?.console?.colorize).toBe(true); // From defaults
      expect(merged.logging?.format).toBe('simple'); // From defaults
    });

    it('should default to development environment when not specified', () => {
      const envConfig = {
        url: 'https://jira.com',
        personalToken: 'token'
      };
      
      const merged = mergeWithDefaults(envConfig);
      expect(merged.environment).toBe('development');
      expect(merged.logLevel).toBe('debug'); // Development default
    });
  });

  describe('Configuration Summary', () => {
    it('should create safe configuration summary', () => {
      const config = {
        environment: 'development' as const,
        url: 'https://jira.company.com',
        personalToken: 'secret-token-123',
        sslVerify: true,
        timeout: 30000,
        logLevel: 'info' as const,
        logFormat: 'json' as const,
        mcp: { name: 'custom-mcp' },
        connection: { timeout: 45000 },
        logging: { level: 'debug' as const }
      };
      
      const summary = getConfigurationSummary(config);
      
      expect(summary.environment).toBe('development');
      expect(summary.url).toBe('[CONFIGURED]');
      expect(summary.personalToken).toBe('[CONFIGURED]'); // Sensitive data hidden
      expect(summary.sslVerify).toBe(true);
      expect(summary.timeout).toBe(30000);
      expect(summary.logLevel).toBe('info');
      expect(summary.mcpServerName).toBe('custom-mcp');
      expect(summary.connectionConfig).toBe('[CONFIGURED]');
      expect(summary.loggingConfig).toBe('[CONFIGURED]');
    });

    it('should handle missing optional fields in summary', () => {
      const config = {
        environment: 'test' as const,
        logLevel: 'error' as const
      };
      
      const summary = getConfigurationSummary(config);
      
      expect(summary.url).toBe('[NOT SET]');
      expect(summary.personalToken).toBe('[NOT SET]');
      expect(summary.connectionConfig).toBe('[DEFAULT]');
      expect(summary.loggingConfig).toBe('[DEFAULT]');
      expect(summary.mcpServerName).toBeUndefined();
    });
  });
});