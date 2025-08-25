import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { JiraConfig } from '../../src/types/config-types.js';
import { ApiError } from '../../src/types/api-error.js';
import { JiraField } from '../../src/types/jira-types.js';

// Mock the jira-client module
const mockJiraClient = {
  listFields: jest.fn()
};

jest.mock('jira-client', () => {
  return jest.fn(() => mockJiraClient);
});

// Mock logger to avoid console output during tests
jest.mock('../../src/utils/logger.js', () => ({
  logger: {
    log: jest.fn(),
    error: jest.fn()
  }
}));

describe('searchFields Method - TDD Implementation', () => {
  let jiraClientWrapper: JiraClientWrapper;
  let mockConfig: JiraConfig;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    mockConfig = {
      url: 'https://test.atlassian.net',
      bearer: 'test-bearer-token'
    };
    
    jiraClientWrapper = new JiraClientWrapper(mockConfig);
  });

  describe('Basic searchFields functionality', () => {
    test('should successfully retrieve all fields when no query is provided', async () => {
      // Arrange
      const mockFieldsResponse: JiraField[] = [
        {
          id: 'summary',
          name: 'Summary',
          custom: false,
          orderable: true,
          navigable: true,
          searchable: true,
          clauseNames: ['summary'],
          schema: {
            type: 'string',
            system: 'summary'
          }
        },
        {
          id: 'status',
          name: 'Status',
          custom: false,
          orderable: false,
          navigable: true,
          searchable: true,
          clauseNames: ['status'],
          schema: {
            type: 'status',
            system: 'status'
          }
        },
        {
          id: 'customfield_10001',
          name: 'Custom Text Field',
          custom: true,
          orderable: true,
          navigable: true,
          searchable: true,
          clauseNames: ['cf[10001]', 'Custom Text Field'],
          schema: {
            type: 'string',
            custom: 'com.atlassian.jira.plugin.system.customfieldtypes:textfield',
            customId: 10001
          }
        }
      ];

      mockJiraClient.listFields.mockResolvedValue(mockFieldsResponse);

      // Act
      const result = await jiraClientWrapper.searchFields();

      // Assert
      expect(mockJiraClient.listFields).toHaveBeenCalledWith();
      expect(result).toEqual(mockFieldsResponse);
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Summary');
      expect(result[1].name).toBe('Status');
      expect(result[2].name).toBe('Custom Text Field');
    });

    test('should filter fields by query when query parameter is provided', async () => {
      // Arrange
      const query = 'summary';
      const mockFieldsResponse: JiraField[] = [
        {
          id: 'summary',
          name: 'Summary',
          custom: false,
          orderable: true,
          navigable: true,
          searchable: true,
          clauseNames: ['summary'],
          schema: {
            type: 'string',
            system: 'summary'
          }
        },
        {
          id: 'status',
          name: 'Status',
          custom: false,
          orderable: false,
          navigable: true,
          searchable: true,
          clauseNames: ['status'],
          schema: {
            type: 'status',
            system: 'status'
          }
        },
        {
          id: 'customfield_10001',
          name: 'Custom Summary Field',
          custom: true,
          orderable: true,
          navigable: true,
          searchable: true,
          clauseNames: ['cf[10001]', 'Custom Summary Field'],
          schema: {
            type: 'string',
            custom: 'com.atlassian.jira.plugin.system.customfieldtypes:textfield',
            customId: 10001
          }
        }
      ];

      mockJiraClient.listFields.mockResolvedValue(mockFieldsResponse);

      // Act
      const result = await jiraClientWrapper.searchFields(query);

      // Assert
      expect(mockJiraClient.listFields).toHaveBeenCalledWith();
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Summary');
      expect(result[1].name).toBe('Custom Summary Field');
      // Status should be filtered out as it doesn't contain 'summary'
      expect(result.find(field => field.name === 'Status')).toBeUndefined();
    });

    test('should handle case-insensitive filtering', async () => {
      // Arrange
      const query = 'CUSTOM';
      const mockFieldsResponse: JiraField[] = [
        {
          id: 'summary',
          name: 'Summary',
          custom: false,
          orderable: true,
          navigable: true,
          searchable: true,
          clauseNames: ['summary']
        },
        {
          id: 'customfield_10001',
          name: 'Custom Text Field',
          custom: true,
          orderable: true,
          navigable: true,
          searchable: true,
          clauseNames: ['cf[10001]', 'Custom Text Field']
        },
        {
          id: 'customfield_10002',
          name: 'custom number field',
          custom: true,
          orderable: true,
          navigable: true,
          searchable: true,
          clauseNames: ['cf[10002]', 'custom number field']
        }
      ];

      mockJiraClient.listFields.mockResolvedValue(mockFieldsResponse);

      // Act
      const result = await jiraClientWrapper.searchFields(query);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Custom Text Field');
      expect(result[1].name).toBe('custom number field');
    });

    test('should return empty array when no fields match the query', async () => {
      // Arrange
      const query = 'nonexistentfield';
      const mockFieldsResponse: JiraField[] = [
        {
          id: 'summary',
          name: 'Summary',
          custom: false,
          orderable: true,
          navigable: true,
          searchable: true,
          clauseNames: ['summary']
        },
        {
          id: 'status',
          name: 'Status',
          custom: false,
          orderable: false,
          navigable: true,
          searchable: true,
          clauseNames: ['status']
        }
      ];

      mockJiraClient.listFields.mockResolvedValue(mockFieldsResponse);

      // Act
      const result = await jiraClientWrapper.searchFields(query);

      // Assert
      expect(mockJiraClient.listFields).toHaveBeenCalledWith();
      expect(result).toEqual([]);
    });

    test('should handle empty query string by returning all fields', async () => {
      // Arrange
      const query = '';
      const mockFieldsResponse: JiraField[] = [
        {
          id: 'summary',
          name: 'Summary',
          custom: false,
          orderable: true,
          navigable: true,
          searchable: true,
          clauseNames: ['summary']
        }
      ];

      mockJiraClient.listFields.mockResolvedValue(mockFieldsResponse);

      // Act
      const result = await jiraClientWrapper.searchFields(query);

      // Assert
      expect(result).toEqual(mockFieldsResponse);
    });

    test('should handle whitespace-only query by returning all fields', async () => {
      // Arrange
      const query = '   ';
      const mockFieldsResponse: JiraField[] = [
        {
          id: 'summary',
          name: 'Summary',
          custom: false,
          orderable: true,
          navigable: true,
          searchable: true,
          clauseNames: ['summary']
        }
      ];

      mockJiraClient.listFields.mockResolvedValue(mockFieldsResponse);

      // Act
      const result = await jiraClientWrapper.searchFields(query);

      // Assert
      expect(result).toEqual(mockFieldsResponse);
    });
  });

  describe('Error handling scenarios', () => {
    test('should throw ApiError when listFields API call fails (403)', async () => {
      // Arrange
      const jiraError = {
        statusCode: 403,
        message: 'Forbidden - Insufficient permissions to view fields'
      };

      mockJiraClient.listFields.mockRejectedValue(jiraError);

      // Act & Assert
      await expect(jiraClientWrapper.searchFields()).rejects.toThrow(ApiError);
      await expect(jiraClientWrapper.searchFields()).rejects.toThrow('Jira API Error: Forbidden - Insufficient permissions to view fields');
      
      expect(mockJiraClient.listFields).toHaveBeenCalledWith();
    });

    test('should throw ApiError when authentication fails (401)', async () => {
      // Arrange
      const jiraError = {
        statusCode: 401,
        message: 'Unauthorized'
      };

      mockJiraClient.listFields.mockRejectedValue(jiraError);

      // Act & Assert
      await expect(jiraClientWrapper.searchFields('summary')).rejects.toThrow(ApiError);
      await expect(jiraClientWrapper.searchFields('summary')).rejects.toThrow('Jira API Error: Unauthorized');
    });

    test('should throw ApiError for network errors', async () => {
      // Arrange
      const networkError = new Error('Network Error - Connection timeout');

      mockJiraClient.listFields.mockRejectedValue(networkError);

      // Act & Assert
      await expect(jiraClientWrapper.searchFields()).rejects.toThrow(ApiError);
      await expect(jiraClientWrapper.searchFields()).rejects.toThrow('Jira API Error: Network Error - Connection timeout');
    });

    test('should throw ApiError for server errors (500)', async () => {
      // Arrange
      const serverError = {
        statusCode: 500,
        message: 'Internal Server Error'
      };

      mockJiraClient.listFields.mockRejectedValue(serverError);

      // Act & Assert
      await expect(jiraClientWrapper.searchFields('custom')).rejects.toThrow(ApiError);
      await expect(jiraClientWrapper.searchFields('custom')).rejects.toThrow('Jira API Error: Internal Server Error');
    });
  });

  describe('Edge cases and data validation', () => {
    test('should handle null response from listFields API', async () => {
      // Arrange
      mockJiraClient.listFields.mockResolvedValue(null);

      // Act
      const result = await jiraClientWrapper.searchFields();

      // Assert
      expect(result).toEqual([]);
    });

    test('should handle undefined response from listFields API', async () => {
      // Arrange
      mockJiraClient.listFields.mockResolvedValue(undefined);

      // Act
      const result = await jiraClientWrapper.searchFields();

      // Assert
      expect(result).toEqual([]);
    });

    test('should handle non-array response from listFields API', async () => {
      // Arrange
      mockJiraClient.listFields.mockResolvedValue({ message: 'Not an array' });

      // Act
      const result = await jiraClientWrapper.searchFields();

      // Assert
      expect(result).toEqual([]);
    });

    test('should handle empty array response from listFields API', async () => {
      // Arrange
      mockJiraClient.listFields.mockResolvedValue([]);

      // Act
      const result = await jiraClientWrapper.searchFields();

      // Assert
      expect(result).toEqual([]);
    });

    test('should handle special characters in query', async () => {
      // Arrange
      const query = 'custom-field_test[10001]';
      const mockFieldsResponse: JiraField[] = [
        {
          id: 'customfield_10001',
          name: 'custom-field_test[10001]',
          custom: true,
          orderable: true,
          navigable: true,
          searchable: true,
          clauseNames: ['cf[10001]']
        }
      ];

      mockJiraClient.listFields.mockResolvedValue(mockFieldsResponse);

      // Act
      const result = await jiraClientWrapper.searchFields(query);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('custom-field_test[10001]');
    });
  });

  describe('Field type validation scenarios', () => {
    test('should handle system fields correctly', async () => {
      // Arrange
      const mockSystemFields: JiraField[] = [
        {
          id: 'summary',
          name: 'Summary',
          custom: false,
          orderable: true,
          navigable: true,
          searchable: true,
          clauseNames: ['summary'],
          schema: {
            type: 'string',
            system: 'summary'
          }
        },
        {
          id: 'assignee',
          name: 'Assignee',
          custom: false,
          orderable: true,
          navigable: true,
          searchable: true,
          clauseNames: ['assignee'],
          schema: {
            type: 'user',
            system: 'assignee'
          }
        }
      ];

      mockJiraClient.listFields.mockResolvedValue(mockSystemFields);

      // Act
      const result = await jiraClientWrapper.searchFields();

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every(field => !field.custom)).toBe(true);
      expect(result.every(field => field.schema?.system)).toBe(true);
    });

    test('should handle custom fields correctly', async () => {
      // Arrange
      const mockCustomFields: JiraField[] = [
        {
          id: 'customfield_10001',
          name: 'Story Points',
          custom: true,
          orderable: true,
          navigable: true,
          searchable: true,
          clauseNames: ['cf[10001]', 'Story Points'],
          schema: {
            type: 'number',
            custom: 'com.atlassian.jira.plugin.system.customfieldtypes:float',
            customId: 10001
          }
        },
        {
          id: 'customfield_10002',
          name: 'Epic Link',
          custom: true,
          orderable: true,
          navigable: true,
          searchable: true,
          clauseNames: ['cf[10002]', 'Epic Link'],
          schema: {
            type: 'any',
            custom: 'com.pyxis.greenhopper.jira:gh-epic-link',
            customId: 10002
          }
        }
      ];

      mockJiraClient.listFields.mockResolvedValue(mockCustomFields);

      // Act
      const result = await jiraClientWrapper.searchFields('custom');

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every(field => field.custom)).toBe(true);
      expect(result.every(field => field.schema?.customId)).toBe(true);
      expect(result.every(field => field.id.startsWith('customfield_'))).toBe(true);
    });

    test('should filter fields by custom field ID pattern', async () => {
      // Arrange
      const query = 'customfield_10001';
      const mockFieldsResponse: JiraField[] = [
        {
          id: 'customfield_10001',
          name: 'Story Points',
          custom: true,
          orderable: true,
          navigable: true,
          searchable: true,
          clauseNames: ['cf[10001]', 'Story Points']
        },
        {
          id: 'customfield_10002',
          name: 'Epic Link',
          custom: true,
          orderable: true,
          navigable: true,
          searchable: true,
          clauseNames: ['cf[10002]', 'Epic Link']
        },
        {
          id: 'summary',
          name: 'Summary',
          custom: false,
          orderable: true,
          navigable: true,
          searchable: true,
          clauseNames: ['summary']
        }
      ];

      mockJiraClient.listFields.mockResolvedValue(mockFieldsResponse);

      // Act
      const result = await jiraClientWrapper.searchFields(query);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('customfield_10001');
      expect(result[0].name).toBe('Story Points');
    });
  });

  describe('Performance and logging', () => {
    test('should log successful field retrieval', async () => {
      // Arrange
      const mockFields: JiraField[] = [
        {
          id: 'summary',
          name: 'Summary',
          custom: false,
          orderable: true,
          navigable: true,
          searchable: true
        }
      ];

      mockJiraClient.listFields.mockResolvedValue(mockFields);

      // Import logger mock to verify calls
      const { logger } = require('../../src/utils/logger.js');

      // Act
      await jiraClientWrapper.searchFields();

      // Assert
      expect(logger.log).toHaveBeenCalledWith('Searching fields');
      expect(logger.log).toHaveBeenCalledWith('Successfully retrieved 1 fields');
    });

    test('should log successful field filtering', async () => {
      // Arrange
      const query = 'custom';
      const mockFields: JiraField[] = [
        {
          id: 'summary',
          name: 'Summary',
          custom: false,
          orderable: true,
          navigable: true,
          searchable: true
        },
        {
          id: 'customfield_10001',
          name: 'Custom Field',
          custom: true,
          orderable: true,
          navigable: true,
          searchable: true
        }
      ];

      mockJiraClient.listFields.mockResolvedValue(mockFields);

      // Import logger mock to verify calls
      const { logger } = require('../../src/utils/logger.js');

      // Act
      await jiraClientWrapper.searchFields(query);

      // Assert
      expect(logger.log).toHaveBeenCalledWith(`Searching fields with query: ${query}`);
      expect(logger.log).toHaveBeenCalledWith('Successfully retrieved 2 fields');
      expect(logger.log).toHaveBeenCalledWith(`Filtered to 1 fields matching query: ${query}`);
    });

    test('should log errors appropriately', async () => {
      // Arrange
      const error = new Error('Test error');

      mockJiraClient.listFields.mockRejectedValue(error);

      // Import logger mock to verify calls
      const { logger } = require('../../src/utils/logger.js');

      // Act & Assert
      await expect(jiraClientWrapper.searchFields()).rejects.toThrow();
      expect(logger.error).toHaveBeenCalledWith('Failed to search fields:', error);
    });
  });

  describe('Data model validation', () => {
    test('should return data matching JiraField interface structure', async () => {
      // Arrange
      const completeFieldResponse: JiraField[] = [
        {
          id: 'summary',
          name: 'Summary',
          key: 'summary',
          custom: false,
          orderable: true,
          navigable: true,
          searchable: true,
          clauseNames: ['summary'],
          schema: {
            type: 'string',
            system: 'summary'
          }
        },
        {
          id: 'customfield_10001',
          name: 'Story Points',
          custom: true,
          orderable: true,
          navigable: true,
          searchable: true,
          clauseNames: ['cf[10001]', 'Story Points'],
          schema: {
            type: 'number',
            custom: 'com.atlassian.jira.plugin.system.customfieldtypes:float',
            customId: 10001
          }
        }
      ];

      mockJiraClient.listFields.mockResolvedValue(completeFieldResponse);

      // Act
      const result = await jiraClientWrapper.searchFields();

      // Assert - Validate structure matches JiraField interface
      expect(result).toHaveLength(2);
      
      // Validate system field structure
      expect(result[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        custom: expect.any(Boolean),
        orderable: expect.any(Boolean),
        navigable: expect.any(Boolean),
        searchable: expect.any(Boolean)
      });
      
      // Validate custom field structure
      expect(result[1]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        custom: expect.any(Boolean),
        orderable: expect.any(Boolean),
        navigable: expect.any(Boolean),
        searchable: expect.any(Boolean),
        clauseNames: expect.any(Array),
        schema: expect.objectContaining({
          type: expect.any(String),
          custom: expect.any(String),
          customId: expect.any(Number)
        })
      });

      // Verify specific values
      expect(result[0].id).toBe('summary');
      expect(result[0].custom).toBe(false);
      expect(result[1].id).toBe('customfield_10001');
      expect(result[1].custom).toBe(true);
      expect(result[1].schema?.customId).toBe(10001);
    });

    test('should handle optional schema field', async () => {
      // Arrange
      const fieldWithoutSchema: JiraField[] = [
        {
          id: 'summary',
          name: 'Summary',
          custom: false,
          orderable: true,
          navigable: true,
          searchable: true,
          clauseNames: ['summary']
          // schema field is optional and omitted
        }
      ];

      mockJiraClient.listFields.mockResolvedValue(fieldWithoutSchema);

      // Act
      const result = await jiraClientWrapper.searchFields();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].schema).toBeUndefined();
      expect(result[0].id).toBe('summary');
      expect(result[0].name).toBe('Summary');
    });

    test('should handle optional clauseNames field', async () => {
      // Arrange
      const fieldWithoutClauseNames: JiraField[] = [
        {
          id: 'summary',
          name: 'Summary',
          custom: false,
          orderable: true,
          navigable: true,
          searchable: true
          // clauseNames field is optional and omitted
        }
      ];

      mockJiraClient.listFields.mockResolvedValue(fieldWithoutClauseNames);

      // Act
      const result = await jiraClientWrapper.searchFields();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].clauseNames).toBeUndefined();
      expect(result[0].id).toBe('summary');
      expect(result[0].name).toBe('Summary');
    });
  });
});