/**
 * E2E test for basic Jira MCP tools
 * 
 * This test verifies the end-to-end behavior of core Jira tools
 * to ensure they work correctly without field filtering issues.
 */

import { JiraMcpServer } from '../../src/server/jira-mcp-server.js';

describe('Basic Tools E2E', () => {
  let server: JiraMcpServer;

  beforeEach(() => {
    server = new JiraMcpServer();
  });

  afterEach(async () => {
    if (server && typeof server.close === 'function') {
      await server.close();
    }
  });

  describe('Issue Operations', () => {
    it('should get issue with basic fields', async () => {
      const result = await server.handleCallTool({
        name: 'getIssue',
        arguments: {
          issueKey: 'DSCWA-428',
          fields: ['key', 'summary', 'status', 'assignee']
        }
      });

      const resultText = result.content[0].text;
      const parsedResult = JSON.parse(resultText);

      // Should not have field validation warnings
      expect(parsedResult.warning).toBeUndefined();
      
      // Should have the issue data directly (no .data wrapper when no warnings)
      expect(parsedResult).toHaveProperty('key');
      expect(parsedResult).toHaveProperty('fields');
      expect(parsedResult.fields).toHaveProperty('summary');
      expect(parsedResult.fields).toHaveProperty('status');
      
      console.log(`✅ Retrieved issue: ${parsedResult.key} - ${parsedResult.fields.summary}`);
    });

    it('should get issue without field restrictions', async () => {
      const result = await server.handleCallTool({
        name: 'getIssue',
        arguments: {
          issueKey: 'DSCWA-428'
          // No fields parameter - should get all fields
        }
      });

      const resultText = result.content[0].text;
      const parsedResult = JSON.parse(resultText);

      expect(parsedResult).toHaveProperty('key');
      expect(parsedResult).toHaveProperty('fields');
      
      // Should have many fields when no restriction is applied
      const fieldCount = Object.keys(parsedResult.fields).length;
      expect(fieldCount).toBeGreaterThan(10);
      
      console.log(`✅ Retrieved issue with ${fieldCount} fields (unrestricted)`);
    });
  });

  describe('Project Operations', () => {
    it('should get project issues with field selection', async () => {
      const result = await server.handleCallTool({
        name: 'getProjectIssues',
        arguments: {
          projectKey: 'DSCWA',
          fields: ['key', 'summary', 'status'],
          maxResults: 2
        }
      });

      const resultText = result.content[0].text;
      const parsedResult = JSON.parse(resultText);

      // Should not have field validation warnings
      expect(parsedResult.warning).toBeUndefined();
      
      expect(parsedResult).toHaveProperty('issues');
      expect(Array.isArray(parsedResult.issues)).toBe(true);
      
      if (parsedResult.issues.length > 0) {
        const firstIssue = parsedResult.issues[0];
        expect(firstIssue).toHaveProperty('key');
        expect(firstIssue.fields).toHaveProperty('summary');
        console.log(`✅ Project issues: ${parsedResult.issues.length} returned`);
      }
    });
  });

  describe('System Operations', () => {
    it('should get current user without issues', async () => {
      const result = await server.handleCallTool({
        name: 'getCurrentUser',
        arguments: {}
      });

      const resultText = result.content[0].text;
      const parsedResult = JSON.parse(resultText);

      expect(parsedResult).toHaveProperty('displayName');
      expect(parsedResult).toHaveProperty('emailAddress');
      
      console.log(`✅ Current user: ${parsedResult.displayName}`);
    });

    it('should search fields without restrictions', async () => {
      const result = await server.handleCallTool({
        name: 'searchFields',
        arguments: {
          query: 'summary'
        }
      });

      const resultText = result.content[0].text;
      const parsedResult = JSON.parse(resultText);

      expect(Array.isArray(parsedResult)).toBe(true);
      expect(parsedResult.length).toBeGreaterThan(0);
      
      // Should find the summary field
      const summaryField = parsedResult.find((field: any) => 
        field.name && field.name.toLowerCase().includes('summary')
      );
      expect(summaryField).toBeDefined();
      
      console.log(`✅ Found ${parsedResult.length} fields matching 'summary'`);
    });
  });

  describe('Agile Operations', () => {
    it('should get board issues with custom fields', async () => {
      // First get a board ID
      const boardsResult = await server.handleCallTool({
        name: 'getAgileBoards',
        arguments: { projectKey: 'DSCWA' }
      });

      const boardsText = boardsResult.content[0].text;
      const boards = JSON.parse(boardsText);

      if (boards.values && boards.values.length > 0) {
        const boardId = boards.values[0].id;
        
        const result = await server.handleCallTool({
          name: 'getBoardIssues',
          arguments: {
            boardId: boardId,
            fields: ['key', 'summary', 'customfield_10001'],
            maxResults: 1
          }
        });

        const resultText = result.content[0].text;
        const parsedResult = JSON.parse(resultText);

        // Should not have field validation warnings for custom fields
        expect(parsedResult.warning).toBeUndefined();
        
        console.log(`✅ Board ${boardId} issues retrieved without field restrictions`);
      } else {
        console.log('⚠️  No boards found for project DSCWA, skipping board issues test');
      }
    });
  });
});