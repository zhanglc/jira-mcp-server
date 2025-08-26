import { JiraMcpServer } from '@/server/jira-mcp-server';
import { loadConfig } from '@/utils/config';
import { ApiError } from '@/types/api-error';
import { JiraClientWrapper } from '@/client/jira-client-wrapper';

describe('MCP getSprintIssues Tool Integration Tests', () => {
  let server: JiraMcpServer;
  let config: any;
  let client: JiraClientWrapper;

  beforeAll(async () => {
    config = await loadConfig();
    client = new JiraClientWrapper(config);
    server = new JiraMcpServer();
  });

  describe('successful getSprintIssues tool execution', () => {
    it('should retrieve sprint issues through MCP tool interface', async () => {
      // First, get available boards and sprints to find a valid sprintId
      const boards = await client.getAgileBoards();

      if (boards.length === 0) {
        console.log(
          '⚠️ No agile boards found - skipping MCP getSprintIssues test'
        );
        return;
      }

      // Find a Scrum board with sprints
      let testSprintId: number | undefined;
      let testSprintName: string = '';

      for (const board of boards.slice(0, 5)) {
        // Check up to 5 boards
        try {
          const sprints = await client.getSprintsFromBoard(board.id);

          if (sprints.length > 0) {
            // Prefer closed sprints (likely to have issues)
            const closedSprints = sprints.filter(s => s.state === 'closed');
            if (closedSprints.length > 0) {
              testSprintId = closedSprints[0].id;
              testSprintName = closedSprints[0].name;
              break;
            } else {
              testSprintId = sprints[0].id;
              testSprintName = sprints[0].name;
              break;
            }
          }
        } catch (error) {
          // Continue to next board if this one doesn't support sprints
          if (
            error instanceof ApiError &&
            error.message.includes("doesn't support sprints")
          ) {
            continue;
          }
          throw error;
        }
      }

      if (!testSprintId) {
        console.log(
          '⚠️ No sprints found in any boards - skipping MCP getSprintIssues test'
        );
        return;
      }

      console.log(
        `🏃 Testing MCP tool with sprint: ${testSprintName} (ID: ${testSprintId})`
      );

      // Test ListTools to ensure getSprintIssues tool is available
      const listToolsRequest = {
        method: 'tools/list',
        params: {},
      };

      const listToolsHandler =
        server['server']['_requestHandlers'].get('tools/list');
      const listToolsResponse = await listToolsHandler(listToolsRequest);

      expect(listToolsResponse).toBeDefined();
      expect(listToolsResponse.tools).toBeDefined();
      expect(Array.isArray(listToolsResponse.tools)).toBe(true);

      // Find getSprintIssues tool
      const getSprintIssuesTool = listToolsResponse.tools.find(
        (tool: any) => tool.name === 'getSprintIssues'
      );
      expect(getSprintIssuesTool).toBeDefined();
      expect(getSprintIssuesTool.name).toBe('getSprintIssues');
      expect(getSprintIssuesTool.description).toContain(
        'Get issues from a specific sprint'
      );
      expect(getSprintIssuesTool.inputSchema).toBeDefined();
      expect(getSprintIssuesTool.inputSchema.properties.sprintId).toBeDefined();
      expect(getSprintIssuesTool.inputSchema.required).toContain('sprintId');

      console.log('✓ getSprintIssues tool found in MCP server tools list');

      // Test CallTool with getSprintIssues
      const callToolRequest = {
        method: 'tools/call',
        params: {
          name: 'getSprintIssues',
          arguments: {
            sprintId: testSprintId,
          },
        },
      };

      const callToolHandler =
        server['server']['_requestHandlers'].get('tools/call');
      const callToolResponse = await callToolHandler(callToolRequest);

      // Validate response structure
      expect(callToolResponse).toBeDefined();
      expect(callToolResponse.content).toBeDefined();
      expect(Array.isArray(callToolResponse.content)).toBe(true);
      expect(callToolResponse.content.length).toBe(1);
      expect(callToolResponse.content[0].type).toBe('text');
      expect(callToolResponse.content[0].text).toBeDefined();

      // Parse and validate the returned data
      const response = JSON.parse(callToolResponse.content[0].text);
      const resultData = response.data || response; // Handle both nested and flat structures
      expect(resultData).toBeDefined();
      expect(typeof resultData).toBe('object');
      expect(resultData).toHaveProperty('startAt');
      expect(resultData).toHaveProperty('maxResults');
      expect(resultData).toHaveProperty('total');
      expect(resultData).toHaveProperty('issues');
      expect(Array.isArray(resultData.issues)).toBe(true);

      console.log(
        `✓ MCP tool returned ${resultData.total} issues from sprint ${testSprintId}`
      );

      if (resultData.total > 0 && resultData.issues.length > 0) {
        const firstIssue = resultData.issues[0];

        // Validate issue structure
        expect(firstIssue).toHaveProperty('id');
        expect(firstIssue).toHaveProperty('key');
        expect(firstIssue).toHaveProperty('self');
        expect(firstIssue).toHaveProperty('fields');

        expect(typeof firstIssue.id).toBe('string');
        expect(typeof firstIssue.key).toBe('string');
        expect(typeof firstIssue.self).toBe('string');
        expect(typeof firstIssue.fields).toBe('object');

        console.log(
          `✓ First issue: ${firstIssue.key} - ${firstIssue.fields.summary}`
        );
      }
    }, 45000); // 45s timeout for real API with multiple calls

    it('should handle getSprintIssues with pagination options through MCP tool', async () => {
      // Get a board and sprint first
      const boards = await client.getAgileBoards();

      if (boards.length === 0) {
        console.log('⚠️ No agile boards found - skipping MCP pagination test');
        return;
      }

      // Find a sprint with issues
      let testSprintId: number | undefined;

      for (const board of boards.slice(0, 3)) {
        try {
          const sprints = await client.getSprintsFromBoard(board.id);

          if (sprints.length > 0) {
            // Check if any sprint has issues
            for (const sprint of sprints.slice(0, 3)) {
              try {
                const quickCheck = await client.getSprintIssues(sprint.id, {
                  maxResults: 1,
                });
                if (quickCheck.total > 0) {
                  testSprintId = sprint.id;
                  break;
                }
              } catch (error) {
                // Continue to next sprint
              }
            }
            if (testSprintId) break;
          }
        } catch (error) {
          if (
            error instanceof ApiError &&
            error.message.includes("doesn't support sprints")
          ) {
            continue;
          }
          throw error;
        }
      }

      if (!testSprintId) {
        console.log(
          '⚠️ No sprint with issues found - skipping MCP pagination test'
        );
        return;
      }

      console.log(`🏃 Testing MCP pagination with sprint: ${testSprintId}`);

      // Test CallTool with pagination options
      const callToolRequest = {
        method: 'tools/call',
        params: {
          name: 'getSprintIssues',
          arguments: {
            sprintId: testSprintId,
            startAt: 0,
            maxResults: 3,
          },
        },
      };

      const callToolHandler =
        server['server']['_requestHandlers'].get('tools/call');
      const callToolResponse = await callToolHandler(callToolRequest);

      // Parse and validate the returned data
      const response = JSON.parse(callToolResponse.content[0].text);
      const resultData = response.data || response; // Handle both nested and flat structures

      expect(resultData.startAt).toBe(0);
      expect(resultData.maxResults).toBe(3);
      expect(resultData.total).toBeGreaterThan(0);

      if (resultData.total > 3) {
        expect(resultData.issues.length).toBe(3);
        console.log(
          `✓ MCP pagination working: showing ${resultData.issues.length} of ${resultData.total} issues`
        );
      } else {
        expect(resultData.issues.length).toBe(resultData.total);
        console.log(
          `✓ Sprint has ${resultData.total} issues (less than maxResults)`
        );
      }
    }, 30000);

    it('should handle getSprintIssues with field selection through MCP tool', async () => {
      // Get a board and sprint first
      const boards = await client.getAgileBoards();

      if (boards.length === 0) {
        console.log(
          '⚠️ No agile boards found - skipping MCP field selection test'
        );
        return;
      }

      // Find a sprint with issues
      let testSprintId: number | undefined;

      for (const board of boards.slice(0, 3)) {
        try {
          const sprints = await client.getSprintsFromBoard(board.id);

          if (sprints.length > 0) {
            for (const sprint of sprints.slice(0, 3)) {
              try {
                const quickCheck = await client.getSprintIssues(sprint.id, {
                  maxResults: 1,
                });
                if (quickCheck.total > 0) {
                  testSprintId = sprint.id;
                  break;
                }
              } catch (error) {
                // Continue to next sprint
              }
            }
            if (testSprintId) break;
          }
        } catch (error) {
          if (
            error instanceof ApiError &&
            error.message.includes("doesn't support sprints")
          ) {
            continue;
          }
          throw error;
        }
      }

      if (!testSprintId) {
        console.log(
          '⚠️ No sprint with issues found - skipping MCP field selection test'
        );
        return;
      }

      console.log(
        `🏃 Testing MCP field selection with sprint: ${testSprintId}`
      );

      // Test CallTool with field selection
      const callToolRequest = {
        method: 'tools/call',
        params: {
          name: 'getSprintIssues',
          arguments: {
            sprintId: testSprintId,
            fields: [
              'summary',
              'status.name',
              'assignee.displayName',
              'priority.name',
            ],
          },
        },
      };

      const callToolHandler =
        server['server']['_requestHandlers'].get('tools/call');
      const callToolResponse = await callToolHandler(callToolRequest);

      // Parse and validate the returned data
      const response = JSON.parse(callToolResponse.content[0].text);
      const resultData = response.data || response; // Handle both nested and flat structures

      expect(resultData.total).toBeGreaterThan(0);

      if (resultData.issues.length > 0) {
        const firstIssue = resultData.issues[0];

        // Should have requested fields (with proper field paths)
        expect(firstIssue.fields).toHaveProperty('summary');
        expect(firstIssue.fields).toHaveProperty('status');
        expect(firstIssue.fields).toHaveProperty('priority');
        expect(firstIssue.fields).toHaveProperty('assignee'); // Can be null

        console.log(
          `✓ MCP field selection working: ${Object.keys(firstIssue.fields).length} fields returned`
        );
        console.log(`✓ Summary: ${firstIssue.fields.summary}`);
        console.log(`✓ Status: ${firstIssue.fields.status.name}`);
      }
    }, 30000);
  });

  describe('error handling in MCP tool', () => {
    it('should handle invalid sprintId through MCP tool', async () => {
      const callToolRequest = {
        method: 'tools/call',
        params: {
          name: 'getSprintIssues',
          arguments: {
            sprintId: 'invalid-id', // Should be number
          },
        },
      };

      const callToolHandler =
        server['server']['_requestHandlers'].get('tools/call');

      await expect(callToolHandler(callToolRequest)).rejects.toThrow();

      console.log('✓ MCP tool correctly rejected invalid sprintId type');
    }, 10000);

    it('should handle missing sprintId through MCP tool', async () => {
      const callToolRequest = {
        method: 'tools/call',
        params: {
          name: 'getSprintIssues',
          arguments: {
            // Missing sprintId
            maxResults: 10,
          },
        },
      };

      const callToolHandler =
        server['server']['_requestHandlers'].get('tools/call');

      await expect(callToolHandler(callToolRequest)).rejects.toThrow();

      console.log('✓ MCP tool correctly rejected missing sprintId');
    }, 10000);

    it('should handle non-existent sprintId through MCP tool', async () => {
      const callToolRequest = {
        method: 'tools/call',
        params: {
          name: 'getSprintIssues',
          arguments: {
            sprintId: 999999, // Non-existent sprint
          },
        },
      };

      const callToolHandler =
        server['server']['_requestHandlers'].get('tools/call');

      await expect(callToolHandler(callToolRequest)).rejects.toThrow();

      console.log('✓ MCP tool correctly handled non-existent sprintId');
    }, 15000);

    it('should handle invalid pagination parameters through MCP tool', async () => {
      // Get a valid sprint first
      const boards = await client.getAgileBoards();

      if (boards.length === 0) {
        console.log('⚠️ No agile boards found - skipping MCP validation test');
        return;
      }

      let testSprintId: number | undefined;

      for (const board of boards.slice(0, 2)) {
        try {
          const sprints = await client.getSprintsFromBoard(board.id);
          if (sprints.length > 0) {
            testSprintId = sprints[0].id;
            break;
          }
        } catch (error) {
          if (
            error instanceof ApiError &&
            error.message.includes("doesn't support sprints")
          ) {
            continue;
          }
          throw error;
        }
      }

      if (!testSprintId) {
        console.log('⚠️ No sprints found - skipping MCP validation test');
        return;
      }

      // Test invalid startAt
      const invalidStartAtRequest = {
        method: 'tools/call',
        params: {
          name: 'getSprintIssues',
          arguments: {
            sprintId: testSprintId,
            startAt: -1, // Invalid: negative
          },
        },
      };

      const callToolHandler =
        server['server']['_requestHandlers'].get('tools/call');

      await expect(callToolHandler(invalidStartAtRequest)).rejects.toThrow();

      // Test invalid maxResults
      const invalidMaxResultsRequest = {
        method: 'tools/call',
        params: {
          name: 'getSprintIssues',
          arguments: {
            sprintId: testSprintId,
            maxResults: 0, // Invalid: must be positive
          },
        },
      };

      await expect(callToolHandler(invalidMaxResultsRequest)).rejects.toThrow();

      // Test invalid fields
      const invalidFieldsRequest = {
        method: 'tools/call',
        params: {
          name: 'getSprintIssues',
          arguments: {
            sprintId: testSprintId,
            fields: 'invalid', // Should be array
          },
        },
      };

      await expect(callToolHandler(invalidFieldsRequest)).rejects.toThrow();

      console.log('✓ MCP tool correctly validated pagination parameters');
    }, 30000);
  });

  describe('MCP tool schema validation', () => {
    it('should have correct tool schema in ListTools response', async () => {
      const listToolsRequest = {
        method: 'tools/list',
        params: {},
      };

      const listToolsHandler =
        server['server']['_requestHandlers'].get('tools/list');
      const listToolsResponse = await listToolsHandler(listToolsRequest);

      const getSprintIssuesTool = listToolsResponse.tools.find(
        (tool: any) => tool.name === 'getSprintIssues'
      );

      expect(getSprintIssuesTool).toBeDefined();
      expect(getSprintIssuesTool.name).toBe('getSprintIssues');
      expect(getSprintIssuesTool.description).toBe(
        'Get issues from a specific sprint with optional pagination and field selection'
      );

      // Validate input schema
      const schema = getSprintIssuesTool.inputSchema;
      expect(schema.type).toBe('object');
      expect(schema.required).toEqual(['sprintId']);

      // Check properties
      expect(schema.properties.sprintId).toBeDefined();
      expect(schema.properties.sprintId.type).toBe('number');
      expect(schema.properties.sprintId.description).toBe(
        'The numeric ID of the sprint'
      );

      expect(schema.properties.startAt).toBeDefined();
      expect(schema.properties.startAt.type).toBe('number');
      expect(schema.properties.startAt.description).toBe(
        'Starting index for pagination (default: 0)'
      );

      expect(schema.properties.maxResults).toBeDefined();
      expect(schema.properties.maxResults.type).toBe('number');
      expect(schema.properties.maxResults.description).toBe(
        'Maximum number of results to return (default: 50)'
      );

      expect(schema.properties.fields).toBeDefined();
      expect(schema.properties.fields.type).toBe('array');
      expect(schema.properties.fields.items.type).toBe('string');
      expect(typeof schema.properties.fields.description).toBe('string');
      expect(schema.properties.fields.description.length).toBeGreaterThan(10); // Description has been enhanced with more details

      console.log('✓ getSprintIssues tool schema is correctly defined');
    });
  });
});
