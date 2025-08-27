/**
 * @file fields-processing.test.ts
 * @description Comprehensive tests for client-side field filtering implementation in tool handlers
 * 
 * Tests cover:
 * - Field filtering for different entity types (project, user, agile, system)
 * - Backward compatibility (no fields parameter)
 * - Error handling and edge cases
 * - Performance and integration scenarios
 */

import { ToolHandler } from '../../../src/server/handlers/tool-handler.js';
import { JiraClientWrapper } from '../../../src/client/jira-client-wrapper.js';
import { JiraResourceHandler } from '../../../src/server/resources/resource-handler.js';
import { FieldFilter } from '../../../src/utils/field-filter.js';
import { ApiError } from '../../../src/types/api-error.js';

// Mock dependencies
jest.mock('../../../src/client/jira-client-wrapper.js');
jest.mock('../../../src/server/resources/resource-handler.js');
jest.mock('../../../src/utils/field-filter.js');
jest.mock('../../../src/utils/config.js', () => ({
  loadConfig: jest.fn(() => ({
    jiraUrl: 'https://test.jira.com',
    personalToken: 'test-token',
    timeout: 30000,
    sslVerify: true,
  })),
}));
jest.mock('../../../src/utils/logger.js', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('ToolHandler - Fields Processing Implementation', () => {
  let toolHandler: ToolHandler;
  let mockJiraClient: jest.Mocked<JiraClientWrapper>;
  let mockResourceHandler: jest.Mocked<JiraResourceHandler>;
  let mockFieldFilter: jest.MockedClass<typeof FieldFilter>;

  // Sample response data for different entity types
  const sampleProjectData = {
    id: '12345',
    key: 'PROJ',
    name: 'Sample Project',
    description: 'Test project',
    lead: {
      name: 'john.doe',
      displayName: 'John Doe',
      emailAddress: 'john.doe@company.com',
    },
    projectCategory: {
      id: '10000',
      name: 'Development',
      description: 'Development projects',
    },
    components: [
      { id: '10001', name: 'Frontend' },
      { id: '10002', name: 'Backend' },
    ],
  };

  const sampleUserData = {
    name: 'john.doe',
    displayName: 'John Doe',
    emailAddress: 'john.doe@company.com',
    active: true,
    groups: {
      size: 2,
      items: [
        { name: 'jira-users', self: 'http://test.jira.com/groups/jira-users' },
        { name: 'developers', self: 'http://test.jira.com/groups/developers' },
      ],
    },
  };

  const sampleAgileData = {
    maxResults: 50,
    startAt: 0,
    isLast: true,
    values: [
      {
        id: 1,
        name: 'Test Board',
        type: 'scrum',
        location: {
          projectId: 12345,
          projectKey: 'PROJ',
          projectName: 'Sample Project',
        },
      },
    ],
  };

  const sampleSystemData = {
    version: '8.20.0',
    versionNumbers: [8, 20, 0],
    deploymentType: 'Server',
    buildNumber: 820000,
    buildDate: '2023-01-15T10:30:00.000Z',
    databaseConfigurationCheck: 'OK',
    licenseType: 'commercial',
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock instances
    mockJiraClient = new JiraClientWrapper({} as any) as jest.Mocked<JiraClientWrapper>;
    mockResourceHandler = new JiraResourceHandler() as jest.Mocked<JiraResourceHandler>;
    mockFieldFilter = FieldFilter as jest.MockedClass<typeof FieldFilter>;

    // Initialize tool handler with mocks
    toolHandler = new ToolHandler(mockJiraClient, mockResourceHandler);

    // Setup default FieldFilter mock behavior
    mockFieldFilter.filterFields.mockImplementation((response, fields, options) => {
      // Simple mock implementation: return original response if no fields, otherwise filtered
      if (!fields || fields.length === 0) {
        return response;
      }
      
      // Create filtered response based on entity type
      switch (options.entityType) {
        case 'project':
          // Handle array responses (getAllProjects) and single responses (getProject)
          if (Array.isArray(response)) {
            return response.map(item => ({ name: item.name, key: item.key }));
          }
          return { name: response.name, key: response.key };
        case 'user':
          return { displayName: response.displayName, emailAddress: response.emailAddress };
        case 'agile':
          return { values: response.values?.map((item: any) => ({ id: item.id, name: item.name })) };
        case 'system':
          return { version: response.version, deploymentType: response.deploymentType };
        default:
          return response;
      }
    });
  });

  describe('Project Tools - Fields Processing', () => {
    describe('getAllProjects', () => {
      beforeEach(() => {
        mockJiraClient.getAllProjects.mockResolvedValue([sampleProjectData]);
      });

      it('should apply client-side filtering when fields are specified', async () => {
        const fields = ['name', 'key', 'lead.displayName'];
        const args = { includeArchived: false, fields };

        const result = await toolHandler.handleTool('getAllProjects', args);

        expect(mockJiraClient.getAllProjects).toHaveBeenCalledWith(false);
        expect(mockFieldFilter.filterFields).toHaveBeenCalledWith(
          [sampleProjectData],
          fields,
          {
            entityType: 'project',
            respectNesting: true,
            logFiltering: true,
          }
        );
        expect(result.content[0].text).toContain('"name"');
        expect(result.content[0].text).toContain('"key"');
      });

      it('should not apply filtering when fields is empty array', async () => {
        const args = { includeArchived: true, fields: [] };

        const result = await toolHandler.handleTool('getAllProjects', args);

        expect(mockJiraClient.getAllProjects).toHaveBeenCalledWith(true);
        expect(mockFieldFilter.filterFields).not.toHaveBeenCalled();
        expect(result.content[0].text).toContain(JSON.stringify([sampleProjectData], null, 2));
      });

      it('should maintain backward compatibility when fields is not provided', async () => {
        const args = { includeArchived: true };

        const result = await toolHandler.handleTool('getAllProjects', args);

        expect(mockJiraClient.getAllProjects).toHaveBeenCalledWith(true);
        expect(mockFieldFilter.filterFields).not.toHaveBeenCalled();
        expect(result.content[0].text).toContain(JSON.stringify([sampleProjectData], null, 2));
      });

      it('should handle invalid fields parameter type', async () => {
        const args = { includeArchived: true, fields: 'invalid' as any };

        await expect(toolHandler.handleTool('getAllProjects', args)).rejects.toThrow(ApiError);
      });
    });

    describe('getProject', () => {
      beforeEach(() => {
        mockJiraClient.getProject.mockResolvedValue(sampleProjectData);
      });

      it('should apply client-side filtering with nested field paths', async () => {
        const fields = ['name', 'projectCategory.name', 'lead.displayName'];
        const args = { projectKey: 'PROJ', fields };

        const result = await toolHandler.handleTool('getProject', args);

        expect(mockJiraClient.getProject).toHaveBeenCalledWith('PROJ');
        expect(mockFieldFilter.filterFields).toHaveBeenCalledWith(
          sampleProjectData,
          fields,
          {
            entityType: 'project',
            respectNesting: true,
            logFiltering: true,
          }
        );
      });

      it('should handle project not found error gracefully', async () => {
        mockJiraClient.getProject.mockRejectedValue(new ApiError('Project not found', 404));
        const args = { projectKey: 'NONEXISTENT', fields: ['name'] };

        await expect(toolHandler.handleTool('getProject', args)).rejects.toThrow(ApiError);
        expect(mockFieldFilter.filterFields).not.toHaveBeenCalled();
      });
    });

    describe('getProjectVersions', () => {
      const sampleVersionsData = [
        { id: '10000', name: 'Version 1.0', released: true },
        { id: '10001', name: 'Version 2.0', released: false },
      ];

      beforeEach(() => {
        mockJiraClient.getProjectVersions.mockResolvedValue(sampleVersionsData);
      });

      it('should apply client-side filtering to version data', async () => {
        const fields = ['name', 'released'];
        const args = { projectKey: 'PROJ', fields };

        const result = await toolHandler.handleTool('getProjectVersions', args);

        expect(mockJiraClient.getProjectVersions).toHaveBeenCalledWith('PROJ');
        expect(mockFieldFilter.filterFields).toHaveBeenCalledWith(
          sampleVersionsData,
          fields,
          {
            entityType: 'project',
            respectNesting: true,
            logFiltering: true,
          }
        );
      });
    });
  });

  describe('User Tools - Fields Processing', () => {
    describe('getCurrentUser', () => {
      beforeEach(() => {
        mockJiraClient.getCurrentUser.mockResolvedValue(sampleUserData);
      });

      it('should apply client-side filtering for user fields', async () => {
        const fields = ['displayName', 'emailAddress', 'groups.size'];
        const args = { fields };

        const result = await toolHandler.handleTool('getCurrentUser', args);

        expect(mockJiraClient.getCurrentUser).toHaveBeenCalled();
        expect(mockFieldFilter.filterFields).toHaveBeenCalledWith(
          sampleUserData,
          fields,
          {
            entityType: 'user',
            respectNesting: true,
            logFiltering: true,
          }
        );
      });

      it('should work without fields parameter (getCurrentUser now accepts fields)', async () => {
        const args = {};

        const result = await toolHandler.handleTool('getCurrentUser', args);

        expect(mockJiraClient.getCurrentUser).toHaveBeenCalled();
        expect(mockFieldFilter.filterFields).not.toHaveBeenCalled();
        expect(result.content[0].text).toContain(JSON.stringify(sampleUserData, null, 2));
      });
    });

    describe('getUserProfile', () => {
      beforeEach(() => {
        mockJiraClient.getUserProfile.mockResolvedValue(sampleUserData);
      });

      it('should apply client-side filtering for user profile fields', async () => {
        const fields = ['displayName', 'active', 'groups.items[].name'];
        const args = { username: 'john.doe', fields };

        const result = await toolHandler.handleTool('getUserProfile', args);

        expect(mockJiraClient.getUserProfile).toHaveBeenCalledWith('john.doe');
        expect(mockFieldFilter.filterFields).toHaveBeenCalledWith(
          sampleUserData,
          fields,
          {
            entityType: 'user',
            respectNesting: true,
            logFiltering: true,
          }
        );
      });
    });
  });

  describe('Agile Tools - Fields Processing', () => {
    describe('getAgileBoards', () => {
      beforeEach(() => {
        mockJiraClient.getAgileBoards.mockResolvedValue(sampleAgileData);
      });

      it('should apply client-side filtering for agile board fields', async () => {
        const fields = ['values[].name', 'values[].type', 'maxResults'];
        const args = { projectKey: 'PROJ', fields };

        const result = await toolHandler.handleTool('getAgileBoards', args);

        expect(mockJiraClient.getAgileBoards).toHaveBeenCalledWith('PROJ');
        expect(mockFieldFilter.filterFields).toHaveBeenCalledWith(
          sampleAgileData,
          fields,
          {
            entityType: 'agile',
            respectNesting: true,
            logFiltering: true,
          }
        );
      });
    });

    describe('getSprintsFromBoard', () => {
      const sampleSprintsData = {
        maxResults: 50,
        startAt: 0,
        isLast: true,
        values: [
          { id: 1, name: 'Sprint 1', state: 'CLOSED' },
          { id: 2, name: 'Sprint 2', state: 'ACTIVE' },
        ],
      };

      beforeEach(() => {
        mockJiraClient.getSprintsFromBoard.mockResolvedValue(sampleSprintsData);
      });

      it('should apply client-side filtering for sprint fields', async () => {
        const fields = ['values[].name', 'values[].state'];
        const args = { boardId: 123, fields };

        const result = await toolHandler.handleTool('getSprintsFromBoard', args);

        expect(mockJiraClient.getSprintsFromBoard).toHaveBeenCalledWith(123);
        expect(mockFieldFilter.filterFields).toHaveBeenCalledWith(
          sampleSprintsData,
          fields,
          {
            entityType: 'agile',
            respectNesting: true,
            logFiltering: true,
          }
        );
      });
    });

    describe('getSprint', () => {
      const sampleSprintData = {
        id: 123,
        name: 'Sprint 1',
        state: 'ACTIVE',
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-14T23:59:59.999Z',
        originBoardId: 456,
      };

      beforeEach(() => {
        mockJiraClient.getSprint.mockResolvedValue(sampleSprintData);
      });

      it('should apply client-side filtering for single sprint fields', async () => {
        const fields = ['name', 'state', 'startDate', 'endDate'];
        const args = { sprintId: 123, fields };

        const result = await toolHandler.handleTool('getSprint', args);

        expect(mockJiraClient.getSprint).toHaveBeenCalledWith(123);
        expect(mockFieldFilter.filterFields).toHaveBeenCalledWith(
          sampleSprintData,
          fields,
          {
            entityType: 'agile',
            respectNesting: true,
            logFiltering: true,
          }
        );
      });
    });
  });

  describe('System Tools - Fields Processing', () => {
    describe('getSystemInfo', () => {
      beforeEach(() => {
        mockJiraClient.getSystemInfo.mockResolvedValue(sampleSystemData);
      });

      it('should apply client-side filtering for system info fields', async () => {
        const fields = ['version', 'deploymentType', 'buildNumber'];
        const args = { fields };

        const result = await toolHandler.handleTool('getSystemInfo', args);

        expect(mockJiraClient.getSystemInfo).toHaveBeenCalled();
        expect(mockFieldFilter.filterFields).toHaveBeenCalledWith(
          sampleSystemData,
          fields,
          {
            entityType: 'system',
            respectNesting: true,
            logFiltering: true,
          }
        );
      });
    });

    describe('getServerInfo', () => {
      beforeEach(() => {
        mockJiraClient.getServerInfo.mockResolvedValue(sampleSystemData);
      });

      it('should apply client-side filtering for server info fields', async () => {
        const fields = ['version', 'licenseType'];
        const args = { fields };

        const result = await toolHandler.handleTool('getServerInfo', args);

        expect(mockJiraClient.getServerInfo).toHaveBeenCalled();
        expect(mockFieldFilter.filterFields).toHaveBeenCalledWith(
          sampleSystemData,
          fields,
          {
            entityType: 'system',
            respectNesting: true,
            logFiltering: true,
          }
        );
      });
    });
  });

  describe('Other Tools - Fields Processing', () => {
    describe('getIssueTransitions', () => {
      const sampleTransitionsData = {
        expand: 'transitions',
        transitions: [
          {
            id: '11',
            name: 'In Progress',
            to: { id: '3', name: 'In Progress', statusCategory: { key: 'indeterminate' } },
          },
          {
            id: '21',
            name: 'Done',
            to: { id: '10001', name: 'Done', statusCategory: { key: 'done' } },
          },
        ],
      };

      beforeEach(() => {
        mockJiraClient.getIssueTransitions.mockResolvedValue(sampleTransitionsData);
      });

      it('should apply client-side filtering for transition fields', async () => {
        const fields = ['transitions[].name', 'transitions[].to.name'];
        const args = { issueKey: 'PROJ-123', fields };

        const result = await toolHandler.handleTool('getIssueTransitions', args);

        expect(mockJiraClient.getIssueTransitions).toHaveBeenCalledWith('PROJ-123');
        expect(mockFieldFilter.filterFields).toHaveBeenCalledWith(
          sampleTransitionsData,
          fields,
          {
            entityType: 'issue',
            respectNesting: true,
            logFiltering: true,
          }
        );
      });
    });

    describe('getIssueWorklogs', () => {
      const sampleWorklogsData = {
        startAt: 0,
        maxResults: 1048576,
        total: 2,
        worklogs: [
          {
            id: '10000',
            timeSpent: '2h',
            timeSpentSeconds: 7200,
            author: { displayName: 'John Doe' },
            created: '2024-01-01T10:00:00.000Z',
          },
        ],
      };

      beforeEach(() => {
        mockJiraClient.getIssueWorklogs.mockResolvedValue(sampleWorklogsData);
      });

      it('should apply client-side filtering for worklog fields', async () => {
        const fields = ['worklogs[].timeSpent', 'worklogs[].author.displayName'];
        const args = { issueKey: 'PROJ-123', fields };

        const result = await toolHandler.handleTool('getIssueWorklogs', args);

        expect(mockJiraClient.getIssueWorklogs).toHaveBeenCalledWith('PROJ-123');
        expect(mockFieldFilter.filterFields).toHaveBeenCalledWith(
          sampleWorklogsData,
          fields,
          {
            entityType: 'issue',
            respectNesting: true,
            logFiltering: true,
          }
        );
      });
    });

    describe('searchFields', () => {
      const sampleFieldsData = [
        {
          id: 'summary',
          name: 'Summary',
          custom: false,
          orderable: true,
          navigable: true,
          searchable: true,
        },
        {
          id: 'customfield_10001',
          name: 'Custom Field 1',
          custom: true,
          orderable: false,
          navigable: true,
          searchable: true,
        },
      ];

      beforeEach(() => {
        mockJiraClient.searchFields.mockResolvedValue(sampleFieldsData);
      });

      it('should apply client-side filtering for field metadata', async () => {
        const fields = ['id', 'name', 'custom'];
        const args = { query: 'summary', fields };

        const result = await toolHandler.handleTool('searchFields', args);

        expect(mockJiraClient.searchFields).toHaveBeenCalledWith('summary');
        expect(mockFieldFilter.filterFields).toHaveBeenCalledWith(
          sampleFieldsData,
          fields,
          {
            entityType: 'system',
            respectNesting: true,
            logFiltering: true,
          }
        );
      });
    });

    describe('downloadAttachments', () => {
      const sampleAttachmentsData = [
        {
          id: '10000',
          filename: 'test.txt',
          size: 1024,
          mimeType: 'text/plain',
          content: 'base64encodedcontent',
        },
      ];

      beforeEach(() => {
        mockJiraClient.downloadAttachments.mockResolvedValue(sampleAttachmentsData);
      });

      it('should apply client-side filtering for attachment metadata', async () => {
        const fields = ['filename', 'size', 'mimeType'];
        const args = { issueKey: 'PROJ-123', fields };

        const result = await toolHandler.handleTool('downloadAttachments', args);

        expect(mockJiraClient.downloadAttachments).toHaveBeenCalledWith('PROJ-123');
        expect(mockFieldFilter.filterFields).toHaveBeenCalledWith(
          sampleAttachmentsData,
          fields,
          {
            entityType: 'issue',
            respectNesting: true,
            logFiltering: true,
          }
        );
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle FieldFilter throwing an error gracefully', async () => {
      const filterError = new Error('Field filtering failed');
      mockFieldFilter.filterFields.mockImplementation(() => {
        throw filterError;
      });
      mockJiraClient.getProject.mockResolvedValue(sampleProjectData);

      const args = { projectKey: 'PROJ', fields: ['name'] };

      // Should not throw, but log the error and return original response
      const result = await toolHandler.handleTool('getProject', args);

      expect(mockFieldFilter.filterFields).toHaveBeenCalledWith(
        sampleProjectData,
        ['name'],
        {
          entityType: 'project',
          respectNesting: true,
          logFiltering: true,
        }
      );
      expect(result.content[0].text).toContain(JSON.stringify(sampleProjectData, null, 2));
    });

    it('should handle null response from Jira client', async () => {
      mockJiraClient.getProject.mockResolvedValue(null);
      const args = { projectKey: 'PROJ', fields: ['name'] };

      const result = await toolHandler.handleTool('getProject', args);

      expect(mockFieldFilter.filterFields).toHaveBeenCalledWith(
        null,
        ['name'],
        {
          entityType: 'project',
          respectNesting: true,
          logFiltering: true,
        }
      );
      expect(result.content[0].text).toContain('null');
    });

    it('should handle fields parameter with null values gracefully', async () => {
      mockJiraClient.getProject.mockResolvedValue(sampleProjectData);
      const args = { projectKey: 'PROJ', fields: null as any };

      await expect(toolHandler.handleTool('getProject', args)).rejects.toThrow(
        'fields must be an array of strings'
      );
    });
  });

  describe('Performance Considerations', () => {
    it('should not call FieldFilter when fields is undefined', async () => {
      mockJiraClient.getAllProjects.mockResolvedValue([sampleProjectData]);
      const args = { includeArchived: true };

      await toolHandler.handleTool('getAllProjects', args);

      expect(mockFieldFilter.filterFields).not.toHaveBeenCalled();
    });

    it('should handle large response objects efficiently', async () => {
      const largeProjectList = Array.from({ length: 1000 }, (_, i) => ({
        ...sampleProjectData,
        id: `${i}`,
        key: `PROJ${i}`,
        name: `Project ${i}`,
      }));

      mockJiraClient.getAllProjects.mockResolvedValue(largeProjectList);
      const args = { includeArchived: true, fields: ['key', 'name'] };

      const startTime = Date.now();
      await toolHandler.handleTool('getAllProjects', args);
      const endTime = Date.now();

      // Should complete within reasonable time (< 1000ms for test)
      expect(endTime - startTime).toBeLessThan(1000);
      expect(mockFieldFilter.filterFields).toHaveBeenCalledWith(
        largeProjectList,
        ['key', 'name'],
        {
          entityType: 'project',
          respectNesting: true,
          logFiltering: true,
        }
      );
    });
  });
});