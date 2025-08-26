import { JiraMcpServer } from '../../src/server/jira-mcp-server.js';

describe('MCP Server - getSprint Tool Integration', () => {
  let mcpServer: JiraMcpServer;

  beforeAll(() => {
    const token = process.env.JIRA_PERSONAL_TOKEN;
    if (!token) {
      console.log(
        'Skipping MCP Server getSprint integration tests - JIRA_PERSONAL_TOKEN not set'
      );
      return;
    }

    mcpServer = new JiraMcpServer();
  });

  beforeEach(() => {
    const token = process.env.JIRA_PERSONAL_TOKEN;
    if (!token) {
      pending(
        'JIRA_PERSONAL_TOKEN not set - skipping MCP Server integration test'
      );
    }
  });

  describe('getSprint MCP Tool', () => {
    it('should retrieve sprint details via MCP handler', async () => {
      // First get available boards to find a board with sprints
      const boardsResponse = await (mcpServer as any).handleGetAgileBoards({});

      expect(boardsResponse).toBeDefined();
      expect(boardsResponse.content).toBeDefined();
      expect(Array.isArray(boardsResponse.content)).toBe(true);

      const boardsText = boardsResponse.content[0].text;
      const boards = JSON.parse(boardsText);
      expect(Array.isArray(boards)).toBe(true);

      if (boards.length === 0) {
        console.log('⚠️ No boards available - skipping getSprint test');
        return;
      }

      // Find a Scrum board (most likely to have sprints)
      const scrumBoard = boards.find((board: any) => board.type === 'scrum');
      const testBoardId = scrumBoard?.id || boards[0].id;

      console.log(
        `📋 Testing with board: ${scrumBoard?.name || boards[0].name} (ID: ${testBoardId}, Type: ${scrumBoard?.type || boards[0].type})`
      );

      // Get sprints from the board first
      const sprintsResponse = await (
        mcpServer as any
      ).handleGetSprintsFromBoard({ boardId: testBoardId });

      expect(sprintsResponse).toBeDefined();
      expect(sprintsResponse.content).toBeDefined();
      expect(Array.isArray(sprintsResponse.content)).toBe(true);

      const sprintsText = sprintsResponse.content[0].text;
      const sprints = JSON.parse(sprintsText);
      expect(Array.isArray(sprints)).toBe(true);

      if (sprints.length === 0) {
        console.log(
          'ℹ️ Board has no sprints (possibly Kanban board) - skipping getSprint test'
        );
        return;
      }

      const testSprintId = sprints[0].id;
      console.log(
        `🏃 Testing getSprint with sprint ID: ${testSprintId} (${sprints[0].name})`
      );

      // Act - Call getSprint via MCP handler
      const response = await (mcpServer as any).handleGetSprint({
        sprintId: testSprintId,
      });

      // Assert
      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content[0].type).toBe('text');

      const sprint = JSON.parse(response.content[0].text);

      // Validate sprint structure
      expect(sprint).toBeDefined();
      expect(sprint.id).toBe(testSprintId);
      expect(typeof sprint.id).toBe('number');
      expect(typeof sprint.self).toBe('string');
      expect(typeof sprint.state).toBe('string');
      expect(typeof sprint.name).toBe('string');

      // Validate self URL format
      expect(sprint.self).toMatch(/\/rest\/agile\/1\.0\/sprint\/\d+/);

      // Validate sprint state is one of expected values
      expect(['active', 'closed', 'future']).toContain(sprint.state);

      console.log(`✓ MCP getSprint returned: ${sprint.name} (${sprint.state})`);

      // Validate optional fields if present
      if (sprint.startDate) {
        expect(typeof sprint.startDate).toBe('string');
        expect(new Date(sprint.startDate).toString()).not.toBe('Invalid Date');
        console.log(`✓ Start date: ${sprint.startDate}`);
      }

      if (sprint.endDate) {
        expect(typeof sprint.endDate).toBe('string');
        expect(new Date(sprint.endDate).toString()).not.toBe('Invalid Date');
        console.log(`✓ End date: ${sprint.endDate}`);
      }

      if (sprint.completeDate) {
        expect(typeof sprint.completeDate).toBe('string');
        expect(new Date(sprint.completeDate).toString()).not.toBe(
          'Invalid Date'
        );
        console.log(`✓ Complete date: ${sprint.completeDate}`);
      }

      if (sprint.originBoardId !== undefined) {
        expect(typeof sprint.originBoardId).toBe('number');
        console.log(`✓ Origin board ID: ${sprint.originBoardId}`);
      }

      if (sprint.goal) {
        expect(typeof sprint.goal).toBe('string');
        console.log(`✓ Goal: ${sprint.goal}`);
      }
    }, 30000);

    it('should validate MCP getSprint data consistency with getSprintsFromBoard', async () => {
      // Get available boards
      const boardsResponse = await (mcpServer as any).handleGetAgileBoards({});
      const boards = JSON.parse(boardsResponse.content[0].text);

      if (boards.length === 0) {
        console.log('⚠️ No agile boards found - skipping consistency test');
        return;
      }

      // Find a board with sprints
      let testSprintId: number | null = null;
      let boardSprintData: any = null;

      for (const board of boards.slice(0, 3)) {
        // Test up to 3 boards
        try {
          const sprintsResponse = await (
            mcpServer as any
          ).handleGetSprintsFromBoard({ boardId: board.id });
          const sprints = JSON.parse(sprintsResponse.content[0].text);

          if (sprints.length > 0) {
            testSprintId = sprints[0].id;
            boardSprintData = sprints[0];
            console.log(
              `📋 Testing consistency with board: ${board.name} (Sprint ${testSprintId})`
            );
            break;
          }
        } catch (error) {
          // Continue to next board
        }
      }

      if (!testSprintId || !boardSprintData) {
        console.log(
          'ℹ️ No sprints found in any boards - skipping consistency test'
        );
        return;
      }

      // Get individual sprint data via MCP getSprint
      const sprintResponse = await (mcpServer as any).handleGetSprint({
        sprintId: testSprintId,
      });
      const individualSprintData = JSON.parse(sprintResponse.content[0].text);

      // Compare data consistency
      expect(individualSprintData.id).toBe(boardSprintData.id);
      expect(individualSprintData.self).toBe(boardSprintData.self);
      expect(individualSprintData.state).toBe(boardSprintData.state);
      expect(individualSprintData.name).toBe(boardSprintData.name);

      // Compare optional fields (only if both have them)
      if (boardSprintData.startDate && individualSprintData.startDate) {
        expect(individualSprintData.startDate).toBe(boardSprintData.startDate);
      }

      if (boardSprintData.endDate && individualSprintData.endDate) {
        expect(individualSprintData.endDate).toBe(boardSprintData.endDate);
      }

      if (boardSprintData.completeDate && individualSprintData.completeDate) {
        expect(individualSprintData.completeDate).toBe(
          boardSprintData.completeDate
        );
      }

      if (boardSprintData.originBoardId && individualSprintData.originBoardId) {
        expect(individualSprintData.originBoardId).toBe(
          boardSprintData.originBoardId
        );
      }

      if (boardSprintData.goal && individualSprintData.goal) {
        expect(individualSprintData.goal).toBe(boardSprintData.goal);
      }

      console.log(
        `✓ MCP getSprint data consistent with getSprintsFromBoard for sprint ${testSprintId}`
      );
    }, 45000);

    it('should handle errors properly via MCP', async () => {
      // Test with non-existent sprint ID
      const nonExistentSprintId = 999999999;

      await expect(
        (mcpServer as any).handleGetSprint({ sprintId: nonExistentSprintId })
      ).rejects.toThrow();

      console.log(
        `✓ MCP getSprint correctly handled non-existent sprint ID: ${nonExistentSprintId}`
      );
    }, 30000);

    it('should validate MCP input parameters', async () => {
      // Test missing sprintId
      await expect((mcpServer as any).handleGetSprint({})).rejects.toThrow();

      console.log('✓ MCP getSprint correctly rejected missing sprintId');

      // Test invalid sprintId type
      await expect(
        (mcpServer as any).handleGetSprint({ sprintId: 'invalid' })
      ).rejects.toThrow();

      console.log('✓ MCP getSprint correctly rejected invalid sprintId type');

      // Test negative sprintId
      await expect(
        (mcpServer as any).handleGetSprint({ sprintId: -1 })
      ).rejects.toThrow();

      console.log('✓ MCP getSprint correctly rejected negative sprintId');
    }, 30000);

    it('should return properly formatted MCP response', async () => {
      // Get available boards first
      const boardsResponse = await (mcpServer as any).handleGetAgileBoards({});
      const boards = JSON.parse(boardsResponse.content[0].text);

      if (boards.length === 0) {
        console.log('⚠️ No agile boards found - skipping response format test');
        return;
      }

      // Find a board with sprints
      let testSprintId: number | null = null;

      for (const board of boards.slice(0, 3)) {
        try {
          const sprintsResponse = await (
            mcpServer as any
          ).handleGetSprintsFromBoard({ boardId: board.id });
          const sprints = JSON.parse(sprintsResponse.content[0].text);

          if (sprints.length > 0) {
            testSprintId = sprints[0].id;
            break;
          }
        } catch (error) {
          // Continue to next board
        }
      }

      if (!testSprintId) {
        console.log('ℹ️ No sprints found - skipping response format test');
        return;
      }

      // Act
      const response = await (mcpServer as any).handleGetSprint({
        sprintId: testSprintId,
      });

      // Assert MCP response format
      expect(response).toBeDefined();
      expect(response).toHaveProperty('content');
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content.length).toBe(1);

      const content = response.content[0];
      expect(content).toHaveProperty('type');
      expect(content.type).toBe('text');
      expect(content).toHaveProperty('text');
      expect(typeof content.text).toBe('string');

      // Validate that text is valid JSON
      expect(() => JSON.parse(content.text)).not.toThrow();

      const parsedData = JSON.parse(content.text);
      expect(parsedData).toHaveProperty('id');
      expect(parsedData).toHaveProperty('self');
      expect(parsedData).toHaveProperty('state');
      expect(parsedData).toHaveProperty('name');

      console.log(`✓ MCP response format valid for sprint ${testSprintId}`);
    }, 30000);

    it('should handle multiple sprint requests efficiently', async () => {
      // Get available boards first
      const boardsResponse = await (mcpServer as any).handleGetAgileBoards({});
      const boards = JSON.parse(boardsResponse.content[0].text);

      if (boards.length === 0) {
        console.log(
          '⚠️ No agile boards found - skipping multiple requests test'
        );
        return;
      }

      // Find a board with sprints
      let testSprintIds: number[] = [];

      for (const board of boards.slice(0, 2)) {
        try {
          const sprintsResponse = await (
            mcpServer as any
          ).handleGetSprintsFromBoard({ boardId: board.id });
          const sprints = JSON.parse(sprintsResponse.content[0].text);

          if (sprints.length > 0) {
            testSprintIds = sprints.slice(0, 3).map((s: any) => s.id); // Test up to 3 sprints
            break;
          }
        } catch (error) {
          // Continue to next board
        }
      }

      if (testSprintIds.length === 0) {
        console.log('ℹ️ No sprints found - skipping multiple requests test');
        return;
      }

      console.log(
        `🏃 Testing multiple getSprint requests with ${testSprintIds.length} sprints`
      );

      // Test multiple requests
      const promises = testSprintIds.map(sprintId =>
        (mcpServer as any).handleGetSprint({ sprintId })
      );

      const responses = await Promise.all(promises);

      // Validate all responses
      responses.forEach((response, index) => {
        expect(response.content).toBeDefined();
        expect(Array.isArray(response.content)).toBe(true);
        expect(response.content[0].type).toBe('text');

        const sprint = JSON.parse(response.content[0].text);
        expect(sprint.id).toBe(testSprintIds[index]);

        console.log(
          `✓ Sprint ${testSprintIds[index]}: ${sprint.name} (${sprint.state})`
        );
      });

      console.log(
        `✓ Successfully handled ${testSprintIds.length} concurrent getSprint requests`
      );
    }, 60000);
  });
});
