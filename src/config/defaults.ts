/**
 * Default Configuration Values
 *
 * Provides default values for configuration sections.
 */

import type { 
  JiraServerConfig, 
  ConnectionConfig, 
  LoggingConfig, 
  MCPServerConfig 
} from '../types/config';

/**
 * Default connection configuration
 */
export const DEFAULT_CONNECTION_CONFIG: ConnectionConfig = {
  timeout: 30000,
  sslVerify: true,
  keepAlive: true,
  retryAttempts: 3,
  retryDelay: 1000
};

/**
 * Default logging configuration
 */
export const DEFAULT_LOGGING_CONFIG: LoggingConfig = {
  level: 'info',
  format: 'simple',
  console: {
    enabled: true,
    colorize: true,
    timestamp: true
  },
  file: {
    enabled: false,
    maxSize: '10m',
    maxFiles: 5,
    rotateDaily: true
  }
};

/**
 * Default MCP server configuration
 */
export const DEFAULT_MCP_CONFIG: MCPServerConfig = {
  name: 'jira-server-mcp',
  version: '1.0.0',
  description: 'Jira Server/Data Center MCP Server',
  capabilities: {
    tools: true,
    resources: true,
    prompts: false
  }
};

/**
 * Minimum required configuration for development
 */
export const DEVELOPMENT_DEFAULTS: Partial<JiraServerConfig> = {
  environment: 'development',
  sslVerify: false, // Often needed for local/dev Jira instances
  timeout: 60000,
  logLevel: 'debug',
  logFormat: 'simple',
  connection: {
    ...DEFAULT_CONNECTION_CONFIG,
    sslVerify: false,
    timeout: 60000 // Longer timeout for development
  },
  logging: {
    ...DEFAULT_LOGGING_CONFIG,
    level: 'debug',
    console: {
      enabled: true,
      colorize: true,
      timestamp: true
    }
  },
  mcp: DEFAULT_MCP_CONFIG
};

/**
 * Production configuration defaults
 */
export const PRODUCTION_DEFAULTS: Partial<JiraServerConfig> = {
  environment: 'production',
  sslVerify: true,
  timeout: 30000,
  logLevel: 'info',
  logFormat: 'json',
  connection: {
    ...DEFAULT_CONNECTION_CONFIG,
    sslVerify: true,
    retryAttempts: 5 // More retries in production
  },
  logging: {
    ...DEFAULT_LOGGING_CONFIG,
    level: 'info',
    format: 'json',
    console: {
      enabled: true,
      colorize: false, // No colors in production logs
      timestamp: true
    },
    file: {
      enabled: true,
      filename: 'jira-mcp-server.log',
      maxSize: '50m',
      maxFiles: 10,
      rotateDaily: true
    }
  },
  mcp: DEFAULT_MCP_CONFIG
};

/**
 * Test environment configuration defaults
 */
export const TEST_DEFAULTS: Partial<JiraServerConfig> = {
  environment: 'test',
  sslVerify: false,
  timeout: 10000, // Faster timeouts for tests
  logLevel: 'error', // Minimal logging in tests
  logFormat: 'simple',
  connection: {
    ...DEFAULT_CONNECTION_CONFIG,
    sslVerify: false,
    timeout: 10000,
    retryAttempts: 1 // Fast failure in tests
  },
  logging: {
    ...DEFAULT_LOGGING_CONFIG,
    level: 'error',
    console: {
      enabled: false, // No console output in tests
      colorize: false,
      timestamp: false
    }
  },
  mcp: DEFAULT_MCP_CONFIG
};

/**
 * Get environment-specific defaults
 */
export function getEnvironmentDefaults(environment: string): Partial<JiraServerConfig> {
  switch (environment) {
    case 'production':
      return PRODUCTION_DEFAULTS;
    case 'test':
      return TEST_DEFAULTS;
    case 'development':
    default:
      return DEVELOPMENT_DEFAULTS;
  }
}