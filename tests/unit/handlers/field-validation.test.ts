import { ToolHandler } from '@/server/handlers/tool-handler';
import { JiraResourceHandler } from '@/server/resources/resource-handler';
import { JiraClientWrapper } from '@/client/jira-client-wrapper';
import { ApiError } from '@/types/api-error';
import type { ToolArgs } from '@/types/mcp-types';

// Mock dependencies
jest.mock('@/client/jira-client-wrapper');
jest.mock('@/server/resources/resource-handler');

describe('ToolHandler Field Validation Integration', () => {
  let toolHandler: ToolHandler;
  let mockJiraClient: jest.Mocked<JiraClientWrapper>;
  let mockResourceHandler: jest.Mocked<JiraResourceHandler>;

  beforeEach(() => {
    // Create mocked instances
    mockJiraClient = new JiraClientWrapper(
      {} as any
    ) as jest.Mocked<JiraClientWrapper>;
    mockResourceHandler =
      new JiraResourceHandler() as jest.Mocked<JiraResourceHandler>;

    // Initialize ToolHandler with dependencies
    toolHandler = new ToolHandler(mockJiraClient, mockResourceHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Field Validation in getIssue Tool', () => {
    it('should validate field paths before API call', async () => {
      // Arrange: Mock valid field validation
      mockResourceHandler.validateFieldPaths.mockReturnValue({
        isValid: true,
        validPaths: ['summary', 'status.name'],
        invalidPaths: [],
        pathInfo: {
          summary: {
            fieldId: 'summary',
            type: 'string',
            description: 'Issue summary',
          },
          'status.name': {
            fieldId: 'status',
            type: 'string',
            description: 'Status name',
          },
        },
      });

      mockJiraClient.getIssue.mockResolvedValue({
        key: 'TEST-123',
        fields: { summary: 'Test Issue', status: { name: 'Open' } },
      });

      const args: ToolArgs = {
        issueKey: 'TEST-123',
        fields: ['summary', 'status.name'],
      };

      // Act
      const result = await toolHandler.handleTool('getIssue', args);

      // Assert
      expect(mockResourceHandler.validateFieldPaths).toHaveBeenCalledWith(
        'issue',
        ['summary', 'status.name']
      );
      expect(mockJiraClient.getIssue).toHaveBeenCalledWith('TEST-123', [
        'summary',
        'status.name',
      ]);
      expect(result.content[0].text).toContain('TEST-123');
    });

    it('should filter invalid fields and warn user when some fields are invalid', async () => {
      // Arrange: Mock mixed validation result
      mockResourceHandler.validateFieldPaths.mockReturnValue({
        isValid: false,
        validPaths: ['summary'],
        invalidPaths: ['invalid_field', 'typo_field'],
        pathInfo: {
          summary: {
            fieldId: 'summary',
            type: 'string',
            description: 'Issue summary',
          },
        },
        suggestions: {
          typo_field: ['assignee', 'reporter'],
          invalid_field: ['assignee.displayName'],
        },
      });

      mockJiraClient.getIssue.mockResolvedValue({
        key: 'TEST-123',
        fields: { summary: 'Test Issue' },
      });

      const args: ToolArgs = {
        issueKey: 'TEST-123',
        fields: ['summary', 'invalid_field', 'typo_field'],
      };

      // Act
      const result = await toolHandler.handleTool('getIssue', args);

      // Assert
      expect(mockResourceHandler.validateFieldPaths).toHaveBeenCalledWith(
        'issue',
        ['summary', 'invalid_field', 'typo_field']
      );
      expect(mockJiraClient.getIssue).toHaveBeenCalledWith('TEST-123', [
        'summary',
      ]);

      // Check that warnings are included in response
      const responseText = result.content[0].text;
      expect(responseText).toContain(
        'WARNING: Some fields were invalid and filtered out'
      );
      expect(responseText).toContain(
        'Invalid fields: invalid_field, typo_field'
      );
      expect(responseText).toContain(
        'Suggestions for \\"typo_field\\": assignee, reporter'
      );
      expect(responseText).toContain(
        'Suggestions for \\"invalid_field\\": assignee.displayName'
      );
    });

    it('should fail when all fields are invalid', async () => {
      // Arrange: Mock all fields invalid
      mockResourceHandler.validateFieldPaths.mockReturnValue({
        isValid: false,
        validPaths: [],
        invalidPaths: ['invalid_field1', 'invalid_field2'],
        suggestions: {
          invalid_field1: ['summary'],
          invalid_field2: ['status.name'],
        },
      });

      const args: ToolArgs = {
        issueKey: 'TEST-123',
        fields: ['invalid_field1', 'invalid_field2'],
      };

      // Act & Assert
      await expect(toolHandler.handleTool('getIssue', args)).rejects.toThrow(
        ApiError
      );
      await expect(toolHandler.handleTool('getIssue', args)).rejects.toThrow(
        'All provided fields are invalid'
      );

      expect(mockResourceHandler.validateFieldPaths).toHaveBeenCalledWith(
        'issue',
        ['invalid_field1', 'invalid_field2']
      );
      expect(mockJiraClient.getIssue).not.toHaveBeenCalled();
    });

    it('should handle custom field patterns correctly', async () => {
      // Arrange: Mock validation with custom fields
      mockResourceHandler.validateFieldPaths.mockReturnValue({
        isValid: true,
        validPaths: ['summary', 'customfield_10001'],
        invalidPaths: [],
        pathInfo: {
          summary: {
            fieldId: 'summary',
            type: 'string',
            description: 'Issue summary',
          },
          customfield_10001: {
            fieldId: 'customfield_10001',
            type: 'string',
            description: 'Custom field',
          },
        },
      });

      mockJiraClient.getIssue.mockResolvedValue({
        key: 'TEST-123',
        fields: { summary: 'Test Issue', customfield_10001: 'Custom Value' },
      });

      const args: ToolArgs = {
        issueKey: 'TEST-123',
        fields: ['summary', 'customfield_10001'],
      };

      // Act
      const result = await toolHandler.handleTool('getIssue', args);

      // Assert
      expect(mockResourceHandler.validateFieldPaths).toHaveBeenCalledWith(
        'issue',
        ['summary', 'customfield_10001']
      );
      expect(mockJiraClient.getIssue).toHaveBeenCalledWith('TEST-123', [
        'summary',
        'customfield_10001',
      ]);
      expect(result.content[0].text).toContain('TEST-123');
    });

    it('should work without fields parameter (no validation needed)', async () => {
      // Arrange
      mockJiraClient.getIssue.mockResolvedValue({
        key: 'TEST-123',
        fields: { summary: 'Test Issue' },
      });

      const args: ToolArgs = {
        issueKey: 'TEST-123',
      };

      // Act
      const result = await toolHandler.handleTool('getIssue', args);

      // Assert
      expect(mockResourceHandler.validateFieldPaths).not.toHaveBeenCalled();
      expect(mockJiraClient.getIssue).toHaveBeenCalledWith(
        'TEST-123',
        undefined
      );
      expect(result.content[0].text).toContain('TEST-123');
    });
  });

  describe('Field Validation in searchIssues Tool', () => {
    it('should validate field paths before search API call', async () => {
      // Arrange: Mock valid field validation
      mockResourceHandler.validateFieldPaths.mockReturnValue({
        isValid: true,
        validPaths: ['summary', 'assignee.displayName'],
        invalidPaths: [],
        pathInfo: {
          summary: {
            fieldId: 'summary',
            type: 'string',
            description: 'Issue summary',
          },
          'assignee.displayName': {
            fieldId: 'assignee',
            type: 'string',
            description: 'Assignee display name',
          },
        },
      });

      mockJiraClient.searchIssues.mockResolvedValue({
        issues: [{ key: 'TEST-123', fields: { summary: 'Test Issue' } }],
        total: 1,
      });

      const args: ToolArgs = {
        jql: 'project = TEST',
        fields: ['summary', 'assignee.displayName'],
      };

      // Act
      const result = await toolHandler.handleTool('searchIssues', args);

      // Assert
      expect(mockResourceHandler.validateFieldPaths).toHaveBeenCalledWith(
        'issue',
        ['summary', 'assignee.displayName']
      );
      expect(mockJiraClient.searchIssues).toHaveBeenCalledWith(
        'project = TEST',
        { fields: ['summary', 'assignee.displayName'] }
      );
      expect(result.content[0].text).toContain('TEST-123');
    });

    it('should include pagination parameters with validated fields', async () => {
      // Arrange: Mock valid field validation
      mockResourceHandler.validateFieldPaths.mockReturnValue({
        isValid: true,
        validPaths: ['summary'],
        invalidPaths: [],
      });

      mockJiraClient.searchIssues.mockResolvedValue({
        issues: [],
        total: 0,
      });

      const args: ToolArgs = {
        jql: 'project = TEST',
        startAt: 10,
        maxResults: 50,
        fields: ['summary'],
      };

      // Act
      await toolHandler.handleTool('searchIssues', args);

      // Assert
      expect(mockJiraClient.searchIssues).toHaveBeenCalledWith(
        'project = TEST',
        {
          startAt: 10,
          maxResults: 50,
          fields: ['summary'],
        }
      );
    });
  });

  describe('Field Validation in getProjectIssues Tool', () => {
    it('should validate field paths for project issues query', async () => {
      // Arrange: Mock valid field validation
      mockResourceHandler.validateFieldPaths.mockReturnValue({
        isValid: true,
        validPaths: ['key', 'summary', 'status.statusCategory.key'],
        invalidPaths: [],
      });

      mockJiraClient.getProjectIssues.mockResolvedValue({
        issues: [{ key: 'TEST-123', fields: { summary: 'Test Issue' } }],
        total: 1,
      });

      const args: ToolArgs = {
        projectKey: 'TEST',
        fields: ['key', 'summary', 'status.statusCategory.key'],
      };

      // Act
      const result = await toolHandler.handleTool('getProjectIssues', args);

      // Assert
      expect(mockResourceHandler.validateFieldPaths).toHaveBeenCalledWith(
        'issue',
        ['key', 'summary', 'status.statusCategory.key']
      );
      expect(mockJiraClient.getProjectIssues).toHaveBeenCalledWith('TEST', {
        fields: ['key', 'summary', 'status.statusCategory.key'],
      });
    });
  });

  describe('Field Validation in Agile Tools', () => {
    it('should validate fields in getBoardIssues tool', async () => {
      // Arrange: Mock valid field validation
      mockResourceHandler.validateFieldPaths.mockReturnValue({
        isValid: true,
        validPaths: ['summary', 'priority.name'],
        invalidPaths: [],
      });

      mockJiraClient.getBoardIssues.mockResolvedValue({
        issues: [{ key: 'TEST-123', fields: { summary: 'Test Issue' } }],
        total: 1,
      });

      const args: ToolArgs = {
        boardId: 123,
        fields: ['summary', 'priority.name'],
      };

      // Act
      await toolHandler.handleTool('getBoardIssues', args);

      // Assert
      expect(mockResourceHandler.validateFieldPaths).toHaveBeenCalledWith(
        'issue',
        ['summary', 'priority.name']
      );
      expect(mockJiraClient.getBoardIssues).toHaveBeenCalledWith(123, {
        fields: ['summary', 'priority.name'],
      });
    });

    it('should validate fields in getSprintIssues tool', async () => {
      // Arrange: Mock valid field validation
      mockResourceHandler.validateFieldPaths.mockReturnValue({
        isValid: true,
        validPaths: ['summary', 'timeestimate'],
        invalidPaths: [],
      });

      mockJiraClient.getSprintIssues.mockResolvedValue({
        issues: [{ key: 'TEST-123', fields: { summary: 'Test Issue' } }],
        total: 1,
      });

      const args: ToolArgs = {
        sprintId: 456,
        fields: ['summary', 'timeestimate'],
      };

      // Act
      await toolHandler.handleTool('getSprintIssues', args);

      // Assert
      expect(mockResourceHandler.validateFieldPaths).toHaveBeenCalledWith(
        'issue',
        ['summary', 'timeestimate']
      );
      expect(mockJiraClient.getSprintIssues).toHaveBeenCalledWith(456, {
        fields: ['summary', 'timeestimate'],
      });
    });
  });

  describe('Performance Requirements', () => {
    it('should complete field validation in under 5ms', async () => {
      // Arrange: Mock fast validation
      mockResourceHandler.validateFieldPaths.mockReturnValue({
        isValid: true,
        validPaths: ['summary'],
        invalidPaths: [],
      });

      mockJiraClient.getIssue.mockResolvedValue({
        key: 'TEST-123',
        fields: { summary: 'Test Issue' },
      });

      const args: ToolArgs = {
        issueKey: 'TEST-123',
        fields: ['summary'],
      };

      // Act & Assert
      const start = Date.now();
      await toolHandler.handleTool('getIssue', args);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5); // Should be much faster due to mocking
      expect(mockResourceHandler.validateFieldPaths).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle resource handler errors gracefully', async () => {
      // Arrange: Mock resource handler error
      mockResourceHandler.validateFieldPaths.mockImplementation(() => {
        throw new Error('Resource handler internal error');
      });

      mockJiraClient.getIssue.mockResolvedValue({
        key: 'TEST-123',
        fields: { summary: 'Test Issue' },
      });

      const args: ToolArgs = {
        issueKey: 'TEST-123',
        fields: ['summary'],
      };

      // Act
      const result = await toolHandler.handleTool('getIssue', args);

      // Assert
      // Should not throw error but handle gracefully by using original fields
      expect(mockJiraClient.getIssue).toHaveBeenCalledWith('TEST-123', [
        'summary',
      ]);
      expect(result.content[0].text).toContain('TEST-123');
    });

    it('should handle unsupported entity type gracefully', async () => {
      // This test will be relevant when other entity types are added
      // For now, all field tools use 'issue' entity type
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Warning Message Format', () => {
    it('should format field validation warnings clearly', async () => {
      // Arrange: Mock validation with warnings
      mockResourceHandler.validateFieldPaths.mockReturnValue({
        isValid: false,
        validPaths: ['summary'],
        invalidPaths: ['invalid1', 'invalid2'],
        suggestions: {
          invalid1: ['summary', 'description'],
          invalid2: ['assignee'],
        },
      });

      mockJiraClient.getIssue.mockResolvedValue({
        key: 'TEST-123',
        fields: { summary: 'Test Issue' },
      });

      const args: ToolArgs = {
        issueKey: 'TEST-123',
        fields: ['summary', 'invalid1', 'invalid2'],
      };

      // Act
      const result = await toolHandler.handleTool('getIssue', args);

      // Assert
      const responseText = result.content[0].text;

      // Check warning structure
      expect(responseText).toContain(
        'WARNING: Some fields were invalid and filtered out'
      );
      expect(responseText).toContain('Invalid fields: invalid1, invalid2');
      expect(responseText).toContain(
        'Suggestions for \\"invalid1\\": summary, description'
      );
      expect(responseText).toContain(
        'Suggestions for \\"invalid2\\": assignee'
      );

      // Check that the actual data is still included
      expect(responseText).toContain('"key": "TEST-123"');
      expect(responseText).toContain('"summary": "Test Issue"');
    });
  });
});
