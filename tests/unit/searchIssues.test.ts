import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { JiraConfig } from '../../src/types/config-types.js';
import { SearchOptions } from '../../src/types/jira-types.js';
import { ApiError } from '../../src/types/api-error.js';

// Mock jira-client
jest.mock('jira-client');

describe('JiraClientWrapper.searchIssues', () => {
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

  describe('Basic JQL Search', () => {
    it('should search issues with basic JQL', async () => {
      const mockSearchResult = {
        expand: 'names,schema',
        startAt: 0,
        maxResults: 50,
        total: 2,
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
        ],
      };

      mockClient.searchJira.mockResolvedValue(mockSearchResult);

      const result = await wrapper.searchIssues('project = DSCWA');

      expect(mockClient.searchJira).toHaveBeenCalledWith('project = DSCWA', {});
      expect(result).toEqual(mockSearchResult);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].key).toBe('DSCWA-1');
    });

    it('should handle empty search results', async () => {
      const mockSearchResult = {
        expand: 'names,schema',
        startAt: 0,
        maxResults: 50,
        total: 0,
        issues: [],
      };

      mockClient.searchJira.mockResolvedValue(mockSearchResult);

      const result = await wrapper.searchIssues('project = NONEXISTENT');

      expect(result.total).toBe(0);
      expect(result.issues).toHaveLength(0);
    });
  });

  describe('Search with Options', () => {
    it('should search with pagination options', async () => {
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

      await wrapper.searchIssues('project = DSCWA', options);

      expect(mockClient.searchJira).toHaveBeenCalledWith('project = DSCWA', {
        startAt: 10,
        maxResults: 20,
      });
    });

    it('should search with field selection', async () => {
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

      await wrapper.searchIssues('project = DSCWA', options);

      expect(mockClient.searchJira).toHaveBeenCalledWith('project = DSCWA', {
        fields: ['summary', 'status', 'assignee'],
      });
    });

    it('should search with combined options', async () => {
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
        fields: ['summary', 'status'],
      };

      await wrapper.searchIssues(
        'project = DSCWA AND status = "Open"',
        options
      );

      expect(mockClient.searchJira).toHaveBeenCalledWith(
        'project = DSCWA AND status = "Open"',
        {
          startAt: 5,
          maxResults: 10,
          fields: ['summary', 'status'],
        }
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JQL syntax error', async () => {
      const jiraError = {
        statusCode: 400,
        message: "The value 'INVALID' does not exist for the field 'project'.",
      };

      mockClient.searchJira.mockRejectedValue(jiraError);

      await expect(
        wrapper.searchIssues('project = INVALID_SYNTAX')
      ).rejects.toThrow(ApiError);
    });

    it('should handle authentication errors', async () => {
      const jiraError = {
        statusCode: 401,
        message: 'You are not authenticated.',
      };

      mockClient.searchJira.mockRejectedValue(jiraError);

      await expect(wrapper.searchIssues('project = DSCWA')).rejects.toThrow(
        ApiError
      );
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockClient.searchJira.mockRejectedValue(networkError);

      await expect(wrapper.searchIssues('project = DSCWA')).rejects.toThrow(
        ApiError
      );
    });

    it('should handle null response', async () => {
      mockClient.searchJira.mockResolvedValue(null);

      const result = await wrapper.searchIssues('project = DSCWA');

      expect(result).toEqual({
        expand: '',
        startAt: 0,
        maxResults: 0,
        total: 0,
        issues: [],
      });
    });
  });

  describe('Field Validation', () => {
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

      await wrapper.searchIssues('project = DSCWA', options);

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

      await wrapper.searchIssues('project = DSCWA', options);

      expect(mockClient.searchJira).toHaveBeenCalledWith('project = DSCWA', {
        fields: ['*all', '*navigable', 'summary'],
      });
    });
  });
});
