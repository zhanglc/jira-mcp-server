/**
 * Configuration Loader
 *
 * Environment variable loading and processing.
 */

import { config as loadDotenv } from 'dotenv';
import { EnvironmentInputSchema, type EnvironmentInput } from './schema';
import { getEnvironmentDefaults } from './defaults';
import { ValidationError } from '../types/common';
import type { JiraServerConfig } from '../types/config';

/**
 * Environment variable to configuration mapping
 */
const ENV_MAPPING = {
  // Core settings
  JIRA_URL: 'url',
  JIRA_PERSONAL_TOKEN: 'personalToken',
  NODE_ENV: 'environment',

  // Connection settings
  JIRA_SSL_VERIFY: 'sslVerify',
  JIRA_TIMEOUT: 'timeout',
  JIRA_KEEP_ALIVE: 'connection.keepAlive',
  JIRA_RETRY_ATTEMPTS: 'connection.retryAttempts',
  JIRA_RETRY_DELAY: 'connection.retryDelay',

  // Logging settings
  LOG_LEVEL: 'logLevel',
  LOG_FORMAT: 'logFormat',
  LOG_CONSOLE_ENABLED: 'logging.console.enabled',
  LOG_CONSOLE_COLORIZE: 'logging.console.colorize',
  LOG_FILE_ENABLED: 'logging.file.enabled',
  LOG_FILE_FILENAME: 'logging.file.filename',

  // MCP settings
  MCP_SERVER_NAME: 'mcp.name',
  MCP_SERVER_VERSION: 'mcp.version',
  MCP_SERVER_DESCRIPTION: 'mcp.description'
} as const;

/**
 * Convert string values to appropriate types
 */
function convertValue(value: string, path: string): unknown {
  // Boolean conversion
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  
  // Number conversion for specific paths
  if (path.includes('timeout') || path.includes('retryAttempts') || path.includes('retryDelay')) {
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      throw new ValidationError({
        code: 'INVALID_NUMBER',
        message: `Invalid number value for ${path}: ${value}`,
        type: 'validation_error',
        field: path,
        value,
        constraints: ['must be a valid number'],
        timestamp: new Date().toISOString()
      });
    }
    return num;
  }
  
  // String value (default)
  return value;
}

/**
 * Set nested property in object using dot notation
 */
function setNestedProperty(obj: any, path: string, value: unknown): void {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!key) continue;
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  const lastKey = keys[keys.length - 1];
  if (lastKey) {
    current[lastKey] = value;
  }
}

/**
 * Load and validate environment variables
 */
export function loadEnvironmentVariables(): Partial<JiraServerConfig> {
  // Load .env files
  loadDotenv();
  
  // Validate environment variable structure
  const envInput = EnvironmentInputSchema.parse(process.env);
  
  const config: Partial<JiraServerConfig> = {};
  
  // Map environment variables to configuration object
  for (const [envVar, configPath] of Object.entries(ENV_MAPPING)) {
    const value = envInput[envVar as keyof EnvironmentInput];
    if (value !== undefined && value !== '' && value.trim() !== '') {
      try {
        const convertedValue = convertValue(value, configPath);
        setNestedProperty(config, configPath, convertedValue);
      } catch (error) {
        if (error instanceof ValidationError) {
          throw error;
        }
        throw new ValidationError({
          code: 'ENV_CONVERSION_ERROR',
          message: `Failed to convert environment variable ${envVar}: ${(error as Error).message}`,
          type: 'validation_error',
          field: envVar,
          value,
          constraints: ['valid format required'],
          timestamp: new Date().toISOString()
        });
      }
    }
  }
  
  // Set up authentication structure if personalToken is provided
  if (config.personalToken) {
    config.auth = {
      personalToken: config.personalToken,
      tokenType: 'bearer'
    };
  }
  
  return config;
}

/**
 * Merge configuration with environment-specific defaults
 */
export function mergeWithDefaults(
  envConfig: Partial<JiraServerConfig>
): Partial<JiraServerConfig> {
  const environment = envConfig.environment || 'development';
  const envDefaults = getEnvironmentDefaults(environment);
  
  // Deep merge function
  function deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(target[key] || {}, source[key]);
      } else if (source[key] !== undefined) {
        result[key] = source[key];
      }
    }
    
    return result;
  }
  
  return deepMerge(envDefaults, envConfig);
}

/**
 * Validate required environment variables
 */
export function validateRequiredEnvironmentVariables(): void {
  const required = ['JIRA_URL', 'JIRA_PERSONAL_TOKEN'];
  const missing: string[] = [];
  
  for (const envVar of required) {
    if (!process.env[envVar] || process.env[envVar]?.trim() === '') {
      missing.push(envVar);
    }
  }
  
  if (missing.length > 0) {
    throw new ValidationError({
      code: 'MISSING_REQUIRED_ENV',
      message: `Missing required environment variables: ${missing.join(', ')}`,
      type: 'validation_error',
      field: missing.join(', '),
      constraints: missing.map(var_ => `${var_} is required`),
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get configuration summary for logging (without sensitive data)
 */
export function getConfigurationSummary(config: Partial<JiraServerConfig>): object {
  return {
    environment: config.environment,
    url: config.url ? '[CONFIGURED]' : '[NOT SET]',
    personalToken: config.personalToken ? '[CONFIGURED]' : '[NOT SET]',
    sslVerify: config.sslVerify,
    timeout: config.timeout,
    logLevel: config.logLevel,
    logFormat: config.logFormat,
    mcpServerName: config.mcp?.name,
    connectionConfig: config.connection ? '[CONFIGURED]' : '[DEFAULT]',
    loggingConfig: config.logging ? '[CONFIGURED]' : '[DEFAULT]'
  };
}
