import * as dotenv from 'dotenv';
import { JiraConfig } from '../types/config-types.js';

dotenv.config();

/**
 * Validates the configuration for security and correctness
 * @param config The configuration to validate
 * @throws Error if configuration is invalid or insecure
 */
export function validateConfig(config: JiraConfig): void {
  // Validate URL
  if (!config.url || typeof config.url !== 'string') {
    throw new Error('Configuration validation failed: JIRA_URL is required and must be a string');
  }

  // Validate URL format and security
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(config.url);
  } catch (error) {
    throw new Error(`Configuration validation failed: JIRA_URL is not a valid URL: ${config.url}`);
  }

  // Enforce HTTPS for security (except localhost for development)
  if (parsedUrl.protocol !== 'https:' && !parsedUrl.hostname.includes('localhost') && parsedUrl.hostname !== '127.0.0.1') {
    throw new Error(`Configuration validation failed: JIRA_URL must use HTTPS for security. Got: ${parsedUrl.protocol}`);
  }

  // Validate hostname is not empty
  if (!parsedUrl.hostname) {
    throw new Error('Configuration validation failed: JIRA_URL must have a valid hostname');
  }

  // Validate authentication configuration
  const hasBearerToken = config.bearer && typeof config.bearer === 'string' && config.bearer.trim().length > 0;
  const hasBasicAuth = config.username && config.password && 
                      typeof config.username === 'string' && typeof config.password === 'string' &&
                      config.username.trim().length > 0 && config.password.trim().length > 0;

  if (!hasBearerToken && !hasBasicAuth) {
    throw new Error('Configuration validation failed: Either bearer token or username/password authentication must be provided');
  }

  // Security checks for bearer token
  if (hasBearerToken) {
    if (config.bearer!.length < 10) {
      throw new Error('Configuration validation failed: Bearer token appears to be too short (minimum 10 characters for security)');
    }
    
    // Check for obvious placeholder values
    const lowerToken = config.bearer!.toLowerCase();
    if (lowerToken.includes('your_token') || lowerToken.includes('replace_me') || lowerToken.includes('example')) {
      throw new Error('Configuration validation failed: Bearer token appears to be a placeholder value');
    }
  }

  // Security checks for basic auth
  if (hasBasicAuth) {
    if (config.password!.length < 8) {
      throw new Error('Configuration validation failed: Password appears to be too short (minimum 8 characters for security)');
    }

    // Check for obvious placeholder values in username/password
    const lowerUsername = config.username!.toLowerCase();
    const lowerPassword = config.password!.toLowerCase();
    
    if (lowerUsername.includes('your_username') || lowerUsername.includes('replace_me') || lowerUsername.includes('example')) {
      throw new Error('Configuration validation failed: Username appears to be a placeholder value');
    }
    
    if (lowerPassword.includes('your_password') || lowerPassword.includes('replace_me') || lowerPassword.includes('example') || lowerPassword === 'password') {
      throw new Error('Configuration validation failed: Password appears to be a placeholder or weak value');
    }
  }
}

export function loadConfig(): JiraConfig {
  const url = process.env.JIRA_URL;
  const bearer = process.env.JIRA_PERSONAL_TOKEN;
  const username = process.env.JIRA_USERNAME;
  const password = process.env.JIRA_PASSWORD;

  if (!url) {
    throw new Error('Missing required environment variable: JIRA_URL');
  }

  let config: JiraConfig;

  // 优先使用Bearer Token认证（基于任务1.1验证结果）
  if (bearer) {
    config = { url, bearer };
  } else if (username && password) {
    // 回退到Basic Auth
    config = { url, username, password };
  } else {
    throw new Error('Either JIRA_PERSONAL_TOKEN or both JIRA_USERNAME and JIRA_PASSWORD must be provided');
  }

  // Validate the configuration for security and correctness
  validateConfig(config);

  return config;
}