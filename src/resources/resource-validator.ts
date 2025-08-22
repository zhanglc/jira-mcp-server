/**
 * Resource Validator - Validates resource content and URIs
 * 
 * Provides validation for resource URIs, content integrity, and access patterns
 */

import type { Logger } from 'winston';
import type { 
  ResourceUriPattern, 
  FieldSchema, 
  ResourceValidationResult
} from '@/types';

export class ResourceValidator {
  private readonly validUriPatterns: Set<ResourceUriPattern> = new Set([
    'jira://fields/issue',
    'jira://fields/project', 
    'jira://fields/user',
    'jira://fields/board',
    'jira://fields/sprint',
    'jira://fields/worklog',
    'jira://fields/custom'
  ]);

  constructor(private logger: Logger) {}

  /**
   * Validate a resource URI pattern
   */
  validateUri(uri: string): { valid: boolean; error?: string } {
    // Check if URI matches expected pattern
    if (!uri.startsWith('jira://')) {
      return {
        valid: false,
        error: 'URI must start with "jira://" scheme'
      };
    }

    // Check if URI is in allowed list
    if (!this.validUriPatterns.has(uri as ResourceUriPattern)) {
      return {
        valid: false,
        error: `Unknown resource URI: ${uri}. Valid URIs are: ${Array.from(this.validUriPatterns).join(', ')}`
      };
    }

    return { valid: true };
  }

  /**
   * Validate field schema content
   */
  validateFieldSchema(schema: FieldSchema): ResourceValidationResult {
    const errors: Array<{ field?: string; message: string; severity: 'error' | 'warning' | 'info' }> = [];
    const warnings: string[] = [];

    // Validate metadata
    if (!schema.metadata) {
      errors.push({
        field: 'metadata',
        message: 'Field schema must include metadata',
        severity: 'error'
      });
    } else {
      // Validate entity type
      const validEntityTypes = ['issue', 'project', 'user', 'board', 'sprint', 'worklog', 'custom'];
      if (!validEntityTypes.includes(schema.metadata.entityType)) {
        errors.push({
          field: 'metadata.entityType',
          message: `Invalid entity type: ${schema.metadata.entityType}`,
          severity: 'error'
        });
      }

      // Validate field count
      if (schema.metadata.totalFields === 0) {
        warnings.push('Schema contains no fields');
      }

      // Check if field count matches actual fields
      const actualFieldCount = Object.keys(schema.fields || {}).length;
      if (schema.metadata.totalFields !== actualFieldCount) {
        warnings.push(`Metadata field count (${schema.metadata.totalFields}) doesn't match actual fields (${actualFieldCount})`);
      }
    }

    // Validate fields structure
    if (!schema.fields || Object.keys(schema.fields).length === 0) {
      errors.push({
        field: 'fields',
        message: 'Schema must contain at least one field definition',
        severity: 'error'
      });
    } else {
      // Validate individual field definitions
      for (const [fieldName, fieldDef] of Object.entries(schema.fields)) {
        if (!fieldDef.type) {
          errors.push({
            field: `fields.${fieldName}.type`,
            message: 'Field definition must specify a type',
            severity: 'error'
          });
        }

        if (!fieldDef.description) {
          warnings.push(`Field '${fieldName}' has no description`);
        }

        // Validate type-specific properties
        if (fieldDef.type === 'array' && !fieldDef.items) {
          errors.push({
            field: `fields.${fieldName}.items`,
            message: 'Array fields must specify items schema',
            severity: 'error'
          });
        }

        if (fieldDef.type === 'object' && !fieldDef.properties) {
          warnings.push(`Object field '${fieldName}' has no properties defined`);
        }
      }
    }

    // Validate nested fields if present
    if (schema.nestedFields) {
      for (const [nestedPath, nestedDef] of Object.entries(schema.nestedFields)) {
        if (!nestedPath.includes('.')) {
          errors.push({
            field: `nestedFields.${nestedPath}`,
            message: 'Nested field path must contain dot notation',
            severity: 'error'
          });
        }

        if (!nestedDef.parentField || !nestedDef.nestedField) {
          errors.push({
            field: `nestedFields.${nestedPath}`,
            message: 'Nested field must specify parentField and nestedField',
            severity: 'error'
          });
        }

        // Check if parent field exists in main fields
        if (nestedDef.parentField && !schema.fields[nestedDef.parentField]) {
          errors.push({
            field: `nestedFields.${nestedPath}.parentField`,
            message: `Parent field '${nestedDef.parentField}' not found in main fields`,
            severity: 'error'
          });
        }
      }
    }

    // Validate custom fields if present
    if (schema.customFields) {
      for (const [fieldId, customDef] of Object.entries(schema.customFields)) {
        if (!fieldId.startsWith('customfield_')) {
          warnings.push(`Custom field ID '${fieldId}' doesn't follow expected pattern 'customfield_XXXXX'`);
        }

        if (!customDef.fieldName) {
          errors.push({
            field: `customFields.${fieldId}.fieldName`,
            message: 'Custom field must have a fieldName',
            severity: 'error'
          });
        }

        if (!customDef.fieldType) {
          errors.push({
            field: `customFields.${fieldId}.fieldType`,
            message: 'Custom field must have a fieldType',
            severity: 'error'
          });
        }
      }
    }

    return {
      uri: `jira://fields/${schema.metadata?.entityType || 'unknown'}` as ResourceUriPattern,
      valid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        validatedAt: new Date().toISOString(),
        schemaVersion: '1.0.0',
        validatorVersion: '1.0.0'
      }
    };
  }

  /**
   * Validate resource access pattern
   */
  validateAccess(uri: ResourceUriPattern, requestOrigin?: string): { allowed: boolean; reason?: string } {
    // Basic validation - in production, this might include more complex logic
    const uriValidation = this.validateUri(uri);
    if (!uriValidation.valid) {
      return {
        allowed: false,
        reason: uriValidation.error || 'URI validation failed'
      };
    }

    // Check for potentially expensive operations
    if (uri === 'jira://fields/custom' && !requestOrigin) {
      this.logger.warn('Custom fields resource accessed without origin tracking');
    }

    return { allowed: true };
  }

  /**
   * Validate resource content size and complexity
   */
  validateContentLimits(content: any): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];
    const contentStr = JSON.stringify(content);
    
    // Check content size (1MB limit)
    const maxSize = 1024 * 1024; // 1MB
    if (contentStr.length > maxSize) {
      warnings.push(`Content size (${contentStr.length} bytes) exceeds recommended limit (${maxSize} bytes)`);
    }

    // Check object depth
    const maxDepth = 10;
    const depth = this.calculateObjectDepth(content);
    if (depth > maxDepth) {
      warnings.push(`Object depth (${depth}) exceeds recommended limit (${maxDepth})`);
    }

    // Check number of fields for field schemas
    if (content && content.fields && Object.keys(content.fields).length > 1000) {
      warnings.push(`Large number of fields (${Object.keys(content.fields).length}) may impact performance`);
    }

    return {
      valid: warnings.length === 0,
      warnings
    };
  }

  /**
   * Calculate object nesting depth
   */
  private calculateObjectDepth(obj: any, currentDepth = 0): number {
    if (typeof obj !== 'object' || obj === null) {
      return currentDepth;
    }

    let maxDepth = currentDepth;
    for (const value of Object.values(obj)) {
      const depth = this.calculateObjectDepth(value, currentDepth + 1);
      maxDepth = Math.max(maxDepth, depth);
    }

    return maxDepth;
  }
}