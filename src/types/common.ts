/**
 * Common Type Definitions
 * 
 * Shared utility types and common interfaces used throughout the application.
 */

/**
 * Utility type for making all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Utility type requiring at least one property from the given keys
 */
export type RequireOne<T, K extends keyof T> = T & {
  [P in K]-?: Required<Pick<T, P>> & Partial<Pick<T, Exclude<K, P>>>;
}[K];

/**
 * Make specific properties optional
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Common error types
 */
export interface BaseError {
  code: string;
  message: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface JiraError extends BaseError {
  type: 'jira_api_error';
  statusCode?: number;
  errorMessages?: string[];
  errors?: Record<string, string>;
}

export interface MCPError extends BaseError {
  type: 'mcp_error';
  toolName?: string;
  resourceUri?: string;
}

// ValidationError interface replaced by class below

export interface AuthenticationError extends BaseError {
  type: 'authentication_error';
  authMethod?: string;
}

export interface NetworkError extends BaseError {
  type: 'network_error';
  url?: string;
  statusCode?: number;
  retryable?: boolean;
}

/**
 * Error Classes
 */
export class ValidationError extends Error {
  public readonly code: string;
  public readonly type: 'validation_error' = 'validation_error';
  public readonly timestamp: string;
  public readonly field?: string | undefined;
  public readonly value?: unknown;
  public readonly constraints?: string[] | undefined;

  constructor(data: {
    code: string;
    message: string;
    type: 'validation_error';
    field?: string;
    value?: unknown;
    constraints?: string[];
    timestamp: string;
  }) {
    super(data.message);
    this.name = 'ValidationError';
    this.code = data.code;
    this.timestamp = data.timestamp;
    this.field = data.field;
    this.value = data.value;
    this.constraints = data.constraints;
  }
}

/**
 * Common status types
 */
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

export type IssueStatusCategory = 'new' | 'indeterminate' | 'done';

/**
 * Pagination and filtering
 */
export interface PaginationOptions {
  startAt?: number;
  maxResults?: number;
  total?: number;
}

export interface SearchOptions extends PaginationOptions {
  fields?: string[];
  expand?: string[];
  orderBy?: string;
}

export interface FilterOptions {
  projectKeys?: string[];
  issueTypes?: string[];
  statuses?: string[];
  assignees?: string[];
  reporters?: string[];
  labels?: string[];
  components?: string[];
  fixVersions?: string[];
  createdAfter?: string;
  createdBefore?: string;
  updatedAfter?: string;
  updatedBefore?: string;
}

/**
 * Date and time utilities
 */
export type IsoDateString = string; // ISO 8601 format
export type UnixTimestamp = number;

/**
 * Field selection types for dot notation support
 */
export type FieldPath<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? K | `${K}.${FieldPath<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

export type FieldSelection<T> = FieldPath<T>[];

/**
 * Generic response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: BaseError;
  meta?: {
    timestamp: string;
    requestId?: string;
    version?: string;
  };
}

/**
 * Search result wrapper with pagination
 */
export interface SearchResult<T> {
  issues?: T[];
  items?: T[];
  values?: T[];
  expand?: string;
  startAt: number;
  maxResults: number;
  total: number;
  isLast?: boolean;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in seconds
  maxSize?: number;
  strategy?: 'lru' | 'lfu' | 'fifo';
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  enabled: boolean;
  maxRetries: number;
  backoffMultiplier: number;
  maxBackoffTime: number;
  retryableErrors?: string[];
}

/**
 * Logging levels
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';

/**
 * Environment types
 */
export type Environment = 'development' | 'production' | 'test';
