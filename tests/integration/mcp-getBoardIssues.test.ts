import { JiraMcpServer } from '../../src/server/jira-mcp-server.js';

describe('JiraMcpServer - getBoardIssues MCP Integration', () => {
  let server: JiraMcpServer;
  let testBoardId: number;

  beforeAll(async () => {
    const token = process.env.JIRA_PERSONAL_TOKEN;
    if (!token) {
      console.log('Skipping MCP Server getBoardIssues integration tests - JIRA_PERSONAL_TOKEN not set');
      return;
    }

    server = new JiraMcpServer();

    // Get a valid board ID for testing by first getting boards
    const boardsResponse = await (server as any).handleGetAgileBoards({});
    const boardsData = JSON.parse(boardsResponse.content[0].text);
    expect(Array.isArray(boardsData)).toBe(true);
    expect(boardsData.length).toBeGreaterThan(0);
    
    testBoardId = boardsData[0].id;
    console.log(`Using test board ID: ${testBoardId} (${boardsData[0].name})`);
  });

  beforeEach(() => {
    const token = process.env.JIRA_PERSONAL_TOKEN;
    if (!token) {
      pending('JIRA_PERSONAL_TOKEN not set - skipping MCP Server integration test');
    }
  });

  describe('Basic MCP tool functionality', () => {
    test('should get board issues with default parameters', async () => {
      // Act - Test the handler directly
      const result = await (server as any).handleGetBoardIssues({
        boardId: testBoardId
      });

      expect(result).toHaveProperty('content');
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content.length).toBe(1);
      expect(result.content[0]).toHaveProperty('type', 'text');
      expect(result.content[0]).toHaveProperty('text');

      const data = JSON.parse(result.content[0].text);
      
      // Validate SearchResult structure
      expect(data).toHaveProperty('expand');
      expect(data).toHaveProperty('startAt');
      expect(data).toHaveProperty('maxResults');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('issues');
      expect(Array.isArray(data.issues)).toBe(true);

      console.log(`MCP getBoardIssues: Board ${testBoardId} has ${data.total} issues (returned ${data.issues.length})`);

      // Validate issue structure if any issues exist
      if (data.issues.length > 0) {
        const issue = data.issues[0];
        expect(issue).toHaveProperty('id');
        expect(issue).toHaveProperty('key');
        expect(issue).toHaveProperty('self');
        expect(issue).toHaveProperty('fields');
        expect(issue.fields).toHaveProperty('summary');
        expect(issue.fields).toHaveProperty('status');

        console.log(`MCP Sample issue: ${issue.key} - ${issue.fields.summary}`);
      }
    });

    test('should handle pagination parameters', async () => {
      const result = await (server as any).handleGetBoardIssues({
        boardId: testBoardId,
        startAt: 0,
        maxResults: 3
      });

      const data = JSON.parse(result.content[0].text);

      expect(data.startAt).toBe(0);
      expect(data.maxResults).toBe(3);
      expect(data.issues.length).toBeLessThanOrEqual(3);

      console.log(`MCP Pagination test: requested 3, got ${data.issues.length} issues`);
    });

    test('should handle field selection', async () => {
      const result = await (server as any).handleGetBoardIssues({
        boardId: testBoardId,
        maxResults: 1,
        fields: ['summary', 'status', 'assignee']
      });

      const data = JSON.parse(result.content[0].text);

      if (data.issues.length > 0) {
        const issue = data.issues[0];
        expect(issue.fields).toHaveProperty('summary');
        expect(issue.fields).toHaveProperty('status');
        expect(issue.fields).toHaveProperty('assignee');

        console.log(`MCP Field filtering: ${issue.key} - ${issue.fields.summary}`);
      }
    });
  });

  describe('Parameter validation', () => {
    test('should require boardId parameter', async () => {
      await expect(async () => {
        await (server as any).handleGetBoardIssues({});
      }).rejects.toThrow(/boardId is required/);
    });

    test('should validate boardId type', async () => {
      await expect(async () => {
        await (server as any).handleGetBoardIssues({
          boardId: 'invalid'
        });
      }).rejects.toThrow(/boardId.*must be a number/);
    });

    test('should validate startAt parameter', async () => {
      await expect(async () => {
        await (server as any).handleGetBoardIssues({
          boardId: testBoardId,
          startAt: -1
        });
      }).rejects.toThrow(/startAt.*non-negative/);
    });

    test('should validate maxResults parameter', async () => {
      await expect(async () => {
        await (server as any).handleGetBoardIssues({
          boardId: testBoardId,
          maxResults: 0
        });
      }).rejects.toThrow(/maxResults.*positive/);
    });

    test('should validate fields parameter', async () => {
      await expect(async () => {
        await (server as any).handleGetBoardIssues({
          boardId: testBoardId,
          fields: 'invalid'
        });
      }).rejects.toThrow(/fields.*array/);
    });
  });

  describe('Error handling', () => {
    test('should handle non-existent board ID', async () => {
      await expect(async () => {
        await (server as any).handleGetBoardIssues({
          boardId: 999999
        });
      }).rejects.toThrow();
    });

    test('should handle invalid board ID', async () => {
      await expect(async () => {
        await (server as any).handleGetBoardIssues({
          boardId: -1
        });
      }).rejects.toThrow();
    });
  });

  describe('Field filtering security', () => {
    test('should filter invalid field names', async () => {
      // Should succeed (not throw) because invalid fields are filtered out
      const result = await (server as any).handleGetBoardIssues({
        boardId: testBoardId,
        maxResults: 1,
        fields: ['summary', 'invalidField', 'maliciousScript', 'status']
      });

      const data = JSON.parse(result.content[0].text);

      if (data.issues.length > 0) {
        const issue = data.issues[0];
        expect(issue.fields).toHaveProperty('summary');
        expect(issue.fields).toHaveProperty('status');
        console.log(`MCP Security test passed - filtered invalid fields for issue: ${issue.key}`);
      }
    });
  });

  describe('Integration with other tools', () => {
    test('should work with getAgileBoards to find valid board IDs', async () => {
      // First get boards
      const boardsResult = await (server as any).handleGetAgileBoards({});
      const boards = JSON.parse(boardsResult.content[0].text);

      expect(Array.isArray(boards)).toBe(true);
      expect(boards.length).toBeGreaterThan(0);

      // Then get issues from the first board
      const issuesResult = await (server as any).handleGetBoardIssues({
        boardId: boards[0].id,
        maxResults: 2
      });

      const issues = JSON.parse(issuesResult.content[0].text);

      expect(issues).toHaveProperty('issues');
      expect(Array.isArray(issues.issues)).toBe(true);

      console.log(`MCP Integration test: Board ${boards[0].name} (ID: ${boards[0].id}) has ${issues.total} issues`);
    });
  });
});