import { JiraMcpServer } from '../../src/server/jira-mcp-server.js';

// Note: This test requires a valid JIRA_PERSONAL_TOKEN and connection to https://jira.dentsplysirona.com
// The test will be skipped if JIRA_PERSONAL_TOKEN is not set
describe('MCP Server - getAllProjects Integration Tests', () => {
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

  describe('getAllProjects MCP Tool', () => {
    it('should handle getAllProjects tool call with default parameters', async () => {
      // Act - Test the handler directly
      const response = await (mcpServer as any).handleGetAllProjects({});

      // Assert
      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content[0]).toHaveProperty('type', 'text');
      expect(response.content[0]).toHaveProperty('text');

      // Parse the JSON response
      const projects = JSON.parse(response.content[0].text);
      expect(Array.isArray(projects)).toBe(true);
      expect(projects.length).toBeGreaterThan(0);

      // Validate project structure
      const sampleProject = projects[0];
      expect(sampleProject).toHaveProperty('id');
      expect(sampleProject).toHaveProperty('key');
      expect(sampleProject).toHaveProperty('name');
      expect(sampleProject).toHaveProperty('self');
      expect(sampleProject).toHaveProperty('projectTypeKey');

      console.log(`MCP Server returned ${projects.length} projects`);
    }, 30000);

    it('should handle getAllProjects tool call with includeArchived=false', async () => {
      // Act - Test the handler directly
      const response = await (mcpServer as any).handleGetAllProjects({ includeArchived: false });

      // Assert
      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(Array.isArray(response.content)).toBe(true);

      // Parse the JSON response
      const projects = JSON.parse(response.content[0].text);
      expect(Array.isArray(projects)).toBe(true);

      // Check that no archived projects are included
      const archivedProjects = projects.filter((project: any) => project.archived === true);
      expect(archivedProjects.length).toBe(0);

      console.log(`MCP Server returned ${projects.length} non-archived projects`);
    }, 30000);

    it('should handle getAllProjects tool call with includeArchived=true', async () => {
      // Act - Test the handler directly
      const response = await (mcpServer as any).handleGetAllProjects({ includeArchived: true });

      // Assert
      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(Array.isArray(response.content)).toBe(true);

      // Parse the JSON response
      const projects = JSON.parse(response.content[0].text);
      expect(Array.isArray(projects)).toBe(true);
      expect(projects.length).toBeGreaterThan(0);

      console.log(`MCP Server returned ${projects.length} projects (including archived)`);
    }, 30000);

    it('should validate includeArchived parameter type', async () => {
      // Act & Assert - Test the handler directly with invalid parameter
      await expect((mcpServer as any).handleGetAllProjects({ includeArchived: 'invalid' })).rejects.toThrow();
    }, 10000);

    it('should find DSCWA project in MCP Server response', async () => {
      // Act - Test the handler directly
      const response = await (mcpServer as any).handleGetAllProjects({});

      // Parse the JSON response
      const projects = JSON.parse(response.content[0].text);
      
      // Assert
      const dscwaProject = projects.find((project: any) => project.key === 'DSCWA');
      expect(dscwaProject).toBeDefined();
      expect(dscwaProject.name).toBeDefined();
      expect(dscwaProject.id).toBeDefined();

      console.log('Found DSCWA project via MCP Server:', {
        id: dscwaProject.id,
        key: dscwaProject.key,
        name: dscwaProject.name
      });
    }, 30000);
  });

  describe('ListTools Integration', () => {
    it('should include getAllProjects in MCP server definition', async () => {
      // This test verifies that the getAllProjects tool is properly defined
      // We can test this by checking if the handler function exists
      expect((mcpServer as any).handleGetAllProjects).toBeDefined();
      expect(typeof (mcpServer as any).handleGetAllProjects).toBe('function');
      
      console.log('getAllProjects handler successfully defined in MCP Server');
    });
  });
});