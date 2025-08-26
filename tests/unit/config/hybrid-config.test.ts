import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { z } from 'zod';
import { loadConfig, loadHybridConfig, validateConfig } from '../../../src/utils/config.js';
import { HybridConfig, JiraConfig } from '../../../src/types/config-types.js';

// Store original environment variables to restore later
const originalEnv = process.env;

describe('Hybrid Configuration Management', () => {
  beforeEach(() => {
    // Reset environment to ensure clean test state
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('HybridConfig Schema Validation', () => {
    it('should validate configuration with dynamic fields enabled', () => {
      const config: HybridConfig = {
        url: 'https://test.atlassian.net',
        bearer: 'valid-bearer-token-1234567890',
        enableDynamicFields: true,
        dynamicFieldCacheTtl: 3600,
        dynamicFieldAnalysis: true,
        fieldAnalysisSampleSize: 10,
        sslVerify: true,
        timeout: 30000,
        projectsFilter: ['PROJECT1', 'PROJECT2']
      };

      expect(() => validateConfig(config)).not.toThrow();
    });

    it('should validate configuration with dynamic fields disabled', () => {
      const config: HybridConfig = {
        url: 'https://test.atlassian.net',
        bearer: 'valid-bearer-token-1234567890',
        enableDynamicFields: false,
        dynamicFieldCacheTtl: 3600,
        dynamicFieldAnalysis: false,
        fieldAnalysisSampleSize: 5,
        sslVerify: true,
        timeout: 30000,
        projectsFilter: []
      };

      expect(() => validateConfig(config)).not.toThrow();
    });

    it('should validate configuration with minimum required fields', () => {
      const config: HybridConfig = {
        url: 'https://test.atlassian.net',
        bearer: 'valid-bearer-token-1234567890',
        enableDynamicFields: false,
        dynamicFieldCacheTtl: 3600,
        dynamicFieldAnalysis: false,
        fieldAnalysisSampleSize: 5,
        sslVerify: true,
        timeout: 30000,
        projectsFilter: []
      };

      expect(() => validateConfig(config)).not.toThrow();
    });

    it('should reject invalid cache TTL values', () => {
      const config: HybridConfig = {
        url: 'https://test.atlassian.net',
        bearer: 'valid-bearer-token-1234567890',
        enableDynamicFields: true,
        dynamicFieldCacheTtl: -1, // Invalid negative value
        dynamicFieldAnalysis: true,
        fieldAnalysisSampleSize: 10,
        sslVerify: true,
        timeout: 30000,
        projectsFilter: []
      };

      expect(() => validateConfig(config)).toThrow('Cache TTL must be at least 60 seconds');
    });

    it('should reject invalid field analysis sample size', () => {
      const config: HybridConfig = {
        url: 'https://test.atlassian.net',
        bearer: 'valid-bearer-token-1234567890',
        enableDynamicFields: true,
        dynamicFieldCacheTtl: 3600,
        dynamicFieldAnalysis: true,
        fieldAnalysisSampleSize: 0, // Invalid zero value
        sslVerify: true,
        timeout: 30000,
        projectsFilter: []
      };

      expect(() => validateConfig(config)).toThrow('Field analysis sample size must be at least 1');
    });

    it('should reject sample size greater than 100', () => {
      const config: HybridConfig = {
        url: 'https://test.atlassian.net',
        bearer: 'valid-bearer-token-1234567890',
        enableDynamicFields: true,
        dynamicFieldCacheTtl: 3600,
        dynamicFieldAnalysis: true,
        fieldAnalysisSampleSize: 150, // Invalid - too large
        sslVerify: true,
        timeout: 30000,
        projectsFilter: []
      };

      expect(() => validateConfig(config)).toThrow('Field analysis sample size must be at most 100');
    });

    it('should validate timeout values', () => {
      const config: HybridConfig = {
        url: 'https://test.atlassian.net',
        bearer: 'valid-bearer-token-1234567890',
        enableDynamicFields: false,
        dynamicFieldCacheTtl: 3600,
        dynamicFieldAnalysis: false,
        fieldAnalysisSampleSize: 5,
        sslVerify: true,
        timeout: 1000, // Minimum valid timeout
        projectsFilter: []
      };

      expect(() => validateConfig(config)).not.toThrow();
    });

    it('should reject invalid timeout values', () => {
      const config: HybridConfig = {
        url: 'https://test.atlassian.net',
        bearer: 'valid-bearer-token-1234567890',
        enableDynamicFields: false,
        dynamicFieldCacheTtl: 3600,
        dynamicFieldAnalysis: false,
        fieldAnalysisSampleSize: 5,
        sslVerify: true,
        timeout: 500, // Too small
        projectsFilter: []
      };

      expect(() => validateConfig(config)).toThrow('Timeout must be at least 1000ms (1 second)');
    });
  });

  describe('Environment Variable Loading', () => {
    it('should load configuration from environment variables with dynamic fields enabled', () => {
      process.env.JIRA_URL = 'https://test.atlassian.net';
      process.env.JIRA_PERSONAL_TOKEN = 'test-bearer-token-1234567890';
      process.env.ENABLE_DYNAMIC_FIELDS = 'true';
      process.env.DYNAMIC_FIELD_CACHE_TTL = '7200';
      process.env.DYNAMIC_FIELD_ANALYSIS = 'true';
      process.env.FIELD_ANALYSIS_SAMPLE_SIZE = '15';
      process.env.JIRA_SSL_VERIFY = 'false';
      process.env.JIRA_TIMEOUT = '45000';
      process.env.JIRA_PROJECTS_FILTER = 'PROJECT1,PROJECT2,PROJECT3';

      const config = loadHybridConfig();

      expect(config.url).toBe('https://test.atlassian.net');
      expect(config.bearer).toBe('test-bearer-token-1234567890');
      expect(config.enableDynamicFields).toBe(true);
      expect(config.dynamicFieldCacheTtl).toBe(7200);
      expect(config.dynamicFieldAnalysis).toBe(true);
      expect(config.fieldAnalysisSampleSize).toBe(15);
      expect(config.sslVerify).toBe(false);
      expect(config.timeout).toBe(45000);
      expect(config.projectsFilter).toEqual(['PROJECT1', 'PROJECT2', 'PROJECT3']);
    });

    it('should load configuration with dynamic fields disabled', () => {
      process.env.JIRA_URL = 'https://test.atlassian.net';
      process.env.JIRA_PERSONAL_TOKEN = 'test-bearer-token-1234567890';
      process.env.ENABLE_DYNAMIC_FIELDS = 'false';
      process.env.DYNAMIC_FIELD_CACHE_TTL = '3600';
      process.env.DYNAMIC_FIELD_ANALYSIS = 'false';

      const config = loadHybridConfig();

      expect(config.enableDynamicFields).toBe(false);
      expect(config.dynamicFieldAnalysis).toBe(false);
    });

    it('should apply default values for optional environment variables', () => {
      process.env.JIRA_URL = 'https://test.atlassian.net';
      process.env.JIRA_PERSONAL_TOKEN = 'test-bearer-token-1234567890';
      // Don't set optional environment variables

      const config = loadHybridConfig();

      expect(config.enableDynamicFields).toBe(false); // Default
      expect(config.dynamicFieldCacheTtl).toBe(3600); // Default
      expect(config.dynamicFieldAnalysis).toBe(false); // Default
      expect(config.fieldAnalysisSampleSize).toBe(5); // Default
      expect(config.sslVerify).toBe(true); // Default
      expect(config.timeout).toBe(30000); // Default
      expect(config.projectsFilter).toEqual([]); // Default
    });

    it('should handle boolean environment variables correctly', () => {
      process.env.JIRA_URL = 'https://test.atlassian.net';
      process.env.JIRA_PERSONAL_TOKEN = 'test-bearer-token-1234567890';
      
      // Test various truthy values
      process.env.ENABLE_DYNAMIC_FIELDS = '1';
      process.env.DYNAMIC_FIELD_ANALYSIS = 'TRUE';
      
      const config1 = loadHybridConfig();
      expect(config1.enableDynamicFields).toBe(true);
      expect(config1.dynamicFieldAnalysis).toBe(true);

      // Test falsy values
      process.env.ENABLE_DYNAMIC_FIELDS = '0';
      process.env.DYNAMIC_FIELD_ANALYSIS = 'FALSE';
      
      const config2 = loadHybridConfig();
      expect(config2.enableDynamicFields).toBe(false);
      expect(config2.dynamicFieldAnalysis).toBe(false);
    });

    it('should parse numeric environment variables correctly', () => {
      process.env.JIRA_URL = 'https://test.atlassian.net';
      process.env.JIRA_PERSONAL_TOKEN = 'test-bearer-token-1234567890';
      process.env.DYNAMIC_FIELD_CACHE_TTL = '7200';
      process.env.FIELD_ANALYSIS_SAMPLE_SIZE = '25';
      process.env.JIRA_TIMEOUT = '60000';

      const config = loadHybridConfig();

      expect(config.dynamicFieldCacheTtl).toBe(7200);
      expect(config.fieldAnalysisSampleSize).toBe(25);
      expect(config.timeout).toBe(60000);
    });

    it('should handle invalid numeric environment variables gracefully', () => {
      process.env.JIRA_URL = 'https://test.atlassian.net';
      process.env.JIRA_PERSONAL_TOKEN = 'test-bearer-token-1234567890';
      process.env.DYNAMIC_FIELD_CACHE_TTL = 'invalid-number';
      process.env.FIELD_ANALYSIS_SAMPLE_SIZE = 'not-a-number';

      expect(() => loadConfig()).toThrow('Invalid numeric value for environment variable');
    });

    it('should parse projects filter correctly', () => {
      process.env.JIRA_URL = 'https://test.atlassian.net';
      process.env.JIRA_PERSONAL_TOKEN = 'test-bearer-token-1234567890';
      process.env.JIRA_PROJECTS_FILTER = 'PROJECT1,PROJECT2,PROJECT3';

      const config = loadHybridConfig();

      expect(config.projectsFilter).toEqual(['PROJECT1', 'PROJECT2', 'PROJECT3']);
    });

    it('should handle empty projects filter', () => {
      process.env.JIRA_URL = 'https://test.atlassian.net';
      process.env.JIRA_PERSONAL_TOKEN = 'test-bearer-token-1234567890';
      process.env.JIRA_PROJECTS_FILTER = '';

      const config = loadHybridConfig();

      expect(config.projectsFilter).toEqual([]);
    });

    it('should handle projects filter with whitespace', () => {
      process.env.JIRA_URL = 'https://test.atlassian.net';
      process.env.JIRA_PERSONAL_TOKEN = 'test-bearer-token-1234567890';
      process.env.JIRA_PROJECTS_FILTER = ' PROJECT1 , PROJECT2 , PROJECT3 ';

      const config = loadHybridConfig();

      expect(config.projectsFilter).toEqual(['PROJECT1', 'PROJECT2', 'PROJECT3']);
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain compatibility with existing JiraConfig interface', () => {
      process.env.JIRA_URL = 'https://test.atlassian.net';
      process.env.JIRA_PERSONAL_TOKEN = 'test-bearer-token-1234567890';

      const config = loadHybridConfig();

      // Should have all JiraConfig properties
      expect(config).toHaveProperty('url');
      expect(config).toHaveProperty('bearer');
      
      // Should be assignable to JiraConfig type
      const jiraConfig: JiraConfig = {
        url: config.url,
        bearer: config.bearer
      };
      
      expect(jiraConfig.url).toBe(config.url);
      expect(jiraConfig.bearer).toBe(config.bearer);
    });

    it('should work with username/password authentication', () => {
      process.env.JIRA_URL = 'https://test.atlassian.net';
      process.env.JIRA_USERNAME = 'testuser@example.com';
      process.env.JIRA_PASSWORD = 'testpassword123';
      delete process.env.JIRA_PERSONAL_TOKEN;

      const config = loadHybridConfig();

      expect(config.url).toBe('https://test.atlassian.net');
      expect(config.username).toBe('testuser@example.com');
      expect(config.password).toBe('testpassword123');
      expect(config.bearer).toBeUndefined();
    });
  });

  describe('Feature Toggle Behavior', () => {
    it('should provide correct feature flags for dynamic field discovery', () => {
      process.env.JIRA_URL = 'https://test.atlassian.net';
      process.env.JIRA_PERSONAL_TOKEN = 'test-bearer-token-1234567890';
      process.env.ENABLE_DYNAMIC_FIELDS = 'true';

      const config = loadHybridConfig();

      expect(config.enableDynamicFields).toBe(true);
      expect(config.isDynamicFieldsEnabled()).toBe(true);
    });

    it('should provide correct feature flags when dynamic fields are disabled', () => {
      process.env.JIRA_URL = 'https://test.atlassian.net';
      process.env.JIRA_PERSONAL_TOKEN = 'test-bearer-token-1234567890';
      process.env.ENABLE_DYNAMIC_FIELDS = 'false';

      const config = loadHybridConfig();

      expect(config.enableDynamicFields).toBe(false);
      expect(config.isDynamicFieldsEnabled()).toBe(false);
    });

    it('should provide cache TTL in milliseconds for internal use', () => {
      process.env.JIRA_URL = 'https://test.atlassian.net';
      process.env.JIRA_PERSONAL_TOKEN = 'test-bearer-token-1234567890';
      process.env.DYNAMIC_FIELD_CACHE_TTL = '7200'; // 2 hours in seconds

      const config = loadHybridConfig();

      expect(config.dynamicFieldCacheTtl).toBe(7200); // In seconds
      expect(config.getCacheTtlMs()).toBe(7200 * 1000); // In milliseconds
    });

    it('should provide field analysis configuration', () => {
      process.env.JIRA_URL = 'https://test.atlassian.net';
      process.env.JIRA_PERSONAL_TOKEN = 'test-bearer-token-1234567890';
      process.env.DYNAMIC_FIELD_ANALYSIS = 'true';
      process.env.FIELD_ANALYSIS_SAMPLE_SIZE = '20';

      const config = loadHybridConfig();

      expect(config.dynamicFieldAnalysis).toBe(true);
      expect(config.fieldAnalysisSampleSize).toBe(20);
      expect(config.isFieldAnalysisEnabled()).toBe(true);
    });
  });

  describe('Configuration Error Handling', () => {
    it('should throw error when required JIRA_URL is missing', () => {
      delete process.env.JIRA_URL;
      process.env.JIRA_PERSONAL_TOKEN = 'test-bearer-token-1234567890';

      expect(() => loadConfig()).toThrow('Missing required environment variable: JIRA_URL');
    });

    it('should throw error when neither bearer token nor username/password is provided', () => {
      process.env.JIRA_URL = 'https://test.atlassian.net';
      delete process.env.JIRA_PERSONAL_TOKEN;
      delete process.env.JIRA_USERNAME;
      delete process.env.JIRA_PASSWORD;

      expect(() => loadConfig()).toThrow('Either JIRA_PERSONAL_TOKEN or both JIRA_USERNAME and JIRA_PASSWORD must be provided');
    });

    it('should throw error for invalid cache TTL range', () => {
      process.env.JIRA_URL = 'https://test.atlassian.net';
      process.env.JIRA_PERSONAL_TOKEN = 'test-bearer-token-1234567890';
      process.env.DYNAMIC_FIELD_CACHE_TTL = '86401'; // > 24 hours

      expect(() => loadConfig()).toThrow('Cache TTL must be between 60 and 86400 seconds (1 minute to 24 hours)');
    });

    it('should throw error for cache TTL too small', () => {
      process.env.JIRA_URL = 'https://test.atlassian.net';
      process.env.JIRA_PERSONAL_TOKEN = 'test-bearer-token-1234567890';
      process.env.DYNAMIC_FIELD_CACHE_TTL = '30'; // < 1 minute

      expect(() => loadConfig()).toThrow('Cache TTL must be between 60 and 86400 seconds (1 minute to 24 hours)');
    });
  });

  describe('Type Safety and Schema Validation', () => {
    it('should enforce proper TypeScript types', () => {
      const config: HybridConfig = {
        url: 'https://test.atlassian.net',
        bearer: 'test-bearer-token-1234567890',
        enableDynamicFields: true,
        dynamicFieldCacheTtl: 3600,
        dynamicFieldAnalysis: true,
        fieldAnalysisSampleSize: 10,
        sslVerify: true,
        timeout: 30000,
        projectsFilter: ['PROJECT1'],
        // Type checking - these methods should exist
        isDynamicFieldsEnabled: expect.any(Function),
        getCacheTtlMs: expect.any(Function),
        isFieldAnalysisEnabled: expect.any(Function)
      };

      // This test will fail during TypeScript compilation if types are wrong
      expect(typeof config.enableDynamicFields).toBe('boolean');
      expect(typeof config.dynamicFieldCacheTtl).toBe('number');
      expect(Array.isArray(config.projectsFilter)).toBe(true);
    });

    it('should validate Zod schema for configuration object', () => {
      // This test will ensure the Zod schema is properly defined
      const validConfig = {
        url: 'https://test.atlassian.net',
        bearer: 'test-bearer-token-1234567890',
        enableDynamicFields: true,
        dynamicFieldCacheTtl: 3600,
        dynamicFieldAnalysis: true,
        fieldAnalysisSampleSize: 10,
        sslVerify: true,
        timeout: 30000,
        projectsFilter: ['PROJECT1']
      };

      // This should not throw with a proper Zod schema
      expect(() => validateConfig(validConfig as HybridConfig)).not.toThrow();
    });
  });
});