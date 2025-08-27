/**
 * @file field-filter.test.ts
 * @description Tests for the FieldFilter utility that provides client-side field filtering
 * with support for dot-notation nested field access and different entity types.
 */

import { FieldFilter, FieldFilterOptions } from '@/utils/field-filter.js';

describe('FieldFilter', () => {
  // Test data for different entity types
  const sampleIssueData = {
    id: '12345',
    key: 'TEST-123',
    summary: 'Test issue summary',
    description: 'Test issue description',
    status: {
      name: 'In Progress',
      statusCategory: {
        key: 'indeterminate',
        name: 'In Progress'
      }
    },
    assignee: {
      displayName: 'John Doe',
      emailAddress: 'john.doe@example.com',
      active: true,
      accountId: '12345'
    },
    reporter: {
      displayName: 'Jane Smith',
      emailAddress: 'jane.smith@example.com'
    },
    priority: {
      name: 'High',
      id: '2'
    },
    project: {
      key: 'TEST',
      name: 'Test Project',
      projectCategory: {
        name: 'Development',
        id: '1'
      }
    },
    components: [
      { name: 'Component 1', id: '1' },
      { name: 'Component 2', id: '2' }
    ],
    customfield_10001: 'Sprint 1',
    customfield_10002: {
      value: 'Epic Value',
      id: 'epic-123'
    },
    created: '2024-01-15T10:00:00.000Z',
    updated: '2024-01-15T15:30:00.000Z'
  };

  const sampleProjectData = {
    id: '10001',
    key: 'TEST',
    name: 'Test Project',
    description: 'A test project',
    lead: {
      displayName: 'Project Lead',
      emailAddress: 'lead@example.com'
    },
    projectCategory: {
      name: 'Development',
      id: '1'
    },
    components: [
      { name: 'Frontend', id: '1' },
      { name: 'Backend', id: '2' }
    ],
    versions: [
      { name: '1.0.0', id: '1' },
      { name: '2.0.0', id: '2' }
    ]
  };

  const sampleUserData = {
    accountId: '12345',
    displayName: 'John Doe',
    emailAddress: 'john.doe@example.com',
    active: true,
    locale: 'en_US',
    timeZone: 'America/New_York',
    groups: {
      items: [
        { name: 'jira-developers', groupId: 'dev-1' },
        { name: 'jira-users', groupId: 'users-1' }
      ]
    }
  };

  const defaultOptions: FieldFilterOptions = {
    entityType: 'issue',
    respectNesting: true,
    logFiltering: false
  };

  describe('Basic field filtering', () => {
    it('should return original response when no fields specified', () => {
      const result = FieldFilter.filterFields(sampleIssueData, [], defaultOptions);
      expect(result).toEqual(sampleIssueData);
    });

    it('should return original response when requestedFields is null', () => {
      const result = FieldFilter.filterFields(sampleIssueData, null as any, defaultOptions);
      expect(result).toEqual(sampleIssueData);
    });

    it('should return original response when requestedFields is undefined', () => {
      const result = FieldFilter.filterFields(sampleIssueData, undefined as any, defaultOptions);
      expect(result).toEqual(sampleIssueData);
    });

    it('should filter simple flat fields', () => {
      const requestedFields = ['id', 'key', 'summary'];
      const result = FieldFilter.filterFields(sampleIssueData, requestedFields, defaultOptions);
      
      expect(result).toEqual({
        id: '12345',
        key: 'TEST-123',
        summary: 'Test issue summary'
      });
    });

    it('should handle missing fields gracefully by not including them', () => {
      const requestedFields = ['id', 'nonexistentField', 'summary'];
      const result = FieldFilter.filterFields(sampleIssueData, requestedFields, defaultOptions);
      
      expect(result).toEqual({
        id: '12345',
        summary: 'Test issue summary'
      });
      expect(result).not.toHaveProperty('nonexistentField');
    });
  });

  describe('Nested field filtering with dot notation', () => {
    it('should extract nested field values using dot notation', () => {
      const requestedFields = ['status.name', 'assignee.displayName', 'project.key'];
      const result = FieldFilter.filterFields(sampleIssueData, requestedFields, defaultOptions);
      
      expect(result).toEqual({
        status: {
          name: 'In Progress'
        },
        assignee: {
          displayName: 'John Doe'
        },
        project: {
          key: 'TEST'
        }
      });
    });

    it('should handle deeply nested paths', () => {
      const requestedFields = ['status.statusCategory.key', 'project.projectCategory.name'];
      const result = FieldFilter.filterFields(sampleIssueData, requestedFields, defaultOptions);
      
      expect(result).toEqual({
        status: {
          statusCategory: {
            key: 'indeterminate'
          }
        },
        project: {
          projectCategory: {
            name: 'Development'
          }
        }
      });
    });

    it('should handle missing nested paths gracefully', () => {
      const requestedFields = ['status.nonexistent.field', 'assignee.displayName'];
      const result = FieldFilter.filterFields(sampleIssueData, requestedFields, defaultOptions);
      
      expect(result).toEqual({
        assignee: {
          displayName: 'John Doe'
        }
      });
      expect(result.status).toBeUndefined();
    });

    it('should preserve nested structure when multiple paths from same object', () => {
      const requestedFields = ['assignee.displayName', 'assignee.emailAddress', 'assignee.active'];
      const result = FieldFilter.filterFields(sampleIssueData, requestedFields, defaultOptions);
      
      expect(result).toEqual({
        assignee: {
          displayName: 'John Doe',
          emailAddress: 'john.doe@example.com',
          active: true
        }
      });
    });
  });

  describe('Array handling', () => {
    it('should handle array fields', () => {
      const requestedFields = ['components'];
      const result = FieldFilter.filterFields(sampleIssueData, requestedFields, defaultOptions);
      
      expect(result).toEqual({
        components: [
          { name: 'Component 1', id: '1' },
          { name: 'Component 2', id: '2' }
        ]
      });
    });

    it('should handle nested array access notation', () => {
      const requestedFields = ['components[].name'];
      const result = FieldFilter.filterFields(sampleIssueData, requestedFields, defaultOptions);
      
      // Note: Basic implementation may not support array indexing
      // This test verifies the graceful handling
      expect(result).toEqual({});
    });

    it('should handle mixed field types including arrays', () => {
      const requestedFields = ['summary', 'components', 'assignee.displayName'];
      const result = FieldFilter.filterFields(sampleIssueData, requestedFields, defaultOptions);
      
      expect(result).toEqual({
        summary: 'Test issue summary',
        components: [
          { name: 'Component 1', id: '1' },
          { name: 'Component 2', id: '2' }
        ],
        assignee: {
          displayName: 'John Doe'
        }
      });
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle null input object', () => {
      const requestedFields = ['field1', 'field2'];
      const result = FieldFilter.filterFields(null, requestedFields, defaultOptions);
      expect(result).toBeNull();
    });

    it('should handle undefined input object', () => {
      const requestedFields = ['field1', 'field2'];
      const result = FieldFilter.filterFields(undefined, requestedFields, defaultOptions);
      expect(result).toBeUndefined();
    });

    it('should handle primitive input values gracefully', () => {
      const requestedFields = ['field1'];
      const result = FieldFilter.filterFields('string value', requestedFields, defaultOptions);
      expect(result).toBe('string value');
    });

    it('should handle empty object input', () => {
      const requestedFields = ['field1', 'field2'];
      const result = FieldFilter.filterFields({}, requestedFields, defaultOptions);
      expect(result).toEqual({});
    });

    it('should handle special characters in field names', () => {
      const dataWithSpecialFields = {
        'field-with-dash': 'value1',
        'field_with_underscore': 'value2',
        'field.with.dots': 'value3',
        'customfield_10001': 'custom value'
      };
      
      const requestedFields = ['field-with-dash', 'customfield_10001'];
      const result = FieldFilter.filterFields(dataWithSpecialFields, requestedFields, defaultOptions);
      
      expect(result).toEqual({
        'field-with-dash': 'value1',
        'customfield_10001': 'custom value'
      });
    });
  });

  describe('Different entity types', () => {
    it('should handle project entity type', () => {
      const options: FieldFilterOptions = { entityType: 'project', respectNesting: true };
      const requestedFields = ['key', 'name', 'lead.displayName'];
      
      const result = FieldFilter.filterFields(sampleProjectData, requestedFields, options);
      
      expect(result).toEqual({
        key: 'TEST',
        name: 'Test Project',
        lead: {
          displayName: 'Project Lead'
        }
      });
    });

    it('should handle user entity type', () => {
      const options: FieldFilterOptions = { entityType: 'user', respectNesting: true };
      const requestedFields = ['displayName', 'emailAddress', 'groups.items'];
      
      const result = FieldFilter.filterFields(sampleUserData, requestedFields, options);
      
      expect(result).toEqual({
        displayName: 'John Doe',
        emailAddress: 'john.doe@example.com',
        groups: {
          items: [
            { name: 'jira-developers', groupId: 'dev-1' },
            { name: 'jira-users', groupId: 'users-1' }
          ]
        }
      });
    });

    it('should handle agile entity type', () => {
      const sprintData = {
        id: 1,
        name: 'Sprint 1',
        state: 'active',
        startDate: '2024-01-01',
        endDate: '2024-01-14',
        originBoardId: 123,
        goal: 'Complete user stories'
      };
      
      const options: FieldFilterOptions = { entityType: 'agile', respectNesting: true };
      const requestedFields = ['name', 'state', 'startDate'];
      
      const result = FieldFilter.filterFields(sprintData, requestedFields, options);
      
      expect(result).toEqual({
        name: 'Sprint 1',
        state: 'active',
        startDate: '2024-01-01'
      });
    });

    it('should handle system entity type', () => {
      const systemData = {
        version: '8.20.0',
        serverTitle: 'Test Jira Instance',
        baseUrl: 'https://jira.example.com',
        build: '820000',
        serverTime: '2024-01-15T10:00:00.000Z'
      };
      
      const options: FieldFilterOptions = { entityType: 'system', respectNesting: true };
      const requestedFields = ['version', 'serverTitle'];
      
      const result = FieldFilter.filterFields(systemData, requestedFields, options);
      
      expect(result).toEqual({
        version: '8.20.0',
        serverTitle: 'Test Jira Instance'
      });
    });
  });

  describe('Logging functionality', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log filtering when enabled', () => {
      const options: FieldFilterOptions = {
        entityType: 'issue',
        respectNesting: true,
        logFiltering: true
      };
      
      const requestedFields = ['id', 'summary'];
      FieldFilter.filterFields(sampleIssueData, requestedFields, options);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Client-side filtering applied for issue:',
        requestedFields
      );
    });

    it('should not log when disabled', () => {
      const options: FieldFilterOptions = {
        entityType: 'issue',
        respectNesting: true,
        logFiltering: false
      };
      
      const requestedFields = ['id', 'summary'];
      FieldFilter.filterFields(sampleIssueData, requestedFields, options);
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should not log when logFiltering is undefined', () => {
      const options: FieldFilterOptions = {
        entityType: 'issue',
        respectNesting: true
      };
      
      const requestedFields = ['id', 'summary'];
      FieldFilter.filterFields(sampleIssueData, requestedFields, options);
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('respectNesting option', () => {
    it('should respect nesting when enabled (default)', () => {
      const options: FieldFilterOptions = {
        entityType: 'issue',
        respectNesting: true
      };
      
      const requestedFields = ['assignee.displayName', 'assignee.emailAddress'];
      const result = FieldFilter.filterFields(sampleIssueData, requestedFields, options);
      
      expect(result).toEqual({
        assignee: {
          displayName: 'John Doe',
          emailAddress: 'john.doe@example.com'
        }
      });
    });

    it('should work when respectNesting is undefined (default behavior)', () => {
      const options: FieldFilterOptions = {
        entityType: 'issue'
      };
      
      const requestedFields = ['assignee.displayName'];
      const result = FieldFilter.filterFields(sampleIssueData, requestedFields, options);
      
      expect(result).toEqual({
        assignee: {
          displayName: 'John Doe'
        }
      });
    });
  });

  describe('Performance with large objects', () => {
    it('should handle large objects efficiently', () => {
      // Create a large object with many fields
      const largeObject: Record<string, any> = {};
      
      // Add 100 simple fields
      for (let i = 0; i < 100; i++) {
        largeObject[`field_${i}`] = `value_${i}`;
      }
      
      // Add 50 nested objects
      for (let i = 0; i < 50; i++) {
        largeObject[`nested_${i}`] = {
          id: i,
          name: `nested_name_${i}`,
          data: {
            value: `nested_value_${i}`,
            metadata: {
              created: new Date().toISOString(),
              id: i
            }
          }
        };
      }
      
      // Add 20 arrays
      for (let i = 0; i < 20; i++) {
        largeObject[`array_${i}`] = Array.from({ length: 10 }, (_, j) => ({
          id: j,
          value: `array_${i}_item_${j}`
        }));
      }
      
      const requestedFields = [
        'field_1', 'field_50', 'field_99',
        'nested_1.name', 'nested_25.data.value', 'nested_49.data.metadata.id',
        'array_5', 'array_15'
      ];
      
      const startTime = Date.now();
      const result = FieldFilter.filterFields(largeObject, requestedFields, defaultOptions);
      const endTime = Date.now();
      
      // Performance check - should complete within reasonable time (100ms)
      expect(endTime - startTime).toBeLessThan(100);
      
      // Verify correct filtering
      expect(result).toEqual({
        field_1: 'value_1',
        field_50: 'value_50',
        field_99: 'value_99',
        nested_1: {
          name: 'nested_name_1'
        },
        nested_25: {
          data: {
            value: 'nested_value_25'
          }
        },
        nested_49: {
          data: {
            metadata: {
              id: 49
            }
          }
        },
        array_5: largeObject.array_5,
        array_15: largeObject.array_15
      });
    });
  });

  describe('Custom field support', () => {
    it('should handle custom fields with standard naming', () => {
      const requestedFields = ['customfield_10001', 'customfield_10002'];
      const result = FieldFilter.filterFields(sampleIssueData, requestedFields, defaultOptions);
      
      expect(result).toEqual({
        customfield_10001: 'Sprint 1',
        customfield_10002: {
          value: 'Epic Value',
          id: 'epic-123'
        }
      });
    });

    it('should handle nested access to custom field objects', () => {
      const requestedFields = ['customfield_10002.value', 'customfield_10002.id'];
      const result = FieldFilter.filterFields(sampleIssueData, requestedFields, defaultOptions);
      
      expect(result).toEqual({
        customfield_10002: {
          value: 'Epic Value',
          id: 'epic-123'
        }
      });
    });
  });

  describe('Complex field combinations', () => {
    it('should handle mixed field types in single request', () => {
      const requestedFields = [
        'id',                              // Simple field
        'status.name',                     // Nested field
        'assignee.displayName',            // Nested field from different object
        'components',                      // Array field
        'customfield_10001',               // Custom field
        'project.projectCategory.name'     // Deeply nested field
      ];
      
      const result = FieldFilter.filterFields(sampleIssueData, requestedFields, defaultOptions);
      
      expect(result).toEqual({
        id: '12345',
        status: {
          name: 'In Progress'
        },
        assignee: {
          displayName: 'John Doe'
        },
        components: [
          { name: 'Component 1', id: '1' },
          { name: 'Component 2', id: '2' }
        ],
        customfield_10001: 'Sprint 1',
        project: {
          projectCategory: {
            name: 'Development'
          }
        }
      });
    });

    it('should handle overlapping nested paths efficiently', () => {
      const requestedFields = [
        'status.name',
        'status.statusCategory.key',
        'status.statusCategory.name'
      ];
      
      const result = FieldFilter.filterFields(sampleIssueData, requestedFields, defaultOptions);
      
      expect(result).toEqual({
        status: {
          name: 'In Progress',
          statusCategory: {
            key: 'indeterminate',
            name: 'In Progress'
          }
        }
      });
    });
  });
});