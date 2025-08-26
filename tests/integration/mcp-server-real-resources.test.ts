import { JiraMcpServer } from '@/server/jira-mcp-server';

describe('JiraMcpServer - Real Resource Integration', () => {
  let server: JiraMcpServer;

  beforeEach(() => {
    server = new JiraMcpServer();
  });

  describe('Real Resource Handler Integration', () => {
    it('should list actual resources with real field definitions', async () => {
      const resourceHandler = server.getResourceHandler();
      const result = await resourceHandler.listResources();

      expect(result).toHaveProperty('resources');
      expect(Array.isArray(result.resources)).toBe(true);
      expect(result.resources.length).toBeGreaterThan(0);

      // Check that issue fields resource exists
      const issueFieldsResource = result.resources.find(
        r => r.uri === 'jira://issue/fields'
      );
      expect(issueFieldsResource).toBeDefined();
      expect(issueFieldsResource!.name).toBe('Jira Issue Fields');
      expect(issueFieldsResource!.mimeType).toBe('application/json');
      expect(issueFieldsResource!.description).toContain(
        'Complete field definitions for Jira issue entities'
      );
    });

    it('should read actual issue field definitions', async () => {
      const resourceHandler = server.getResourceHandler();
      const result = await resourceHandler.readResource('jira://issue/fields');

      expect(result).toHaveProperty('contents');
      expect(Array.isArray(result.contents)).toBe(true);
      expect(result.contents.length).toBe(1);

      const content = result.contents[0];
      expect(content.type).toBe('text');
      expect(content.mimeType).toBe('application/json');

      // Parse and validate the JSON content
      const fieldDefinitions = JSON.parse(content.text);
      expect(fieldDefinitions).toHaveProperty('entityType', 'issue');
      expect(fieldDefinitions).toHaveProperty('totalFields');
      expect(fieldDefinitions).toHaveProperty('fields');
      expect(fieldDefinitions).toHaveProperty('pathIndex');

      // Verify specific fields exist
      expect(fieldDefinitions.fields).toHaveProperty('summary');
      expect(fieldDefinitions.fields).toHaveProperty('description');
      expect(fieldDefinitions.fields).toHaveProperty('status');
      expect(fieldDefinitions.fields).toHaveProperty('assignee');

      // Verify path index includes common paths (paths are in the pathIndex object)
      const pathIndexKeys = Object.keys(fieldDefinitions.pathIndex);
      expect(pathIndexKeys).toContain('summary');
      expect(pathIndexKeys).toContain('status.name');
      expect(pathIndexKeys).toContain('assignee.displayName');

      // Verify the pathIndex structure is correct
      expect(pathIndexKeys.length).toBeGreaterThan(20);
      expect(fieldDefinitions.pathIndex['summary']).toBe('summary');
      expect(fieldDefinitions.pathIndex['status.name']).toBe('status');

      // Verify total fields count is reasonable (static definitions have 14 fields)
      expect(fieldDefinitions.totalFields).toBeGreaterThan(10);
    });

    it('should validate field paths using the resource handler', async () => {
      const resourceHandler = server.getResourceHandler();

      // Test valid paths
      const validPaths = ['summary', 'status.name', 'assignee.displayName'];
      const validResult = resourceHandler.validateFieldPaths(
        'issue',
        validPaths
      );

      expect(validResult.isValid).toBe(true);
      expect(validResult.validPaths).toEqual(validPaths);
      expect(validResult.invalidPaths).toHaveLength(0);

      // Test invalid paths
      const invalidPaths = ['nonexistent', 'invalid.path'];
      const invalidResult = resourceHandler.validateFieldPaths(
        'issue',
        invalidPaths
      );

      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.validPaths).toHaveLength(0);
      expect(invalidResult.invalidPaths).toEqual(invalidPaths);

      // Test mixed valid and invalid paths
      const mixedPaths = ['summary', 'nonexistent', 'status.name'];
      const mixedResult = resourceHandler.validateFieldPaths(
        'issue',
        mixedPaths
      );

      expect(mixedResult.isValid).toBe(false);
      expect(mixedResult.validPaths).toContain('summary');
      expect(mixedResult.validPaths).toContain('status.name');
      expect(mixedResult.invalidPaths).toContain('nonexistent');
    });

    it('should handle custom field patterns', async () => {
      const resourceHandler = server.getResourceHandler();

      // Test custom field pattern
      const customFieldPaths = ['customfield_10001', 'customfield_12345'];
      const result = resourceHandler.validateFieldPaths(
        'issue',
        customFieldPaths
      );

      expect(result.isValid).toBe(true);
      expect(result.validPaths).toEqual(customFieldPaths);
      expect(result.invalidPaths).toHaveLength(0);
    });

    it('should handle unsupported entity types gracefully', async () => {
      const resourceHandler = server.getResourceHandler();

      const result = resourceHandler.validateFieldPaths('unsupported', [
        'summary',
      ]);

      expect(result.isValid).toBe(false);
      expect(result.validPaths).toHaveLength(0);
      expect(result.invalidPaths).toEqual(['summary']);
      expect(result.error).toContain('Unknown entity type: unsupported');
    });

    it('should throw error for invalid resource URIs', async () => {
      const resourceHandler = server.getResourceHandler();

      await expect(resourceHandler.readResource('invalid-uri')).rejects.toThrow(
        'Invalid resource URI format: invalid-uri'
      );
    });

    it('should throw error for unknown resource URIs', async () => {
      const resourceHandler = server.getResourceHandler();

      await expect(
        resourceHandler.readResource('jira://unknown/fields')
      ).rejects.toThrow('Unknown resource URI: jira://unknown/fields');
    });
  });

  describe('Backward Compatibility with Real Handlers', () => {
    it('should maintain tool handler functionality alongside resource handler', () => {
      const toolHandler = server.getToolHandler();
      const resourceHandler = server.getResourceHandler();

      expect(toolHandler).toBeDefined();
      expect(resourceHandler).toBeDefined();

      // Should be different instances
      expect(toolHandler).not.toBe(resourceHandler);
    });

    it('should have all expected backward compatibility methods', () => {
      const expectedMethods = [
        'handleGetIssue',
        'handleGetIssueTransitions',
        'handleSearchIssues',
        'handleGetIssueWorklogs',
        'handleDownloadAttachments',
        'handleGetAllProjects',
        'handleGetProject',
        'handleGetProjectIssues',
        'handleGetProjectVersions',
        'handleGetCurrentUser',
        'handleGetUserProfile',
        'handleGetAgileBoards',
        'handleGetBoardIssues',
        'handleGetSprintsFromBoard',
        'handleGetSprintIssues',
        'handleGetSprint',
        'handleSearchFields',
        'handleGetSystemInfo',
        'handleGetServerInfo',
      ];

      for (const method of expectedMethods) {
        expect(typeof (server as any)[method]).toBe('function');
      }
    });
  });

  describe('Resource Protocol Integration with Server Lifecycle', () => {
    it('should initialize resource handler during server construction', () => {
      const newServer = new JiraMcpServer();
      const resourceHandler = newServer.getResourceHandler();

      expect(resourceHandler).toBeDefined();
      expect(typeof resourceHandler.listResources).toBe('function');
      expect(typeof resourceHandler.readResource).toBe('function');
      expect(typeof resourceHandler.validateFieldPaths).toBe('function');
    });

    it('should support multiple resource operations without side effects', async () => {
      const resourceHandler = server.getResourceHandler();

      // First operation
      const firstList = await resourceHandler.listResources();
      const firstRead = await resourceHandler.readResource(
        'jira://issue/fields'
      );

      // Second operation
      const secondList = await resourceHandler.listResources();
      const secondRead = await resourceHandler.readResource(
        'jira://issue/fields'
      );

      // Results should be consistent
      expect(firstList).toEqual(secondList);
      expect(firstRead).toEqual(secondRead);
    });
  });
});
