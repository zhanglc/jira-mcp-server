/**
 * MCP Protocol Type Definitions
 * 
 * Type definitions for MCP (Model Context Protocol) specific functionality,
 * including tools, resources, and server extensions.
 */

import type { Tool, Resource } from '@modelcontextprotocol/sdk/types.js';
import type { JiraServerConfig } from './config';
import type { BaseError } from './common';

/**
 * MCP Tool Input Schema Types
 */
export interface ToolInputSchema {
  [x: string]: unknown;
  type: 'object';
  properties?: Record<string, {
    type: string;
    description: string;
    enum?: string[];
    items?: { type: string };
    default?: any;
    pattern?: string;
    minimum?: number;
    maximum?: number;
  }>;
  required?: string[];
  additionalProperties?: boolean;
}

/**
 * MCP Tool Handler Context
 */
export interface MCPToolContext {
  config: JiraServerConfig;
  requestId?: string;
  clientInfo?: {
    name: string;
    version: string;
  };
  timestamp: string;
}

/**
 * MCP Tool Handler Function
 */
export type MCPToolHandler = (
  args: Record<string, any>,
  context: MCPToolContext
) => Promise<string>;

/**
 * Extended MCP Tool Definition
 */
export interface JiraMCPTool extends Tool {
  name: string;
  description: string;
  inputSchema: ToolInputSchema;
  handler: MCPToolHandler;
  category: 'issue' | 'search' | 'project' | 'user' | 'agile' | 'operation';
  examples?: Array<{
    name: string;
    description: string;
    arguments: Record<string, any>;
  }>;
  permissions?: string[];
  rateLimits?: {
    requestsPerMinute?: number;
    requestsPerHour?: number;
  };
}

/**
 * MCP Resource Content Types
 */
export interface ResourceContent {
  uri: string;
  mimeType?: string;
  text?: string;
  blob?: Uint8Array;
}

/**
 * MCP Resource Handler Context
 */
export interface MCPResourceContext {
  config: JiraServerConfig;
  requestId?: string;
  clientInfo?: {
    name: string;
    version: string;
  };
  timestamp: string;
}

/**
 * MCP Resource Handler Function
 */
export type MCPResourceHandler = (
  uri: string,
  context: MCPResourceContext
) => Promise<ResourceContent>;

/**
 * Extended MCP Resource Definition
 */
export interface JiraMCPResource extends Resource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  handler: MCPResourceHandler;
  category: 'field-definition' | 'schema' | 'documentation';
  cacheable?: boolean;
  cacheTtl?: number;
  permissions?: string[];
}

/**
 * Field Definition Resource Content
 */
export interface FieldDefinitionContent {
  fields: Record<string, {
    type: string;
    description: string;
    required?: boolean;
    example?: any;
    nested?: Record<string, {
      type: string;
      description: string;
    }>;
  }>;
  metadata: {
    entityType: string;
    lastUpdated: string;
    version: string;
    source: 'jira-server' | 'configuration';
  };
}

/**
 * Resource URI Patterns
 */
export type ResourceUriPattern = 
  | 'jira://fields/issue'
  | 'jira://fields/project'
  | 'jira://fields/user'
  | 'jira://fields/board'
  | 'jira://fields/sprint'
  | 'jira://fields/worklog'
  | 'jira://fields/custom'
  | 'jira://schema/search'
  | 'jira://docs/api';

/**
 * Tool Arguments for Issue Operations
 */
export interface IssueToolArgs {
  issueKey: string;
  fields?: string[];
  expand?: string[];
}

export interface SearchToolArgs {
  jql?: string;
  fields?: string[];
  maxResults?: number;
  startAt?: number;
  orderBy?: string;
}

export interface ProjectToolArgs {
  projectKey?: string;
  includeArchived?: boolean;
  fields?: string[];
}

export interface UserToolArgs {
  username?: string;
  accountId?: string; // For compatibility, but Server/DC uses username
  fields?: string[];
}

export interface AgileToolArgs {
  boardId?: string;
  sprintId?: string;
  state?: 'active' | 'closed' | 'future';
  fields?: string[];
  maxResults?: number;
  startAt?: number;
}

export interface AttachmentToolArgs {
  issueKey: string;
  targetDir: string;
  attachmentIds?: string[];
}

/**
 * Tool Response Formats
 */
export interface ToolResponse<T = any> {
  success: boolean;
  data?: T;
  error?: BaseError;
  meta?: {
    requestId?: string;
    timestamp: string;
    executionTime?: number;
    cacheHit?: boolean;
  };
}

/**
 * MCP Server Configuration
 */
export interface MCPServerInfo {
  name: string;
  version: string;
  description?: string;
  author?: string;
  license?: string;
  homepage?: string;
  capabilities: {
    tools: {
      listChanged?: boolean;
    };
    resources: {
      subscribe?: boolean;
      listChanged?: boolean;
    };
    prompts?: {
      listChanged?: boolean;
    };
  };
}

/**
 * Tool Registration Info
 */
export interface ToolRegistration {
  tool: JiraMCPTool;
  enabled: boolean;
  metadata: {
    registeredAt: string;
    lastUsed?: string;
    usageCount: number;
    averageExecutionTime?: number;
  };
}

/**
 * Resource Registration Info
 */
export interface ResourceRegistration {
  resource: JiraMCPResource;
  enabled: boolean;
  metadata: {
    registeredAt: string;
    lastAccessed?: string;
    accessCount: number;
    cacheHits?: number;
    cacheMisses?: number;
  };
}

/**
 * Server State
 */
export interface MCPServerState {
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  startedAt?: string;
  tools: Map<string, ToolRegistration>;
  resources: Map<string, ResourceRegistration>;
  config: JiraServerConfig;
  stats: {
    totalRequests: number;
    totalErrors: number;
    uptime: number;
    averageResponseTime: number;
  };
}

/**
 * Error Types for MCP Operations
 */
export interface MCPToolError extends BaseError {
  type: 'mcp_tool_error';
  toolName: string;
  arguments?: Record<string, any>;
}

export interface MCPResourceError extends BaseError {
  type: 'mcp_resource_error';
  resourceUri: string;
}

export interface MCPValidationError extends BaseError {
  type: 'mcp_validation_error';
  field: string;
  value: any;
  schema?: any;
}

/**
 * Field Selection Support
 */
export interface FieldSelectionMeta {
  requestedFields: string[];
  availableFields: string[];
  resolvedFields: string[];
  skippedFields: string[];
  nestedFieldsSupported: boolean;
}

/**
 * Batch Operation Support
 */
export interface BatchOperation<T> {
  operations: Array<{
    id: string;
    type: string;
    arguments: Record<string, any>;
  }>;
  results: Array<{
    id: string;
    success: boolean;
    data?: T;
    error?: BaseError;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    executionTime: number;
  };
}

/**
 * Pagination Support for MCP Responses
 */
export interface MCPPaginatedResponse<T> {
  data: T[];
  pagination: {
    startAt: number;
    maxResults: number;
    total: number;
    isLast: boolean;
    nextStartAt?: number;
  };
  links?: {
    self?: string;
    next?: string;
    prev?: string;
  };
}

/**
 * Cache Control for Resources
 */
export interface CacheControl {
  maxAge?: number;
  mustRevalidate?: boolean;
  noCache?: boolean;
  noStore?: boolean;
  private?: boolean;
  public?: boolean;
  etag?: string;
  lastModified?: string;
}
