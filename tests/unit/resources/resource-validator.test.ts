/**
 * Unit tests for ResourceValidator
 */

import { ResourceValidator } from '@/resources/resource-validator';
import type { ResourceUriPattern, FieldSchema, CustomFieldDefinition } from '@/types';
import { createMockLogger } from '../../utils/test-helpers';

describe('ResourceValidator', () => {
  let validator: ResourceValidator;
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = createMockLogger();
    validator = new ResourceValidator(mockLogger);
  });

  describe('validateUri', () => {
    it('should validate correct Jira URIs', () => {
      const validUris = [
        'jira://fields/issue',
        'jira://fields/project',
        'jira://fields/user',
        'jira://fields/board',
        'jira://fields/sprint',
        'jira://fields/worklog',
        'jira://fields/custom'
      ];

      validUris.forEach(uri => {
        const result = validator.validateUri(uri);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid URI schemes', () => {
      const invalidUris = [
        'http://fields/issue',
        'https://fields/issue',
        'ftp://fields/issue',
        'custom://fields/issue'
      ];

      invalidUris.forEach(uri => {
        const result = validator.validateUri(uri);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('must start with "jira://"');
      });
    });

    it('should reject unknown resource paths', () => {
      const unknownUris = [
        'jira://fields/unknown',
        'jira://fields/invalid',
        'jira://other/issue',
        'jira://fields/issue/extra'
      ];

      unknownUris.forEach(uri => {
        const result = validator.validateUri(uri);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Unknown resource URI');
      });
    });
  });

  describe('validateFieldSchema', () => {
    const createValidSchema = (): FieldSchema => ({
      fields: {
        key: {
          type: 'string',
          description: 'Issue key'
        },
        status: {
          type: 'object',
          description: 'Issue status',
          properties: {
            name: { type: 'string', description: 'Status name' }
          }
        },
        tags: {
          type: 'array',
          description: 'Issue tags',
          items: { type: 'string', description: 'Tag value' }
        }
      },
      nestedFields: {
        'status.name': {
          type: 'string',
          description: 'Status name',
          path: 'status.name',
          parentField: 'status',
          nestedField: 'name'
        }
      },
      metadata: {
        entityType: 'issue',
        version: '1.0.0',
        lastUpdated: '2024-01-01T00:00:00.000Z',
        source: 'configuration',
        customFieldsIncluded: false,
        totalFields: 3
      }
    });

    it('should validate correct field schema', () => {
      const schema = createValidSchema();
      const result = validator.validateFieldSchema(schema);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.uri).toBe('jira://fields/issue');
    });

    it('should require metadata', () => {
      const schema = createValidSchema();
      delete (schema as any).metadata;

      const result = validator.validateFieldSchema(schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'metadata',
        message: 'Field schema must include metadata',
        severity: 'error'
      });
    });

    it('should validate entity type', () => {
      const schema = createValidSchema();
      schema.metadata.entityType = 'invalid' as any;

      const result = validator.validateFieldSchema(schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'metadata.entityType',
        message: 'Invalid entity type: invalid',
        severity: 'error'
      });
    });

    it('should require at least one field', () => {
      const schema = createValidSchema();
      schema.fields = {};

      const result = validator.validateFieldSchema(schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'fields',
        message: 'Schema must contain at least one field definition',
        severity: 'error'
      });
    });

    it('should validate field definitions', () => {
      const schema = createValidSchema();
      schema.fields.invalidField = {} as any; // Missing type

      const result = validator.validateFieldSchema(schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'fields.invalidField.type',
        message: 'Field definition must specify a type',
        severity: 'error'
      });
    });

    it('should validate array field items', () => {
      const schema = createValidSchema();
      schema.fields.arrayField = {
        type: 'array',
        description: 'Array field'
        // Missing items property
      };

      const result = validator.validateFieldSchema(schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'fields.arrayField.items',
        message: 'Array fields must specify items schema',
        severity: 'error'
      });
    });

    it('should validate nested field structure', () => {
      const schema = createValidSchema();
      schema.nestedFields!['invalid'] = {
        type: 'string',
        description: 'Invalid nested field',
        path: 'invalid', // No dot notation
        parentField: 'nonexistent',
        nestedField: 'field'
      };

      const result = validator.validateFieldSchema(schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'nestedFields.invalid',
        message: 'Nested field path must contain dot notation',
        severity: 'error'
      });
      expect(result.errors).toContainEqual({
        field: 'nestedFields.invalid.parentField',
        message: 'Parent field \'nonexistent\' not found in main fields',
        severity: 'error'
      });
    });

    it('should validate custom fields', () => {
      const schema = createValidSchema();
      schema.customFields = {
        'customfield_10001': {
          type: 'string',
          description: 'Test custom field',
          fieldId: 'customfield_10001',
          // Missing fieldName and fieldType
          isGlobal: true,
          isLocked: false
        } as CustomFieldDefinition
      };

      const result = validator.validateFieldSchema(schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'customFields.customfield_10001.fieldName',
        message: 'Custom field must have a fieldName',
        severity: 'error'
      });
      expect(result.errors).toContainEqual({
        field: 'customFields.customfield_10001.fieldType',
        message: 'Custom field must have a fieldType',
        severity: 'error'
      });
    });

    it('should warn about missing descriptions', () => {
      const schema = createValidSchema();
      delete schema.fields.key.description;

      const result = validator.validateFieldSchema(schema);

      expect(result.warnings).toContain('Field \'key\' has no description');
    });

    it('should warn about field count mismatch', () => {
      const schema = createValidSchema();
      schema.metadata.totalFields = 999; // Wrong count

      const result = validator.validateFieldSchema(schema);

      expect(result.warnings).toContain('Metadata field count (999) doesn\'t match actual fields (3)');
    });
  });

  describe('validateAccess', () => {
    it('should allow access to valid URIs', () => {
      const validUris: ResourceUriPattern[] = [
        'jira://fields/issue',
        'jira://fields/project',
        'jira://fields/user'
      ];

      validUris.forEach(uri => {
        const result = validator.validateAccess(uri);
        expect(result.allowed).toBe(true);
        expect(result.reason).toBeUndefined();
      });
    });

    it('should deny access to invalid URIs', () => {
      const result = validator.validateAccess('jira://fields/invalid' as ResourceUriPattern);
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Unknown resource URI');
    });

    it('should log warning for custom fields without origin', () => {
      validator.validateAccess('jira://fields/custom');
      
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Custom fields resource accessed without origin tracking'
      );
    });

    it('should allow custom fields access with origin', () => {
      const result = validator.validateAccess('jira://fields/custom', 'test-client');
      
      expect(result.allowed).toBe(true);
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });
  });

  describe('validateContentLimits', () => {
    it('should pass for reasonable content size', () => {
      const content = {
        fields: {
          key: { type: 'string', description: 'Issue key' },
          summary: { type: 'string', description: 'Issue summary' }
        }
      };

      const result = validator.validateContentLimits(content);

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should warn about large content size', () => {
      // Create large content (over 1MB)
      const largeContent = {
        fields: {}
      };
      
      // Add many fields to make it large
      for (let i = 0; i < 10000; i++) {
        (largeContent.fields as any)[`field${i}`] = {
          type: 'string',
          description: `A very long description that repeats many times to make the content larger than 1MB. `.repeat(50)
        };
      }

      const result = validator.validateContentLimits(largeContent);

      expect(result.valid).toBe(false);
      expect(result.warnings).toContainEqual(
        expect.stringContaining('Content size')
      );
    });

    it('should warn about deep object nesting', () => {
      // Create deeply nested object
      let deepObject: any = {};
      let current = deepObject;
      
      for (let i = 0; i < 15; i++) {
        current.nested = {};
        current = current.nested;
      }

      const result = validator.validateContentLimits(deepObject);

      expect(result.valid).toBe(false);
      expect(result.warnings).toContainEqual(
        expect.stringContaining('Object depth')
      );
    });

    it('should warn about too many fields', () => {
      const content = {
        fields: {}
      };

      // Add more than 1000 fields
      for (let i = 0; i < 1500; i++) {
        (content.fields as any)[`field${i}`] = {
          type: 'string',
          description: 'Field description'
        };
      }

      const result = validator.validateContentLimits(content);

      expect(result.valid).toBe(false);
      expect(result.warnings).toContainEqual(
        expect.stringContaining('Large number of fields')
      );
    });
  });

  describe('edge cases', () => {
    it('should handle null and undefined values', () => {
      const result = validator.validateContentLimits(null);
      expect(result.valid).toBe(true);
    });

    it('should handle empty objects', () => {
      const schema: FieldSchema = {
        fields: {},
        metadata: {
          entityType: 'issue',
          version: '1.0.0',
          lastUpdated: '2024-01-01T00:00:00.000Z',
          source: 'configuration',
          customFieldsIncluded: false,
          totalFields: 0
        }
      };

      const result = validator.validateFieldSchema(schema);
      expect(result.valid).toBe(false); // Should fail because no fields
    });
  });
});