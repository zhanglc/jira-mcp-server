import { JiraResourceHandler } from './resource-handler.js';
import type { JiraClientWrapper } from '../../client/jira-client-wrapper.js';
import type {
  ResourceDefinition,
  FieldDefinition,
  EnhancedResourceDefinition,
} from '../../types/field-definition.js';
import { logger } from '../../utils/logger.js';

/**
 * HybridResourceHandler extends JiraResourceHandler with dynamic field discovery capabilities.
 *
 * This handler can operate in two modes:
 * 1. Static mode: Returns only predefined static field definitions (same as base class)
 * 2. Hybrid mode: Combines static definitions with dynamically discovered custom fields
 *
 * Key features:
 * - Environment-controlled dynamic field discovery
 * - Intelligent caching with configurable TTL and LRU eviction
 * - Race condition prevention with Promise caching
 * - Graceful fallback to static definitions on API errors with structured logging
 * - Real-time custom field detection with business names
 * - Input validation for cache keys and field IDs
 */
export class HybridResourceHandler extends JiraResourceHandler {
  private readonly jiraClient: JiraClientWrapper;
  private readonly enableDynamic: boolean;
  private readonly cacheTtl: number;
  private readonly cacheMaxSize: number;
  private customFieldsCache: Map<
    string,
    { data: FieldDefinition[]; timestamp: number; lastAccessed: number }
  > = new Map();
  private pendingRequests: Map<string, Promise<FieldDefinition[]>> = new Map();

  /**
   * Create a new HybridResourceHandler instance.
   *
   * @param jiraClient - JiraClientWrapper instance for API calls
   * @param enableDynamic - Whether to enable dynamic field discovery
   * @param cacheTtl - Cache TTL in seconds (default: 3600 = 1 hour)
   * @param cacheMaxSize - Maximum number of cache entries (default: 100)
   * @throws Error if jiraClient is null/undefined, cacheTtl is invalid, or cacheMaxSize is invalid
   */
  constructor(
    jiraClient: JiraClientWrapper,
    enableDynamic: boolean,
    cacheTtl: number = 3600,
    cacheMaxSize: number = 100
  ) {
    super();

    // Validate JiraClientWrapper
    if (!jiraClient) {
      throw new Error('JiraClientWrapper is required');
    }

    // Only validate methods when dynamic fields are enabled
    if (enableDynamic) {
      if (!('searchFields' in jiraClient)) {
        throw new Error('JiraClientWrapper must have searchFields method');
      }

      if (typeof jiraClient.searchFields !== 'function') {
        throw new Error('JiraClientWrapper.searchFields must be a function');
      }
    }

    // Validate cache configuration
    if (cacheTtl <= 0) {
      throw new Error('Cache TTL must be positive');
    }

    if (cacheMaxSize <= 0) {
      throw new Error('Cache size limit must be positive');
    }

    this.jiraClient = jiraClient;
    this.enableDynamic = enableDynamic;
    this.cacheTtl = cacheTtl;
    this.cacheMaxSize = cacheMaxSize;
  }

  /**
   * Override readResource to provide hybrid static-dynamic field definitions.
   *
   * In static mode: Returns only static field definitions (same as base class)
   * In hybrid mode: Combines static definitions with dynamically discovered fields
   *
   * @param uri - Resource URI (e.g., "jira://issue/fields")
   * @returns Resource content with field definitions
   */
  async readResource(
    uri: string
  ): Promise<{
    contents: Array<{ type: 'text'; text: string; mimeType: string }>;
  }> {
    // Validate URI input
    if (!uri) {
      throw new Error('Resource URI is required');
    }

    if (!this.isValidResourceUriFormat(uri)) {
      throw new Error(`Invalid resource URI format: ${uri}`);
    }

    // Get base static definition
    const baseResult = await super.readResource(uri);

    // If dynamic fields are disabled, return static definitions only
    if (!this.enableDynamic) {
      return baseResult;
    }

    try {
      // Parse the static definition
      if (!baseResult.contents?.[0]?.text) {
        throw new Error('Invalid base result format');
      }
      const staticDefinition: ResourceDefinition = JSON.parse(
        baseResult.contents[0].text
      );

      // Discover and fuse dynamic fields
      const dynamicFields = await this.discoverDynamicFields(
        staticDefinition.entityType
      );
      const enhancedDefinition = this.fuseFieldDefinitions(
        staticDefinition,
        dynamicFields
      );

      // Return enhanced definition
      return {
        contents: [
          {
            type: 'text',
            text: JSON.stringify(enhancedDefinition, null, 2),
            mimeType: 'application/json',
          },
        ],
      };
    } catch (error) {
      // Log error with structured context before fallback
      logger.error(
        'Failed to enhance resource with dynamic fields, falling back to static definitions',
        {
          uri,
          enableDynamic: this.enableDynamic,
          error,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
        }
      );

      // Gracefully fallback to static definitions
      return baseResult;
    }
  }

  /**
   * Discover dynamic custom fields from Jira API.
   * Uses intelligent caching with LRU eviction and race condition prevention.
   *
   * @param entityType - Entity type to discover fields for
   * @returns Array of dynamic field definitions
   */
  private async discoverDynamicFields(
    entityType: string
  ): Promise<FieldDefinition[]> {
    // Validate entity type
    if (!entityType || typeof entityType !== 'string') {
      logger.warn('Invalid entity type for dynamic field discovery', {
        entityType,
      });
      return [];
    }

    const cacheKey = this.buildCacheKey(entityType);
    const cached = this.customFieldsCache.get(cacheKey);
    const now = Date.now();

    // Update last accessed time and return cached data if still valid
    if (cached && now - cached.timestamp < this.cacheTtl * 1000) {
      // Update access time and move to end of Map (LRU)
      const cacheData = { ...cached, lastAccessed: now };
      this.customFieldsCache.delete(cacheKey);
      this.customFieldsCache.set(cacheKey, cacheData);
      
      logger.log('Cache hit for dynamic fields', {
        cacheKey,
        entityType,
        cacheAge: now - cached.timestamp,
      });
      return cached.data;
    }

    // Check if there's already a pending request for this entity type (race condition prevention)
    const pendingRequest = this.pendingRequests.get(cacheKey);
    if (pendingRequest) {
      logger.log('Waiting for existing API request to complete', {
        cacheKey,
        entityType,
      });
      return await pendingRequest;
    }

    // Create new request and cache it to prevent race conditions
    const requestPromise = this.fetchDynamicFieldsFromAPI(
      entityType,
      cacheKey,
      now
    );
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Clean up pending request
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Fetch dynamic fields from Jira API and handle caching.
   */
  private async fetchDynamicFieldsFromAPI(
    entityType: string,
    cacheKey: string,
    now: number
  ): Promise<FieldDefinition[]> {
    logger.log('Cache miss, fetching dynamic fields from API', {
      cacheKey,
      entityType,
    });

    try {
      // Call Jira API to get field information
      const fields = await this.jiraClient.searchFields();

      // Convert and validate Jira field data to FieldDefinition objects
      const dynamicFields: FieldDefinition[] = fields
        .filter(field => field.custom) // Only custom fields
        .map(field => this.convertJiraFieldToDefinition(field))
        .filter(field => field !== null) as FieldDefinition[]; // Remove invalid fields

      // Update cache with LRU management
      this.updateCacheWithLRU(cacheKey, dynamicFields, now);

      logger.log('Successfully discovered dynamic fields', {
        entityType,
        dynamicFieldCount: dynamicFields.length,
        cacheHit: false,
      });

      return dynamicFields;
    } catch (error) {
      // Log structured error information
      logger.error(
        'Failed to discover dynamic fields, falling back to static definitions',
        {
          entityType,
          enableDynamic: this.enableDynamic,
          error,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
        }
      );

      // Return empty array on error (graceful fallback)
      return [];
    }
  }

  /**
   * Fuse static and dynamic field definitions into a single enhanced definition.
   *
   * @param staticDefinition - Base static field definition
   * @param dynamicFields - Array of dynamic field definitions to merge
   * @returns Enhanced resource definition with both static and dynamic fields
   */
  private fuseFieldDefinitions(
    staticDefinition: ResourceDefinition,
    dynamicFields: FieldDefinition[]
  ): EnhancedResourceDefinition {
    // Validate inputs
    if (!staticDefinition || typeof staticDefinition !== 'object') {
      throw new Error('Invalid static definition provided for fusion');
    }

    if (!Array.isArray(dynamicFields)) {
      logger.warn('Invalid dynamic fields array, using empty array', {
        dynamicFields,
      });
      dynamicFields = [];
    }

    // Create enhanced definition with deep copy of static fields and path index
    const enhanced: EnhancedResourceDefinition = {
      ...staticDefinition,
      fields: { ...staticDefinition.fields },
      pathIndex: { ...staticDefinition.pathIndex },
      lastUpdated: new Date().toISOString(),
      dynamicFields: 0,
      lastDynamicUpdate: new Date().toISOString(),
    };

    let validDynamicFieldCount = 0;

    // Add dynamic fields with comprehensive validation and conflict handling
    for (const field of dynamicFields) {
      if (!this.isValidDynamicField(field)) {
        logger.warn('Skipping invalid field during fusion', { field });
        continue;
      }

      // Prevent overwriting static fields (static takes precedence)
      if (enhanced.fields[field.id]) {
        logger.warn('Dynamic field conflicts with static field, skipping', {
          fieldId: field.id,
          staticField: !!enhanced.fields[field.id],
        });
        continue;
      }

      // Add the dynamic field
      enhanced.fields[field.id] = field;
      validDynamicFieldCount++;

      // Build dynamic path index for this field
      const dynamicPaths = this.buildFieldPathIndex(field);

      // Add all access paths to the path index with validation
      for (const [path, fieldId] of Object.entries(dynamicPaths)) {
        if (path && path.trim().length > 0) {
          // Check for path conflicts and log warnings
          if (
            enhanced.pathIndex[path] &&
            enhanced.pathIndex[path] !== fieldId
          ) {
            logger.warn('Path conflict detected during fusion', {
              path,
              existingFieldId: enhanced.pathIndex[path],
              newFieldId: fieldId,
            });
          }
          enhanced.pathIndex[path] = fieldId;
        }
      }
    }

    // Update metadata
    enhanced.totalFields = Object.keys(enhanced.fields).length;
    enhanced.dynamicFields = validDynamicFieldCount;

    logger.log('Successfully fused field definitions', {
      staticFieldCount: Object.keys(staticDefinition.fields).length,
      dynamicFieldCount: validDynamicFieldCount,
      totalFieldCount: enhanced.totalFields,
      totalPaths: Object.keys(enhanced.pathIndex).length,
    });

    return enhanced;
  }

  /**
   * Validate if a dynamic field is valid for fusion.
   *
   * @param field - Field to validate
   * @returns True if field is valid, false otherwise
   */
  private isValidDynamicField(field: any): field is FieldDefinition {
    return (
      field &&
      typeof field === 'object' &&
      field.id &&
      typeof field.id === 'string' &&
      field.id.trim().length > 0 &&
      field.name &&
      typeof field.name === 'string'
    );
  }

  /**
   * Build path index for a single field.
   *
   * @param field - Field to build path index for
   * @returns Path index mapping for the field
   */
  private buildFieldPathIndex(field: FieldDefinition): Record<string, string> {
    const pathIndex: Record<string, string> = {};

    if (!field.accessPaths || !Array.isArray(field.accessPaths)) {
      return pathIndex;
    }

    for (const accessPath of field.accessPaths) {
      if (
        accessPath &&
        typeof accessPath === 'object' &&
        accessPath.path &&
        typeof accessPath.path === 'string' &&
        accessPath.path.trim().length > 0
      ) {
        pathIndex[accessPath.path] = field.id;
      }
    }

    return pathIndex;
  }

  /**
   * Build comprehensive path index for dynamic fields.
   * This method creates a lookup table for all access paths of dynamic fields.
   *
   * @param dynamicFields - Record of dynamic field definitions
   * @returns Path index mapping access paths to field IDs
   */
  private buildDynamicPathIndex(
    dynamicFields: Record<string, FieldDefinition>
  ): Record<string, string> {
    const pathIndex: Record<string, string> = {};

    for (const [fieldId, definition] of Object.entries(dynamicFields)) {
      if (!definition || !definition.accessPaths) {
        continue;
      }

      for (const accessPath of definition.accessPaths) {
        if (
          accessPath &&
          typeof accessPath === 'object' &&
          accessPath.path &&
          typeof accessPath.path === 'string' &&
          accessPath.path.trim().length > 0
        ) {
          pathIndex[accessPath.path] = fieldId;
        }
      }
    }

    return pathIndex;
  }

  /**
   * Convert a Jira field to our FieldDefinition format with validation.
   */
  private convertJiraFieldToDefinition(field: any): FieldDefinition | null {
    // Validate required field properties
    if (!this.isValidFieldId(field.id)) {
      logger.warn('Skipping invalid field definition', {
        field,
        reason: 'Invalid field ID',
      });
      return null;
    }

    if (!field.name || typeof field.name !== 'string') {
      logger.warn('Skipping invalid field definition', {
        field,
        reason: 'Invalid field name',
      });
      return null;
    }

    return {
      id: field.id,
      name: field.name,
      description: `Dynamic custom field: ${field.name}`,
      type: this.mapJiraTypeToFieldType(field.schema?.type ?? 'string'),
      accessPaths: [
        {
          path: field.id,
          description: `Access ${field.name} value`,
          type: this.mapJiraTypeToTSType(field.schema?.type ?? 'string'),
          frequency: 'medium' as const,
        },
      ],
      examples: [field.id],
      commonUsage: [[field.id]],
      source: 'dynamic' as const,
      confidence: 'high' as const,
    };
  }

  /**
   * Validate field ID format.
   */
  private isValidFieldId(fieldId: any): boolean {
    return (
      fieldId !== null &&
      fieldId !== undefined &&
      typeof fieldId === 'string' &&
      fieldId.trim().length > 0
    );
  }

  /**
   * Build a validated cache key.
   */
  private buildCacheKey(entityType: string): string {
    if (!entityType || typeof entityType !== 'string') {
      throw new Error('Invalid entity type for cache key');
    }
    return `${entityType.toLowerCase()}-fields`;
  }

  /**
   * Update cache with LRU eviction strategy.
   */
  private updateCacheWithLRU(
    cacheKey: string,
    data: FieldDefinition[],
    timestamp: number
  ): void {
    // Enforce cache size limit with LRU eviction
    if (this.customFieldsCache.size >= this.cacheMaxSize) {
      // Find the least recently used entry
      let oldestKey = '';
      let oldestTime = Infinity;

      for (const [key, entry] of this.customFieldsCache) {
        if (entry.lastAccessed < oldestTime) {
          oldestTime = entry.lastAccessed;
          oldestKey = key;
        }
      }

      if (oldestKey) {
        this.customFieldsCache.delete(oldestKey);
        logger.log('Evicted LRU cache entry', {
          evictedKey: oldestKey,
          cacheSize: this.customFieldsCache.size,
          maxSize: this.cacheMaxSize,
        });
      }
    }

    // Add new entry to cache
    this.customFieldsCache.set(cacheKey, {
      data,
      timestamp,
      lastAccessed: timestamp,
    });
  }

  /**
   * Map Jira field type to our field type classification.
   */
  private mapJiraTypeToFieldType(
    jiraType: string
  ): 'object' | 'string' | 'array' {
    if (!jiraType || typeof jiraType !== 'string') {
      return 'string';
    }

    switch (jiraType.toLowerCase()) {
      case 'array':
        return 'array';
      case 'object':
      case 'project':
      case 'user':
      case 'issuetype':
      case 'priority':
      case 'resolution':
      case 'status':
        return 'object';
      default:
        return 'string';
    }
  }

  /**
   * Map Jira field type to TypeScript type.
   */
  private mapJiraTypeToTSType(jiraType: string): string {
    if (!jiraType || typeof jiraType !== 'string') {
      return 'string';
    }

    switch (jiraType.toLowerCase()) {
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'array':
        return 'any[]';
      case 'object':
        return 'object';
      case 'date':
      case 'datetime':
        return 'string'; // ISO date string
      default:
        return 'string';
    }
  }

  /**
   * Check if a URI follows the valid resource URI pattern.
   * Renamed to avoid conflict with base class private method.
   */
  private isValidResourceUriFormat(uri: string): boolean {
    return /^jira:\/\/\w+\/\w+$/i.test(uri);
  }
}
