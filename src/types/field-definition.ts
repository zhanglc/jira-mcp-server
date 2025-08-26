/**
 * Access path definition for nested field access
 */
export interface AccessPath {
  /** The dot-notation path (e.g., "status.statusCategory.key") */
  path: string;
  /** Human-readable description of what this path accesses */
  description: string;
  /** TypeScript/JSON type of the value at this path */
  type: string;
  /** Usage frequency in real-world scenarios */
  frequency: 'high' | 'medium' | 'low';
}

/**
 * Complete field definition with all access paths and metadata
 */
export interface FieldDefinition {
  /** Unique field identifier (e.g., "status", "customfield_10001") */
  id: string;
  /** Business-friendly field name from Jira */
  name: string;
  /** Enhanced human-readable description */
  description: string;
  /** Field type classification */
  type: 'object' | 'string' | 'array';
  /** All available nested access routes for this field */
  accessPaths: AccessPath[];
  /** Usage examples showing common access patterns */
  examples: string[];
  /** Frequently used field combinations for queries */
  commonUsage: string[][];
  /** Optional: Source of field definition (for hybrid architecture) */
  source?: 'static' | 'dynamic';
  /** Optional: Definition accuracy level (for hybrid architecture) */
  confidence?: 'high' | 'medium' | 'low';
}

/**
 * Complete resource definition containing all fields for an entity type
 */
export interface ResourceDefinition {
  /** Resource URI (e.g., "jira://issue/fields") */
  uri: string;
  /** Entity type (e.g., "issue", "project", "user") */
  entityType: string;
  /** ISO timestamp of last update */
  lastUpdated: string;
  /** Version string for compatibility tracking */
  version: string;
  /** Total number of fields in this resource */
  totalFields: number;
  /** Complete field definitions keyed by field ID */
  fields: Record<string, FieldDefinition>;
  /** Fast lookup index: access path -> field ID */
  pathIndex: Record<string, string>;
}

/**
 * Enhanced resource definition for hybrid architecture with dynamic field fusion
 * Extends ResourceDefinition with additional metadata for dynamic field tracking
 */
export interface EnhancedResourceDefinition extends ResourceDefinition {
  /** Number of dynamic custom fields discovered from Jira API */
  dynamicFields: number;
  /** ISO timestamp of last dynamic field discovery */
  lastDynamicUpdate: string;
}

/**
 * Result of field path validation
 */
export interface ValidationResult {
  /** Whether the field path is valid */
  isValid: boolean;
  /** Field ID if path is valid */
  fieldId?: string;
  /** Validated access path if valid */
  path?: string;
  /** Expected type at this path if valid */
  type?: string;
  /** Error message if invalid */
  error?: string;
}

/**
 * Result of batch field path validation
 */
export interface BatchValidationResult {
  /** Whether all field paths are valid */
  isValid: boolean;
  /** Array of valid field paths */
  validPaths: string[];
  /** Array of invalid field paths */
  invalidPaths: string[];
  /** Error message if entity type is invalid */
  error?: string;
  /** Detailed path information for valid paths */
  pathInfo?: Record<
    string,
    {
      fieldId: string;
      type: string;
      description: string;
    }
  >;
  /** Suggestions for invalid paths (path -> suggested paths) */
  suggestions?: Record<string, string[]>;
}
