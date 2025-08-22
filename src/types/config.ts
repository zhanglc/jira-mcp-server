/**
 * Configuration Type Definitions
 *
 * Type definitions for application configuration including Jira Server settings,
 * authentication, logging, and performance options.
 */

import type { LogLevel, Environment, CacheConfig, RetryConfig } from './common';

/**
 * Personal Access Token authentication configuration
 */
export interface AuthConfig {
  personalToken: string;
  tokenType?: 'bearer' | 'basic' | 'pat';
}

/**
 * HTTP connection configuration
 */
export interface ConnectionConfig {
  timeout: number;
  sslVerify: boolean;
  maxRedirects?: number;
  keepAlive?: boolean;
  userAgent?: string;
  retryAttempts?: number;
  retryDelay?: number;
  proxy?: {
    host: string;
    port: number;
    auth?: {
      username: string;
      password: string;
    };
  };
}

/**
 * Project and content filtering configuration
 */
export interface FilterConfig {
  projectsFilter?: string[];
  allowedIssueTypes?: string[];
  excludedFields?: string[];
  maxResultsLimit?: number;
  defaultFields?: string[];
}

/**
 * Logging configuration
 */
export type LogFormat = 'json' | 'simple' | 'structured';

export interface LoggingConfig {
  level: LogLevel;
  format: LogFormat;
  file?: {
    enabled: boolean;
    path?: string;
    filename?: string;
    maxSize: string;
    maxFiles: number;
    rotateDaily?: boolean;
  };
  console?: {
    enabled: boolean;
    colorize: boolean;
    timestamp?: boolean;
  };
}

/**
 * Performance and optimization configuration
 */
export interface PerformanceConfig {
  cache?: CacheConfig;
  retry?: RetryConfig;
  requestDelay?: number;
  batchSize?: number;
  concurrentRequests?: number;
}

/**
 * MCP server specific configuration
 */
export interface MCPServerConfig {
  name: string;
  version: string;
  description?: string;
  capabilities: {
    tools: boolean;
    resources: boolean;
    prompts?: boolean;
  };
  tools?: {
    maxFields?: number;
    defaultPageSize?: number;
    maxPageSize?: number;
  };
  resources?: {
    cacheTtl?: number;
    enableFieldDefinitions?: boolean;
  };
}

/**
 * Main Jira Server configuration interface
 */
export interface JiraServerConfig {
  // Environment
  environment: Environment;

  // Basic Jira Server connection
  url: string;
  auth: AuthConfig;
  connection?: ConnectionConfig;

  // Optional features
  filter?: FilterConfig;
  logging?: LoggingConfig;
  performance?: PerformanceConfig;
  mcp?: MCPServerConfig;

  // Backwards compatibility
  personalToken: string;
  sslVerify: boolean;
  timeout: number;
  projectsFilter?: string[];
  logLevel: LogLevel;
  logFormat: string;
}

/**
 * Configuration validation and loading options
 */
export interface ConfigOptions {
  validateUrl?: boolean;
  validateToken?: boolean;
  allowInsecure?: boolean;
  environmentPrefix?: string;
  configFile?: string;
}

/**
 * Environment variable mapping
 */
export interface EnvironmentVariables {
  JIRA_URL: string;
  JIRA_PERSONAL_TOKEN: string;
  JIRA_SSL_VERIFY?: string;
  JIRA_TIMEOUT?: string;
  JIRA_PROJECTS_FILTER?: string;
  JIRA_LOG_LEVEL?: string;
  JIRA_LOG_FORMAT?: string;
  JIRA_ENVIRONMENT?: string;
  JIRA_MAX_RESULTS?: string;
  JIRA_CACHE_ENABLED?: string;
  JIRA_CACHE_TTL?: string;
  JIRA_RETRY_ENABLED?: string;
  JIRA_RETRY_MAX?: string;
  NODE_ENV?: string;
}

/**
 * Configuration loading result
 */
export interface ConfigLoadResult {
  config: JiraServerConfig;
  source: 'environment' | 'file' | 'defaults';
  warnings?: string[];
  errors?: string[];
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Partial<JiraServerConfig> = {
  environment: 'development',
  connection: {
    timeout: 30000,
    sslVerify: true,
    maxRedirects: 5,
    keepAlive: true,
    userAgent: 'jira-server-mcp/1.0.0',
  },
  logging: {
    level: 'info',
    format: 'simple',
    console: {
      enabled: true,
      colorize: true,
    },
  },
  performance: {
    cache: {
      enabled: true,
      ttl: 300, // 5 minutes
      strategy: 'lru',
    },
    retry: {
      enabled: true,
      maxRetries: 3,
      backoffMultiplier: 2,
      maxBackoffTime: 30000,
    },
    batchSize: 50,
    concurrentRequests: 5,
  },
  mcp: {
    name: 'jira-server-mcp',
    version: '1.0.0',
    capabilities: {
      tools: true,
      resources: true,
    },
    tools: {
      maxFields: 100,
      defaultPageSize: 50,
      maxPageSize: 1000,
    },
    resources: {
      cacheTtl: 300,
      enableFieldDefinitions: true,
    },
  },
  filter: {
    maxResultsLimit: 1000,
    defaultFields: [
      'summary',
      'status',
      'assignee',
      'reporter',
      'created',
      'updated',
    ],
  },
};
