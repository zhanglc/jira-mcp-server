import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { JiraConfig } from '../../src/types/config-types.js';
import { ApiError } from '../../src/types/api-error.js';

// Mock the jira-client module
jest.mock('jira-client');
const mockJiraClient = require('jira-client');

describe('JiraClientWrapper.downloadAttachments', () => {
  let wrapper: JiraClientWrapper;
  let mockClient: any;

  const config: JiraConfig = {
    url: 'https://test.jira.com',
    username: 'testuser',
    password: 'testpass',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      findIssue: jest.fn(),
    };
    mockJiraClient.mockImplementation(() => mockClient);
    wrapper = new JiraClientWrapper(config);
  });

  describe('successful scenarios', () => {
    it('should return attachments for issue with attachments', async () => {
      // Arrange
      const issueKey = 'TEST-123';
      const mockAttachments = [
        {
          id: '10001',
          self: 'https://test.jira.com/rest/api/2/attachment/10001',
          filename: 'document.pdf',
          author: {
            self: 'https://test.jira.com/rest/api/2/user?username=testuser',
            name: 'testuser',
            key: 'testuser',
            displayName: 'Test User',
            emailAddress: 'test@example.com',
            active: true,
            timeZone: 'UTC',
            avatarUrls: {},
          },
          created: '2024-01-15T10:30:00.000Z',
          size: 1024000,
          mimeType: 'application/pdf',
          content: 'https://test.jira.com/secure/attachment/10001/document.pdf',
        },
        {
          id: '10002',
          self: 'https://test.jira.com/rest/api/2/attachment/10002',
          filename: 'image.png',
          author: {
            self: 'https://test.jira.com/rest/api/2/user?username=testuser2',
            name: 'testuser2',
            key: 'testuser2',
            displayName: 'Test User 2',
            emailAddress: 'test2@example.com',
            active: true,
            timeZone: 'UTC',
            avatarUrls: {},
          },
          created: '2024-01-16T14:45:00.000Z',
          size: 512000,
          mimeType: 'image/png',
          content: 'https://test.jira.com/secure/attachment/10002/image.png',
          thumbnail: 'https://test.jira.com/secure/thumbnail/10002/image.png',
        },
      ];

      const mockIssue = {
        id: '10000',
        key: issueKey,
        self: 'https://test.jira.com/rest/api/2/issue/10000',
        fields: {
          attachment: mockAttachments,
        },
      };

      mockClient.findIssue.mockResolvedValue(mockIssue);

      // Act
      const result = await wrapper.downloadAttachments(issueKey);

      // Assert
      expect(mockClient.findIssue).toHaveBeenCalledWith(
        issueKey,
        '',
        'attachment'
      );
      expect(result).toHaveLength(2);

      // Verify first attachment
      expect(result[0]).toEqual({
        id: '10001',
        self: 'https://test.jira.com/rest/api/2/attachment/10001',
        filename: 'document.pdf',
        author: mockAttachments[0].author,
        created: '2024-01-15T10:30:00.000Z',
        size: 1024000,
        mimeType: 'application/pdf',
        content: 'https://test.jira.com/secure/attachment/10001/document.pdf',
      });

      // Verify second attachment (with thumbnail)
      expect(result[1]).toEqual({
        id: '10002',
        self: 'https://test.jira.com/rest/api/2/attachment/10002',
        filename: 'image.png',
        author: mockAttachments[1].author,
        created: '2024-01-16T14:45:00.000Z',
        size: 512000,
        mimeType: 'image/png',
        content: 'https://test.jira.com/secure/attachment/10002/image.png',
        thumbnail: 'https://test.jira.com/secure/thumbnail/10002/image.png',
      });
    });

    it('should return empty array for issue without attachments', async () => {
      // Arrange
      const issueKey = 'TEST-456';
      const mockIssue = {
        id: '10001',
        key: issueKey,
        self: 'https://test.jira.com/rest/api/2/issue/10001',
        fields: {
          attachment: [],
        },
      };

      mockClient.findIssue.mockResolvedValue(mockIssue);

      // Act
      const result = await wrapper.downloadAttachments(issueKey);

      // Assert
      expect(mockClient.findIssue).toHaveBeenCalledWith(
        issueKey,
        '',
        'attachment'
      );
      expect(result).toEqual([]);
    });

    it('should return empty array when attachment field is null', async () => {
      // Arrange
      const issueKey = 'TEST-789';
      const mockIssue = {
        id: '10002',
        key: issueKey,
        self: 'https://test.jira.com/rest/api/2/issue/10002',
        fields: {
          attachment: null,
        },
      };

      mockClient.findIssue.mockResolvedValue(mockIssue);

      // Act
      const result = await wrapper.downloadAttachments(issueKey);

      // Assert
      expect(mockClient.findIssue).toHaveBeenCalledWith(
        issueKey,
        '',
        'attachment'
      );
      expect(result).toEqual([]);
    });

    it('should return empty array when attachment field is undefined', async () => {
      // Arrange
      const issueKey = 'TEST-101';
      const mockIssue = {
        id: '10003',
        key: issueKey,
        self: 'https://test.jira.com/rest/api/2/issue/10003',
        fields: {},
      };

      mockClient.findIssue.mockResolvedValue(mockIssue);

      // Act
      const result = await wrapper.downloadAttachments(issueKey);

      // Assert
      expect(mockClient.findIssue).toHaveBeenCalledWith(
        issueKey,
        '',
        'attachment'
      );
      expect(result).toEqual([]);
    });
  });

  describe('error scenarios', () => {
    it('should throw ApiError when issue does not exist (404)', async () => {
      // Arrange
      const issueKey = 'NONEXISTENT-123';
      const jiraError = {
        statusCode: 404,
        message:
          'Issue does not exist or you do not have permission to see it.',
      };
      mockClient.findIssue.mockRejectedValue(jiraError);

      // Act & Assert
      await expect(wrapper.downloadAttachments(issueKey)).rejects.toThrow(
        ApiError
      );
      await expect(wrapper.downloadAttachments(issueKey)).rejects.toThrow(
        'Issue does not exist or you do not have permission to see it'
      );
      expect(mockClient.findIssue).toHaveBeenCalledWith(
        issueKey,
        '',
        'attachment'
      );
    });

    it('should throw ApiError when access is denied (403)', async () => {
      // Arrange
      const issueKey = 'RESTRICTED-456';
      const jiraError = {
        statusCode: 403,
        message: 'You do not have permission to view this issue.',
      };
      mockClient.findIssue.mockRejectedValue(jiraError);

      // Act & Assert
      await expect(wrapper.downloadAttachments(issueKey)).rejects.toThrow(
        ApiError
      );
      await expect(wrapper.downloadAttachments(issueKey)).rejects.toThrow(
        'You do not have permission to view this issue'
      );
      expect(mockClient.findIssue).toHaveBeenCalledWith(
        issueKey,
        '',
        'attachment'
      );
    });

    it('should throw ApiError when authentication fails (401)', async () => {
      // Arrange
      const issueKey = 'TEST-789';
      const jiraError = {
        statusCode: 401,
        message: 'You are not authenticated.',
      };
      mockClient.findIssue.mockRejectedValue(jiraError);

      // Act & Assert
      await expect(wrapper.downloadAttachments(issueKey)).rejects.toThrow(
        ApiError
      );
      await expect(wrapper.downloadAttachments(issueKey)).rejects.toThrow(
        'You are not authenticated'
      );
      expect(mockClient.findIssue).toHaveBeenCalledWith(
        issueKey,
        '',
        'attachment'
      );
    });

    it('should throw ApiError when network error occurs', async () => {
      // Arrange
      const issueKey = 'TEST-NETWORK';
      const networkError = new Error('Network error');
      mockClient.findIssue.mockRejectedValue(networkError);

      // Act & Assert
      await expect(wrapper.downloadAttachments(issueKey)).rejects.toThrow(
        ApiError
      );
      expect(mockClient.findIssue).toHaveBeenCalledWith(
        issueKey,
        '',
        'attachment'
      );
    });

    it('should throw ApiError when response is null', async () => {
      // Arrange
      const issueKey = 'TEST-NULL';
      mockClient.findIssue.mockResolvedValue(null);

      // Act & Assert
      await expect(wrapper.downloadAttachments(issueKey)).rejects.toThrow(
        ApiError
      );
      await expect(wrapper.downloadAttachments(issueKey)).rejects.toThrow(
        'No issue information received'
      );
      expect(mockClient.findIssue).toHaveBeenCalledWith(
        issueKey,
        '',
        'attachment'
      );
    });

    it('should throw ApiError when response is undefined', async () => {
      // Arrange
      const issueKey = 'TEST-UNDEFINED';
      mockClient.findIssue.mockResolvedValue(undefined);

      // Act & Assert
      await expect(wrapper.downloadAttachments(issueKey)).rejects.toThrow(
        ApiError
      );
      await expect(wrapper.downloadAttachments(issueKey)).rejects.toThrow(
        'No issue information received'
      );
      expect(mockClient.findIssue).toHaveBeenCalledWith(
        issueKey,
        '',
        'attachment'
      );
    });

    it('should throw ApiError when response lacks fields property', async () => {
      // Arrange
      const issueKey = 'TEST-INVALID';
      const invalidIssue = {
        id: '10004',
        key: issueKey,
        self: 'https://test.jira.com/rest/api/2/issue/10004',
        // Missing fields property
      };
      mockClient.findIssue.mockResolvedValue(invalidIssue);

      // Act & Assert
      await expect(wrapper.downloadAttachments(issueKey)).rejects.toThrow(
        ApiError
      );
      await expect(wrapper.downloadAttachments(issueKey)).rejects.toThrow(
        'Invalid issue response'
      );
      expect(mockClient.findIssue).toHaveBeenCalledWith(
        issueKey,
        '',
        'attachment'
      );
    });
  });

  describe('parameter validation', () => {
    it('should handle empty issue key', async () => {
      // Arrange
      const issueKey = '';
      const jiraError = {
        statusCode: 400,
        message: 'Issue key is required',
      };
      mockClient.findIssue.mockRejectedValue(jiraError);

      // Act & Assert
      await expect(wrapper.downloadAttachments(issueKey)).rejects.toThrow(
        ApiError
      );
      expect(mockClient.findIssue).toHaveBeenCalledWith('', '', 'attachment');
    });

    it('should handle whitespace-only issue key', async () => {
      // Arrange
      const issueKey = '   ';
      const jiraError = {
        statusCode: 400,
        message: 'Issue key is required',
      };
      mockClient.findIssue.mockRejectedValue(jiraError);

      // Act & Assert
      await expect(wrapper.downloadAttachments(issueKey)).rejects.toThrow(
        ApiError
      );
      expect(mockClient.findIssue).toHaveBeenCalledWith(
        '   ',
        '',
        'attachment'
      );
    });
  });

  describe('data model validation', () => {
    it('should handle attachment with missing optional thumbnail', async () => {
      // Arrange
      const issueKey = 'TEST-OPTIONAL';
      const mockAttachment = {
        id: '10005',
        self: 'https://test.jira.com/rest/api/2/attachment/10005',
        filename: 'text-file.txt',
        author: {
          self: 'https://test.jira.com/rest/api/2/user?username=testuser',
          name: 'testuser',
          key: 'testuser',
          displayName: 'Test User',
          emailAddress: 'test@example.com',
          active: true,
          timeZone: 'UTC',
          avatarUrls: {},
        },
        created: '2024-01-17T09:15:00.000Z',
        size: 2048,
        mimeType: 'text/plain',
        content: 'https://test.jira.com/secure/attachment/10005/text-file.txt',
        // No thumbnail property for non-image files
      };

      const mockIssue = {
        id: '10005',
        key: issueKey,
        self: 'https://test.jira.com/rest/api/2/issue/10005',
        fields: {
          attachment: [mockAttachment],
        },
      };

      mockClient.findIssue.mockResolvedValue(mockIssue);

      // Act
      const result = await wrapper.downloadAttachments(issueKey);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: '10005',
        self: 'https://test.jira.com/rest/api/2/attachment/10005',
        filename: 'text-file.txt',
        author: mockAttachment.author,
        created: '2024-01-17T09:15:00.000Z',
        size: 2048,
        mimeType: 'text/plain',
        content: 'https://test.jira.com/secure/attachment/10005/text-file.txt',
        // thumbnail property should not be present
      });
      expect(result[0]).not.toHaveProperty('thumbnail');
    });

    it('should handle various file types with correct mimeTypes', async () => {
      // Arrange
      const issueKey = 'TEST-FILETYPES';
      const mockAttachments = [
        {
          id: '10006',
          self: 'https://test.jira.com/rest/api/2/attachment/10006',
          filename: 'spreadsheet.xlsx',
          author: {
            self: 'https://test.jira.com/rest/api/2/user?username=testuser',
            name: 'testuser',
            key: 'testuser',
            displayName: 'Test User',
            emailAddress: 'test@example.com',
            active: true,
            timeZone: 'UTC',
            avatarUrls: {},
          },
          created: '2024-01-18T11:20:00.000Z',
          size: 51200,
          mimeType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          content:
            'https://test.jira.com/secure/attachment/10006/spreadsheet.xlsx',
        },
        {
          id: '10007',
          self: 'https://test.jira.com/rest/api/2/attachment/10007',
          filename: 'video.mp4',
          author: {
            self: 'https://test.jira.com/rest/api/2/user?username=testuser',
            name: 'testuser',
            key: 'testuser',
            displayName: 'Test User',
            emailAddress: 'test@example.com',
            active: true,
            timeZone: 'UTC',
            avatarUrls: {},
          },
          created: '2024-01-18T12:30:00.000Z',
          size: 10485760,
          mimeType: 'video/mp4',
          content: 'https://test.jira.com/secure/attachment/10007/video.mp4',
        },
      ];

      const mockIssue = {
        id: '10006',
        key: issueKey,
        self: 'https://test.jira.com/rest/api/2/issue/10006',
        fields: {
          attachment: mockAttachments,
        },
      };

      mockClient.findIssue.mockResolvedValue(mockIssue);

      // Act
      const result = await wrapper.downloadAttachments(issueKey);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].mimeType).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      expect(result[1].mimeType).toBe('video/mp4');
    });
  });
});
