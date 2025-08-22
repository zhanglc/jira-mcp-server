/**
 * Field Selection Test Utilities
 *
 * Specialized utilities for testing field selection and filtering functionality.
 */

/**
 * Field Selection Test Data Generator
 */
export class FieldSelectionTestData {
  /**
   * Generate comprehensive test scenarios for field selection
   */
  static getTestScenarios() {
    return {
      simple: {
        description: 'Simple field selection',
        requestedFields: ['summary', 'status', 'priority'],
        availableFields: [
          'summary',
          'status',
          'priority',
          'description',
          'assignee',
        ],
        expectedValid: ['summary', 'status', 'priority'],
        expectedInvalid: [],
        expectedNested: [],
      },

      nested: {
        description: 'Nested field selection with dot notation',
        requestedFields: ['assignee.displayName', 'project.key', 'status.name'],
        availableFields: ['assignee', 'project', 'status', 'summary'],
        expectedValid: ['assignee.displayName', 'project.key', 'status.name'],
        expectedInvalid: [],
        expectedNested: ['assignee.displayName', 'project.key', 'status.name'],
      },

      deepNested: {
        description: 'Deep nested field selection',
        requestedFields: [
          'project.lead.displayName',
          'project.lead.emailAddress',
          'assignee.groups.items[0].name',
          'status.statusCategory.name',
        ],
        availableFields: ['project', 'assignee', 'status'],
        expectedValid: [
          'project.lead.displayName',
          'project.lead.emailAddress',
          'assignee.groups.items[0].name',
          'status.statusCategory.name',
        ],
        expectedInvalid: [],
        expectedNested: [
          'project.lead.displayName',
          'project.lead.emailAddress',
          'assignee.groups.items[0].name',
          'status.statusCategory.name',
        ],
      },

      arrayAccess: {
        description: 'Array field access patterns',
        requestedFields: [
          'components[0].name',
          'components[*].description',
          'fixVersions[0].releaseDate',
          'labels[*]',
        ],
        availableFields: ['components', 'fixVersions', 'labels'],
        expectedValid: [
          'components[0].name',
          'components[*].description',
          'fixVersions[0].releaseDate',
          'labels[*]',
        ],
        expectedInvalid: [],
        expectedNested: [
          'components[0].name',
          'components[*].description',
          'fixVersions[0].releaseDate',
          'labels[*]',
        ],
      },

      mixed: {
        description: 'Mixed valid and invalid fields',
        requestedFields: [
          'summary', // Valid simple
          'assignee.displayName', // Valid nested
          'nonexistent', // Invalid
          'project.invalid', // Invalid nested
          'status.name', // Valid nested
        ],
        availableFields: ['summary', 'assignee', 'project', 'status'],
        expectedValid: ['summary', 'assignee.displayName', 'status.name'],
        expectedInvalid: ['nonexistent', 'project.invalid'],
        expectedNested: ['assignee.displayName', 'status.name'],
      },

      invalid: {
        description: 'All invalid field selections',
        requestedFields: [
          'nonexistent',
          'invalid.field',
          'missing.deeply.nested',
        ],
        availableFields: ['summary', 'status', 'assignee'],
        expectedValid: [],
        expectedInvalid: [
          'nonexistent',
          'invalid.field',
          'missing.deeply.nested',
        ],
        expectedNested: ['invalid.field', 'missing.deeply.nested'],
      },

      empty: {
        description: 'Empty field selection',
        requestedFields: [],
        availableFields: ['summary', 'status', 'assignee'],
        expectedValid: [],
        expectedInvalid: [],
        expectedNested: [],
      },

      allFields: {
        description: 'Request all available fields',
        requestedFields: ['*'],
        availableFields: ['summary', 'status', 'assignee', 'project'],
        expectedValid: ['summary', 'status', 'assignee', 'project'],
        expectedInvalid: [],
        expectedNested: [],
      },
    };
  }

  /**
   * Generate performance test scenarios
   */
  static getPerformanceScenarios() {
    const largeFieldSet = Array.from({ length: 100 }, (_, i) => `field${i}`);
    const deepNestedFields = Array.from(
      { length: 50 },
      (_, i) => `level1.level2.level3.level4.field${i}`
    );

    return {
      largeFieldSet: {
        description: 'Large number of simple fields',
        requestedFields: largeFieldSet,
        availableFields: largeFieldSet,
        expectedExecutionTime: 100, // milliseconds
      },

      deepNesting: {
        description: 'Deep nested field access',
        requestedFields: deepNestedFields,
        availableFields: ['level1'],
        expectedExecutionTime: 200, // milliseconds
      },

      complexMixed: {
        description: 'Complex mixed field types',
        requestedFields: [
          ...largeFieldSet.slice(0, 25),
          ...deepNestedFields.slice(0, 25),
          'array[0].nested.field',
          'array[*].nested.deep.field',
        ],
        availableFields: [...largeFieldSet.slice(0, 25), 'level1', 'array'],
        expectedExecutionTime: 300, // milliseconds
      },
    };
  }
}

/**
 * Field Selection Validation Utilities
 */
export class FieldSelectionValidator {
  /**
   * Validate that field selection works correctly
   */
  static validateFieldSelection(
    result: any,
    requestedFields: string[],
    _originalData: any
  ): {
    success: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if result contains only requested fields
    for (const field of requestedFields) {
      if (field.includes('.')) {
        // Handle nested fields
        const fieldPath = field.split('.');
        let current = result;
        let valid = true;

        for (let i = 0; i < fieldPath.length; i++) {
          const segment = fieldPath[i];

          if (current === null || current === undefined) {
            valid = false;
            break;
          }

          if (segment.includes('[')) {
            // Handle array access
            const [arrayField, indexPart] = segment.split('[');
            const index = indexPart.replace(']', '');

            if (!current[arrayField]) {
              valid = false;
              break;
            }

            if (index === '*') {
              // Wildcard access - check if array exists
              if (!Array.isArray(current[arrayField])) {
                valid = false;
                break;
              }
              // For wildcard, we check the first element
              current = current[arrayField][0];
            } else {
              // Specific index access
              const idx = parseInt(index);
              if (
                !Array.isArray(current[arrayField]) ||
                !current[arrayField][idx]
              ) {
                valid = false;
                break;
              }
              current = current[arrayField][idx];
            }
          } else {
            if (!Object.prototype.hasOwnProperty.call(current, segment)) {
              valid = false;
              break;
            }
            current = current[segment];
          }
        }

        if (!valid) {
          warnings.push(
            `Nested field '${field}' not found or incomplete in result`
          );
        }
      } else {
        // Handle simple fields
        if (!Object.prototype.hasOwnProperty.call(result, field)) {
          warnings.push(`Simple field '${field}' not found in result`);
        }
      }
    }

    // Check for unexpected fields in result
    const resultFields = this.getFieldPaths(result);
    const expectedPaths = this.expandFieldPaths(requestedFields);

    for (const resultField of resultFields) {
      if (
        !expectedPaths.some(
          expected =>
            resultField.startsWith(expected) || expected.startsWith(resultField)
        )
      ) {
        warnings.push(`Unexpected field '${resultField}' found in result`);
      }
    }

    return {
      success: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get all field paths from an object
   */
  private static getFieldPaths(obj: any, prefix: string = ''): string[] {
    const paths: string[] = [];

    if (obj === null || obj === undefined || typeof obj !== 'object') {
      return paths;
    }

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = prefix ? `${prefix}.${key}` : key;
      paths.push(currentPath);

      if (Array.isArray(value)) {
        // Handle arrays
        if (value.length > 0) {
          const arrayPaths = this.getFieldPaths(value[0], currentPath + '[0]');
          paths.push(...arrayPaths);
        }
      } else if (typeof value === 'object' && value !== null) {
        // Handle nested objects
        const nestedPaths = this.getFieldPaths(value, currentPath);
        paths.push(...nestedPaths);
      }
    }

    return paths;
  }

  /**
   * Expand field paths to include all possible variations
   */
  private static expandFieldPaths(fields: string[]): string[] {
    const expanded: string[] = [];

    for (const field of fields) {
      expanded.push(field);

      // Handle wildcards
      if (field.includes('[*]')) {
        expanded.push(field.replace('[*]', '[0]'));
      }

      // Handle nested paths - add partial paths
      const parts = field.split('.');
      for (let i = 1; i < parts.length; i++) {
        expanded.push(parts.slice(0, i).join('.'));
      }
    }

    return expanded;
  }
}

/**
 * Performance Testing Utilities
 */
export class FieldSelectionPerformanceTester {
  /**
   * Measure field selection performance
   */
  static async measureFieldSelectionPerformance<T>(
    selectionFn: (fields: string[]) => Promise<T>,
    fields: string[],
    iterations: number = 10
  ): Promise<{
    averageTime: number;
    minTime: number;
    maxTime: number;
    results: T[];
  }> {
    const times: number[] = [];
    const results: T[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      const result = await selectionFn(fields);
      const end = process.hrtime.bigint();

      const time = Number(end - start) / 1_000_000; // Convert to milliseconds
      times.push(time);
      results.push(result);
    }

    return {
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      results,
    };
  }

  /**
   * Memory usage testing for field selection
   */
  static measureMemoryUsage<T>(
    selectionFn: (fields: string[]) => T,
    fields: string[]
  ): {
    result: T;
    memoryUsed: number;
  } {
    const memBefore = process.memoryUsage().heapUsed;
    const result = selectionFn(fields);
    const memAfter = process.memoryUsage().heapUsed;

    return {
      result,
      memoryUsed: memAfter - memBefore,
    };
  }
}

/**
 * Mock Data Generator for Field Selection Testing
 */
export class FieldSelectionMockData {
  /**
   * Generate mock Jira issue with comprehensive field structure
   */
  static generateComplexIssue(issueKey: string = 'TEST-123') {
    return {
      id: '10001',
      key: issueKey,
      self: `https://test.atlassian.net/rest/api/2/issue/${issueKey}`,
      fields: {
        summary: 'Test Issue with Complex Structure',
        description: 'This is a test issue with nested data structures',
        status: {
          id: '1',
          name: 'Open',
          description: 'The issue is open',
          statusCategory: {
            id: 2,
            key: 'new',
            colorName: 'blue-gray',
            name: 'To Do',
          },
        },
        priority: {
          id: '3',
          name: 'Medium',
          description: 'Medium priority',
          iconUrl:
            'https://test.atlassian.net/images/icons/priorities/medium.svg',
        },
        assignee: {
          name: 'testuser',
          key: 'testuser',
          displayName: 'Test User',
          emailAddress: 'test@example.com',
          active: true,
          avatarUrls: {
            '16x16': 'https://test.atlassian.net/avatar/16',
            '24x24': 'https://test.atlassian.net/avatar/24',
          },
          groups: {
            size: 2,
            items: [
              { id: '1', name: 'jira-users' },
              { id: '2', name: 'developers' },
            ],
          },
        },
        reporter: {
          name: 'reporter',
          displayName: 'Issue Reporter',
          emailAddress: 'reporter@example.com',
        },
        project: {
          id: '10000',
          key: 'TEST',
          name: 'Test Project',
          description: 'Test project description',
          lead: {
            name: 'projectlead',
            displayName: 'Project Lead',
            emailAddress: 'lead@example.com',
          },
          components: [
            {
              id: '10001',
              name: 'Frontend',
              description: 'Frontend components',
              lead: {
                name: 'frontendlead',
                displayName: 'Frontend Lead',
              },
            },
            {
              id: '10002',
              name: 'Backend',
              description: 'Backend components',
            },
          ],
        },
        components: [
          {
            id: '10001',
            name: 'Frontend',
            description: 'Frontend components',
          },
        ],
        fixVersions: [
          {
            id: '10000',
            name: 'Version 1.0',
            description: 'First release',
            released: false,
            archived: false,
            releaseDate: '2023-12-31',
          },
        ],
        versions: [
          {
            id: '10001',
            name: 'Version 0.9',
            released: true,
          },
        ],
        labels: ['bug', 'critical', 'frontend'],
        created: '2023-01-01T10:00:00.000Z',
        updated: '2023-01-02T15:30:00.000Z',
        resolutiondate: null,
        duedate: '2023-01-15',
        timeoriginalestimate: 7200,
        timeestimate: 3600,
        timespent: 1800,
        worklog: {
          startAt: 0,
          maxResults: 20,
          total: 1,
          worklogs: [
            {
              id: '10000',
              author: {
                name: 'testuser',
                displayName: 'Test User',
              },
              comment: 'Initial work on the issue',
              started: '2023-01-01T09:00:00.000Z',
              timeSpent: '30m',
              timeSpentSeconds: 1800,
            },
          ],
        },
        // Custom fields
        customfield_10001: 'Custom text value',
        customfield_10002: {
          value: 'Option 1',
          id: '10001',
        },
        customfield_10003: [
          { value: 'Multi 1', id: '20001' },
          { value: 'Multi 2', id: '20002' },
        ],
        customfield_10004: 42.5,
        customfield_10005: '2023-01-01',
        customfield_10006: {
          name: 'customuser',
          displayName: 'Custom User',
        },
      },
    };
  }

  /**
   * Generate mock data for specific field selection scenarios
   */
  static generateFieldSelectionScenarios() {
    const baseIssue = this.generateComplexIssue();

    return {
      simpleFields: {
        input: baseIssue,
        fields: ['summary', 'status', 'priority'],
        expected: {
          summary: baseIssue.fields.summary,
          status: baseIssue.fields.status,
          priority: baseIssue.fields.priority,
        },
      },

      nestedFields: {
        input: baseIssue,
        fields: ['assignee.displayName', 'project.key', 'status.name'],
        expected: {
          assignee: {
            displayName: baseIssue.fields.assignee.displayName,
          },
          project: {
            key: baseIssue.fields.project.key,
          },
          status: {
            name: baseIssue.fields.status.name,
          },
        },
      },

      arrayFields: {
        input: baseIssue,
        fields: ['components[0].name', 'fixVersions[*].name', 'labels[*]'],
        expected: {
          components: [
            {
              name: baseIssue.fields.components[0].name,
            },
          ],
          fixVersions: baseIssue.fields.fixVersions.map(v => ({
            name: v.name,
          })),
          labels: baseIssue.fields.labels,
        },
      },
    };
  }
}
