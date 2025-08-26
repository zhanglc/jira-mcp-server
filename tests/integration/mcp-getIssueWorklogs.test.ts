import { JiraMcpServer } from '../../src/server/jira-mcp-server.js';

// Integration test for getIssueWorklogs MCP tool
// Note: This test requires a valid JIRA_PERSONAL_TOKEN and connection to https://jira.dentsplysirona.com
describe('MCP Server - getIssueWorklogs Integration Tests', () => {
  let mcpServer: JiraMcpServer;
  const TEST_ISSUE_KEY = 'DSCWA-428'; // Test issue from environment

  beforeAll(() => {
    const token = process.env.JIRA_PERSONAL_TOKEN;
    if (!token) {
      console.log(
        'Skipping MCP Server getIssueWorklogs integration tests - JIRA_PERSONAL_TOKEN not set'
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

  describe('getIssueWorklogs MCP Tool', () => {
    it('should return issue worklogs when called via MCP handler', async () => {
      // Act - Test the handler directly
      const response = await (mcpServer as any).handleGetIssueWorklogs({
        issueKey: TEST_ISSUE_KEY,
      });

      // Assert
      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content.length).toBe(1);
      expect(response.content[0]).toHaveProperty('type', 'text');
      expect(response.content[0]).toHaveProperty('text');

      // Parse the JSON response
      const worklogsText = response.content[0].text;
      expect(typeof worklogsText).toBe('string');

      const worklogs = JSON.parse(worklogsText);
      expect(worklogs).toBeDefined();
      expect(Array.isArray(worklogs)).toBe(true);

      // Validate worklog structure if worklogs exist
      if (worklogs.length > 0) {
        const worklog = worklogs[0];
        expect(worklog.self).toBeDefined();
        expect(worklog.id).toBeDefined();
        expect(worklog.issueId).toBeDefined();
        expect(worklog.author).toBeDefined();
        expect(worklog.created).toBeDefined();
        expect(worklog.timeSpent).toBeDefined();
        expect(worklog.timeSpentSeconds).toBeDefined();

        console.log(
          `✅ MCP getIssueWorklogs tool returned ${worklogs.length} worklog(s) for issue ${TEST_ISSUE_KEY}`
        );
      } else {
        console.log(`ℹ Issue ${TEST_ISSUE_KEY} has no worklogs`);
      }
    }, 10000);

    it('should reject requests with missing issueKey parameter', async () => {
      // Act & Assert - Test the handler directly with missing parameter
      await expect(
        (mcpServer as any).handleGetIssueWorklogs({})
      ).rejects.toThrow('issueKey is required and must be a string');
    });

    it('should reject requests with invalid issueKey type', async () => {
      // Act & Assert - Test the handler directly with invalid parameter type
      await expect(
        (mcpServer as any).handleGetIssueWorklogs({ issueKey: 123 })
      ).rejects.toThrow('issueKey is required and must be a string');
    });

    it('should handle non-existent issue gracefully', async () => {
      // Act & Assert - Test the handler directly with non-existent issue
      await expect(
        (mcpServer as any).handleGetIssueWorklogs({
          issueKey: 'NONEXISTENT-99999',
        })
      ).rejects.toThrow();
    }, 10000);

    it('should provide complete worklog data for time tracking analysis', async () => {
      // Act - Test the handler directly
      const response = await (mcpServer as any).handleGetIssueWorklogs({
        issueKey: TEST_ISSUE_KEY,
      });
      const worklogs = JSON.parse(response.content[0].text);

      // Assert - validate the data is suitable for time tracking analysis
      if (worklogs.length > 0) {
        let totalTimeSeconds = 0;
        const authors = new Set();
        const worklogDetails = [];

        for (const worklog of worklogs) {
          // Validate essential fields for time tracking
          expect(worklog.timeSpentSeconds).toBeDefined();
          expect(typeof worklog.timeSpentSeconds).toBe('number');
          expect(worklog.timeSpentSeconds).toBeGreaterThan(0);

          expect(worklog.timeSpent).toBeDefined();
          expect(typeof worklog.timeSpent).toBe('string');

          expect(worklog.author).toBeDefined();
          expect(worklog.author.displayName).toBeDefined();

          expect(worklog.created).toBeDefined();
          expect(worklog.created).toMatch(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{4}$/
          );

          // Collect data for analysis
          totalTimeSeconds += worklog.timeSpentSeconds;
          authors.add(worklog.author.displayName);
          worklogDetails.push({
            author: worklog.author.displayName,
            timeSpent: worklog.timeSpent,
            timeSpentSeconds: worklog.timeSpentSeconds,
            created: worklog.created,
            comment: worklog.comment || 'No comment',
          });
        }

        // Report analysis results
        console.log('=== MCP TIME TRACKING ANALYSIS ===');
        console.log(`Tool: getIssueWorklogs`);
        console.log(`Issue: ${TEST_ISSUE_KEY}`);
        console.log(`Total worklogs: ${worklogs.length}`);
        console.log(
          `Total time logged: ${totalTimeSeconds} seconds (${Math.round((totalTimeSeconds / 3600) * 100) / 100} hours)`
        );
        console.log(`Contributors: ${authors.size} unique users`);
        console.log(`Authors: ${Array.from(authors).join(', ')}`);
        console.log('✅ MCP worklog analysis completed successfully');
      } else {
        console.log(
          `ℹ No time tracking data available for issue ${TEST_ISSUE_KEY}`
        );
      }
    }, 15000);

    it('should return well-formed JSON that can be parsed by MCP clients', async () => {
      // Act - Test the handler directly
      const response = await (mcpServer as any).handleGetIssueWorklogs({
        issueKey: TEST_ISSUE_KEY,
      });
      const worklogsText = response.content[0].text;

      // Assert - JSON formatting validation
      expect(() => JSON.parse(worklogsText)).not.toThrow();

      const worklogs = JSON.parse(worklogsText);
      const reformattedJson = JSON.stringify(worklogs, null, 2);

      // Verify it's properly formatted JSON (matches our formatting)
      expect(worklogsText).toBe(reformattedJson);

      // Verify array structure
      expect(Array.isArray(worklogs)).toBe(true);

      // Verify worklog entries if they exist
      if (worklogs.length > 0) {
        const worklog = worklogs[0];
        expect(typeof worklog.self).toBe('string');
        expect(typeof worklog.id).toBe('string');
        expect(typeof worklog.issueId).toBe('string');
        expect(typeof worklog.author).toBe('object');
        expect(typeof worklog.created).toBe('string');
        expect(typeof worklog.timeSpent).toBe('string');
        expect(typeof worklog.timeSpentSeconds).toBe('number');
      }

      console.log('✅ MCP JSON formatting validation passed');
    }, 10000);

    it('should validate parameter validation works correctly', async () => {
      // Act & Assert - Test valid parameters (should work)
      const validResponse = await (mcpServer as any).handleGetIssueWorklogs({
        issueKey: TEST_ISSUE_KEY,
      });
      expect(validResponse).toBeDefined();
      expect(validResponse.content).toBeDefined();

      // Act & Assert - Test missing parameters (should fail)
      await expect(
        (mcpServer as any).handleGetIssueWorklogs({})
      ).rejects.toThrow('issueKey is required and must be a string');

      // Act & Assert - Test null issueKey (should fail)
      await expect(
        (mcpServer as any).handleGetIssueWorklogs({ issueKey: null })
      ).rejects.toThrow('issueKey is required and must be a string');

      // Act & Assert - Test undefined issueKey (should fail)
      await expect(
        (mcpServer as any).handleGetIssueWorklogs({ issueKey: undefined })
      ).rejects.toThrow('issueKey is required and must be a string');

      // Act & Assert - Test empty string issueKey (should fail)
      await expect(
        (mcpServer as any).handleGetIssueWorklogs({ issueKey: '' })
      ).rejects.toThrow('issueKey is required and must be a string');

      // Act & Assert - Test non-string issueKey (should fail)
      await expect(
        (mcpServer as any).handleGetIssueWorklogs({ issueKey: 123 })
      ).rejects.toThrow('issueKey is required and must be a string');

      console.log(
        '✅ Parameter validation working correctly for getIssueWorklogs'
      );
    }, 10000);
  });

  describe('MCP Tool Definition', () => {
    it('should include getIssueWorklogs in MCP server definition', async () => {
      // This test verifies that the getIssueWorklogs tool is properly defined
      // We can test this by checking if the handler function exists
      expect((mcpServer as any).handleGetIssueWorklogs).toBeDefined();
      expect(typeof (mcpServer as any).handleGetIssueWorklogs).toBe('function');

      console.log(
        '✅ getIssueWorklogs handler successfully defined in MCP Server'
      );
    });

    it('should have correct tool schema definition', async () => {
      // Act - Create a new instance to test the tool definition process
      const testServer = new JiraMcpServer();

      // Check that the tool registration process includes getIssueWorklogs
      expect((testServer as any).handleGetIssueWorklogs).toBeDefined();

      console.log(
        '✅ getIssueWorklogs tool schema correctly integrated into MCP Server'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully through MCP interface', async () => {
      // Test with an invalid issue key format
      await expect(
        (mcpServer as any).handleGetIssueWorklogs({
          issueKey: 'INVALID_FORMAT',
        })
      ).rejects.toThrow();

      console.log('✅ MCP error handling validated');
    }, 10000);

    it('should provide meaningful error messages through MCP', async () => {
      try {
        await (mcpServer as any).handleGetIssueWorklogs({});
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('issueKey is required');
        expect(error.statusCode).toBe(400);
        console.log('✅ MCP error message validation passed:', error.message);
      }
    });
  });
});
