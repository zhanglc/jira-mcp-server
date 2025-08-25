import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { JiraConfig } from '../../src/types/config-types.js';
import { ApiError } from '../../src/types/api-error.js';

// Mock the jira-client module
const mockJiraClient = {
  findIssue: jest.fn()
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

describe('getIssue Method - TDD Implementation', () => {
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

  describe('Constructor coverage', () => {
    test('should initialize with basic auth configuration', () => {
      const basicAuthConfig: JiraConfig = {
        url: 'https://test.atlassian.net',
        username: 'testuser',
        password: 'testpass'
      };
      
      const wrapper = new JiraClientWrapper(basicAuthConfig);
      expect(wrapper).toBeInstanceOf(JiraClientWrapper);
    });
  });

  describe('Basic getIssue functionality', () => {
    test('should successfully retrieve an issue with basic fields', async () => {
      // Arrange
      const issueKey = 'TEST-123';
      const mockIssueResponse = {
        id: '12345',
        key: 'TEST-123',
        self: 'https://test.atlassian.net/rest/api/2/issue/12345',
        fields: {
          summary: 'Test Issue Summary',
          status: {
            name: 'To Do',
            statusCategory: {
              key: 'new',
              name: 'New'
            }
          },
          assignee: null,
          reporter: {
            self: 'https://test.atlassian.net/rest/api/2/user?username=testuser',
            name: 'testuser',
            key: 'testuser',
            displayName: 'Test User',
            emailAddress: 'test@example.com',
            active: true,
            timeZone: 'UTC',
            avatarUrls: {
              '48x48': 'https://avatar.url'
            }
          },
          creator: {
            self: 'https://test.atlassian.net/rest/api/2/user?username=testuser',
            name: 'testuser',
            key: 'testuser',
            displayName: 'Test User',
            emailAddress: 'test@example.com',
            active: true,
            timeZone: 'UTC',
            avatarUrls: {
              '48x48': 'https://avatar.url'
            }
          },
          project: {
            key: 'TEST',
            name: 'Test Project'
          },
          issuetype: {
            name: 'Story',
            subtask: false
          },
          priority: {
            name: 'Medium',
            id: '3'
          },
          created: '2024-01-01T10:00:00.000Z',
          updated: '2024-01-02T10:00:00.000Z',
          description: 'Test issue description'
        }
      };

      mockJiraClient.findIssue.mockResolvedValue(mockIssueResponse);

      // Act
      const result = await jiraClientWrapper.getIssue(issueKey);

      // Assert
      expect(mockJiraClient.findIssue).toHaveBeenCalledWith(issueKey);
      expect(result).toEqual(mockIssueResponse);
      expect(result.key).toBe(issueKey);
      expect(result.fields.summary).toBe('Test Issue Summary');
    });

    test('should retrieve issue with specific fields when fields parameter is provided', async () => {
      // Arrange
      const issueKey = 'TEST-123';
      const fields = ['summary', 'status', 'assignee'];
      const mockIssueResponse = {
        id: '12345',
        key: 'TEST-123',
        self: 'https://test.atlassian.net/rest/api/2/issue/12345',
        fields: {
          summary: 'Test Issue Summary',
          status: {
            name: 'To Do',
            statusCategory: {
              key: 'new',
              name: 'New'
            }
          },
          assignee: null
        }
      };

      mockJiraClient.findIssue.mockResolvedValue(mockIssueResponse);

      // Act
      const result = await jiraClientWrapper.getIssue(issueKey, fields);

      // Assert
      expect(mockJiraClient.findIssue).toHaveBeenCalledWith(issueKey, '', fields.join(','));
      expect(result).toEqual(mockIssueResponse);
      expect(result.fields).toHaveProperty('summary');
      expect(result.fields).toHaveProperty('status');
      expect(result.fields).toHaveProperty('assignee');
    });

    test('should handle empty fields array', async () => {
      // Arrange
      const issueKey = 'TEST-123';
      const fields: string[] = [];
      const mockIssueResponse = {
        id: '12345',
        key: 'TEST-123',
        self: 'https://test.atlassian.net/rest/api/2/issue/12345',
        fields: {}
      };

      mockJiraClient.findIssue.mockResolvedValue(mockIssueResponse);

      // Act
      const result = await jiraClientWrapper.getIssue(issueKey, fields);

      // Assert
      expect(mockJiraClient.findIssue).toHaveBeenCalledWith(issueKey, '', '');
      expect(result).toEqual(mockIssueResponse);
    });
  });

  describe('Error handling scenarios', () => {
    test('should throw ApiError when issue does not exist (404)', async () => {
      // Arrange
      const issueKey = 'NONEXISTENT-123';
      const jiraError = {
        statusCode: 404,
        message: 'Issue Does Not Exist'
      };

      mockJiraClient.findIssue.mockRejectedValue(jiraError);

      // Act & Assert
      await expect(jiraClientWrapper.getIssue(issueKey)).rejects.toThrow(ApiError);
      await expect(jiraClientWrapper.getIssue(issueKey)).rejects.toThrow('Jira API Error: Issue Does Not Exist');
      
      expect(mockJiraClient.findIssue).toHaveBeenCalledWith(issueKey);
    });

    test('should throw ApiError when access is forbidden (403)', async () => {
      // Arrange
      const issueKey = 'SECRET-123';
      const jiraError = {
        statusCode: 403,
        message: 'Forbidden'
      };

      mockJiraClient.findIssue.mockRejectedValue(jiraError);

      // Act & Assert
      await expect(jiraClientWrapper.getIssue(issueKey)).rejects.toThrow(ApiError);
      await expect(jiraClientWrapper.getIssue(issueKey)).rejects.toThrow('Jira API Error: Forbidden');
    });

    test('should throw ApiError when authentication fails (401)', async () => {
      // Arrange
      const issueKey = 'TEST-123';
      const jiraError = {
        statusCode: 401,
        message: 'Unauthorized'
      };

      mockJiraClient.findIssue.mockRejectedValue(jiraError);

      // Act & Assert
      await expect(jiraClientWrapper.getIssue(issueKey)).rejects.toThrow(ApiError);
      await expect(jiraClientWrapper.getIssue(issueKey)).rejects.toThrow('Jira API Error: Unauthorized');
    });

    test('should throw ApiError for network errors', async () => {
      // Arrange
      const issueKey = 'TEST-123';
      const networkError = new Error('Network Error');

      mockJiraClient.findIssue.mockRejectedValue(networkError);

      // Act & Assert
      await expect(jiraClientWrapper.getIssue(issueKey)).rejects.toThrow(ApiError);
      await expect(jiraClientWrapper.getIssue(issueKey)).rejects.toThrow('Jira API Error: Network Error');
    });

    test('should throw ApiError for server errors (500)', async () => {
      // Arrange
      const issueKey = 'TEST-123';
      const serverError = {
        statusCode: 500,
        message: 'Internal Server Error'
      };

      mockJiraClient.findIssue.mockRejectedValue(serverError);

      // Act & Assert
      await expect(jiraClientWrapper.getIssue(issueKey)).rejects.toThrow(ApiError);
      await expect(jiraClientWrapper.getIssue(issueKey)).rejects.toThrow('Jira API Error: Internal Server Error');
    });
  });

  describe('Input validation and edge cases', () => {
    test('should handle issue keys with different formats', async () => {
      // Arrange
      const testCases = [
        'PROJ-1',
        'MYPROJECT-999',
        'ABC-12345',
        'X-1'
      ];

      const mockResponse = { id: '1', key: '', fields: {} };

      for (const issueKey of testCases) {
        mockJiraClient.findIssue.mockResolvedValue({ ...mockResponse, key: issueKey });

        // Act
        const result = await jiraClientWrapper.getIssue(issueKey);

        // Assert
        expect(result.key).toBe(issueKey);
        expect(mockJiraClient.findIssue).toHaveBeenCalledWith(issueKey);
      }
    });

    test('should handle special characters in issue keys', async () => {
      // Arrange
      const issueKey = 'PROJ_TEST-123';
      const mockResponse = {
        id: '1',
        key: issueKey,
        fields: { summary: 'Test' }
      };

      mockJiraClient.findIssue.mockResolvedValue(mockResponse);

      // Act
      const result = await jiraClientWrapper.getIssue(issueKey);

      // Assert
      expect(result.key).toBe(issueKey);
      expect(mockJiraClient.findIssue).toHaveBeenCalledWith(issueKey);
    });

    test('should handle complex field selections', async () => {
      // Arrange
      const issueKey = 'TEST-123';
      const complexFields = [
        'summary',
        'status',
        'assignee',
        'reporter',
        'project',
        'issuetype',
        'priority',
        'created',
        'updated',
        'description',
        'customfield_10001'
      ];

      const mockResponse = {
        id: '1',
        key: issueKey,
        fields: {
          summary: 'Test',
          customfield_10001: 'Custom Value'
        }
      };

      mockJiraClient.findIssue.mockResolvedValue(mockResponse);

      // Act
      const result = await jiraClientWrapper.getIssue(issueKey, complexFields);

      // Assert
      expect(mockJiraClient.findIssue).toHaveBeenCalledWith(
        issueKey,
        '',
        complexFields.join(',')
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Data model validation', () => {
    test('should return data matching JiraIssue interface structure', async () => {
      // Arrange
      const issueKey = 'TEST-123';
      const completeIssueResponse = {
        id: '12345',
        key: 'TEST-123',
        self: 'https://test.atlassian.net/rest/api/2/issue/12345',
        fields: {
          summary: 'Complete Test Issue',
          status: {
            name: 'In Progress',
            statusCategory: {
              key: 'indeterminate',
              name: 'In Progress'
            }
          },
          assignee: {
            self: 'https://test.atlassian.net/rest/api/2/user?username=assignee',
            name: 'assignee',
            key: 'assignee',
            displayName: 'Assignee User',
            emailAddress: 'assignee@example.com',
            active: true,
            timeZone: 'UTC',
            avatarUrls: {
              '48x48': 'https://assignee-avatar.url'
            }
          },
          reporter: {
            self: 'https://test.atlassian.net/rest/api/2/user?username=reporter',
            name: 'reporter',
            key: 'reporter',
            displayName: 'Reporter User',
            emailAddress: 'reporter@example.com',
            active: true,
            timeZone: 'UTC',
            avatarUrls: {
              '48x48': 'https://reporter-avatar.url'
            }
          },
          creator: {
            self: 'https://test.atlassian.net/rest/api/2/user?username=creator',
            name: 'creator',
            key: 'creator',
            displayName: 'Creator User',
            emailAddress: 'creator@example.com',
            active: true,
            timeZone: 'UTC',
            avatarUrls: {
              '48x48': 'https://creator-avatar.url'
            }
          },
          project: {
            key: 'TEST',
            name: 'Test Project'
          },
          issuetype: {
            name: 'Bug',
            subtask: false
          },
          priority: {
            name: 'High',
            id: '2'
          },
          created: '2024-01-01T10:00:00.000Z',
          updated: '2024-01-02T15:30:00.000Z',
          description: 'Detailed bug description with multiple lines\nand formatting.',
          parent: {
            key: 'TEST-100',
            fields: {
              summary: 'Parent Epic'
            }
          },
          customfield_10001: 'Custom Field Value'
        }
      };

      mockJiraClient.findIssue.mockResolvedValue(completeIssueResponse);

      // Act
      const result = await jiraClientWrapper.getIssue(issueKey);

      // Assert - Validate structure matches JiraIssue interface
      expect(result).toMatchObject({
        id: expect.any(String),
        key: expect.any(String),
        self: expect.any(String),
        fields: expect.objectContaining({
          summary: expect.any(String),
          status: expect.objectContaining({
            name: expect.any(String),
            statusCategory: expect.objectContaining({
              key: expect.any(String),
              name: expect.any(String)
            })
          }),
          reporter: expect.objectContaining({
            name: expect.any(String),
            key: expect.any(String),
            displayName: expect.any(String),
            emailAddress: expect.any(String),
            active: expect.any(Boolean),
            timeZone: expect.any(String),
            avatarUrls: expect.any(Object)
          }),
          creator: expect.objectContaining({
            name: expect.any(String),
            key: expect.any(String),
            displayName: expect.any(String),
            emailAddress: expect.any(String),
            active: expect.any(Boolean),
            timeZone: expect.any(String),
            avatarUrls: expect.any(Object)
          }),
          project: expect.objectContaining({
            key: expect.any(String),
            name: expect.any(String)
          }),
          issuetype: expect.objectContaining({
            name: expect.any(String),
            subtask: expect.any(Boolean)
          }),
          priority: expect.objectContaining({
            name: expect.any(String),
            id: expect.any(String)
          }),
          created: expect.any(String),
          updated: expect.any(String)
        })
      });

      // Verify specific values
      expect(result.id).toBe('12345');
      expect(result.key).toBe('TEST-123');
      expect(result.fields.summary).toBe('Complete Test Issue');
      expect(result.fields.assignee).not.toBeNull();
      expect(result.fields.assignee?.displayName).toBe('Assignee User');
    });

    test('should handle null assignee field', async () => {
      // Arrange
      const issueKey = 'TEST-123';
      const issueWithNullAssignee = {
        id: '12345',
        key: 'TEST-123',
        self: 'https://test.atlassian.net/rest/api/2/issue/12345',
        fields: {
          summary: 'Unassigned Issue',
          status: {
            name: 'Open',
            statusCategory: {
              key: 'new',
              name: 'New'
            }
          },
          assignee: null,
          reporter: {
            self: 'https://test.atlassian.net/rest/api/2/user?username=reporter',
            name: 'reporter',
            key: 'reporter',
            displayName: 'Reporter User',
            emailAddress: 'reporter@example.com',
            active: true,
            timeZone: 'UTC',
            avatarUrls: {}
          },
          creator: {
            self: 'https://test.atlassian.net/rest/api/2/user?username=creator',
            name: 'creator',
            key: 'creator',
            displayName: 'Creator User',
            emailAddress: 'creator@example.com',
            active: true,
            timeZone: 'UTC',
            avatarUrls: {}
          },
          project: {
            key: 'TEST',
            name: 'Test Project'
          },
          issuetype: {
            name: 'Task',
            subtask: false
          },
          priority: {
            name: 'Low',
            id: '4'
          },
          created: '2024-01-01T10:00:00.000Z',
          updated: '2024-01-01T10:00:00.000Z'
        }
      };

      mockJiraClient.findIssue.mockResolvedValue(issueWithNullAssignee);

      // Act
      const result = await jiraClientWrapper.getIssue(issueKey);

      // Assert
      expect(result.fields.assignee).toBeNull();
      expect(result.fields.reporter).not.toBeNull();
      expect(result.fields.creator).not.toBeNull();
    });
  });

  describe('Performance and logging', () => {
    test('should log successful issue retrieval', async () => {
      // Arrange
      const issueKey = 'TEST-123';
      const mockResponse = {
        id: '1',
        key: issueKey,
        fields: { summary: 'Test' }
      };

      mockJiraClient.findIssue.mockResolvedValue(mockResponse);

      // Import logger mock to verify calls
      const { logger } = require('../../src/utils/logger.js');

      // Act
      await jiraClientWrapper.getIssue(issueKey);

      // Assert
      expect(logger.log).toHaveBeenCalledWith(`Getting issue: ${issueKey}`);
      expect(logger.log).toHaveBeenCalledWith(`Successfully retrieved issue: ${issueKey}`);
    });

    test('should log errors appropriately', async () => {
      // Arrange
      const issueKey = 'TEST-123';
      const error = new Error('Test error');

      mockJiraClient.findIssue.mockRejectedValue(error);

      // Import logger mock to verify calls
      const { logger } = require('../../src/utils/logger.js');

      // Act & Assert
      await expect(jiraClientWrapper.getIssue(issueKey)).rejects.toThrow();
      expect(logger.error).toHaveBeenCalledWith(`Failed to get issue ${issueKey}:`, error);
    });
  });
});