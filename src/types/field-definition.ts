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

/**
 * Result of analyzing access path availability in sampled data
 */
export interface AccessPathAnalysis {
  /** The access path being analyzed */
  path: string;
  /** Rate of availability when the parent field is present (0.0 to 1.0) */
  availabilityRate: number;
  /** Human-readable description of the path */
  description: string;
  /** Expected type at this path */
  type: string;
  /** Usage frequency classification */
  frequency: 'high' | 'medium' | 'low';
}

/**
 * Result of analyzing a single field's usage patterns
 */
export interface FieldUsageResult {
  /** Field identifier */
  fieldId: string;
  /** Business-friendly field name */
  name: string;
  /** Field description */
  description: string;
  /** Rate of field presence in samples (0.0 to 1.0) */
  presenceRate: number;
  /** Rate of non-empty values when field is present (0.0 to 1.0) */
  valueFillRate: number;
  /** Analysis of all access paths for this field */
  accessPaths: AccessPathAnalysis[];
  /** Source of field definition */
  source: 'static' | 'dynamic';
  /** Confidence level of the analysis */
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Complete field usage analysis result for an entity type
 */
export interface EntityFieldUsageAnalysis {
  /** Entity type analyzed */
  entityType: 'issue' | 'project' | 'user' | 'agile';
  /** ISO timestamp of analysis */
  analyzedAt: string;
  /** Total number of entities sampled */
  totalSamples: number;
  /** Field usage results keyed by field ID */
  fields: Record<string, FieldUsageResult>;
  /** Summary statistics */
  summary: {
    /** Total number of fields analyzed */
    totalFields: number;
    /** Average field presence rate across all fields */
    averagePresenceRate: number;
    /** Average value fill rate across all fields */
    averageValueFillRate: number;
    /** Number of fields with high presence rate (>= 0.8) */
    highPresenceFields: number;
    /** Number of fields with low presence rate (< 0.2) */
    lowPresenceFields: number;
  };
}
