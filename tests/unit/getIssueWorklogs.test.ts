import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { JiraWorklog } from '../../src/types/jira-types.js';
import { ApiError } from '../../src/types/api-error.js';
import { logger } from '../../src/utils/logger.js';

// Mock the jira-client module
const mockGetIssueWorklogs = jest.fn();
jest.mock('jira-client', () => {
  return jest.fn().mockImplementation(() => ({
    getIssueWorklogs: mockGetIssueWorklogs,
  }));
});

// Mock the logger
jest.mock('../../src/utils/logger.js', () => ({
  logger: {
    log: jest.fn(),
    error: jest.fn(),
  },
}));

describe('JiraClientWrapper.getIssueWorklogs', () => {
  let jiraWrapper: JiraClientWrapper;
  const testConfig = {
    url: 'https://test.atlassian.net',
    bearer: 'test-token',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jiraWrapper = new JiraClientWrapper(testConfig);
  });

  describe('successful worklog retrieval', () => {
    it('should return worklogs for a valid issue key', async () => {
      // Arrange
      const issueKey = 'TEST-123';
      const mockWorklogs: JiraWorklog[] = [
        {
          self: 'https://test.atlassian.net/rest/api/2/issue/10000/worklog/10001',
          id: '10001',
          issueId: '10000',
          author: {
            self: 'https://test.atlassian.net/rest/api/2/user?username=testuser',
            name: 'testuser',
            key: 'testuser',
            displayName: 'Test User',
            emailAddress: 'test@example.com',
            active: true,
            timeZone: 'America/New_York',
            avatarUrls: {
              '48x48':
                'https://test.atlassian.net/secure/useravatar?size=large&ownerId=testuser',
            },
          },
          created: '2024-01-15T10:30:00.000+0000',
          updated: '2024-01-15T10:30:00.000+0000',
          started: '2024-01-15T09:00:00.000+0000',
          timeSpent: '2h',
          timeSpentSeconds: 7200,
          comment: 'Fixed the bug in authentication module',
        },
        {
          self: 'https://test.atlassian.net/rest/api/2/issue/10000/worklog/10002',
          id: '10002',
          issueId: '10000',
          author: {
            self: 'https://test.atlassian.net/rest/api/2/user?username=developer',
            name: 'developer',
            key: 'developer',
            displayName: 'Developer User',
            emailAddress: 'dev@example.com',
            active: true,
            timeZone: 'UTC',
            avatarUrls: {
              '48x48':
                'https://test.atlassian.net/secure/useravatar?size=large&ownerId=developer',
            },
          },
          updateAuthor: {
            self: 'https://test.atlassian.net/rest/api/2/user?username=manager',
            name: 'manager',
            key: 'manager',
            displayName: 'Manager User',
            emailAddress: 'manager@example.com',
            active: true,
            timeZone: 'UTC',
            avatarUrls: {
              '48x48':
                'https://test.atlassian.net/secure/useravatar?size=large&ownerId=manager',
            },
          },
          created: '2024-01-16T14:15:00.000+0000',
          updated: '2024-01-16T15:00:00.000+0000',
          started: '2024-01-16T13:00:00.000+0000',
          timeSpent: '1h 30m',
          timeSpentSeconds: 5400,
          comment: 'Added unit tests',
          visibility: {
            type: 'group',
            value: 'developers',
          },
        },
      ];

      mockGetIssueWorklogs.mockResolvedValue({
        worklogs: mockWorklogs,
      });

      // Act
      const result = await jiraWrapper.getIssueWorklogs(issueKey);

      // Assert
      expect(mockGetIssueWorklogs).toHaveBeenCalledWith(issueKey);
      expect(result).toEqual(mockWorklogs);
      expect(logger.log).toHaveBeenCalledWith(
        `Getting worklogs for issue: ${issueKey}`
      );
      expect(logger.log).toHaveBeenCalledWith(
        `Successfully retrieved ${mockWorklogs.length} worklogs for issue: ${issueKey}`
      );
    });

    it('should return empty array when issue has no worklogs', async () => {
      // Arrange
      const issueKey = 'TEST-456';

      mockGetIssueWorklogs.mockResolvedValue({
        worklogs: [],
      });

      // Act
      const result = await jiraWrapper.getIssueWorklogs(issueKey);

      // Assert
      expect(result).toEqual([]);
      expect(logger.log).toHaveBeenCalledWith(
        `Successfully retrieved 0 worklogs for issue: ${issueKey}`
      );
    });

    it('should handle response without worklogs property', async () => {
      // Arrange
      const issueKey = 'TEST-789';

      mockGetIssueWorklogs.mockResolvedValue({}); // Missing worklogs property

      // Act
      const result = await jiraWrapper.getIssueWorklogs(issueKey);

      // Assert
      expect(result).toEqual([]);
      expect(logger.log).toHaveBeenCalledWith(
        `No worklogs property in response for issue: ${issueKey}`
      );
    });

    it('should handle null response', async () => {
      // Arrange
      const issueKey = 'TEST-NULL';
      mockGetIssueWorklogs.mockResolvedValue(null);

      // Act
      const result = await jiraWrapper.getIssueWorklogs(issueKey);

      // Assert
      expect(result).toEqual([]);
      expect(logger.log).toHaveBeenCalledWith(
        `No response received for issue worklogs: ${issueKey}`
      );
    });

    it('should handle worklogs with minimal required fields', async () => {
      // Arrange
      const issueKey = 'TEST-MINIMAL';
      const mockWorklogs: JiraWorklog[] = [
        {
          self: 'https://test.atlassian.net/rest/api/2/issue/10000/worklog/10003',
          id: '10003',
          issueId: '10000',
          author: {
            self: 'https://test.atlassian.net/rest/api/2/user?username=minimal',
            name: 'minimal',
            key: 'minimal',
            displayName: 'Minimal User',
            emailAddress: 'minimal@example.com',
            active: true,
            timeZone: 'UTC',
            avatarUrls: {},
          },
          created: '2024-01-17T12:00:00.000+0000',
          timeSpent: '30m',
          timeSpentSeconds: 1800,
          // No comment, started, updated, updateAuthor, or visibility
        },
      ];

      mockGetIssueWorklogs.mockResolvedValue({
        worklogs: mockWorklogs,
      });

      // Act
      const result = await jiraWrapper.getIssueWorklogs(issueKey);

      // Assert
      expect(result).toEqual(mockWorklogs);
      expect(result[0].comment).toBeUndefined();
      expect(result[0].started).toBeUndefined();
      expect(result[0].updated).toBeUndefined();
      expect(result[0].updateAuthor).toBeUndefined();
      expect(result[0].visibility).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should throw ApiError when issue does not exist', async () => {
      // Arrange
      const issueKey = 'NONEXISTENT-123';
      const jiraError = new Error('Issue Does Not Exist');
      (jiraError as any).statusCode = 404;
      mockGetIssueWorklogs.mockRejectedValue(jiraError);

      // Act & Assert
      await expect(jiraWrapper.getIssueWorklogs(issueKey)).rejects.toThrow(
        ApiError
      );
      expect(logger.error).toHaveBeenCalledWith(
        `Failed to get worklogs for issue ${issueKey}:`,
        jiraError
      );
    });

    it('should throw ApiError when user lacks permission', async () => {
      // Arrange
      const issueKey = 'FORBIDDEN-123';
      const jiraError = new Error('Forbidden');
      (jiraError as any).statusCode = 403;
      mockGetIssueWorklogs.mockRejectedValue(jiraError);

      // Act & Assert
      await expect(jiraWrapper.getIssueWorklogs(issueKey)).rejects.toThrow(
        ApiError
      );
      expect(logger.error).toHaveBeenCalledWith(
        `Failed to get worklogs for issue ${issueKey}:`,
        jiraError
      );
    });

    it('should throw ApiError when authentication fails', async () => {
      // Arrange
      const issueKey = 'AUTH-FAIL';
      const jiraError = new Error('Unauthorized');
      (jiraError as any).statusCode = 401;
      mockGetIssueWorklogs.mockRejectedValue(jiraError);

      // Act & Assert
      await expect(jiraWrapper.getIssueWorklogs(issueKey)).rejects.toThrow(
        ApiError
      );
      expect(logger.error).toHaveBeenCalledWith(
        `Failed to get worklogs for issue ${issueKey}:`,
        jiraError
      );
    });

    it('should throw ApiError for server errors', async () => {
      // Arrange
      const issueKey = 'SERVER-ERROR';
      const jiraError = new Error('Internal Server Error');
      (jiraError as any).statusCode = 500;
      mockGetIssueWorklogs.mockRejectedValue(jiraError);

      // Act & Assert
      await expect(jiraWrapper.getIssueWorklogs(issueKey)).rejects.toThrow(
        ApiError
      );
      expect(logger.error).toHaveBeenCalledWith(
        `Failed to get worklogs for issue ${issueKey}:`,
        jiraError
      );
    });

    it('should throw ApiError for network errors', async () => {
      // Arrange
      const issueKey = 'NETWORK-ERROR';
      const networkError = new Error('Network timeout');
      mockGetIssueWorklogs.mockRejectedValue(networkError);

      // Act & Assert
      await expect(jiraWrapper.getIssueWorklogs(issueKey)).rejects.toThrow(
        ApiError
      );
      expect(logger.error).toHaveBeenCalledWith(
        `Failed to get worklogs for issue ${issueKey}:`,
        networkError
      );
    });
  });

  describe('input validation and edge cases', () => {
    it('should handle issue keys with different formats', async () => {
      // Test various valid issue key formats
      const issueKeys = [
        'PROJECT-123',
        'LONG_PROJECT_NAME-999',
        'ABC-1',
        'TEST123-4567',
      ];

      for (const issueKey of issueKeys) {
        mockGetIssueWorklogs.mockResolvedValue({ worklogs: [] });

        const result = await jiraWrapper.getIssueWorklogs(issueKey);

        expect(mockGetIssueWorklogs).toHaveBeenCalledWith(issueKey);
        expect(result).toEqual([]);
      }
    });

    it('should handle worklogs with special characters in comments', async () => {
      // Arrange
      const issueKey = 'TEST-SPECIAL';
      const mockWorklogs: JiraWorklog[] = [
        {
          self: 'https://test.atlassian.net/rest/api/2/issue/10000/worklog/10004',
          id: '10004',
          issueId: '10000',
          author: {
            self: 'https://test.atlassian.net/rest/api/2/user?username=testuser',
            name: 'testuser',
            key: 'testuser',
            displayName: 'Test User',
            emailAddress: 'test@example.com',
            active: true,
            timeZone: 'UTC',
            avatarUrls: {},
          },
          created: '2024-01-18T10:00:00.000+0000',
          timeSpent: '1h',
          timeSpentSeconds: 3600,
          comment:
            'Fixed bug with "quotes" and <HTML> tags & special chars: àáâãäåæçèéêë',
        },
      ];

      mockGetIssueWorklogs.mockResolvedValue({
        worklogs: mockWorklogs,
      });

      // Act
      const result = await jiraWrapper.getIssueWorklogs(issueKey);

      // Assert
      expect(result).toEqual(mockWorklogs);
      expect(result[0].comment).toContain('quotes');
      expect(result[0].comment).toContain('<HTML>');
      expect(result[0].comment).toContain('àáâãäåæçèéêë');
    });

    it('should handle worklogs with very large time spent values', async () => {
      // Arrange
      const issueKey = 'TEST-LARGETIME';
      const mockWorklogs: JiraWorklog[] = [
        {
          self: 'https://test.atlassian.net/rest/api/2/issue/10000/worklog/10005',
          id: '10005',
          issueId: '10000',
          author: {
            self: 'https://test.atlassian.net/rest/api/2/user?username=testuser',
            name: 'testuser',
            key: 'testuser',
            displayName: 'Test User',
            emailAddress: 'test@example.com',
            active: true,
            timeZone: 'UTC',
            avatarUrls: {},
          },
          created: '2024-01-19T10:00:00.000+0000',
          timeSpent: '40h',
          timeSpentSeconds: 144000, // 40 hours in seconds
          comment: 'Major refactoring over multiple days',
        },
      ];

      mockGetIssueWorklogs.mockResolvedValue({
        worklogs: mockWorklogs,
      });

      // Act
      const result = await jiraWrapper.getIssueWorklogs(issueKey);

      // Assert
      expect(result).toEqual(mockWorklogs);
      expect(result[0].timeSpentSeconds).toBe(144000);
      expect(result[0].timeSpent).toBe('40h');
    });
  });
});
