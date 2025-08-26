import * as dotenv from 'dotenv';
import { 
  JiraConfig, 
  HybridConfig, 
  HybridConfigSchema, 
  DEFAULT_HYBRID_CONFIG,
  ValidatedHybridConfig
} from '../types/config-types.js';

dotenv.config();

/**
 * Validates the configuration for security and correctness
 * @param config The configuration to validate
 * @throws Error if configuration is invalid or insecure
 */
export function validateConfig(config: JiraConfig | HybridConfig): void {
  // Use Zod schema validation for HybridConfig
  if ('enableDynamicFields' in config) {
    try {
      HybridConfigSchema.parse(config);
      return; // Zod validation passed, skip legacy validation
    } catch (error: any) {
      if (error.errors && error.errors.length > 0) {
        const firstError = error.errors[0];
        throw new Error(`Configuration validation failed: ${firstError.message}`);
      }
      throw new Error(`Configuration validation failed: ${error.message}`);
    }
  }
  
  // Legacy validation for basic JiraConfig
  // Validate URL
  if (!config.url || typeof config.url !== 'string') {
    throw new Error(
      'Configuration validation failed: JIRA_URL is required and must be a string'
    );
  }

  // Validate URL format and security
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(config.url);
  } catch (error) {
    throw new Error(
      `Configuration validation failed: JIRA_URL is not a valid URL: ${config.url}`
    );
  }

  // Enforce HTTPS for security (except localhost for development)
  if (
    parsedUrl.protocol !== 'https:' &&
    !parsedUrl.hostname.includes('localhost') &&
    parsedUrl.hostname !== '127.0.0.1'
  ) {
    throw new Error(
      `Configuration validation failed: JIRA_URL must use HTTPS for security. Got: ${parsedUrl.protocol}`
    );
  }

  // Validate hostname is not empty
  if (!parsedUrl.hostname) {
    throw new Error(
      'Configuration validation failed: JIRA_URL must have a valid hostname'
    );
  }

  // Validate authentication configuration
  const hasBearerToken =
    config.bearer &&
    typeof config.bearer === 'string' &&
    config.bearer.trim().length > 0;
  const hasBasicAuth =
    config.username &&
    config.password &&
    typeof config.username === 'string' &&
    typeof config.password === 'string' &&
    config.username.trim().length > 0 &&
    config.password.trim().length > 0;

  if (!hasBearerToken && !hasBasicAuth) {
    throw new Error(
      'Configuration validation failed: Either bearer token or username/password authentication must be provided'
    );
  }

  // Security checks for bearer token
  if (hasBearerToken) {
    if (config.bearer!.length < 10) {
      throw new Error(
        'Configuration validation failed: Bearer token appears to be too short (minimum 10 characters for security)'
      );
    }

    // Check for obvious placeholder values
    const lowerToken = config.bearer!.toLowerCase();
    if (
      lowerToken.includes('your_token') ||
      lowerToken.includes('replace_me') ||
      lowerToken.includes('example')
    ) {
      throw new Error(
        'Configuration validation failed: Bearer token appears to be a placeholder value'
      );
    }
  }

  // Security checks for basic auth
  if (hasBasicAuth) {
    if (config.password!.length < 8) {
      throw new Error(
        'Configuration validation failed: Password appears to be too short (minimum 8 characters for security)'
      );
    }

    // Check for obvious placeholder values in username/password
    const lowerUsername = config.username!.toLowerCase();
    const lowerPassword = config.password!.toLowerCase();

    if (
      lowerUsername.includes('your_username') ||
      lowerUsername.includes('replace_me') ||
      lowerUsername.includes('example')
    ) {
      throw new Error(
        'Configuration validation failed: Username appears to be a placeholder value'
      );
    }

    if (
      lowerPassword.includes('your_password') ||
      lowerPassword.includes('replace_me') ||
      lowerPassword.includes('example') ||
      lowerPassword === 'password'
    ) {
      throw new Error(
        'Configuration validation failed: Password appears to be a placeholder or weak value'
      );
    }
  }
}

/**
 * Parse boolean environment variable with multiple accepted formats
 * @param value Environment variable value
 * @param defaultValue Default value if undefined or empty
 * @returns Boolean value
 */
function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (!value || value.trim() === '') {
    return defaultValue;
  }
  
  const lowerValue = value.toLowerCase().trim();
  return lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes';
}

/**
 * Parse numeric environment variable with validation
 * @param value Environment variable value
 * @param defaultValue Default value if undefined or empty
 * @param variableName Name of the environment variable for error messages
 * @returns Numeric value
 */
function parseNumber(value: string | undefined, defaultValue: number, variableName: string): number {
  if (!value || value.trim() === '') {
    return defaultValue;
  }
  
  const numValue = parseInt(value.trim(), 10);
  if (isNaN(numValue)) {
    throw new Error(`Invalid numeric value for environment variable ${variableName}: ${value}`);
  }
  
  return numValue;
}

/**
 * Parse comma-separated list with whitespace trimming
 * @param value Environment variable value
 * @param defaultValue Default value if undefined or empty
 * @returns Array of strings
 */
function parseStringArray(value: string | undefined, defaultValue: string[]): string[] {
  if (!value || value.trim() === '') {
    return defaultValue;
  }
  
  return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
}

/**
 * Load configuration from environment variables (legacy JiraConfig only)
 * @deprecated Use loadHybridConfig() for new features
 */
export function loadConfig(): JiraConfig {
  const hybridConfig = loadHybridConfig();
  
  // Return only JiraConfig properties for backward compatibility
  const jiraConfig: JiraConfig = {
    url: hybridConfig.url,
    ...(hybridConfig.username && hybridConfig.password 
      ? { username: hybridConfig.username, password: hybridConfig.password }
      : {}),
    ...(hybridConfig.bearer ? { bearer: hybridConfig.bearer } : {})
  };
  
  return jiraConfig;
}

/**
 * Load hybrid configuration from environment variables with full feature support
 * @returns Validated hybrid configuration
 */
export function loadHybridConfig(): ValidatedHybridConfig {
  // Load required environment variables
  const url = process.env.JIRA_URL;
  const bearer = process.env.JIRA_PERSONAL_TOKEN;
  const username = process.env.JIRA_USERNAME;
  const password = process.env.JIRA_PASSWORD;

  if (!url) {
    throw new Error('Missing required environment variable: JIRA_URL');
  }

  if (!bearer && (!username || !password)) {
    throw new Error(
      'Either JIRA_PERSONAL_TOKEN or both JIRA_USERNAME and JIRA_PASSWORD must be provided'
    );
  }

  // Build configuration object with proper typing
  const configData = {
    // Core Jira authentication
    url,
    ...(bearer ? { bearer } : {}),
    ...(username && password ? { username, password } : {}),
    
    // Hybrid field configuration
    enableDynamicFields: parseBoolean(
      process.env.ENABLE_DYNAMIC_FIELDS, 
      DEFAULT_HYBRID_CONFIG.enableDynamicFields
    ),
    dynamicFieldCacheTtl: parseNumber(
      process.env.DYNAMIC_FIELD_CACHE_TTL, 
      DEFAULT_HYBRID_CONFIG.dynamicFieldCacheTtl,
      'DYNAMIC_FIELD_CACHE_TTL'
    ),
    dynamicFieldAnalysis: parseBoolean(
      process.env.DYNAMIC_FIELD_ANALYSIS, 
      DEFAULT_HYBRID_CONFIG.dynamicFieldAnalysis
    ),
    fieldAnalysisSampleSize: parseNumber(
      process.env.FIELD_ANALYSIS_SAMPLE_SIZE, 
      DEFAULT_HYBRID_CONFIG.fieldAnalysisSampleSize,
      'FIELD_ANALYSIS_SAMPLE_SIZE'
    ),
    
    // Additional Jira configuration
    sslVerify: parseBoolean(
      process.env.JIRA_SSL_VERIFY, 
      DEFAULT_HYBRID_CONFIG.sslVerify
    ),
    timeout: parseNumber(
      process.env.JIRA_TIMEOUT, 
      DEFAULT_HYBRID_CONFIG.timeout,
      'JIRA_TIMEOUT'
    ),
    projectsFilter: parseStringArray(
      process.env.JIRA_PROJECTS_FILTER, 
      DEFAULT_HYBRID_CONFIG.projectsFilter
    )
  };

  // Additional validation for cache TTL range
  if (configData.dynamicFieldCacheTtl < 60 || configData.dynamicFieldCacheTtl > 86400) {
    throw new Error('Cache TTL must be between 60 and 86400 seconds (1 minute to 24 hours)');
  }

  // Additional validation for field analysis sample size
  if (configData.fieldAnalysisSampleSize < 1 || configData.fieldAnalysisSampleSize > 100) {
    throw new Error('Field analysis sample size must be between 1 and 100');
  }

  // Validate the configuration using Zod schema
  const validatedConfig = HybridConfigSchema.parse(configData);

  return validatedConfig;
}

// Export default config instances for convenience
export const config = loadConfig(); // Legacy JiraConfig for backward compatibility
export const hybridConfig = loadHybridConfig(); // Full HybridConfig with all features
