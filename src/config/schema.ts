/**
 * Configuration Schema Definitions
 *
 * Zod schemas for validating configuration objects.
 */

import { z } from 'zod';

// Type imports for schema validation - used for type definitions
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Environment, LogLevel } from '../types/common';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { LogFormat } from '../types/config';


// Environment enum schema
export const EnvironmentSchema = z.enum([
  'development',
  'test',
  'production',
] as const);

// Log level enum schema
export const LogLevelSchema = z.enum([
  'error',
  'warn',
  'info',
  'debug',
  'trace',
] as const);

// Log format enum schema
export const LogFormatSchema = z.enum([
  'simple',
  'json',
  'structured',
] as const);

// Authentication configuration schema
export const AuthConfigSchema = z.object({
  personalToken: z.string().min(1, 'Personal token cannot be empty'),
  tokenType: z.enum(['bearer', 'pat']).default('bearer'),
});

// Connection configuration schema
export const ConnectionConfigSchema = z
  .object({
    timeout: z.number().int().positive().default(30000),
    sslVerify: z.boolean().default(true),
    keepAlive: z.boolean().default(true),
    retryAttempts: z.number().int().min(0).max(5).default(3),
    retryDelay: z.number().int().positive().default(1000),
  })
  .optional();

// Console logging configuration schema
const ConsoleLoggingSchema = z.object({
  enabled: z.boolean().default(true),
  colorize: z.boolean().default(true),
  timestamp: z.boolean().default(true),
});

// File logging configuration schema
const FileLoggingSchema = z.object({
  enabled: z.boolean().default(false),
  filename: z.string().optional(),
  maxSize: z.string().default('10m'),
  maxFiles: z.number().int().positive().default(5),
  rotateDaily: z.boolean().default(true),
});

// Logging configuration schema
export const LoggingConfigSchema = z
  .object({
    level: LogLevelSchema.default('info'),
    format: LogFormatSchema.default('simple'),
    console: ConsoleLoggingSchema.default({}),
    file: FileLoggingSchema.optional(),
  })
  .optional();

// MCP server capabilities schema
const MCPCapabilitiesSchema = z.object({
  tools: z.boolean().default(true),
  resources: z.boolean().default(true),
  prompts: z.boolean().default(false),
});

// MCP server configuration schema
export const MCPServerConfigSchema = z
  .object({
    name: z.string().default('jira-server-mcp'),
    version: z.string().default('1.0.0'),
    description: z.string().default('Jira Server/Data Center MCP Server'),
    capabilities: MCPCapabilitiesSchema.default({}),
  })
  .optional();

// Custom URL validation for HTTP/HTTPS only
const httpUrlSchema = z
  .string()
  .url('Invalid URL format')
  .refine(url => url.startsWith('http://') || url.startsWith('https://'), {
    message: 'URL must be HTTP or HTTPS',
  });

// Main Jira Server configuration schema
export const JiraServerConfigSchema = z
  .object({
    // Core required fields
    environment: EnvironmentSchema,
    url: httpUrlSchema,
    auth: AuthConfigSchema,

    // Optional configuration sections
    connection: ConnectionConfigSchema,
    logging: LoggingConfigSchema,
    mcp: MCPServerConfigSchema,

    // Backwards compatibility fields (flat structure)
    personalToken: z.string().min(1, 'Personal token cannot be empty'),
    sslVerify: z.boolean().default(true),
    timeout: z.number().int().positive().default(30000),
    logLevel: LogLevelSchema.default('info'),
    logFormat: LogFormatSchema.default('simple'),
  })
  .refine(
    data => {
      // Ensure auth.personalToken matches personalToken for backwards compatibility
      return data.auth.personalToken === data.personalToken;
    },
    {
      message:
        'Authentication token mismatch between auth.personalToken and personalToken',
      path: ['auth', 'personalToken'],
    }
  );

// Environment variable raw input schema (before transformation)
export const EnvironmentInputSchema = z.object({
  // Core settings
  JIRA_URL: z.string().optional(),
  JIRA_PERSONAL_TOKEN: z.string().optional(),
  NODE_ENV: z.string().optional(),

  // Connection settings
  JIRA_SSL_VERIFY: z.string().optional(),
  JIRA_TIMEOUT: z.string().optional(),
  JIRA_KEEP_ALIVE: z.string().optional(),
  JIRA_RETRY_ATTEMPTS: z.string().optional(),
  JIRA_RETRY_DELAY: z.string().optional(),

  // Logging settings
  LOG_LEVEL: z.string().optional(),
  LOG_FORMAT: z.string().optional(),
  LOG_CONSOLE_ENABLED: z.string().optional(),
  LOG_CONSOLE_COLORIZE: z.string().optional(),
  LOG_FILE_ENABLED: z.string().optional(),
  LOG_FILE_FILENAME: z.string().optional(),

  // MCP settings
  MCP_SERVER_NAME: z.string().optional(),
  MCP_SERVER_VERSION: z.string().optional(),
  MCP_SERVER_DESCRIPTION: z.string().optional(),
});

// Type exports for TypeScript
export type EnvironmentInput = z.infer<typeof EnvironmentInputSchema>;
export type ValidatedJiraServerConfig = z.infer<typeof JiraServerConfigSchema>;
