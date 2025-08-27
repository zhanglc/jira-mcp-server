import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import {
  SearchResult,
  JiraIssue,
  SearchOptions,
} from '../../src/types/jira-types.js';
import { ApiError } from '../../src/types/api-error.js';
import { logger } from '../../src/utils/logger.js';

// Mock jira-client
const mockJiraClient = {
  searchJira: jest.fn(),
};

jest.mock('jira-client', () => {
  return jest.fn().mockImplementation(() => mockJiraClient);
});

// Mock logger
jest.mock('../../src/utils/logger.js', () => ({
  logger: {
    log: jest.fn(),
    error: jest.fn(),
  },
}));

describe('JiraClientWrapper.getSprintIssues', () => {
  let jiraClient: JiraClientWrapper;
  let mockConfig: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConfig = {
      url: 'https://test.jira.com',
      bearer: 'fake-token',
    };

    jiraClient = new JiraClientWrapper(mockConfig);
  });

  describe('successful sprint issues retrieval', () => {
    it('should retrieve sprint issues successfully', async () => {
      // Arrange
      const sprintId = 123;
      const mockSearchResult: SearchResult<JiraIssue> = {
        expand: 'names,schema',
        startAt: 0,
        maxResults: 50,
        total: 2,
        issues: [
          {
            id: '10001',
            key: 'DSCWA-1',
            self: 'https://test.jira.com/rest/api/2/issue/10001',
            fields: {
              summary: 'First issue in sprint',
              status: {
                name: 'In Progress',
                statusCategory: {
                  key: 'indeterminate',
                  name: 'In Progress',
                },
              },
              assignee: {
                self: 'https://test.jira.com/rest/api/2/user?username=testuser',
                name: 'testuser',
                key: 'testuser',
                displayName: 'Test User',
                emailAddress: 'test@example.com',
                active: true,
                timeZone: 'UTC',
                avatarUrls: {},
              },
              reporter: {
                self: 'https://test.jira.com/rest/api/2/user?username=reporter',
                name: 'reporter',
                key: 'reporter',
                displayName: 'Reporter User',
                emailAddress: 'reporter@example.com',
                active: true,
                timeZone: 'UTC',
                avatarUrls: {},
              },
              creator: {
                self: 'https://test.jira.com/rest/api/2/user?username=creator',
                name: 'creator',
                key: 'creator',
                displayName: 'Creator User',
                emailAddress: 'creator@example.com',
                active: true,
                timeZone: 'UTC',
                avatarUrls: {},
              },
              project: {
                key: 'DSCWA',
                name: 'Test Project',
              },
              issuetype: {
                name: 'Story',
                subtask: false,
              },
              priority: {
                name: 'Medium',
                id: '3',
              },
              created: '2024-01-01T10:00:00.000Z',
              updated: '2024-01-02T15:30:00.000Z',
            },
          },
          {
            id: '10002',
            key: 'DSCWA-2',
            self: 'https://test.jira.com/rest/api/2/issue/10002',
            fields: {
              summary: 'Second issue in sprint',
              status: {
                name: 'To Do',
                statusCategory: {
                  key: 'new',
                  name: 'To Do',
                },
              },
              assignee: null,
              reporter: {
                self: 'https://test.jira.com/rest/api/2/user?username=reporter2',
                name: 'reporter2',
                key: 'reporter2',
                displayName: 'Reporter User 2',
                emailAddress: 'reporter2@example.com',
                active: true,
                timeZone: 'UTC',
                avatarUrls: {},
              },
              creator: {
                self: 'https://test.jira.com/rest/api/2/user?username=creator2',
                name: 'creator2',
                key: 'creator2',
                displayName: 'Creator User 2',
                emailAddress: 'creator2@example.com',
                active: true,
                timeZone: 'UTC',
                avatarUrls: {},
              },
              project: {
                key: 'DSCWA',
                name: 'Test Project',
              },
              issuetype: {
                name: 'Bug',
                subtask: false,
              },
              priority: {
                name: 'High',
                id: '2',
              },
              created: '2024-01-03T14:00:00.000Z',
              updated: '2024-01-03T14:00:00.000Z',
            },
          },
        ],
      };

      mockJiraClient.searchJira.mockResolvedValue(mockSearchResult);

      // Act
      const result = await jiraClient.getSprintIssues(sprintId);

      // Assert
      expect(result).toEqual(mockSearchResult);
      expect(result.total).toBe(2);
      expect(result.issues).toHaveLength(2);
      expect(result.issues[0].key).toBe('DSCWA-1');
      expect(result.issues[1].key).toBe('DSCWA-2');

      expect(mockJiraClient.searchJira).toHaveBeenCalledWith(
        'sprint = 123',
        {}
      );
      expect(logger.log).toHaveBeenCalledWith('Getting issues for sprint: 123');
      expect(logger.log).toHaveBeenCalledWith(
        'Successfully found 2 issues for sprint: 123'
      );
    });

    it('should retrieve sprint issues with pagination options', async () => {
      // Arrange
      const sprintId = 456;
      const options: SearchOptions = {
        startAt: 10,
        maxResults: 25,
      };
      const mockSearchResult: SearchResult<JiraIssue> = {
        expand: 'names,schema',
        startAt: 10,
        maxResults: 25,
        total: 100,
        issues: [],
      };

      mockJiraClient.searchJira.mockResolvedValue(mockSearchResult);

      // Act
      const result = await jiraClient.getSprintIssues(sprintId, options);

      // Assert
      expect(result).toEqual(mockSearchResult);
      expect(result.startAt).toBe(10);
      expect(result.maxResults).toBe(25);
      expect(result.total).toBe(100);

      expect(mockJiraClient.searchJira).toHaveBeenCalledWith('sprint = 456', {
        startAt: 10,
        maxResults: 25,
      });
      expect(logger.log).toHaveBeenCalledWith('Getting issues for sprint: 456');
    });

    it('should retrieve sprint issues with field selection', async () => {
      // Arrange
      const sprintId = 789;
      const options: SearchOptions = {
        fields: ['summary', 'status', 'assignee'],
      };
      const mockSearchResult: SearchResult<JiraIssue> = {
        expand: 'names,schema',
        startAt: 0,
        maxResults: 50,
        total: 1,
        issues: [],
      };

      mockJiraClient.searchJira.mockResolvedValue(mockSearchResult);

      // Act
      const result = await jiraClient.getSprintIssues(sprintId, options);

      // Assert
      expect(result).toEqual(mockSearchResult);

      expect(mockJiraClient.searchJira).toHaveBeenCalledWith('sprint = 789', {
        fields: ['summary', 'status', 'assignee'],
      });
    });

    it('should retrieve sprint issues with all options', async () => {
      // Arrange
      const sprintId = 999;
      const options: SearchOptions = {
        startAt: 5,
        maxResults: 15,
        fields: ['summary', 'status', 'assignee', 'priority'],
      };
      const mockSearchResult: SearchResult<JiraIssue> = {
        expand: 'names,schema',
        startAt: 5,
        maxResults: 15,
        total: 50,
        issues: [],
      };

      mockJiraClient.searchJira.mockResolvedValue(mockSearchResult);

      // Act
      const result = await jiraClient.getSprintIssues(sprintId, options);

      // Assert
      expect(result).toEqual(mockSearchResult);

      expect(mockJiraClient.searchJira).toHaveBeenCalledWith('sprint = 999', {
        startAt: 5,
        maxResults: 15,
        fields: ['summary', 'status', 'assignee', 'priority'],
      });
    });

    it('should pass all fields directly without filtering', async () => {
      // Arrange
      const sprintId = 111;
      const options: SearchOptions = {
        fields: [
          'summary',
          'invalid_field',
          'status',
          'malicious_field',
          'customfield_10001',
        ],
      };
      const mockSearchResult: SearchResult<JiraIssue> = {
        expand: 'names,schema',
        startAt: 0,
        maxResults: 50,
        total: 0,
        issues: [],
      };

      mockJiraClient.searchJira.mockResolvedValue(mockSearchResult);

      // Act
      const result = await jiraClient.getSprintIssues(sprintId, options);

      // Assert
      expect(result).toEqual(mockSearchResult);

      // Should pass all fields directly without filtering
      expect(mockJiraClient.searchJira).toHaveBeenCalledWith('sprint = 111', {
        fields: ['summary', 'invalid_field', 'status', 'malicious_field', 'customfield_10001'],
      });
    });

    it('should handle empty fields array', async () => {
      // Arrange
      const sprintId = 222;
      const options: SearchOptions = {
        fields: [],
      };
      const mockSearchResult: SearchResult<JiraIssue> = {
        expand: 'names,schema',
        startAt: 0,
        maxResults: 50,
        total: 0,
        issues: [],
      };

      mockJiraClient.searchJira.mockResolvedValue(mockSearchResult);

      // Act
      const result = await jiraClient.getSprintIssues(sprintId, options);

      // Assert
      expect(result).toEqual(mockSearchResult);

      // Empty fields should result in fields: [] in search options
      expect(mockJiraClient.searchJira).toHaveBeenCalledWith('sprint = 222', {
        fields: [],
      });
    });
  });

  describe('edge cases', () => {
    it('should return empty search result when sprint has no issues', async () => {
      // Arrange
      const sprintId = 555;
      const mockSearchResult: SearchResult<JiraIssue> = {
        expand: 'names,schema',
        startAt: 0,
        maxResults: 50,
        total: 0,
        issues: [],
      };

      mockJiraClient.searchJira.mockResolvedValue(mockSearchResult);

      // Act
      const result = await jiraClient.getSprintIssues(sprintId);

      // Assert
      expect(result).toEqual(mockSearchResult);
      expect(result.total).toBe(0);
      expect(result.issues).toHaveLength(0);

      expect(mockJiraClient.searchJira).toHaveBeenCalledWith(
        'sprint = 555',
        {}
      );
      expect(logger.log).toHaveBeenCalledWith(
        'Successfully found 0 issues for sprint: 555'
      );
    });

    it('should handle null response gracefully', async () => {
      // Arrange
      const sprintId = 666;
      mockJiraClient.searchJira.mockResolvedValue(null);

      // Act
      const result = await jiraClient.getSprintIssues(sprintId);

      // Assert
      expect(result).toEqual({
        expand: '',
        startAt: 0,
        maxResults: 0,
        total: 0,
        issues: [],
      });
      expect(logger.log).toHaveBeenCalledWith(
        'No response received for JQL search: sprint = 666'
      );
    });

    it('should handle undefined response gracefully', async () => {
      // Arrange
      const sprintId = 777;
      mockJiraClient.searchJira.mockResolvedValue(undefined);

      // Act
      const result = await jiraClient.getSprintIssues(sprintId);

      // Assert
      expect(result).toEqual({
        expand: '',
        startAt: 0,
        maxResults: 0,
        total: 0,
        issues: [],
      });
      expect(logger.log).toHaveBeenCalledWith(
        'No response received for JQL search: sprint = 777'
      );
    });

    it('should handle zero sprint ID', async () => {
      // Arrange
      const sprintId = 0;
      const mockSearchResult: SearchResult<JiraIssue> = {
        expand: 'names,schema',
        startAt: 0,
        maxResults: 50,
        total: 0,
        issues: [],
      };

      mockJiraClient.searchJira.mockResolvedValue(mockSearchResult);

      // Act
      const result = await jiraClient.getSprintIssues(sprintId);

      // Assert
      expect(result).toEqual(mockSearchResult);
      expect(mockJiraClient.searchJira).toHaveBeenCalledWith('sprint = 0', {});
    });

    it('should handle negative sprint ID (edge case)', async () => {
      // Arrange
      const sprintId = -1;
      const mockSearchResult: SearchResult<JiraIssue> = {
        expand: 'names,schema',
        startAt: 0,
        maxResults: 50,
        total: 0,
        issues: [],
      };

      mockJiraClient.searchJira.mockResolvedValue(mockSearchResult);

      // Act
      const result = await jiraClient.getSprintIssues(sprintId);

      // Assert
      expect(result).toEqual(mockSearchResult);
      expect(mockJiraClient.searchJira).toHaveBeenCalledWith('sprint = -1', {});
    });
  });

  describe('error handling', () => {
    it('should throw ApiError when sprint does not exist (404)', async () => {
      // Arrange
      const sprintId = 404;
      const mockError = {
        statusCode: 404,
        message: 'Sprint not found',
      };
      mockJiraClient.searchJira.mockRejectedValue(mockError);

      // Act & Assert
      await expect(jiraClient.getSprintIssues(sprintId)).rejects.toThrow(
        ApiError
      );
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to search issues with JQL sprint = 404:',
        mockError
      );
    });

    it('should throw ApiError when access is denied (403)', async () => {
      // Arrange
      const sprintId = 403;
      const mockError = {
        statusCode: 403,
        message: 'Forbidden',
      };
      mockJiraClient.searchJira.mockRejectedValue(mockError);

      // Act & Assert
      await expect(jiraClient.getSprintIssues(sprintId)).rejects.toThrow(
        ApiError
      );
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to search issues with JQL sprint = 403:',
        mockError
      );
    });

    it('should throw ApiError for general API errors', async () => {
      // Arrange
      const sprintId = 500;
      const mockError = {
        statusCode: 500,
        message: 'Internal Server Error',
      };
      mockJiraClient.searchJira.mockRejectedValue(mockError);

      // Act & Assert
      await expect(jiraClient.getSprintIssues(sprintId)).rejects.toThrow(
        ApiError
      );
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to search issues with JQL sprint = 500:',
        mockError
      );
    });

    it('should handle sprint with agile functionality disabled', async () => {
      // Arrange
      const sprintId = 123;
      const mockError = {
        statusCode: 400,
        message: 'Agile functionality is not enabled',
      };
      mockJiraClient.searchJira.mockRejectedValue(mockError);

      // Act & Assert
      await expect(jiraClient.getSprintIssues(sprintId)).rejects.toThrow(
        ApiError
      );
    });

    it('should handle invalid sprint state errors', async () => {
      // Arrange
      const sprintId = 123;
      const mockError = {
        statusCode: 400,
        message: 'Invalid JQL query for sprint',
      };
      mockJiraClient.searchJira.mockRejectedValue(mockError);

      // Act & Assert
      await expect(jiraClient.getSprintIssues(sprintId)).rejects.toThrow(
        ApiError
      );
    });
  });

  describe('parameter validation', () => {
    it('should convert number sprintId to string for JQL query', async () => {
      // Arrange
      const sprintId = 12345;
      mockJiraClient.searchJira.mockResolvedValue({
        expand: '',
        startAt: 0,
        maxResults: 50,
        total: 0,
        issues: [],
      });

      // Act
      await jiraClient.getSprintIssues(sprintId);

      // Assert
      expect(mockJiraClient.searchJira).toHaveBeenCalledWith(
        'sprint = 12345',
        {}
      );
    });

    it('should handle default values for optional parameters', async () => {
      // Arrange
      const sprintId = 888;
      mockJiraClient.searchJira.mockResolvedValue({
        expand: '',
        startAt: 0,
        maxResults: 50,
        total: 0,
        issues: [],
      });

      // Act
      await jiraClient.getSprintIssues(sprintId, {});

      // Assert
      expect(mockJiraClient.searchJira).toHaveBeenCalledWith(
        'sprint = 888',
        {}
      );
    });

    it('should handle special field values (*all, *navigable)', async () => {
      // Arrange
      const sprintId = 999;
      const options: SearchOptions = {
        fields: ['*all', '*navigable', 'summary'],
      };
      mockJiraClient.searchJira.mockResolvedValue({
        expand: '',
        startAt: 0,
        maxResults: 50,
        total: 0,
        issues: [],
      });

      // Act
      await jiraClient.getSprintIssues(sprintId, options);

      // Assert
      expect(mockJiraClient.searchJira).toHaveBeenCalledWith('sprint = 999', {
        fields: ['*all', '*navigable', 'summary'],
      });
    });
  });
});
