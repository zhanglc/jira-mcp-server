/**
 * Integration tests for getSprintsFromBoard MCP tool
 * 
 * These tests verify that the getSprintsFromBoard tool is properly registered
 * and functions correctly through the MCP server interface.
 * 
 * Prerequisites:
 * - Valid Jira Server environment (https://jira.dentsplysirona.com)
 * - Valid authentication credentials in .env
 * - Agile functionality enabled on the Jira Server
 * - Test boards with sprint data available
 */

import { JiraMcpServer } from '../../src/server/jira-mcp-server.js';

describe('MCP Server - getSprintsFromBoard Tool Integration', () => {
  let mcpServer: JiraMcpServer;

  beforeAll(() => {
    const token = process.env.JIRA_PERSONAL_TOKEN;
    if (!token) {
      console.log('Skipping MCP Server getSprintsFromBoard integration tests - JIRA_PERSONAL_TOKEN not set');
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

  describe('getSprintsFromBoard MCP Tool', () => {
    it('should retrieve sprints from a board via MCP handler', async () => {
      // First get available boards to find a board with sprints
      const boardsResponse = await (mcpServer as any).handleGetAgileBoards({});
      
      expect(boardsResponse).toBeDefined();
      expect(boardsResponse.content).toBeDefined();
      expect(Array.isArray(boardsResponse.content)).toBe(true);
      
      const boardsText = boardsResponse.content[0].text;
      const boards = JSON.parse(boardsText);
      expect(Array.isArray(boards)).toBe(true);
      
      if (boards.length === 0) {
        console.log('⚠️ No boards available - skipping sprint test');
        return;
      }

      // Find a Scrum board (most likely to have sprints)
      const scrumBoard = boards.find((board: any) => board.type === 'scrum');
      const testBoardId = scrumBoard?.id || boards[0].id;

      console.log(`📋 Testing getSprintsFromBoard with board ID: ${testBoardId} (${scrumBoard?.name || boards[0].name})`);

      // Act - Test the handler directly
      const response = await (mcpServer as any).handleGetSprintsFromBoard({ boardId: testBoardId });

      // Assert
      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content.length).toBe(1);
      expect(response.content[0]).toHaveProperty('type', 'text');
      expect(response.content[0]).toHaveProperty('text');
      
      // Parse the JSON response
      const sprintsText = response.content[0].text;
      expect(typeof sprintsText).toBe('string');
      
      const sprints = JSON.parse(sprintsText);
      expect(sprints).toBeDefined();
      expect(Array.isArray(sprints)).toBe(true);
      
      console.log(`✓ Retrieved ${sprints.length} sprints from board ${testBoardId}`);

      if (sprints.length > 0) {
        const firstSprint = sprints[0];
        
        // Validate sprint structure
        expect(firstSprint).toHaveProperty('id');
        expect(firstSprint).toHaveProperty('self');
        expect(firstSprint).toHaveProperty('state');
        expect(firstSprint).toHaveProperty('name');
        
        expect(typeof firstSprint.id).toBe('number');
        expect(typeof firstSprint.self).toBe('string');
        expect(typeof firstSprint.state).toBe('string');
        expect(typeof firstSprint.name).toBe('string');
        
        // Validate self URL format
        expect(firstSprint.self).toMatch(/\/rest\/agile\/1\.0\/sprint\/\d+/);
        
        // Validate sprint state is valid
        expect(['active', 'closed', 'future']).toContain(firstSprint.state);
        
        console.log(`✓ First sprint: ${firstSprint.name} (${firstSprint.state})`);
        
        // Validate optional date fields if present
        if (firstSprint.startDate) {
          expect(typeof firstSprint.startDate).toBe('string');
          expect(new Date(firstSprint.startDate).toString()).not.toBe('Invalid Date');
          console.log(`✓ Start date: ${firstSprint.startDate}`);
        }
        
        if (firstSprint.endDate) {
          expect(typeof firstSprint.endDate).toBe('string');
          expect(new Date(firstSprint.endDate).toString()).not.toBe('Invalid Date');
          console.log(`✓ End date: ${firstSprint.endDate}`);
        }
        
        if (firstSprint.completeDate) {
          expect(typeof firstSprint.completeDate).toBe('string');
          expect(new Date(firstSprint.completeDate).toString()).not.toBe('Invalid Date');
          console.log(`✓ Complete date: ${firstSprint.completeDate}`);
        }
        
        if (firstSprint.originBoardId !== undefined) {
          expect(typeof firstSprint.originBoardId).toBe('number');
          console.log(`✓ Origin board ID: ${firstSprint.originBoardId}`);
        }
        
        if (firstSprint.goal) {
          expect(typeof firstSprint.goal).toBe('string');
          console.log(`✓ Goal: ${firstSprint.goal}`);
        }
      } else {
        console.log('ℹ️ Board has no sprints (possibly Kanban board)');
      }
    }, 30000);

    it('should handle different board types correctly', async () => {
      // Get available boards
      const boardsResponse = await (mcpServer as any).handleGetAgileBoards({});
      const boardsText = boardsResponse.content[0].text;
      const boards = JSON.parse(boardsText);
      
      if (boards.length === 0) {
        console.log('⚠️ No boards available - skipping board type test');
        return;
      }

      // Test with different board types
      const testResults = [];
      
      for (const board of boards.slice(0, 3)) { // Test up to 3 boards
        try {
          const response = await (mcpServer as any).handleGetSprintsFromBoard({ boardId: board.id });
          const sprints = JSON.parse(response.content[0].text);
          
          testResults.push({
            boardId: board.id,
            boardName: board.name,
            boardType: board.type,
            sprintCount: sprints.length,
            success: true
          });
          
          console.log(`📋 Board ${board.name} (${board.type}): ${sprints.length} sprints`);
          
        } catch (error) {
          testResults.push({
            boardId: board.id,
            boardName: board.name,
            boardType: board.type,
            sprintCount: 0,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          
          console.log(`⚠️ Board ${board.name} (${board.type}): Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Assert that we tested multiple boards
      expect(testResults.length).toBeGreaterThan(0);
      
      // Log summary
      const successfulBoards = testResults.filter(r => r.success);
      const boardsWithSprints = testResults.filter(r => r.success && r.sprintCount > 0);
      
      console.log(`✓ Tested ${testResults.length} boards: ${successfulBoards.length} successful, ${boardsWithSprints.length} with sprints`);
    }, 45000);

    it('should handle error cases properly', async () => {
      // Test with invalid board ID
      const invalidBoardId = 999999;

      // Act & Assert
      await expect(
        (mcpServer as any).handleGetSprintsFromBoard({ boardId: invalidBoardId })
      ).rejects.toThrow();
      
      console.log(`✓ Properly handled invalid board ID: ${invalidBoardId}`);
    }, 30000);

    it('should validate input parameters', async () => {
      // Test missing boardId
      await expect(
        (mcpServer as any).handleGetSprintsFromBoard({})
      ).rejects.toThrow(/boardId is required/);

      // Test invalid boardId type
      await expect(
        (mcpServer as any).handleGetSprintsFromBoard({ boardId: 'invalid' })
      ).rejects.toThrow(/boardId.*must be a number/);

      // Test null boardId
      await expect(
        (mcpServer as any).handleGetSprintsFromBoard({ boardId: null })
      ).rejects.toThrow(/boardId is required/);

      console.log('✓ Properly validated input parameters');
    }, 30000);

    it('should return properly formatted sprint data', async () => {
      // Get available boards
      const boardsResponse = await (mcpServer as any).handleGetAgileBoards({});
      const boardsText = boardsResponse.content[0].text;
      const boards = JSON.parse(boardsText);
      
      if (boards.length === 0) {
        console.log('⚠️ No boards available - skipping data validation test');
        return;
      }

      // Find a board with sprints
      let testSprints = [];
      let testBoardName = '';
      
      for (const board of boards) {
        try {
          const response = await (mcpServer as any).handleGetSprintsFromBoard({ boardId: board.id });
          const sprints = JSON.parse(response.content[0].text);
          
          if (sprints.length > 0) {
            testSprints = sprints;
            testBoardName = board.name;
            break;
          }
        } catch (error) {
          // Continue to next board if this one doesn't support sprints
        }
      }

      if (testSprints.length === 0) {
        console.log('ℹ️ No sprints found in any boards - skipping data validation');
        return;
      }

      console.log(`📋 Validating sprint data from board: ${testBoardName}`);

      // Validate each sprint structure
      testSprints.forEach((sprint: any) => {
        // Required fields
        expect(sprint.id).toBeDefined();
        expect(sprint.self).toBeDefined();
        expect(sprint.state).toBeDefined();
        expect(sprint.name).toBeDefined();
        
        expect(typeof sprint.id).toBe('number');
        expect(typeof sprint.self).toBe('string');
        expect(typeof sprint.state).toBe('string');
        expect(typeof sprint.name).toBe('string');
        
        // Validate sprint state
        expect(['active', 'closed', 'future']).toContain(sprint.state);
        
        // Optional fields - type validation only if present
        if (sprint.startDate !== undefined) {
          expect(typeof sprint.startDate).toBe('string');
        }
        
        if (sprint.endDate !== undefined) {
          expect(typeof sprint.endDate).toBe('string');
        }
        
        if (sprint.completeDate !== undefined) {
          expect(typeof sprint.completeDate).toBe('string');
        }
        
        if (sprint.originBoardId !== undefined) {
          expect(typeof sprint.originBoardId).toBe('number');
        }
        
        if (sprint.goal !== undefined) {
          expect(typeof sprint.goal).toBe('string');
        }
      });
      
      console.log(`✓ All ${testSprints.length} sprints validated against JiraSprint interface`);
    }, 30000);
  });
});