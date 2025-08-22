/**
 * Configuration Management
 *
 * This module handles loading and validating configuration from environment variables.
 */

import { ZodError } from 'zod';
import { JiraServerConfigSchema } from './schema';
import {
  loadEnvironmentVariables,
  mergeWithDefaults,
  validateRequiredEnvironmentVariables,
  getConfigurationSummary,
} from './loader';
import { ValidationError } from '../types/common';
import type { JiraServerConfig } from '../types/config';

// Configuration cache
let configCache: JiraServerConfig | null = null;
let cacheTimestamp: number = 0;

/**
 * Cache TTL in milliseconds (5 minutes in development, 1 hour in production)
 */
const CACHE_TTL =
  process.env.NODE_ENV === 'development' ? 5 * 60 * 1000 : 60 * 60 * 1000;

/**
 * Load and validate configuration from environment variables
 */
export async function loadConfig(): Promise<JiraServerConfig> {
  // Return cached configuration if valid
  if (configCache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return configCache;
  }

  try {
    // Step 1: Validate required environment variables first
    validateRequiredEnvironmentVariables();

    // Step 2: Load environment variables
    const envConfig = loadEnvironmentVariables();

    // Step 3: Merge with environment-specific defaults
    const mergedConfig = mergeWithDefaults(envConfig);

    // Step 4: Validate final configuration with Zod
    const validatedConfig = JiraServerConfigSchema.parse(mergedConfig);

    // Step 5: Cache the validated configuration
    configCache = validatedConfig as JiraServerConfig;
    cacheTimestamp = Date.now();

    // Step 6: Log configuration summary (without sensitive data)
    if (process.env.NODE_ENV !== 'test') {
      // eslint-disable-next-line no-console
      console.log(
        'Configuration loaded successfully:',
        getConfigurationSummary(validatedConfig as JiraServerConfig)
      );
    }

    return validatedConfig as JiraServerConfig;
  } catch (error) {
    // Transform Zod errors to ValidationError
    if (error instanceof ZodError) {
      const constraints = error.issues.map(
        issue => `${issue.path.join('.')}: ${issue.message}`
      );

      throw new ValidationError({
        code: 'CONFIG_VALIDATION_ERROR',
        message: 'Configuration validation failed',
        type: 'validation_error',
        field: error.issues[0]?.path.join('.') || 'unknown',
        value:
          'value' in (error.issues[0] || {})
            ? (error.issues[0] as any).value
            : undefined,
        constraints,
        timestamp: new Date().toISOString(),
      });
    }

    // Re-throw ValidationError instances
    if (error instanceof ValidationError) {
      throw error;
    }

    // Wrap other errors
    throw new ValidationError({
      code: 'CONFIG_LOAD_ERROR',
      message: `Failed to load configuration: ${(error as Error).message}`,
      type: 'validation_error',
      constraints: ['Configuration loading failed'],
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Clear configuration cache
 * Useful for testing or when environment changes are detected
 */
export function clearConfigCache(): void {
  configCache = null;
  cacheTimestamp = 0;
}

/**
 * Get cached configuration without reloading
 * Returns null if no valid cache exists
 */
export function getCachedConfig(): JiraServerConfig | null {
  if (configCache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return configCache;
  }
  return null;
}

/**
 * Check if configuration is cached and valid
 */
export function isConfigCached(): boolean {
  return configCache !== null && Date.now() - cacheTimestamp < CACHE_TTL;
}

/**
 * Reload configuration, bypassing cache
 */
export async function reloadConfig(): Promise<JiraServerConfig> {
  clearConfigCache();
  return loadConfig();
}

/**
 * Validate configuration object without loading from environment
 * Useful for testing custom configuration objects
 */
export function validateConfig(config: unknown): JiraServerConfig {
  try {
    return JiraServerConfigSchema.parse(config) as JiraServerConfig;
  } catch (error) {
    if (error instanceof ZodError) {
      const constraints = error.issues.map(
        issue => `${issue.path.join('.')}: ${issue.message}`
      );

      throw new ValidationError({
        code: 'CONFIG_VALIDATION_ERROR',
        message: 'Configuration validation failed',
        type: 'validation_error',
        field: error.issues[0]?.path.join('.') || 'unknown',
        value:
          'value' in (error.issues[0] || {})
            ? (error.issues[0] as any).value
            : undefined,
        constraints,
        timestamp: new Date().toISOString(),
      });
    }
    throw error;
  }
}

// Export everything from sub-modules
export * from './schema';
export * from './loader';
export * from './defaults';
