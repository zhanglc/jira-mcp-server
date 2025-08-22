/**
 * MCP Resource Type Definitions
 *
 * Type definitions for MCP resources, including field definitions,
 * schema metadata, and resource content structures.
 */

import type { ResourceUriPattern, CacheControl } from './mcp';
import type { IsoDateString } from './common';

/**
 * Base Field Definition
 */
export interface FieldDefinition {
  type: string;
  description: string;
  required?: boolean;
  deprecated?: boolean;
  example?: any;
  format?: string;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  enum?: any[];
  items?: FieldDefinition;
  properties?: Record<string, FieldDefinition>;
  additionalProperties?: boolean | FieldDefinition;
}

/**
 * Nested Field Definition for dot notation support
 */
export interface NestedFieldDefinition extends FieldDefinition {
  path: string; // e.g., "assignee.displayName"
  parentField: string; // e.g., "assignee"
  nestedField: string; // e.g., "displayName"
  parentType?: string;
  jiraFieldPath?: string; // Actual Jira API field path
}

/**
 * Field Schema with metadata
 */
export interface FieldSchema {
  fields: Record<string, FieldDefinition>;
  nestedFields?: Record<string, NestedFieldDefinition>;
  metadata: {
    entityType:
      | 'issue'
      | 'project'
      | 'user'
      | 'board'
      | 'sprint'
      | 'worklog'
      | 'custom';
    version: string;
    lastUpdated: IsoDateString;
    source: 'jira-server' | 'configuration' | 'dynamic';
    serverVersion?: string;
    customFieldsIncluded: boolean;
    totalFields: number;
  };
  customFields?: Record<string, CustomFieldDefinition>;
  standardFields?: Record<string, FieldDefinition>;
}

/**
 * Custom Field Definition (Server/DC specific)
 */
export interface CustomFieldDefinition extends FieldDefinition {
  fieldId: string; // e.g., "customfield_10008"
  fieldName: string; // Human readable name
  fieldType: string; // Jira field type
  searcherKey?: string;
  contexts?: Array<{
    projectIds: string[];
    issueTypeIds: string[];
  }>;
  configuration?: Record<string, any>;
  screens?: string[];
  workflows?: string[];
  isGlobal: boolean;
  isLocked: boolean;
}

/**
 * Resource Metadata
 */
export interface ResourceMetadata {
  uri: ResourceUriPattern;
  name: string;
  description: string;
  version: string;
  lastModified: IsoDateString;
  size?: number;
  contentType: string;
  encoding?: string;
  checksum?: string;
  cacheControl?: CacheControl;
  permissions?: {
    read: string[];
    write?: string[];
  };
  dependencies?: ResourceUriPattern[];
  tags?: string[];
}

/**
 * Issue Field Definitions Resource
 */
export interface IssueFieldsResource {
  uri: 'jira://fields/issue';
  content: FieldSchema;
  includes: {
    coreFields: boolean;
    customFields: boolean;
    agileFields: boolean;
    timeTrackingFields: boolean;
    attachmentFields: boolean;
    commentFields: boolean;
    linkFields: boolean;
  };
}

/**
 * Project Field Definitions Resource
 */
export interface ProjectFieldsResource {
  uri: 'jira://fields/project';
  content: FieldSchema;
  includes: {
    basicInfo: boolean;
    components: boolean;
    versions: boolean;
    roles: boolean;
    permissions: boolean;
    configuration: boolean;
  };
}

/**
 * User Field Definitions Resource
 */
export interface UserFieldsResource {
  uri: 'jira://fields/user';
  content: FieldSchema;
  includes: {
    basicProfile: boolean;
    avatars: boolean;
    groups: boolean;
    permissions: boolean;
    preferences: boolean;
    activity: boolean;
  };
}

/**
 * Board Field Definitions Resource
 */
export interface BoardFieldsResource {
  uri: 'jira://fields/board';
  content: FieldSchema;
  includes: {
    basicInfo: boolean;
    configuration: boolean;
    location: boolean;
    permissions: boolean;
    statistics: boolean;
  };
}

/**
 * Sprint Field Definitions Resource
 */
export interface SprintFieldsResource {
  uri: 'jira://fields/sprint';
  content: FieldSchema;
  includes: {
    basicInfo: boolean;
    dates: boolean;
    goals: boolean;
    statistics: boolean;
    issues: boolean;
  };
}

/**
 * Worklog Field Definitions Resource
 */
export interface WorklogFieldsResource {
  uri: 'jira://fields/worklog';
  content: FieldSchema;
  includes: {
    basicInfo: boolean;
    timeTracking: boolean;
    visibility: boolean;
    properties: boolean;
  };
}

/**
 * Custom Field Definitions Resource
 */
export interface CustomFieldsResource {
  uri: 'jira://fields/custom';
  content: {
    fields: Record<string, CustomFieldDefinition>;
    metadata: {
      totalCustomFields: number;
      lastScanned: IsoDateString;
      serverVersion: string;
      includedProjects: string[];
      fieldTypes: string[];
    };
  };
}

/**
 * Resource Cache Entry
 */
export interface ResourceCacheEntry {
  uri: ResourceUriPattern;
  content: any;
  metadata: ResourceMetadata;
  cachedAt: IsoDateString;
  expiresAt?: IsoDateString;
  accessCount: number;
  lastAccessed: IsoDateString;
  etag?: string;
  validated: boolean;
}

/**
 * Resource Loading Configuration
 */
export interface ResourceLoadConfig {
  enableCaching: boolean;
  cacheTtl: number;
  validateOnAccess: boolean;
  refreshOnExpiry: boolean;
  includeMetadata: boolean;
  compression?: 'gzip' | 'deflate' | 'br';
  maxSize?: number;
}

/**
 * Resource Discovery Result
 */
export interface ResourceDiscovery {
  available: Array<{
    uri: ResourceUriPattern;
    name: string;
    description: string;
    available: boolean;
    lastChecked: IsoDateString;
    error?: string;
  }>;
  metadata: {
    serverVersion: string;
    discoveredAt: IsoDateString;
    totalResources: number;
    availableResources: number;
  };
}

/**
 * Field Selection Support Metadata
 */
export interface FieldSelectionSupport {
  entityType: string;
  supportsNestedFields: boolean;
  supportedNotations: ('dot' | 'bracket' | 'expand')[];
  maxDepth: number;
  reservedFields: string[];
  examples: Array<{
    description: string;
    fieldSelection: string[];
    expectedResult: Record<string, any>;
  }>;
}

/**
 * Resource Update Event
 */
export interface ResourceUpdateEvent {
  uri: ResourceUriPattern;
  type: 'created' | 'updated' | 'deleted' | 'invalidated';
  timestamp: IsoDateString;
  source: 'manual' | 'automatic' | 'configuration' | 'jira-server';
  changes?: Array<{
    field: string;
    oldValue?: any;
    newValue?: any;
  }>;
  affectedClients?: string[];
}

/**
 * Batch Resource Request
 */
export interface BatchResourceRequest {
  requests: Array<{
    id: string;
    uri: ResourceUriPattern;
    parameters?: Record<string, any>;
  }>;
  options?: {
    parallel: boolean;
    maxConcurrency?: number;
    timeout?: number;
    includeMetadata: boolean;
  };
}

/**
 * Batch Resource Response
 */
export interface BatchResourceResponse {
  responses: Array<{
    id: string;
    success: boolean;
    content?: any;
    metadata?: ResourceMetadata;
    error?: {
      code: string;
      message: string;
    };
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    executionTime: number;
  };
}

/**
 * Resource Validation Result
 */
export interface ResourceValidationResult {
  uri: ResourceUriPattern;
  valid: boolean;
  errors: Array<{
    field?: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  warnings: string[];
  metadata: {
    validatedAt: IsoDateString;
    schemaVersion: string;
    validatorVersion: string;
  };
}
