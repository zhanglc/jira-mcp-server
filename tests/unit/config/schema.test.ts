/**
 * Configuration Schema Tests
 * 
 * Tests for Zod schema validation of configuration objects.
 */

import { 
  JiraServerConfigSchema, 
  AuthConfigSchema, 
  ConnectionConfigSchema,
  LoggingConfigSchema,
  MCPServerConfigSchema,
  EnvironmentSchema,
  LogLevelSchema,
  LogFormatSchema
} from '@/config/schema';

describe('Configuration Schema Validation', () => {
  describe('Valid Configuration Validation', () => {
    it('should validate minimal valid configuration', () => {
      const config = {
        environment: 'development' as const,
        url: 'https://jira.company.com',
        personalToken: 'valid-token-123',
        auth: { 
          personalToken: 'valid-token-123',
          tokenType: 'bearer' as const
        }
      };
      
      expect(() => JiraServerConfigSchema.parse(config)).not.toThrow();
      const result = JiraServerConfigSchema.parse(config);
      expect(result.environment).toBe('development');
      expect(result.url).toBe('https://jira.company.com');
      expect(result.personalToken).toBe('valid-token-123');
    });

    it('should validate complete configuration with all optional fields', () => {
      const fullConfig = {
        environment: 'production' as const,
        url: 'https://jira.company.com',
        auth: { 
          personalToken: 'token',
          tokenType: 'bearer' as const
        },
        connection: { 
          timeout: 45000, 
          sslVerify: true, 
          keepAlive: true,
          retryAttempts: 5,
          retryDelay: 2000
        },
        logging: { 
          level: 'info' as const, 
          format: 'json' as const, 
          console: { enabled: true, colorize: false, timestamp: true },
          file: { enabled: true, filename: 'app.log', maxSize: '50m', maxFiles: 10, rotateDaily: true }
        },
        mcp: { 
          name: 'jira-server-mcp', 
          version: '1.0.0', 
          description: 'Jira Server MCP',
          capabilities: { tools: true, resources: true, prompts: false }
        },
        personalToken: 'token',
        sslVerify: true,
        timeout: 45000,
        logLevel: 'info' as const,
        logFormat: 'json' as const
      };
      
      expect(() => JiraServerConfigSchema.parse(fullConfig)).not.toThrow();
      const result = JiraServerConfigSchema.parse(fullConfig);
      expect(result.logging?.level).toBe('info');
      expect(result.mcp?.capabilities.tools).toBe(true);
    });
  });

  describe('Invalid Configuration Validation', () => {
    it('should reject missing required fields', () => {
      const incompleteConfigs = [
        { environment: 'development' }, // missing url, personalToken, auth
        { url: 'https://jira.com' }, // missing environment, personalToken, auth
        { personalToken: 'token' } // missing environment, url, auth
      ];
      
      incompleteConfigs.forEach(config => {
        expect(() => JiraServerConfigSchema.parse(config)).toThrow();
      });
    });

    it('should reject invalid URL formats', () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://jira.com',
        'https://',
        'javascript:alert(1)'
      ];
      
      invalidUrls.forEach(url => {
        const config = { 
          environment: 'development', 
          url, 
          personalToken: 'token',
          auth: { personalToken: 'token' }
        };
        expect(() => JiraServerConfigSchema.parse(config)).toThrow();
      });
    });

    it('should reject invalid environment values', () => {
      const config = { 
        environment: 'invalid-env', 
        url: 'https://jira.com', 
        personalToken: 'token',
        auth: { personalToken: 'token' }
      };
      expect(() => JiraServerConfigSchema.parse(config)).toThrow();
    });

    it('should reject invalid timeout values', () => {
      const invalidTimeouts = [-1, 0, 1.5]; // Negative, zero, non-integer
      
      invalidTimeouts.forEach(timeout => {
        const config = { 
          environment: 'development', 
          url: 'https://jira.com', 
          personalToken: 'token',
          auth: { personalToken: 'token' },
          timeout 
        };
        expect(() => JiraServerConfigSchema.parse(config)).toThrow();
      });
    });

    it('should reject mismatched authentication tokens', () => {
      const config = {
        environment: 'development',
        url: 'https://jira.com',
        personalToken: 'token1',
        auth: { personalToken: 'token2' } // Different token
      };
      
      expect(() => JiraServerConfigSchema.parse(config)).toThrow();
    });

    it('should reject empty personal token', () => {
      const config = {
        environment: 'development',
        url: 'https://jira.com',
        personalToken: '',
        auth: { personalToken: '' }
      };
      
      expect(() => JiraServerConfigSchema.parse(config)).toThrow();
    });
  });

  describe('Default Value Application', () => {
    it('should apply correct default values', () => {
      const minimalConfig = {
        environment: 'development' as const,
        url: 'https://jira.com',
        personalToken: 'token',
        auth: { personalToken: 'token' }
      };
      
      const result = JiraServerConfigSchema.parse(minimalConfig);
      expect(result.sslVerify).toBe(true);
      expect(result.timeout).toBe(30000);
      expect(result.logLevel).toBe('info');
      expect(result.logFormat).toBe('simple');
      expect(result.auth.tokenType).toBe('bearer');
    });

    it('should apply default values for optional sections', () => {
      const configWithOptionals = {
        environment: 'development' as const,
        url: 'https://jira.com',
        personalToken: 'token',
        auth: { personalToken: 'token' },
        connection: {},
        logging: {},
        mcp: {}
      };
      
      const result = JiraServerConfigSchema.parse(configWithOptionals);
      expect(result.connection?.timeout).toBe(30000);
      expect(result.connection?.sslVerify).toBe(true);
      expect(result.logging?.level).toBe('info');
      expect(result.mcp?.name).toBe('jira-server-mcp');
    });
  });

  describe('Individual Schema Components', () => {
    it('should validate AuthConfig schema correctly', () => {
      const validAuth = { personalToken: 'token123' };
      const result = AuthConfigSchema.parse(validAuth);
      expect(result.tokenType).toBe('bearer'); // default value
      
      const invalidAuth = { personalToken: '' };
      expect(() => AuthConfigSchema.parse(invalidAuth)).toThrow();
    });

    it('should validate ConnectionConfig schema correctly', () => {
      const validConnection = { timeout: 45000, sslVerify: false };
      const result = ConnectionConfigSchema.parse(validConnection);
      expect(result?.keepAlive).toBe(true); // default value
      expect(result?.retryAttempts).toBe(3); // default value
      
      const invalidConnection = { timeout: -1 };
      expect(() => ConnectionConfigSchema.parse(invalidConnection)).toThrow();
    });

    it('should validate LoggingConfig schema correctly', () => {
      const validLogging = { level: 'debug' as const };
      const result = LoggingConfigSchema.parse(validLogging);
      expect(result?.format).toBe('simple'); // default value
      expect(result?.console.enabled).toBe(true); // default value
      
      const invalidLogging = { level: 'invalid-level' };
      expect(() => LoggingConfigSchema.parse(invalidLogging)).toThrow();
    });

    it('should validate enum schemas correctly', () => {
      // Environment enum
      expect(() => EnvironmentSchema.parse('development')).not.toThrow();
      expect(() => EnvironmentSchema.parse('production')).not.toThrow();
      expect(() => EnvironmentSchema.parse('test')).not.toThrow();
      expect(() => EnvironmentSchema.parse('invalid')).toThrow();
      
      // LogLevel enum
      expect(() => LogLevelSchema.parse('debug')).not.toThrow();
      expect(() => LogLevelSchema.parse('info')).not.toThrow();
      expect(() => LogLevelSchema.parse('invalid')).toThrow();
      
      // LogFormat enum
      expect(() => LogFormatSchema.parse('json')).not.toThrow();
      expect(() => LogFormatSchema.parse('simple')).not.toThrow();
      expect(() => LogFormatSchema.parse('invalid')).toThrow();
    });
  });
});