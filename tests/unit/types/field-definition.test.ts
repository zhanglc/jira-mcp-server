import type {
  FieldDefinition,
  AccessPath,
  ResourceDefinition,
  ValidationResult,
} from '@/types/field-definition.js';

describe('Field Definition Types', () => {
  describe('AccessPath interface', () => {
    it('should validate AccessPath structure', () => {
      const accessPath: AccessPath = {
        path: 'status.statusCategory.key',
        description: 'Status category key',
        type: 'string',
        frequency: 'high',
      };

      expect(accessPath.path).toBe('status.statusCategory.key');
      expect(accessPath.description).toBe('Status category key');
      expect(accessPath.type).toBe('string');
      expect(accessPath.frequency).toBe('high');
    });

    it('should accept all valid frequency values', () => {
      const frequencies: Array<'high' | 'medium' | 'low'> = [
        'high',
        'medium',
        'low',
      ];

      frequencies.forEach(freq => {
        const accessPath: AccessPath = {
          path: 'test.path',
          description: 'Test description',
          type: 'string',
          frequency: freq,
        };
        expect(accessPath.frequency).toBe(freq);
      });
    });
  });

  describe('FieldDefinition interface', () => {
    it('should validate FieldDefinition structure for status field', () => {
      const statusField: FieldDefinition = {
        id: 'status',
        name: 'Status',
        description: 'Current issue status and its category',
        type: 'object',
        accessPaths: [
          {
            path: 'status.name',
            description: 'Status name',
            type: 'string',
            frequency: 'high',
          },
          {
            path: 'status.statusCategory.key',
            description: 'Status category key (todo/progress/done)',
            type: 'string',
            frequency: 'high',
          },
          {
            path: 'status.statusCategory.name',
            description: 'Status category name',
            type: 'string',
            frequency: 'medium',
          },
        ],
        examples: ['status.name', 'status.statusCategory.key'],
        commonUsage: [['status.name', 'status.statusCategory.key']],
      };

      expect(statusField.id).toBe('status');
      expect(statusField.name).toBe('Status');
      expect(statusField.type).toBe('object');
      expect(statusField.accessPaths).toHaveLength(3);
      expect(statusField.examples).toHaveLength(2);
      expect(statusField.commonUsage).toHaveLength(1);
    });

    it('should validate FieldDefinition structure for assignee field', () => {
      const assigneeField: FieldDefinition = {
        id: 'assignee',
        name: 'Assignee',
        description: 'Issue assignee user information',
        type: 'object',
        accessPaths: [
          {
            path: 'assignee.displayName',
            description: 'User display name',
            type: 'string',
            frequency: 'high',
          },
          {
            path: 'assignee.emailAddress',
            description: 'User email address',
            type: 'string',
            frequency: 'high',
          },
          {
            path: 'assignee.active',
            description: 'User active status',
            type: 'boolean',
            frequency: 'medium',
          },
        ],
        examples: ['assignee.displayName', 'assignee.emailAddress'],
        commonUsage: [['assignee.displayName', 'assignee.emailAddress']],
      };

      expect(assigneeField.id).toBe('assignee');
      expect(assigneeField.name).toBe('Assignee');
      expect(assigneeField.type).toBe('object');
      expect(assigneeField.accessPaths).toHaveLength(3);
    });

    it('should accept all valid field types', () => {
      const fieldTypes: Array<'object' | 'string' | 'array'> = [
        'object',
        'string',
        'array',
      ];

      fieldTypes.forEach(type => {
        const field: FieldDefinition = {
          id: 'test',
          name: 'Test Field',
          description: 'Test description',
          type: type,
          accessPaths: [],
          examples: [],
          commonUsage: [],
        };
        expect(field.type).toBe(type);
      });
    });
  });

  describe('ResourceDefinition interface', () => {
    it('should validate ResourceDefinition structure', () => {
      const resourceDef: ResourceDefinition = {
        uri: 'jira://issue/fields',
        entityType: 'issue',
        lastUpdated: '2024-01-01T00:00:00.000Z',
        version: '1.0.0',
        totalFields: 2,
        fields: {
          status: {
            id: 'status',
            name: 'Status',
            description: 'Current issue status',
            type: 'object',
            accessPaths: [
              {
                path: 'status.name',
                description: 'Status name',
                type: 'string',
                frequency: 'high',
              },
            ],
            examples: ['status.name'],
            commonUsage: [['status.name']],
          },
        },
        pathIndex: {
          'status.name': 'status',
        },
      };

      expect(resourceDef.uri).toBe('jira://issue/fields');
      expect(resourceDef.entityType).toBe('issue');
      expect(resourceDef.totalFields).toBe(2);
      expect(resourceDef.fields).toHaveProperty('status');
      expect(resourceDef.pathIndex['status.name']).toBe('status');
    });

    it('should validate path index mapping', () => {
      const resourceDef: ResourceDefinition = {
        uri: 'jira://issue/fields',
        entityType: 'issue',
        lastUpdated: '2024-01-01T00:00:00.000Z',
        version: '1.0.0',
        totalFields: 1,
        fields: {
          assignee: {
            id: 'assignee',
            name: 'Assignee',
            description: 'Issue assignee',
            type: 'object',
            accessPaths: [
              {
                path: 'assignee.displayName',
                description: 'Display name',
                type: 'string',
                frequency: 'high',
              },
              {
                path: 'assignee.emailAddress',
                description: 'Email address',
                type: 'string',
                frequency: 'high',
              },
            ],
            examples: ['assignee.displayName'],
            commonUsage: [['assignee.displayName']],
          },
        },
        pathIndex: {
          'assignee.displayName': 'assignee',
          'assignee.emailAddress': 'assignee',
        },
      };

      expect(resourceDef.pathIndex['assignee.displayName']).toBe('assignee');
      expect(resourceDef.pathIndex['assignee.emailAddress']).toBe('assignee');
    });
  });

  describe('ValidationResult interface', () => {
    it('should validate ValidationResult for valid path', () => {
      const validResult: ValidationResult = {
        isValid: true,
        fieldId: 'status',
        path: 'status.name',
        type: 'string',
      };

      expect(validResult.isValid).toBe(true);
      expect(validResult.fieldId).toBe('status');
      expect(validResult.path).toBe('status.name');
      expect(validResult.type).toBe('string');
      expect(validResult.error).toBeUndefined();
    });

    it('should validate ValidationResult for invalid path', () => {
      const invalidResult: ValidationResult = {
        isValid: false,
        error: 'Field not found',
      };

      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toBe('Field not found');
      expect(invalidResult.fieldId).toBeUndefined();
      expect(invalidResult.path).toBeUndefined();
      expect(invalidResult.type).toBeUndefined();
    });
  });
});
