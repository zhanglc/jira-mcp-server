import * as fs from 'fs/promises';
import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { getSampleIssue } from '../../src/scripts/generate-field-definitions.js';

// Mock dependencies
jest.mock('../../src/client/jira-client-wrapper.js');
jest.mock('fs/promises');

describe('Generate Field Definitions Script', () => {
  let mockJiraClient: jest.Mocked<JiraClientWrapper>;
  const mockWriteFile = fs.writeFile as jest.MockedFunction<
    typeof fs.writeFile
  >;
  const mockMkdir = fs.mkdir as jest.MockedFunction<typeof fs.mkdir>;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };

    // Create mock JiraClient instance
    mockJiraClient = {
      getIssue: jest.fn(),
    } as any;

    // Mock the constructor
    (
      JiraClientWrapper as jest.MockedClass<typeof JiraClientWrapper>
    ).mockImplementation(() => mockJiraClient);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getSampleIssue', () => {
    it('should fetch issue data and save to JSON file', async () => {
      // Arrange
      const mockIssueData = {
        key: 'DSCWA-373',
        fields: {
          summary: 'Test issue summary',
          status: {
            name: 'Done',
            statusCategory: {
              key: 'done',
              name: 'Done',
            },
          },
          assignee: {
            displayName: 'John Doe',
            emailAddress: 'john.doe@example.com',
          },
          customfield_10001: 'Custom field value',
          customfield_10002: { value: 'Custom object field' },
        },
      };

      mockJiraClient.getIssue.mockResolvedValue(mockIssueData);
      mockWriteFile.mockResolvedValue(undefined);
      mockMkdir.mockResolvedValue(undefined);

      // Spy on console.log to verify output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await getSampleIssue();

      // Assert
      expect(mockJiraClient.getIssue).toHaveBeenCalledWith('DSCWA-373');
      expect(mockMkdir).toHaveBeenCalledWith('data', { recursive: true });
      expect(mockWriteFile).toHaveBeenCalledWith(
        'data/sample-issue.json',
        JSON.stringify(mockIssueData, null, 2)
      );

      // Verify console output
      expect(consoleSpy).toHaveBeenCalledWith(
        'Sample issue saved to data/sample-issue.json'
      );
      expect(consoleSpy).toHaveBeenCalledWith('Total fields: 5');
      expect(consoleSpy).toHaveBeenCalledWith('Custom fields: 2');
      expect(consoleSpy).toHaveBeenCalledWith('System fields: 3');

      consoleSpy.mockRestore();
    });

    it('should handle empty custom fields correctly', async () => {
      // Arrange
      const mockIssueData = {
        key: 'DSCWA-373',
        fields: {
          summary: 'Test issue summary',
          status: { name: 'Done' },
          assignee: { displayName: 'John Doe' },
        },
      };

      mockJiraClient.getIssue.mockResolvedValue(mockIssueData);
      mockWriteFile.mockResolvedValue(undefined);
      mockMkdir.mockResolvedValue(undefined);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await getSampleIssue();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Total fields: 3');
      expect(consoleSpy).toHaveBeenCalledWith('Custom fields: 0');
      expect(consoleSpy).toHaveBeenCalledWith('System fields: 3');

      consoleSpy.mockRestore();
    });

    it('should handle Jira client errors properly', async () => {
      // Arrange
      const errorMessage = 'Connection failed';
      mockJiraClient.getIssue.mockRejectedValue(new Error(errorMessage));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(getSampleIssue()).rejects.toThrow(errorMessage);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error generating sample issue:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle file system errors properly', async () => {
      // Arrange
      const mockIssueData = {
        key: 'DSCWA-373',
        fields: { summary: 'Test' },
      };

      mockJiraClient.getIssue.mockResolvedValue(mockIssueData);
      mockWriteFile.mockRejectedValue(new Error('File write failed'));
      mockMkdir.mockResolvedValue(undefined);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(getSampleIssue()).rejects.toThrow('File write failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error generating sample issue:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should count fields correctly with complex data structure', async () => {
      // Arrange
      const mockIssueData = {
        key: 'DSCWA-373',
        fields: {
          summary: 'Test issue',
          status: { name: 'Done' },
          assignee: { displayName: 'John' },
          reporter: { displayName: 'Jane' },
          project: { key: 'DSCWA', name: 'Test Project' },
          customfield_10001: 'Custom 1',
          customfield_10002: { value: 'Custom 2' },
          customfield_10003: ['Array', 'Values'],
          customfield_10004: null,
          customfield_10005: { complex: { nested: 'value' } },
        },
      };

      mockJiraClient.getIssue.mockResolvedValue(mockIssueData);
      mockWriteFile.mockResolvedValue(undefined);
      mockMkdir.mockResolvedValue(undefined);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await getSampleIssue();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Total fields: 10');
      expect(consoleSpy).toHaveBeenCalledWith('Custom fields: 5');
      expect(consoleSpy).toHaveBeenCalledWith('System fields: 5');

      consoleSpy.mockRestore();
    });

    it('should use custom issue key from environment variable', async () => {
      // Arrange
      process.env.SAMPLE_ISSUE_KEY = 'TEST-123';

      const mockIssueData = {
        key: 'TEST-123',
        fields: {
          summary: 'Custom test issue',
          status: { name: 'Open' },
        },
      };

      mockJiraClient.getIssue.mockResolvedValue(mockIssueData);
      mockWriteFile.mockResolvedValue(undefined);
      mockMkdir.mockResolvedValue(undefined);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await getSampleIssue();

      // Assert
      expect(mockJiraClient.getIssue).toHaveBeenCalledWith('TEST-123');
      expect(mockMkdir).toHaveBeenCalledWith('data', { recursive: true });
      expect(mockWriteFile).toHaveBeenCalledWith(
        'data/sample-issue.json',
        JSON.stringify(mockIssueData, null, 2)
      );

      consoleSpy.mockRestore();
    });

    it('should create output directory if it does not exist', async () => {
      // Arrange
      const mockIssueData = {
        key: 'DSCWA-373',
        fields: { summary: 'Test' },
      };

      mockJiraClient.getIssue.mockResolvedValue(mockIssueData);
      mockWriteFile.mockResolvedValue(undefined);
      mockMkdir.mockResolvedValue(undefined);

      // Act
      await getSampleIssue();

      // Assert
      expect(mockMkdir).toHaveBeenCalledWith('data', { recursive: true });
      expect(mockWriteFile).toHaveBeenCalledWith(
        'data/sample-issue.json',
        JSON.stringify(mockIssueData, null, 2)
      );
    });

    it('should handle directory creation errors gracefully', async () => {
      // Arrange
      const mockIssueData = {
        key: 'DSCWA-373',
        fields: { summary: 'Test' },
      };

      mockJiraClient.getIssue.mockResolvedValue(mockIssueData);
      mockMkdir.mockRejectedValue(new Error('Permission denied'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(getSampleIssue()).rejects.toThrow('Permission denied');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error generating sample issue:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
