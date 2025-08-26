import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { JiraConfig } from '../../src/types/config-types.js';
import { SearchResult, JiraIssue } from '../../src/types/jira-types.js';
import { ApiError } from '../../src/types/api-error.js';

const mockBearerConfig: JiraConfig = {
  url: 'https://test.atlassian.net',
  bearer: 'test-bearer-token',
};

const mockBasicConfig: JiraConfig = {
  url: 'https://test.atlassian.net',
  username: 'test@example.com',
  password: 'test-password',
};

describe('JiraClientWrapper', () => {
  test('should initialize successfully with bearer token', () => {
    const wrapper = new JiraClientWrapper(mockBearerConfig);
    expect(wrapper).toBeInstanceOf(JiraClientWrapper);
  });

  test('should initialize successfully with basic auth', () => {
    const wrapper = new JiraClientWrapper(mockBasicConfig);
    expect(wrapper).toBeInstanceOf(JiraClientWrapper);
  });

  test('should throw error if no authentication provided', () => {
    const invalidConfig: JiraConfig = {
      url: 'https://test.atlassian.net',
    };

    expect(() => new JiraClientWrapper(invalidConfig)).toThrow(
      'Either bearer token or username/password must be provided'
    );
  });
});

describe('JiraClientWrapper - getBoardIssues', () => {
  let wrapper: JiraClientWrapper;
  let mockClient: any;

  beforeEach(() => {
    wrapper = new JiraClientWrapper(mockBearerConfig);
    mockClient = (wrapper as any).client;
  });

  describe('Success cases', () => {
    test('should get board issues with default parameters', async () => {
      const mockResponse: SearchResult<JiraIssue> = {
        expand: 'names,schema',
        startAt: 0,
        maxResults: 50,
        total: 1,
        issues: [
          {
            id: '10001',
            key: 'TEST-123',
            self: 'https://test.atlassian.net/rest/api/2/issue/10001',
            fields: {
              summary: 'Test Issue from Board',
              status: {
                name: 'In Progress',
                statusCategory: {
                  key: 'indeterminate',
                  name: 'In Progress',
                },
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
                avatarUrls: {},
              },
              creator: {
                self: 'https://test.atlassian.net/rest/api/2/user?username=testuser',
                name: 'testuser',
                key: 'testuser',
                displayName: 'Test User',
                emailAddress: 'test@example.com',
                active: true,
                timeZone: 'UTC',
                avatarUrls: {},
              },
              project: {
                key: 'TEST',
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
              created: '2023-01-01T12:00:00.000Z',
              updated: '2023-01-01T12:30:00.000Z',
            },
          },
        ],
      };

      mockClient.getIssuesForBoard = jest.fn().mockResolvedValue(mockResponse);

      const result = await wrapper.getBoardIssues(123);

      expect(mockClient.getIssuesForBoard).toHaveBeenCalledWith(
        '123',
        0,
        50,
        undefined,
        true,
        undefined
      );
      expect(result).toEqual(mockResponse);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].key).toBe('TEST-123');
      expect(result.total).toBe(1);
    });

    test('should get board issues with pagination options', async () => {
      const mockResponse: SearchResult<JiraIssue> = {
        expand: 'names,schema',
        startAt: 10,
        maxResults: 5,
        total: 25,
        issues: [],
      };

      mockClient.getIssuesForBoard = jest.fn().mockResolvedValue(mockResponse);

      const result = await wrapper.getBoardIssues(123, {
        startAt: 10,
        maxResults: 5,
      });

      expect(mockClient.getIssuesForBoard).toHaveBeenCalledWith(
        '123',
        10,
        5,
        undefined,
        true,
        undefined
      );
      expect(result.startAt).toBe(10);
      expect(result.maxResults).toBe(5);
      expect(result.total).toBe(25);
    });

    test('should get board issues with field selection', async () => {
      const mockResponse: SearchResult<JiraIssue> = {
        expand: 'names,schema',
        startAt: 0,
        maxResults: 50,
        total: 1,
        issues: [
          {
            id: '10001',
            key: 'TEST-123',
            self: 'https://test.atlassian.net/rest/api/2/issue/10001',
            fields: {
              summary: 'Test Issue with Limited Fields',
              status: {
                name: 'Open',
                statusCategory: {
                  key: 'new',
                  name: 'To Do',
                },
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
                avatarUrls: {},
              },
              creator: {
                self: 'https://test.atlassian.net/rest/api/2/user?username=testuser',
                name: 'testuser',
                key: 'testuser',
                displayName: 'Test User',
                emailAddress: 'test@example.com',
                active: true,
                timeZone: 'UTC',
                avatarUrls: {},
              },
              project: {
                key: 'TEST',
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
              created: '2023-01-01T12:00:00.000Z',
              updated: '2023-01-01T12:30:00.000Z',
            },
          },
        ],
      };

      mockClient.getIssuesForBoard = jest.fn().mockResolvedValue(mockResponse);

      const result = await wrapper.getBoardIssues(123, {
        fields: ['summary', 'status', 'assignee'],
      });

      expect(mockClient.getIssuesForBoard).toHaveBeenCalledWith(
        '123',
        0,
        50,
        undefined,
        true,
        'summary,status,assignee'
      );
      expect(result.issues[0].fields.summary).toBe(
        'Test Issue with Limited Fields'
      );
    });

    test('should filter invalid field names for security', async () => {
      const mockResponse: SearchResult<JiraIssue> = {
        expand: 'names,schema',
        startAt: 0,
        maxResults: 50,
        total: 0,
        issues: [],
      };

      mockClient.getIssuesForBoard = jest.fn().mockResolvedValue(mockResponse);

      await wrapper.getBoardIssues(123, {
        fields: [
          'summary',
          'status',
          'invalidField',
          'customfield_10001',
          'maliciousScript',
        ],
      });

      // Should filter out invalid fields but keep valid ones and custom fields
      expect(mockClient.getIssuesForBoard).toHaveBeenCalledWith(
        '123',
        0,
        50,
        undefined,
        true,
        'summary,status,customfield_10001'
      );
    });

    test('should handle empty board response', async () => {
      const mockResponse: SearchResult<JiraIssue> = {
        expand: '',
        startAt: 0,
        maxResults: 50,
        total: 0,
        issues: [],
      };

      mockClient.getIssuesForBoard = jest.fn().mockResolvedValue(mockResponse);

      const result = await wrapper.getBoardIssues(123);

      expect(result.issues).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    test('should handle null response from jira-client', async () => {
      mockClient.getIssuesForBoard = jest.fn().mockResolvedValue(null);

      const result = await wrapper.getBoardIssues(123);

      expect(result).toEqual({
        expand: '',
        startAt: 0,
        maxResults: 0,
        total: 0,
        issues: [],
      });
    });
  });

  describe('Error cases', () => {
    test('should throw ApiError for board not found (404)', async () => {
      const jiraError = {
        statusCode: 404,
        error: 'Not Found',
        message:
          'Board does not exist or you do not have permission to view it.',
      };

      mockClient.getIssuesForBoard = jest.fn().mockRejectedValue(jiraError);

      await expect(wrapper.getBoardIssues(999)).rejects.toThrow(ApiError);
      await expect(wrapper.getBoardIssues(999)).rejects.toThrow(
        'Board does not exist'
      );
    });

    test('should throw ApiError for access denied (403)', async () => {
      const jiraError = {
        statusCode: 403,
        error: 'Forbidden',
        message: 'You do not have permission to view this board.',
      };

      mockClient.getIssuesForBoard = jest.fn().mockRejectedValue(jiraError);

      await expect(wrapper.getBoardIssues(123)).rejects.toThrow(ApiError);
      await expect(wrapper.getBoardIssues(123)).rejects.toThrow(
        'You do not have permission'
      );
    });

    test('should throw ApiError for invalid board ID format', async () => {
      const jiraError = {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Board ID must be a number.',
      };

      mockClient.getIssuesForBoard = jest.fn().mockRejectedValue(jiraError);

      await expect(wrapper.getBoardIssues(0)).rejects.toThrow(ApiError);
    });

    test('should throw ApiError for agile functionality not available', async () => {
      const jiraError = {
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Agile functionality is not available.',
      };

      mockClient.getIssuesForBoard = jest.fn().mockRejectedValue(jiraError);

      await expect(wrapper.getBoardIssues(123)).rejects.toThrow(ApiError);
    });

    test('should handle network errors', async () => {
      const networkError = new Error('Network timeout');

      mockClient.getIssuesForBoard = jest.fn().mockRejectedValue(networkError);

      await expect(wrapper.getBoardIssues(123)).rejects.toThrow(ApiError);
    });
  });

  describe('Parameter validation', () => {
    test('should handle various board ID types', async () => {
      const mockResponse: SearchResult<JiraIssue> = {
        expand: '',
        startAt: 0,
        maxResults: 50,
        total: 0,
        issues: [],
      };

      mockClient.getIssuesForBoard = jest.fn().mockResolvedValue(mockResponse);

      // Test with different valid board IDs
      await wrapper.getBoardIssues(1);
      await wrapper.getBoardIssues(999999);

      expect(mockClient.getIssuesForBoard).toHaveBeenCalledTimes(2);
      expect(mockClient.getIssuesForBoard).toHaveBeenNthCalledWith(
        1,
        '1',
        0,
        50,
        undefined,
        true,
        undefined
      );
      expect(mockClient.getIssuesForBoard).toHaveBeenNthCalledWith(
        2,
        '999999',
        0,
        50,
        undefined,
        true,
        undefined
      );
    });

    test('should handle all search options together', async () => {
      const mockResponse: SearchResult<JiraIssue> = {
        expand: '',
        startAt: 20,
        maxResults: 10,
        total: 100,
        issues: [],
      };

      mockClient.getIssuesForBoard = jest.fn().mockResolvedValue(mockResponse);

      await wrapper.getBoardIssues(123, {
        startAt: 20,
        maxResults: 10,
        fields: ['summary', 'status', 'assignee', 'customfield_10001'],
      });

      expect(mockClient.getIssuesForBoard).toHaveBeenCalledWith(
        '123',
        20,
        10,
        undefined,
        true,
        'summary,status,assignee,customfield_10001'
      );
    });
  });
});
