/**
 * Integration tests for getAgileBoards MCP tool
 *
 * These tests verify that the getAgileBoards functionality works correctly
 * through the MCP Server interface, testing both the tool definition and
 * execution against a real Jira Server instance.
 */

import { JiraMcpServer } from '../../src/server/jira-mcp-server.js';

describe('MCP Server - getAgileBoards Tool Integration', () => {
  let mcpServer: JiraMcpServer;

  beforeAll(() => {
    const token = process.env.JIRA_PERSONAL_TOKEN;
    if (!token) {
      console.log(
        'Skipping MCP Server getAgileBoards integration tests - JIRA_PERSONAL_TOKEN not set'
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

  describe('getAgileBoards MCP Tool', () => {
    it('should retrieve all agile boards via MCP handler', async () => {
      // Act - Test the handler directly
      const response = await (mcpServer as any).handleGetAgileBoards({});

      // Assert
      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content.length).toBe(1);
      expect(response.content[0]).toHaveProperty('type', 'text');
      expect(response.content[0]).toHaveProperty('text');

      // Parse the JSON response
      const boardsText = response.content[0].text;
      expect(typeof boardsText).toBe('string');

      const boards = JSON.parse(boardsText);
      expect(boards).toBeDefined();
      expect(Array.isArray(boards)).toBe(true);
      expect(boards.length).toBeGreaterThan(0);

      // Validate board structure
      const firstBoard = boards[0];
      expect(firstBoard).toHaveProperty('id');
      expect(firstBoard).toHaveProperty('self');
      expect(firstBoard).toHaveProperty('name');
      expect(firstBoard).toHaveProperty('type');

      expect(typeof firstBoard.id).toBe('number');
      expect(typeof firstBoard.self).toBe('string');
      expect(typeof firstBoard.name).toBe('string');
      expect(typeof firstBoard.type).toBe('string');

      console.log(`✓ Retrieved ${boards.length} boards via MCP handler`);
      console.log(`✓ First board: ${firstBoard.name} (${firstBoard.type})`);
    }, 30000);

    it('should filter boards by project key via MCP handler', async () => {
      // Act - Test with project filter
      const response = await (mcpServer as any).handleGetAgileBoards({
        projectKey: 'DSCWA',
      });

      // Assert
      expect(response).toBeDefined();
      expect(response.content).toBeDefined();

      const boards = JSON.parse(response.content[0].text);
      expect(Array.isArray(boards)).toBe(true);

      // All returned boards should have DSCWA project association if any exist
      boards.forEach((board: any) => {
        if (board.location?.type === 'project') {
          expect(board.location.projectKey).toBe('DSCWA');
        }
      });

      console.log(
        `✓ Project filtering working - found ${boards.length} boards for DSCWA`
      );
    }, 30000);

    it('should return empty array for non-existent project via MCP handler', async () => {
      // Act - Test with non-existent project
      const response = await (mcpServer as any).handleGetAgileBoards({
        projectKey: 'NONEXISTENT_XYZ123',
      });

      // Assert
      expect(response).toBeDefined();
      expect(response.content).toBeDefined();

      const boards = JSON.parse(response.content[0].text);
      expect(Array.isArray(boards)).toBe(true);
      expect(boards.length).toBe(0);

      console.log(
        '✓ Non-existent project correctly returns empty array via MCP'
      );
    }, 30000);

    it('should handle invalid projectKey type via MCP handler', async () => {
      // Act & Assert
      await expect(
        (mcpServer as any).handleGetAgileBoards({ projectKey: 123 })
      ).rejects.toThrow('projectKey must be a string');
    });

    it('should handle empty string projectKey via MCP handler', async () => {
      // Act - Test with empty string
      const response = await (mcpServer as any).handleGetAgileBoards({
        projectKey: '',
      });

      // Assert
      expect(response).toBeDefined();
      expect(response.content).toBeDefined();

      const boards = JSON.parse(response.content[0].text);
      expect(Array.isArray(boards)).toBe(true);
      expect(boards.length).toBeGreaterThan(0);

      console.log(
        `✓ Empty project key handled correctly - retrieved ${boards.length} boards`
      );
    }, 30000);
  });
});
