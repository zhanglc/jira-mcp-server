import { z } from 'zod';

export interface JiraConfig {
  url: string;
  username?: string;
  password?: string;
  bearer?: string;
}

/**
 * Extended configuration interface that includes hybrid field capabilities
 * and feature toggles for dynamic field discovery
 */
export interface HybridConfig extends JiraConfig {
  // Core Jira authentication (inherited from JiraConfig)
  url: string;
  username?: string;
  password?: string;
  bearer?: string;

  // Hybrid field configuration
  enableDynamicFields: boolean;
  dynamicFieldCacheTtl: number; // In seconds
  dynamicFieldAnalysis: boolean;
  fieldAnalysisSampleSize: number;

  // Additional Jira configuration
  sslVerify: boolean;
  timeout: number; // In milliseconds
  projectsFilter: string[];

  // Helper methods for feature toggles
  isDynamicFieldsEnabled(): boolean;
  getCacheTtlMs(): number;
  isFieldAnalysisEnabled(): boolean;
}

/**
 * Zod schema for validating basic Jira configuration
 */
export const JiraConfigSchema = z.object({
  url: z.string().url('URL must be a valid URL'),
  username: z.string().optional(),
  password: z.string().optional(),
  bearer: z.string().optional()
}).refine(
  (data) => {
    const hasBearerToken = data.bearer && data.bearer.trim().length > 0;
    const hasBasicAuth = data.username && data.password && 
                        data.username.trim().length > 0 && 
                        data.password.trim().length > 0;
    return hasBearerToken || hasBasicAuth;
  },
  {
    message: 'Either bearer token or username/password authentication must be provided'
  }
);

/**
 * Zod schema for validating hybrid configuration with additional validation rules
 */
export const HybridConfigSchema = z.object({
  // Core Jira authentication (same as JiraConfigSchema)
  url: z.string().url('URL must be a valid URL'),
  username: z.string().optional(),
  password: z.string().optional(),
  bearer: z.string().optional(),
  
  // Hybrid field configuration
  enableDynamicFields: z.boolean(),
  dynamicFieldCacheTtl: z.number()
    .min(60, 'Cache TTL must be at least 60 seconds (1 minute)')
    .max(86400, 'Cache TTL must be at most 86400 seconds (24 hours)'),
  dynamicFieldAnalysis: z.boolean(),
  fieldAnalysisSampleSize: z.number()
    .min(1, 'Field analysis sample size must be at least 1')
    .max(100, 'Field analysis sample size must be at most 100'),
  
  // Additional Jira configuration
  sslVerify: z.boolean(),
  timeout: z.number()
    .min(1000, 'Timeout must be at least 1000ms (1 second)')
    .max(300000, 'Timeout must be at most 300000ms (5 minutes)'),
  projectsFilter: z.array(z.string())
}).refine(
  (data) => {
    const hasBearerToken = data.bearer && data.bearer.trim().length > 0;
    const hasBasicAuth = data.username && data.password && 
                        data.username.trim().length > 0 && 
                        data.password.trim().length > 0;
    return hasBearerToken || hasBasicAuth;
  },
  {
    message: 'Either bearer token or username/password authentication must be provided'
  }
).transform((data) => {
  // Add helper methods to the validated configuration object
  const config = data as any;
  
  config.isDynamicFieldsEnabled = function(): boolean {
    return this.enableDynamicFields;
  };
  
  config.getCacheTtlMs = function(): number {
    return this.dynamicFieldCacheTtl * 1000;
  };
  
  config.isFieldAnalysisEnabled = function(): boolean {
    return this.dynamicFieldAnalysis;
  };
  
  return config as HybridConfig;
});

/**
 * Type for the validated hybrid configuration
 */
export type ValidatedHybridConfig = z.infer<typeof HybridConfigSchema>;

/**
 * Default configuration values for hybrid features
 */
export const DEFAULT_HYBRID_CONFIG = {
  enableDynamicFields: false,
  dynamicFieldCacheTtl: 3600, // 1 hour
  dynamicFieldAnalysis: false,
  fieldAnalysisSampleSize: 5,
  sslVerify: true,
  timeout: 30000, // 30 seconds
  projectsFilter: [] as string[]
} as const;
