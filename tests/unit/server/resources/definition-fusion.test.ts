import { HybridResourceHandler } from '@/server/resources/hybrid-resource-handler.js';
import { JiraClientWrapper } from '@/client/jira-client-wrapper.js';
import type {
  FieldDefinition,
  ResourceDefinition,
} from '@/types/field-definition.js';
import type { JiraField } from '@/types/jira-types.js';

// Mock JiraClientWrapper
class MockJiraClientWrapper extends JiraClientWrapper {
  private mockFields: JiraField[] = [];

  constructor() {
    // Create minimal mock for JiraClientWrapper with valid auth
    super({
      url: 'http://test-jira.com',
      bearer: 'test-token',
    });
  }

  setMockFields(fields: JiraField[]): void {
    this.mockFields = fields;
  }

  async searchFields(): Promise<JiraField[]> {
    return this.mockFields;
  }
}

describe('HybridResourceHandler - Definition Fusion Logic', () => {
  let hybridHandler: HybridResourceHandler;
  let mockJiraClient: MockJiraClientWrapper;

  // Test data for static definition
  const mockStaticDefinition: ResourceDefinition = {
    uri: 'jira://issue/fields',
    entityType: 'issue',
    lastUpdated: '2024-01-01T00:00:00.000Z',
    version: '1.0.0',
    totalFields: 2,
    fields: {
      status: {
        id: 'status',
        name: 'Status',
        description: 'Issue status',
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
            description: 'Status category key',
            type: 'string',
            frequency: 'high',
          },
        ],
        examples: ['status.name'],
        commonUsage: [['status.name']],
        source: 'static',
        confidence: 'high',
      },
      assignee: {
        id: 'assignee',
        name: 'Assignee',
        description: 'Issue assignee',
        type: 'object',
        accessPaths: [
          {
            path: 'assignee.displayName',
            description: 'Assignee display name',
            type: 'string',
            frequency: 'high',
          },
          {
            path: 'assignee.accountId',
            description: 'Assignee account ID',
            type: 'string',
            frequency: 'medium',
          },
        ],
        examples: ['assignee.displayName'],
        commonUsage: [['assignee.displayName']],
        source: 'static',
        confidence: 'high',
      },
    },
    pathIndex: {
      'status.name': 'status',
      'status.statusCategory.key': 'status',
      'assignee.displayName': 'assignee',
      'assignee.accountId': 'assignee',
    },
  };

  // Test data for dynamic custom fields
  const mockDynamicFields: FieldDefinition[] = [
    {
      id: 'customfield_10001',
      name: 'Story Points',
      description: 'Dynamic custom field: Story Points',
      type: 'string',
      accessPaths: [
        {
          path: 'customfield_10001',
          description: 'Access Story Points value',
          type: 'number',
          frequency: 'medium',
        },
      ],
      examples: ['customfield_10001'],
      commonUsage: [['customfield_10001']],
      source: 'dynamic',
      confidence: 'high',
    },
    {
      id: 'customfield_10002',
      name: 'Epic Link',
      description: 'Dynamic custom field: Epic Link',
      type: 'object',
      accessPaths: [
        {
          path: 'customfield_10002',
          description: 'Access Epic Link value',
          type: 'object',
          frequency: 'medium',
        },
        {
          path: 'customfield_10002.key',
          description: 'Epic key',
          type: 'string',
          frequency: 'high',
        },
      ],
      examples: ['customfield_10002', 'customfield_10002.key'],
      commonUsage: [['customfield_10002.key']],
      source: 'dynamic',
      confidence: 'high',
    },
  ];

  beforeEach(() => {
    mockJiraClient = new MockJiraClientWrapper();
    hybridHandler = new HybridResourceHandler(mockJiraClient, true, 3600, 100);
  });

  describe('fuseFieldDefinitions', () => {
    it('should merge static and dynamic fields correctly', async () => {
      // Arrange
      const expectedTotalFields =
        mockStaticDefinition.totalFields + mockDynamicFields.length;

      // Act
      const result = (hybridHandler as any).fuseFieldDefinitions(
        mockStaticDefinition,
        mockDynamicFields
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.totalFields).toBe(expectedTotalFields);
      expect(result.dynamicFields).toBe(mockDynamicFields.length);
      expect(result.lastDynamicUpdate).toBeDefined();
      expect(new Date(result.lastDynamicUpdate)).toBeInstanceOf(Date);

      // Check that all static fields are preserved
      expect(result.fields['status']).toEqual(
        mockStaticDefinition.fields['status']
      );
      expect(result.fields['assignee']).toEqual(
        mockStaticDefinition.fields['assignee']
      );

      // Check that dynamic fields are added
      expect(result.fields['customfield_10001']).toEqual(mockDynamicFields[0]);
      expect(result.fields['customfield_10002']).toEqual(mockDynamicFields[1]);
    });

    it('should build enhanced path index with both static and dynamic paths', async () => {
      // Act
      const result = (hybridHandler as any).fuseFieldDefinitions(
        mockStaticDefinition,
        mockDynamicFields
      );

      // Assert
      // Check static paths are preserved
      expect(result.pathIndex['status.name']).toBe('status');
      expect(result.pathIndex['status.statusCategory.key']).toBe('status');
      expect(result.pathIndex['assignee.displayName']).toBe('assignee');
      expect(result.pathIndex['assignee.accountId']).toBe('assignee');

      // Check dynamic paths are added
      expect(result.pathIndex['customfield_10001']).toBe('customfield_10001');
      expect(result.pathIndex['customfield_10002']).toBe('customfield_10002');
      expect(result.pathIndex['customfield_10002.key']).toBe(
        'customfield_10002'
      );
    });

    it('should handle empty dynamic fields array gracefully', async () => {
      // Act
      const result = (hybridHandler as any).fuseFieldDefinitions(
        mockStaticDefinition,
        []
      );

      // Assert
      expect(result.totalFields).toBe(mockStaticDefinition.totalFields);
      expect(result.dynamicFields).toBe(0);
      expect(result.fields).toEqual(mockStaticDefinition.fields);
      expect(result.pathIndex).toEqual(mockStaticDefinition.pathIndex);
    });

    it('should prevent static field conflicts and log warnings', async () => {
      // Arrange
      const conflictingDynamicField: FieldDefinition = {
        id: 'status', // Conflicts with static field
        name: 'Custom Status Field',
        description: 'Dynamic custom field: Custom Status Field',
        type: 'string',
        accessPaths: [
          {
            path: 'status',
            description: 'Custom status value',
            type: 'string',
            frequency: 'medium',
          },
        ],
        examples: ['status'],
        commonUsage: [['status']],
        source: 'dynamic',
        confidence: 'high',
      };

      const mockLoggerWarn = jest
        .spyOn(require('@/utils/logger.js').logger, 'warn')
        .mockImplementation();

      // Act
      const result = (hybridHandler as any).fuseFieldDefinitions(
        mockStaticDefinition,
        [conflictingDynamicField, ...mockDynamicFields]
      );

      // Assert
      expect(result.fields['status']).toEqual(
        mockStaticDefinition.fields['status']
      ); // Static field preserved
      expect(result.fields['status']).not.toEqual(conflictingDynamicField); // Dynamic field rejected
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        'Dynamic field conflicts with static field, skipping',
        expect.objectContaining({
          fieldId: 'status',
          staticField: true,
        })
      );

      mockLoggerWarn.mockRestore();
    });

    it('should skip invalid dynamic fields during fusion', async () => {
      // Arrange
      const invalidDynamicFields = [
        null,
        undefined,
        { name: 'Invalid Field' }, // Missing id
        { id: '', name: 'Empty ID Field' }, // Empty id
        ...mockDynamicFields,
      ];

      const mockLoggerWarn = jest
        .spyOn(require('@/utils/logger.js').logger, 'warn')
        .mockImplementation();

      // Act
      const result = (hybridHandler as any).fuseFieldDefinitions(
        mockStaticDefinition,
        invalidDynamicFields as any
      );

      // Assert
      expect(result.totalFields).toBe(
        mockStaticDefinition.totalFields + mockDynamicFields.length
      );
      expect(result.dynamicFields).toBe(mockDynamicFields.length);
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        'Skipping invalid field during fusion',
        expect.any(Object)
      );

      mockLoggerWarn.mockRestore();
    });

    it('should handle fields with missing or empty access paths', async () => {
      // Arrange
      const fieldWithoutPaths: FieldDefinition = {
        id: 'customfield_10003',
        name: 'Field Without Paths',
        description: 'Field without access paths',
        type: 'string',
        accessPaths: [],
        examples: [],
        commonUsage: [],
        source: 'dynamic',
        confidence: 'high',
      };

      const fieldWithNullPaths: FieldDefinition = {
        id: 'customfield_10004',
        name: 'Field With Null Paths',
        description: 'Field with null access paths',
        type: 'string',
        accessPaths: [
          { path: '', description: '', type: 'string', frequency: 'low' },
          null as any,
          undefined as any,
        ],
        examples: [],
        commonUsage: [],
        source: 'dynamic',
        confidence: 'high',
      };

      // Act
      const result = (hybridHandler as any).fuseFieldDefinitions(
        mockStaticDefinition,
        [fieldWithoutPaths, fieldWithNullPaths, ...mockDynamicFields]
      );

      // Assert
      expect(result.fields['customfield_10003']).toEqual(fieldWithoutPaths);
      expect(result.fields['customfield_10004']).toEqual(fieldWithNullPaths);
      expect(result.totalFields).toBe(
        mockStaticDefinition.totalFields + mockDynamicFields.length + 2
      );

      // Check that no invalid paths were added to pathIndex
      expect(result.pathIndex['']).toBeUndefined();
    });

    it('should validate input parameters and throw errors for invalid inputs', () => {
      // Test invalid static definition
      expect(() =>
        (hybridHandler as any).fuseFieldDefinitions(null, mockDynamicFields)
      ).toThrow('Invalid static definition provided for fusion');

      expect(() =>
        (hybridHandler as any).fuseFieldDefinitions(
          undefined,
          mockDynamicFields
        )
      ).toThrow('Invalid static definition provided for fusion');

      expect(() =>
        (hybridHandler as any).fuseFieldDefinitions(
          'invalid',
          mockDynamicFields
        )
      ).toThrow('Invalid static definition provided for fusion');
    });

    it('should handle non-array dynamic fields gracefully', async () => {
      // Arrange
      const mockLoggerWarn = jest
        .spyOn(require('@/utils/logger.js').logger, 'warn')
        .mockImplementation();

      // Act
      const result = (hybridHandler as any).fuseFieldDefinitions(
        mockStaticDefinition,
        'not an array' as any
      );

      // Assert
      expect(result.totalFields).toBe(mockStaticDefinition.totalFields);
      expect(result.dynamicFields).toBe(0);
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        'Invalid dynamic fields array, using empty array',
        expect.any(Object)
      );

      mockLoggerWarn.mockRestore();
    });

    it('should preserve original static definition properties', async () => {
      // Act
      const result = (hybridHandler as any).fuseFieldDefinitions(
        mockStaticDefinition,
        mockDynamicFields
      );

      // Assert
      expect(result.uri).toBe(mockStaticDefinition.uri);
      expect(result.entityType).toBe(mockStaticDefinition.entityType);
      expect(result.version).toBe(mockStaticDefinition.version);
      expect(result.lastUpdated).not.toBe(mockStaticDefinition.lastUpdated); // Should be updated
      expect(
        new Date(result.lastUpdated) >
          new Date(mockStaticDefinition.lastUpdated)
      ).toBe(true);
    });

    it('should create proper enhanced metadata', async () => {
      // Act
      const result = (hybridHandler as any).fuseFieldDefinitions(
        mockStaticDefinition,
        mockDynamicFields
      );

      // Assert
      expect(result.dynamicFields).toBe(mockDynamicFields.length);
      expect(result.lastDynamicUpdate).toBeDefined();
      expect(typeof result.lastDynamicUpdate).toBe('string');
      expect(new Date(result.lastDynamicUpdate)).toBeInstanceOf(Date);

      // Verify the enhanced properties exist
      expect(result).toHaveProperty('totalFields');
      expect(result).toHaveProperty('dynamicFields');
      expect(result).toHaveProperty('lastDynamicUpdate');
    });
  });

  describe('buildDynamicPathIndex', () => {
    it('should create correct path index from dynamic fields', async () => {
      // Arrange
      const dynamicFieldsMap = mockDynamicFields.reduce(
        (acc, field) => {
          acc[field.id] = field;
          return acc;
        },
        {} as Record<string, FieldDefinition>
      );

      // Act
      const pathIndex = (hybridHandler as any).buildDynamicPathIndex(
        dynamicFieldsMap
      );

      // Assert
      expect(pathIndex['customfield_10001']).toBe('customfield_10001');
      expect(pathIndex['customfield_10002']).toBe('customfield_10002');
      expect(pathIndex['customfield_10002.key']).toBe('customfield_10002');
    });

    it('should handle empty dynamic fields object', async () => {
      // Act
      const pathIndex = (hybridHandler as any).buildDynamicPathIndex({});

      // Assert
      expect(pathIndex).toEqual({});
      expect(Object.keys(pathIndex)).toHaveLength(0);
    });

    it('should handle fields with no access paths', async () => {
      // Arrange
      const fieldWithoutPaths: FieldDefinition = {
        id: 'customfield_10005',
        name: 'No Paths Field',
        description: 'Field without access paths',
        type: 'string',
        accessPaths: [],
        examples: [],
        commonUsage: [],
        source: 'dynamic',
        confidence: 'high',
      };

      const dynamicFieldsMap = {
        customfield_10005: fieldWithoutPaths,
      };

      // Act
      const pathIndex = (hybridHandler as any).buildDynamicPathIndex(
        dynamicFieldsMap
      );

      // Assert
      expect(pathIndex).toEqual({});
    });

    it('should handle multiple paths for single field correctly', async () => {
      // Arrange
      const complexField: FieldDefinition = {
        id: 'customfield_10006',
        name: 'Complex Field',
        description: 'Field with multiple access paths',
        type: 'object',
        accessPaths: [
          {
            path: 'customfield_10006',
            description: 'Root access',
            type: 'object',
            frequency: 'high',
          },
          {
            path: 'customfield_10006.value',
            description: 'Value access',
            type: 'string',
            frequency: 'high',
          },
          {
            path: 'customfield_10006.nested.property',
            description: 'Nested access',
            type: 'string',
            frequency: 'medium',
          },
        ],
        examples: ['customfield_10006.value'],
        commonUsage: [['customfield_10006.value']],
        source: 'dynamic',
        confidence: 'high',
      };

      const dynamicFieldsMap = {
        customfield_10006: complexField,
      };

      // Act
      const pathIndex = (hybridHandler as any).buildDynamicPathIndex(
        dynamicFieldsMap
      );

      // Assert
      expect(pathIndex['customfield_10006']).toBe('customfield_10006');
      expect(pathIndex['customfield_10006.value']).toBe('customfield_10006');
      expect(pathIndex['customfield_10006.nested.property']).toBe(
        'customfield_10006'
      );
      expect(Object.keys(pathIndex)).toHaveLength(3);
    });
  });

  describe('Integration - Full Fusion Process', () => {
    it('should perform complete fusion workflow with both static and dynamic fields', async () => {
      // Arrange
      const expectedStaticFieldCount = Object.keys(
        mockStaticDefinition.fields
      ).length;
      const expectedDynamicFieldCount = mockDynamicFields.length;
      const expectedTotalFields =
        expectedStaticFieldCount + expectedDynamicFieldCount;
      const expectedTotalPaths =
        Object.keys(mockStaticDefinition.pathIndex).length +
        mockDynamicFields.reduce(
          (count, field) => count + field.accessPaths.length,
          0
        );

      // Act
      const result = (hybridHandler as any).fuseFieldDefinitions(
        mockStaticDefinition,
        mockDynamicFields
      );

      // Assert comprehensive integration
      expect(result.totalFields).toBe(expectedTotalFields);
      expect(result.dynamicFields).toBe(expectedDynamicFieldCount);
      expect(Object.keys(result.fields)).toHaveLength(expectedTotalFields);
      expect(Object.keys(result.pathIndex)).toHaveLength(expectedTotalPaths);

      // Verify static fields integrity
      for (const [fieldId, fieldDef] of Object.entries(
        mockStaticDefinition.fields
      )) {
        expect(result.fields[fieldId]).toEqual(fieldDef);
      }

      // Verify dynamic fields integration
      for (const dynamicField of mockDynamicFields) {
        expect(result.fields[dynamicField.id]).toEqual(dynamicField);
      }

      // Verify path index completeness
      for (const [path, fieldId] of Object.entries(
        mockStaticDefinition.pathIndex
      )) {
        expect(result.pathIndex[path]).toBe(fieldId);
      }

      for (const dynamicField of mockDynamicFields) {
        for (const accessPath of dynamicField.accessPaths) {
          expect(result.pathIndex[accessPath.path]).toBe(dynamicField.id);
        }
      }
    });
  });
});
