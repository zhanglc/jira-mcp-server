import { ToolHandler } from '../../../src/server/handlers/tool-handler.js';
import { JiraClientWrapper } from '../../../src/client/jira-client-wrapper.js';
import { ApiError } from '../../../src/types/api-error.js';

// Mock the JiraClientWrapper
const mockJiraClientWrapper = {
  getIssue: jest.fn(),
};

// Mock logger to avoid console output during tests
jest.mock('../../../src/utils/logger.js', () => ({
  logger: {
    log: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock config to avoid loading real environment variables
jest.mock('../../../src/utils/config.js', () => ({
  loadConfig: jest.fn(() => ({
    url: 'https://test.atlassian.net',
    bearer: 'test-bearer-token',
  })),
}));

describe('ToolHandler getIssue with expand parameter', () => {
  let toolHandler: ToolHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    toolHandler = new ToolHandler(
      mockJiraClientWrapper as unknown as JiraClientWrapper
    );
  });

  describe('Expand parameter validation', () => {
    test('should accept valid expand parameters', async () => {
      // Arrange
      const mockIssueResponse = {
        id: '12345',
        key: 'TEST-123',
        fields: { summary: 'Test' },
        changelog: { histories: [] },
      };
      mockJiraClientWrapper.getIssue.mockResolvedValue(mockIssueResponse);

      const validExpandOptions = [
        'changelog',
        'renderedFields',
        'names',
        'schema',
        'transitions',
        'operations',
        'editmeta',
        'versionedRepresentations',
      ];

      for (const expandOption of validExpandOptions) {
        // Act
        const result = await toolHandler.handleTool('getIssue', {
          issueKey: 'TEST-123',
          expand: [expandOption],
        });

        // Assert
        expect(mockJiraClientWrapper.getIssue).toHaveBeenCalledWith(
          'TEST-123',
          undefined,
          [expandOption]
        );
        expect(result.content[0].text).toContain('"id": "12345"');
      }
    });

    test('should accept multiple valid expand parameters', async () => {
      // Arrange
      const mockIssueResponse = {
        id: '12345',
        key: 'TEST-123',
        fields: { summary: 'Test' },
        changelog: { histories: [] },
        transitions: [],
      };
      mockJiraClientWrapper.getIssue.mockResolvedValue(mockIssueResponse);

      // Act
      const result = await toolHandler.handleTool('getIssue', {
        issueKey: 'TEST-123',
        expand: ['changelog', 'transitions'],
      });

      // Assert
      expect(mockJiraClientWrapper.getIssue).toHaveBeenCalledWith(
        'TEST-123',
        undefined,
        ['changelog', 'transitions']
      );
      expect(result.content[0].text).toContain('"id": "12345"');
    });

    test('should reject invalid expand parameters', async () => {
      // Arrange & Act & Assert
      await expect(
        toolHandler.handleTool('getIssue', {
          issueKey: 'TEST-123',
          expand: ['invalid_option'],
        })
      ).rejects.toThrow(ApiError);

      await expect(
        toolHandler.handleTool('getIssue', {
          issueKey: 'TEST-123',
          expand: ['changelog', 'invalid_option'],
        })
      ).rejects.toThrow(
        'Invalid expand options: invalid_option. Valid options are: changelog, renderedFields, names, schema, transitions, operations, editmeta, versionedRepresentations'
      );
    });

    test('should reject non-string expand parameters', async () => {
      // Arrange & Act & Assert
      await expect(
        toolHandler.handleTool('getIssue', {
          issueKey: 'TEST-123',
          expand: [123],
        })
      ).rejects.toThrow(ApiError);

      await expect(
        toolHandler.handleTool('getIssue', {
          issueKey: 'TEST-123',
          expand: ['changelog', null],
        })
      ).rejects.toThrow(ApiError);
    });

    test('should reject non-array expand parameter', async () => {
      // Arrange & Act & Assert
      await expect(
        toolHandler.handleTool('getIssue', {
          issueKey: 'TEST-123',
          expand: 'changelog',
        })
      ).rejects.toThrow('expand must be an array of strings');
    });

    test('should handle empty expand array', async () => {
      // Arrange
      const mockIssueResponse = {
        id: '12345',
        key: 'TEST-123',
        fields: { summary: 'Test' },
      };
      mockJiraClientWrapper.getIssue.mockResolvedValue(mockIssueResponse);

      // Act
      const result = await toolHandler.handleTool('getIssue', {
        issueKey: 'TEST-123',
        expand: [],
      });

      // Assert
      expect(mockJiraClientWrapper.getIssue).toHaveBeenCalledWith(
        'TEST-123',
        undefined,
        []
      );
      expect(result.content[0].text).toContain('"id": "12345"');
    });
  });

  describe('Expand parameter combined with fields', () => {
    test('should handle both fields and expand parameters', async () => {
      // Arrange
      const mockIssueResponse = {
        id: '12345',
        key: 'TEST-123',
        fields: { summary: 'Test', status: { name: 'Open' } },
        changelog: { histories: [] },
      };
      mockJiraClientWrapper.getIssue.mockResolvedValue(mockIssueResponse);

      // Act
      const result = await toolHandler.handleTool('getIssue', {
        issueKey: 'TEST-123',
        fields: ['summary', 'status'],
        expand: ['changelog'],
      });

      // Assert
      expect(mockJiraClientWrapper.getIssue).toHaveBeenCalledWith(
        'TEST-123',
        ['summary', 'status'],
        ['changelog']
      );
      expect(result.content[0].text).toContain('"id": "12345"');
    });

    test('should handle expand without fields', async () => {
      // Arrange
      const mockIssueResponse = {
        id: '12345',
        key: 'TEST-123',
        fields: { summary: 'Test' },
        changelog: { histories: [] },
      };
      mockJiraClientWrapper.getIssue.mockResolvedValue(mockIssueResponse);

      // Act
      const result = await toolHandler.handleTool('getIssue', {
        issueKey: 'TEST-123',
        expand: ['changelog'],
      });

      // Assert
      expect(mockJiraClientWrapper.getIssue).toHaveBeenCalledWith(
        'TEST-123',
        undefined,
        ['changelog']
      );
      expect(result.content[0].text).toContain('"id": "12345"');
    });

    test('should handle fields without expand', async () => {
      // Arrange
      const mockIssueResponse = {
        id: '12345',
        key: 'TEST-123',
        fields: { summary: 'Test' },
      };
      mockJiraClientWrapper.getIssue.mockResolvedValue(mockIssueResponse);

      // Act
      const result = await toolHandler.handleTool('getIssue', {
        issueKey: 'TEST-123',
        fields: ['summary'],
      });

      // Assert
      expect(mockJiraClientWrapper.getIssue).toHaveBeenCalledWith(
        'TEST-123',
        ['summary'],
        undefined
      );
      expect(result.content[0].text).toContain('"id": "12345"');
    });
  });

  describe('Backward compatibility', () => {
    test('should work without expand parameter (existing behavior)', async () => {
      // Arrange
      const mockIssueResponse = {
        id: '12345',
        key: 'TEST-123',
        fields: { summary: 'Test' },
      };
      mockJiraClientWrapper.getIssue.mockResolvedValue(mockIssueResponse);

      // Act
      const result = await toolHandler.handleTool('getIssue', {
        issueKey: 'TEST-123',
      });

      // Assert
      expect(mockJiraClientWrapper.getIssue).toHaveBeenCalledWith(
        'TEST-123',
        undefined,
        undefined
      );
      expect(result.content[0].text).toContain('"id": "12345"');
    });

    test('should work with only fields parameter (existing behavior)', async () => {
      // Arrange
      const mockIssueResponse = {
        id: '12345',
        key: 'TEST-123',
        fields: { summary: 'Test' },
      };
      mockJiraClientWrapper.getIssue.mockResolvedValue(mockIssueResponse);

      // Act
      const result = await toolHandler.handleTool('getIssue', {
        issueKey: 'TEST-123',
        fields: ['summary', 'status'],
      });

      // Assert
      expect(mockJiraClientWrapper.getIssue).toHaveBeenCalledWith(
        'TEST-123',
        ['summary', 'status'],
        undefined
      );
      expect(result.content[0].text).toContain('"id": "12345"');
    });
  });

  describe('Real-world expand scenarios', () => {
    test('should handle changelog expand for issue history', async () => {
      // Arrange
      const mockIssueResponse = {
        id: '12345',
        key: 'TEST-123',
        fields: { summary: 'Test Issue' },
        changelog: {
          startAt: 0,
          maxResults: 50,
          total: 1,
          histories: [
            {
              id: '10001',
              author: {
                self: 'https://test.atlassian.net/rest/api/2/user?username=admin',
                name: 'admin',
                key: 'admin',
                displayName: 'Administrator',
                emailAddress: 'admin@example.com',
              },
              created: '2024-01-01T10:00:00.000Z',
              items: [
                {
                  field: 'status',
                  fieldtype: 'jira',
                  from: '1',
                  fromString: 'Open',
                  to: '3',
                  toString: 'In Progress',
                },
              ],
            },
          ],
        },
      };
      mockJiraClientWrapper.getIssue.mockResolvedValue(mockIssueResponse);

      // Act
      const result = await toolHandler.handleTool('getIssue', {
        issueKey: 'TEST-123',
        expand: ['changelog'],
      });

      // Assert
      expect(mockJiraClientWrapper.getIssue).toHaveBeenCalledWith(
        'TEST-123',
        undefined,
        ['changelog']
      );
      
      const responseObj = JSON.parse(result.content[0].text);
      expect(responseObj).toHaveProperty('changelog');
      expect(responseObj.changelog.histories).toHaveLength(1);
      expect(responseObj.changelog.histories[0].items[0].field).toBe('status');
    });

    test('should handle multiple expand options for comprehensive issue data', async () => {
      // Arrange
      const mockIssueResponse = {
        id: '12345',
        key: 'TEST-123',
        fields: { summary: 'Test Issue' },
        changelog: { histories: [] },
        transitions: [
          { id: '21', name: 'Done', to: { name: 'Done' } },
        ],
        renderedFields: {
          summary: '<p>Test Issue</p>',
          description: '<p>Rendered description</p>',
        },
      };
      mockJiraClientWrapper.getIssue.mockResolvedValue(mockIssueResponse);

      // Act
      const result = await toolHandler.handleTool('getIssue', {
        issueKey: 'TEST-123',
        expand: ['changelog', 'transitions', 'renderedFields'],
      });

      // Assert
      expect(mockJiraClientWrapper.getIssue).toHaveBeenCalledWith(
        'TEST-123',
        undefined,
        ['changelog', 'transitions', 'renderedFields']
      );
      
      const responseObj = JSON.parse(result.content[0].text);
      expect(responseObj).toHaveProperty('changelog');
      expect(responseObj).toHaveProperty('transitions');
      expect(responseObj).toHaveProperty('renderedFields');
      expect(responseObj.transitions).toHaveLength(1);
    });
  });

  describe('Error propagation', () => {
    test('should propagate JiraClientWrapper errors', async () => {
      // Arrange
      const jiraError = new ApiError('Issue not found', 404);
      mockJiraClientWrapper.getIssue.mockRejectedValue(jiraError);

      // Act & Assert
      await expect(
        toolHandler.handleTool('getIssue', {
          issueKey: 'NONEXISTENT-123',
          expand: ['changelog'],
        })
      ).rejects.toThrow('Issue not found');
    });

    test('should handle invalid issueKey with expand parameter', async () => {
      // Act & Assert
      await expect(
        toolHandler.handleTool('getIssue', {
          issueKey: '',
          expand: ['changelog'],
        })
      ).rejects.toThrow('issueKey is required and must be a string');

      await expect(
        toolHandler.handleTool('getIssue', {
          expand: ['changelog'],
        })
      ).rejects.toThrow('issueKey is required and must be a string');
    });
  });
});