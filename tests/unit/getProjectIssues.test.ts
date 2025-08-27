import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { JiraConfig } from '../../src/types/config-types.js';
import { SearchOptions } from '../../src/types/jira-types.js';
import { ApiError } from '../../src/types/api-error.js';

// Mock jira-client
jest.mock('jira-client');

describe('JiraClientWrapper.getProjectIssues', () => {
  let wrapper: JiraClientWrapper;
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    const JiraClient = require('jira-client');
    mockClient = {
      searchJira: jest.fn(),
    };
    JiraClient.mockImplementation(() => mockClient);

    const config: JiraConfig = {
      url: 'https://test.jira.com',
      bearer: 'test-token',
    };

    wrapper = new JiraClientWrapper(config);
  });

  describe('Basic Project Issues Retrieval', () => {
    it('should get issues for a specific project', async () => {
      const mockSearchResult = {
        expand: 'names,schema',
        startAt: 0,
        maxResults: 50,
        total: 5,
        issues: [
          {
            id: '12345',
            key: 'DSCWA-1',
            self: 'https://test.jira.com/rest/api/2/issue/12345',
            fields: {
              summary: 'Test Issue 1',
              status: {
                name: 'Open',
                statusCategory: {
                  key: 'new',
                  name: 'To Do',
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
                avatarUrls: { '48x48': 'url' },
              },
              reporter: {
                self: 'https://test.jira.com/rest/api/2/user?username=reporter',
                name: 'reporter',
                key: 'reporter',
                displayName: 'Reporter User',
                emailAddress: 'reporter@example.com',
                active: true,
                timeZone: 'UTC',
                avatarUrls: { '48x48': 'url' },
              },
              creator: {
                self: 'https://test.jira.com/rest/api/2/user?username=creator',
                name: 'creator',
                key: 'creator',
                displayName: 'Creator User',
                emailAddress: 'creator@example.com',
                active: true,
                timeZone: 'UTC',
                avatarUrls: { '48x48': 'url' },
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
              created: '2023-01-01T10:00:00.000+0000',
              updated: '2023-01-02T10:00:00.000+0000',
            },
          },
          {
            id: '12346',
            key: 'DSCWA-2',
            self: 'https://test.jira.com/rest/api/2/issue/12346',
            fields: {
              summary: 'Test Issue 2',
              status: {
                name: 'In Progress',
                statusCategory: {
                  key: 'indeterminate',
                  name: 'In Progress',
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
                avatarUrls: { '48x48': 'url' },
              },
              creator: {
                self: 'https://test.jira.com/rest/api/2/user?username=creator2',
                name: 'creator2',
                key: 'creator2',
                displayName: 'Creator User 2',
                emailAddress: 'creator2@example.com',
                active: true,
                timeZone: 'UTC',
                avatarUrls: { '48x48': 'url' },
              },
              project: {
                key: 'DSCWA',
                name: 'Test Project',
              },
              issuetype: {
                name: 'Task',
                subtask: false,
              },
              priority: {
                name: 'Medium',
                id: '3',
              },
              created: '2023-01-03T10:00:00.000+0000',
              updated: '2023-01-04T10:00:00.000+0000',
            },
          },
        ],
      };

      mockClient.searchJira.mockResolvedValue(mockSearchResult);

      const result = await wrapper.getProjectIssues('DSCWA');

      expect(mockClient.searchJira).toHaveBeenCalledWith('project = DSCWA', {});
      expect(result).toEqual(mockSearchResult);
      expect(result.issues).toHaveLength(2);
      expect(result.issues[0].key).toBe('DSCWA-1');
      expect(result.issues[1].key).toBe('DSCWA-2');
      expect(result.total).toBe(5);
    });

    it('should handle empty project results', async () => {
      const mockSearchResult = {
        expand: 'names,schema',
        startAt: 0,
        maxResults: 50,
        total: 0,
        issues: [],
      };

      mockClient.searchJira.mockResolvedValue(mockSearchResult);

      const result = await wrapper.getProjectIssues('EMPTY');

      expect(mockClient.searchJira).toHaveBeenCalledWith('project = EMPTY', {});
      expect(result.total).toBe(0);
      expect(result.issues).toHaveLength(0);
    });

    it('should handle project keys with spaces', async () => {
      const mockSearchResult = {
        expand: 'names,schema',
        startAt: 0,
        maxResults: 50,
        total: 1,
        issues: [],
      };

      mockClient.searchJira.mockResolvedValue(mockSearchResult);

      await wrapper.getProjectIssues('PROJECT WITH SPACES');

      expect(mockClient.searchJira).toHaveBeenCalledWith(
        'project = "PROJECT WITH SPACES"',
        {}
      );
    });
  });

  describe('Project Issues with Options', () => {
    it('should get project issues with pagination options', async () => {
      const mockSearchResult = {
        expand: 'names,schema',
        startAt: 10,
        maxResults: 20,
        total: 100,
        issues: [],
      };

      mockClient.searchJira.mockResolvedValue(mockSearchResult);

      const options: SearchOptions = {
        startAt: 10,
        maxResults: 20,
      };

      await wrapper.getProjectIssues('DSCWA', options);

      expect(mockClient.searchJira).toHaveBeenCalledWith('project = DSCWA', {
        startAt: 10,
        maxResults: 20,
      });
    });

    it('should get project issues with field selection', async () => {
      const mockSearchResult = {
        expand: 'names,schema',
        startAt: 0,
        maxResults: 50,
        total: 1,
        issues: [],
      };

      mockClient.searchJira.mockResolvedValue(mockSearchResult);

      const options: SearchOptions = {
        fields: ['summary', 'status', 'assignee'],
      };

      await wrapper.getProjectIssues('DSCWA', options);

      expect(mockClient.searchJira).toHaveBeenCalledWith('project = DSCWA', {
        fields: ['summary', 'status', 'assignee'],
      });
    });

    it('should get project issues with combined options', async () => {
      const mockSearchResult = {
        expand: 'names,schema',
        startAt: 5,
        maxResults: 10,
        total: 50,
        issues: [],
      };

      mockClient.searchJira.mockResolvedValue(mockSearchResult);

      const options: SearchOptions = {
        startAt: 5,
        maxResults: 10,
        fields: ['summary', 'status', 'priority'],
      };

      await wrapper.getProjectIssues('DSCWA', options);

      expect(mockClient.searchJira).toHaveBeenCalledWith('project = DSCWA', {
        startAt: 5,
        maxResults: 10,
        fields: ['summary', 'status', 'priority'],
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent project error', async () => {
      const jiraError = {
        statusCode: 400,
        message:
          "The value 'NONEXISTENT' does not exist for the field 'project'.",
      };

      mockClient.searchJira.mockRejectedValue(jiraError);

      await expect(wrapper.getProjectIssues('NONEXISTENT')).rejects.toThrow(
        ApiError
      );
    });

    it('should handle invalid project key format', async () => {
      const jiraError = {
        statusCode: 400,
        message: 'Invalid project key format.',
      };

      mockClient.searchJira.mockRejectedValue(jiraError);

      await expect(
        wrapper.getProjectIssues('invalid-project-key!')
      ).rejects.toThrow(ApiError);
    });

    it('should handle authentication errors', async () => {
      const jiraError = {
        statusCode: 401,
        message: 'You are not authenticated.',
      };

      mockClient.searchJira.mockRejectedValue(jiraError);

      await expect(wrapper.getProjectIssues('DSCWA')).rejects.toThrow(ApiError);
    });

    it('should handle permission errors', async () => {
      const jiraError = {
        statusCode: 403,
        message: 'You do not have permission to access this project.',
      };

      mockClient.searchJira.mockRejectedValue(jiraError);

      await expect(wrapper.getProjectIssues('RESTRICTED')).rejects.toThrow(
        ApiError
      );
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockClient.searchJira.mockRejectedValue(networkError);

      await expect(wrapper.getProjectIssues('DSCWA')).rejects.toThrow(ApiError);
    });

    it('should handle null response from searchJira', async () => {
      mockClient.searchJira.mockResolvedValue(null);

      const result = await wrapper.getProjectIssues('DSCWA');

      expect(result).toEqual({
        expand: '',
        startAt: 0,
        maxResults: 0,
        total: 0,
        issues: [],
      });
    });
  });

  describe('Field Validation and Security', () => {
    it('should pass all fields directly without filtering', async () => {
      const mockSearchResult = {
        expand: 'names,schema',
        startAt: 0,
        maxResults: 50,
        total: 0,
        issues: [],
      };

      mockClient.searchJira.mockResolvedValue(mockSearchResult);

      const options: SearchOptions = {
        fields: [
          'summary',
          'status',
          'invalidField',
          'maliciousScript',
          'customfield_10001',
        ],
      };

      await wrapper.getProjectIssues('DSCWA', options);

      // Should pass all fields directly without filtering
      expect(mockClient.searchJira).toHaveBeenCalledWith('project = DSCWA', {
        fields: ['summary', 'status', 'invalidField', 'maliciousScript', 'customfield_10001'],
      });
    });

    it('should allow *all and *navigable special fields', async () => {
      const mockSearchResult = {
        expand: 'names,schema',
        startAt: 0,
        maxResults: 50,
        total: 0,
        issues: [],
      };

      mockClient.searchJira.mockResolvedValue(mockSearchResult);

      const options: SearchOptions = {
        fields: ['*all', '*navigable', 'summary'],
      };

      await wrapper.getProjectIssues('DSCWA', options);

      expect(mockClient.searchJira).toHaveBeenCalledWith('project = DSCWA', {
        fields: ['*all', '*navigable', 'summary'],
      });
    });
  });

  describe('JQL Construction', () => {
    it('should construct JQL for simple project key', async () => {
      const mockSearchResult = {
        expand: 'names,schema',
        startAt: 0,
        maxResults: 50,
        total: 0,
        issues: [],
      };

      mockClient.searchJira.mockResolvedValue(mockSearchResult);

      await wrapper.getProjectIssues('ABC');

      expect(mockClient.searchJira).toHaveBeenCalledWith('project = ABC', {});
    });

    it('should construct JQL for project key with numbers', async () => {
      const mockSearchResult = {
        expand: 'names,schema',
        startAt: 0,
        maxResults: 50,
        total: 0,
        issues: [],
      };

      mockClient.searchJira.mockResolvedValue(mockSearchResult);

      await wrapper.getProjectIssues('PROJ123');

      expect(mockClient.searchJira).toHaveBeenCalledWith(
        'project = PROJ123',
        {}
      );
    });

    it('should construct JQL for project key with underscores', async () => {
      const mockSearchResult = {
        expand: 'names,schema',
        startAt: 0,
        maxResults: 50,
        total: 0,
        issues: [],
      };

      mockClient.searchJira.mockResolvedValue(mockSearchResult);

      await wrapper.getProjectIssues('MY_PROJECT');

      expect(mockClient.searchJira).toHaveBeenCalledWith(
        'project = MY_PROJECT',
        {}
      );
    });

    it('should properly quote project keys with special characters', async () => {
      const mockSearchResult = {
        expand: 'names,schema',
        startAt: 0,
        maxResults: 50,
        total: 0,
        issues: [],
      };

      mockClient.searchJira.mockResolvedValue(mockSearchResult);

      await wrapper.getProjectIssues('PROJECT-WITH-DASHES');

      expect(mockClient.searchJira).toHaveBeenCalledWith(
        'project = "PROJECT-WITH-DASHES"',
        {}
      );
    });
  });
});
