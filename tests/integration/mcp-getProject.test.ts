import { JiraMcpServer } from '../../src/server/jira-mcp-server.js';

// Note: This test requires a valid JIRA_PERSONAL_TOKEN and connection to https://jira.dentsplysirona.com
// The test will be skipped if JIRA_PERSONAL_TOKEN is not set
describe('MCP Server - getProject Integration Tests', () => {
  let mcpServer: JiraMcpServer;

  beforeAll(() => {
    const token = process.env.JIRA_PERSONAL_TOKEN;
    if (!token) {
      console.log('Skipping MCP Server integration tests - JIRA_PERSONAL_TOKEN not set');
      return;
    }

    mcpServer = new JiraMcpServer();
  });

  beforeEach(() => {
    const token = process.env.JIRA_PERSONAL_TOKEN;
    if (!token) {
      pending('JIRA_PERSONAL_TOKEN not set - skipping MCP Server integration test');
    }
  });

  describe('getProject MCP Tool', () => {
    it('should handle getProject tool call for DSCWA project', async () => {
      // Act - Test the handler directly
      const response = await (mcpServer as any).handleGetProject({
        projectKey: 'DSCWA'
      });

      // Assert
      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content[0]).toHaveProperty('type', 'text');
      expect(response.content[0]).toHaveProperty('text');

      // Parse the JSON response
      const project = JSON.parse(response.content[0].text);
      expect(project).toBeDefined();
      expect(project.id).toBe('16305');
      expect(project.key).toBe('DSCWA');
      expect(project.name).toBe('Intent Based System');
      expect(project.self).toBe('https://jira.dentsplysirona.com/rest/api/2/project/16305');
      expect(project.projectTypeKey).toBeDefined();

      console.log(`MCP Server returned project: ${project.name} (${project.key})`);
      console.log('Project details count:', {
        componentsCount: project.components?.length || 0,
        versionsCount: project.versions?.length || 0,
        rolesCount: Object.keys(project.roles || {}).length,
        issueTypesCount: project.issueTypes?.length || 0
      });
    }, 15000);

    it('should handle missing projectKey parameter', async () => {
      // Act & Assert - Test with missing projectKey
      await expect((mcpServer as any).handleGetProject({}))
        .rejects.toThrow('projectKey is required and must be a string');
    });

    it('should handle invalid projectKey type', async () => {
      // Act & Assert - Test with invalid projectKey type
      await expect((mcpServer as any).handleGetProject({ projectKey: 123 }))
        .rejects.toThrow('projectKey is required and must be a string');
    });

    it('should handle non-existent project', async () => {
      // Act & Assert - Test with non-existent project
      await expect((mcpServer as any).handleGetProject({ 
        projectKey: 'NONEXISTENT_PROJECT_12345' 
      })).rejects.toThrow();
    }, 10000);

    it('should validate getProject response contains all expected project fields', async () => {
      // Act
      const response = await (mcpServer as any).handleGetProject({
        projectKey: 'DSCWA'
      });

      // Parse response
      const projectData = JSON.parse(response.content[0].text);

      // Assert - Validate required fields
      expect(projectData).toHaveProperty('id');
      expect(projectData).toHaveProperty('key');
      expect(projectData).toHaveProperty('name');
      expect(projectData).toHaveProperty('self');
      expect(projectData).toHaveProperty('projectTypeKey');

      // Validate field types
      expect(typeof projectData.id).toBe('string');
      expect(typeof projectData.key).toBe('string');
      expect(typeof projectData.name).toBe('string');
      expect(typeof projectData.self).toBe('string');
      expect(typeof projectData.projectTypeKey).toBe('string');

      console.log('MCP Project Field Analysis:', {
        requiredFields: {
          id: !!projectData.id,
          key: !!projectData.key,
          name: !!projectData.name,
          self: !!projectData.self,
          projectTypeKey: !!projectData.projectTypeKey
        },
        optionalFields: {
          description: !!projectData.description,
          lead: !!projectData.lead,
          archived: projectData.archived !== undefined,
          avatarUrls: !!projectData.avatarUrls,
          projectCategory: !!projectData.projectCategory,
          components: Array.isArray(projectData.components),
          versions: Array.isArray(projectData.versions),
          roles: typeof projectData.roles === 'object',
          issueTypes: Array.isArray(projectData.issueTypes)
        },
        detailedCounts: {
          componentsCount: projectData.components?.length || 0,
          versionsCount: projectData.versions?.length || 0,
          rolesCount: Object.keys(projectData.roles || {}).length,
          issueTypesCount: projectData.issueTypes?.length || 0
        }
      });
    }, 15000);

    it('should compare getProject MCP response with getAllProjects MCP response', async () => {
      // Act - Get single project via getProject
      const getProjectResponse = await (mcpServer as any).handleGetProject({
        projectKey: 'DSCWA'
      });

      // Get all projects via getAllProjects
      const getAllProjectsResponse = await (mcpServer as any).handleGetAllProjects({});

      // Parse responses
      const singleProject = JSON.parse(getProjectResponse.content[0].text);
      const allProjects = JSON.parse(getAllProjectsResponse.content[0].text);
      const dscwaFromList = allProjects.find((p: any) => p.key === 'DSCWA');

      // Assert consistency
      expect(dscwaFromList).toBeDefined();
      expect(singleProject.id).toBe(dscwaFromList.id);
      expect(singleProject.key).toBe(dscwaFromList.key);
      expect(singleProject.name).toBe(dscwaFromList.name);
      expect(singleProject.self).toBe(dscwaFromList.self);
      expect(singleProject.projectTypeKey).toBe(dscwaFromList.projectTypeKey);

      console.log('MCP Response Consistency Check:', {
        'getProject fields': Object.keys(singleProject).length,
        'getAllProjects fields': Object.keys(dscwaFromList).length,
        'getProject has more details': Object.keys(singleProject).length > Object.keys(dscwaFromList).length
      });
    }, 20000);
  });
});