/**
 * @file field-filter.ts
 * @description Client-side field filtering utility for filtering response data
 * based on requested field paths with support for dot-notation nested access.
 * 
 * Provides efficient field filtering for APIs that don't support native fields
 * parameter, with comprehensive support for different entity types and nested
 * field access patterns.
 */

/**
 * Configuration options for field filtering
 */
export interface FieldFilterOptions {
  /** Entity type being filtered (used for logging and validation) */
  entityType: 'issue' | 'project' | 'user' | 'agile' | 'system';
  
  /** Whether to respect nested object structure when building result (default: true) */
  respectNesting?: boolean;
  
  /** Whether to log filtering operations for debugging (default: false) */
  logFiltering?: boolean;
}

/**
 * Client-side field filtering utility for APIs that don't support native fields parameter.
 * 
 * Supports:
 * - Dot-notation nested field access (e.g., "status.name", "assignee.displayName")
 * - Multiple entity types (issue, project, user, agile, system)
 * - Graceful handling of missing fields
 * - Performance optimized for large objects
 * - Optional logging for debugging
 * 
 * @example
 * ```typescript
 * const options = { entityType: 'issue', respectNesting: true };
 * const filtered = FieldFilter.filterFields(issueData, ['status.name', 'assignee.displayName'], options);
 * // Result: { status: { name: "In Progress" }, assignee: { displayName: "John Doe" } }
 * ```
 */
export class FieldFilter {
  /**
   * Filter response fields based on requested field paths
   * 
   * @param response - The response object to filter
   * @param requestedFields - Array of field paths to extract (supports dot notation)
   * @param options - Filtering options including entity type and behavior flags
   * @returns Filtered object containing only requested fields
   */
  static filterFields(
    response: any,
    requestedFields: string[] | null | undefined,
    options: FieldFilterOptions
  ): any {
    // Return original response if no fields specified
    if (!requestedFields || requestedFields.length === 0) {
      return response;
    }

    // Handle non-object inputs gracefully
    if (!response || typeof response !== 'object') {
      return response;
    }

    // Log filtering operation if enabled
    if (options.logFiltering) {
      console.log(`Client-side filtering applied for ${options.entityType}:`, requestedFields);
    }

    // Apply field filtering with nesting support
    const respectNesting = options.respectNesting !== false; // Default to true
    return this.applyFieldFiltering(response, requestedFields, respectNesting);
  }

  /**
   * Apply nested field filtering with dot-notation support
   * 
   * @private
   * @param obj - Source object to filter
   * @param fields - Array of field paths to extract
   * @param respectNesting - Whether to preserve nested structure in result
   * @returns Filtered object with requested fields
   */
  private static applyFieldFiltering(
    obj: any,
    fields: string[],
    respectNesting: boolean = true
  ): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const result: any = {};
    
    // Process each requested field path
    for (const field of fields) {
      const value = this.extractFieldValue(obj, field);
      
      // Only include field if value exists (not undefined)
      if (value !== undefined) {
        if (respectNesting) {
          this.setNestedValue(result, field, value);
        } else {
          // Flat structure - use original field path as key
          result[field] = value;
        }
      }
    }

    return result;
  }

  /**
   * Extract field value using dot notation path
   * 
   * Supports:
   * - Simple fields: "name", "id"
   * - Nested fields: "status.name", "assignee.displayName"
   * - Deep nesting: "project.projectCategory.name"
   * - Custom fields: "customfield_10001", "customfield_10002.value"
   * 
   * @private
   * @param obj - Source object to extract from
   * @param path - Dot-notation path to the desired field
   * @returns Field value or undefined if path doesn't exist
   */
  private static extractFieldValue(obj: any, path: string): any {
    // Handle simple array notation (basic support)
    // Note: Advanced array indexing like [0] is not implemented
    if (path.includes('[]')) {
      // For now, treat array notation as invalid and return undefined
      // This could be enhanced in the future to support array indexing
      return undefined;
    }

    // Split path and traverse object
    return path.split('.').reduce((current, key) => {
      // Return undefined if current level is null/undefined or key doesn't exist
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Set nested value in result object, creating intermediate objects as needed
   * 
   * Creates the full nested structure for a dot-notation path.
   * For example, "status.statusCategory.name" creates:
   * { status: { statusCategory: { name: value } } }
   * 
   * @private
   * @param obj - Target object to set value in
   * @param path - Dot-notation path where to set the value
   * @param value - Value to set at the specified path
   */
  private static setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    
    // Navigate/create nested structure
    const target = keys.reduce((current, key) => {
      // Create nested object if it doesn't exist
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);
    
    // Set the final value
    target[lastKey] = value;
  }
}

/**
 * Type alias for backward compatibility and convenience
 */
export type { FieldFilterOptions as ClientFieldFilterOptions };