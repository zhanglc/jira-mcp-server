/**
 * E2E test for searchIssues field validation
 * 
 * This test verifies the end-to-end behavior of searchIssues with various field combinations,
 * ensuring that field validation works correctly and responses include all requested fields.
 */

import { JiraMcpServer } from '../../src/server/jira-mcp-server.js';

describe('SearchIssues E2E - Field Validation', () => {
  let server: JiraMcpServer;

  beforeEach(() => {
    server = new JiraMcpServer();
  });

  afterEach(async () => {
    if (server && typeof server.close === 'function') {
      await server.close();
    }
  });

  describe('Basic Field Validation', () => {
    it('should accept key, summary, and status fields without warnings', async () => {
      // Test the exact scenario reported by the user
      const result = await server.handleCallTool({
        name: 'searchIssues',
        arguments: {
          jql: "project = DSCWA AND assignee = currentUser() ORDER BY updated DESC",
          fields: ["key", "summary", "status"],
          maxResults: 1
        }
      });

      const resultText = result.content[0].text;
      const parsedResult = JSON.parse(resultText);

      // Should not have any field validation warnings
      expect(parsedResult.warning).toBeUndefined();
      
      // Should have the direct Jira API response structure
      expect(parsedResult).toHaveProperty('expand');
      expect(parsedResult).toHaveProperty('startAt');
      expect(parsedResult).toHaveProperty('maxResults');
      expect(parsedResult).toHaveProperty('total');
      expect(parsedResult).toHaveProperty('issues');
      
      // If issues are returned, verify they have the requested fields
      if (parsedResult.issues && parsedResult.issues.length > 0) {
        const firstIssue = parsedResult.issues[0];
        
        // Key should be at the top level
        expect(firstIssue).toHaveProperty('key');
        expect(typeof firstIssue.key).toBe('string');
        
        // Summary and status should be in fields object
        expect(firstIssue).toHaveProperty('fields');
        expect(firstIssue.fields).toHaveProperty('summary');
        expect(firstIssue.fields).toHaveProperty('status');
        
        console.log(`✅ Verified issue ${firstIssue.key} has all requested fields`);
      }
    });

    it('should work with minimal field selection', async () => {
      const result = await server.handleCallTool({
        name: 'searchIssues',
        arguments: {
          jql: "project = DSCWA ORDER BY updated DESC",
          fields: ["key"],
          maxResults: 1
        }
      });

      const resultText = result.content[0].text;
      const parsedResult = JSON.parse(resultText);

      // Should not have warnings for basic key field
      expect(parsedResult.warning).toBeUndefined();
      
      if (parsedResult.issues && parsedResult.issues.length > 0) {
        const firstIssue = parsedResult.issues[0];
        expect(firstIssue).toHaveProperty('key');
        console.log(`✅ Key-only search returned: ${firstIssue.key}`);
      }
    });

    it('should work with nested field paths', async () => {
      const result = await server.handleCallTool({
        name: 'searchIssues',
        arguments: {
          jql: "project = DSCWA ORDER BY updated DESC",
          fields: ["key", "status.name", "assignee.displayName"],
          maxResults: 1
        }
      });

      const resultText = result.content[0].text;
      const parsedResult = JSON.parse(resultText);

      // Should not have warnings for valid nested paths
      expect(parsedResult.warning).toBeUndefined();
      
      if (parsedResult.issues && parsedResult.issues.length > 0) {
        const firstIssue = parsedResult.issues[0];
        expect(firstIssue).toHaveProperty('key');
        console.log(`✅ Nested field search returned: ${firstIssue.key}`);
      }
    });
  });

  describe('Custom Field Handling', () => {
    it('should work with custom fields', async () => {
      const result = await server.handleCallTool({
        name: 'searchIssues',
        arguments: {
          jql: "project = DSCWA ORDER BY updated DESC",
          fields: ["key", "summary", "customfield_10001"],
          maxResults: 1
        }
      });

      const resultText = result.content[0].text;
      const parsedResult = JSON.parse(resultText);

      // Should not have warnings for custom fields
      expect(parsedResult.warning).toBeUndefined();
      
      if (parsedResult.issues && parsedResult.issues.length > 0) {
        const firstIssue = parsedResult.issues[0];
        expect(firstIssue).toHaveProperty('key');
        console.log(`✅ Custom field search returned: ${firstIssue.key}`);
      }
    });

    it('should handle custom field permission/existence errors gracefully - user reported case', async () => {
      // Test the exact scenario the user encountered
      await expect(
        server.handleCallTool({
          name: 'searchIssues',
          arguments: {
            jql: "project = DSCWA AND assignee = currentUser() AND customfield_10106 IS NOT EMPTY",
            fields: [
              "key",
              "summary",
              "customfield_10106"
            ],
            maxResults: 50
          }
        })
      ).rejects.toThrow(/Field 'customfield_10106' does not exist or you do not have permission to view it/);

      // Test with a more specific error check
      try {
        await server.handleCallTool({
          name: 'searchIssues',
          arguments: {
            jql: "project = DSCWA AND assignee = currentUser() AND customfield_10106 IS NOT EMPTY",
            fields: ["key", "summary", "customfield_10106"],
            maxResults: 50
          }
        });
        fail('Expected ApiError to be thrown');
      } catch (error: any) {
        // Verify the error is properly caught and formatted
        expect(error.message).toContain('Jira API Error');
        expect(error.message).toContain('customfield_10106');
        expect(error.message).toContain('does not exist or you do not have permission');
        
        // Check that the error follows the ApiError pattern
        expect(error.name).toBe('ApiError');
        
        console.log('✅ Custom field permission error handled correctly:', error.message);
      }
    });

    it('should handle JQL with custom fields even when fields parameter has invalid custom fields', async () => {
      // Test scenario where JQL uses custom field but fields parameter has different/invalid custom field
      // This tests separation of concerns between JQL execution and field filtering
      await expect(
        server.handleCallTool({
          name: 'searchIssues',
          arguments: {
            jql: "project = DSCWA AND customfield_10001 IS NOT EMPTY ORDER BY updated DESC",
            fields: ["key", "summary", "customfield_99999"], // Invalid custom field in fields
            maxResults: 1
          }
        })
      ).rejects.toThrow(/Field 'customfield_99999' does not exist or you do not have permission to view it/);

      console.log('✅ JQL vs fields parameter custom field handling verified');
    });

    it('should handle mixed valid/invalid custom fields in fields parameter', async () => {
      // Test with mix of valid and invalid custom fields
      await expect(
        server.handleCallTool({
          name: 'searchIssues',
          arguments: {
            jql: "project = DSCWA ORDER BY updated DESC",
            fields: [
              "key", 
              "summary", 
              "customfield_10001", // Potentially valid
              "customfield_88888", // Invalid
              "status"
            ],
            maxResults: 1
          }
        })
      ).rejects.toThrow(/Field 'customfield_88888' does not exist or you do not have permission to view it/);

      console.log('✅ Mixed valid/invalid custom fields error handling verified');
    });

    it('should work when custom field is in JQL but not in fields parameter', async () => {
      // This should work - JQL can reference fields that aren't returned
      const result = await server.handleCallTool({
        name: 'searchIssues',
        arguments: {
          jql: "project = DSCWA AND customfield_10001 IS NOT EMPTY ORDER BY updated DESC",
          fields: ["key", "summary", "status"], // No custom field in response
          maxResults: 1
        }
      });

      const resultText = result.content[0].text;
      const parsedResult = JSON.parse(resultText);

      // Should work fine - JQL filters but doesn't need field in response
      expect(parsedResult.warning).toBeUndefined();
      
      if (parsedResult.issues && parsedResult.issues.length > 0) {
        const firstIssue = parsedResult.issues[0];
        expect(firstIssue).toHaveProperty('key');
        expect(firstIssue.fields).toHaveProperty('summary');
        expect(firstIssue.fields).toHaveProperty('status');
        // Should NOT have customfield_10001 in response
        expect(firstIssue.fields).not.toHaveProperty('customfield_10001');
        
        console.log(`✅ JQL with custom field filter works without custom field in response: ${firstIssue.key}`);
      }
    });

    it('should fail when custom field is in fields parameter but not accessible', async () => {
      // Test edge case where JQL is simple but fields parameter fails
      await expect(
        server.handleCallTool({
          name: 'searchIssues',
          arguments: {
            jql: "project = DSCWA ORDER BY updated DESC", // Simple JQL
            fields: ["key", "summary", "customfield_77777"], // Invalid custom field
            maxResults: 1
          }
        })
      ).rejects.toThrow(/Field 'customfield_77777' does not exist or you do not have permission to view it/);

      console.log('✅ Invalid custom field in fields parameter properly rejected');
    });

    it('should provide detailed error information for custom field access issues', async () => {
      // Verify comprehensive error details are provided
      try {
        await server.handleCallTool({
          name: 'searchIssues',
          arguments: {
            jql: "project = DSCWA ORDER BY updated DESC",
            fields: ["key", "customfield_11111"], // Non-existent custom field
            maxResults: 1
          }
        });
        fail('Expected error to be thrown for non-existent custom field');
      } catch (error: any) {
        // Verify error message structure and content
        expect(error.message).toContain('Jira API Error');
        expect(error.message).toContain('customfield_11111');
        expect(error.message).toContain('does not exist or you do not have permission');
        
        // Verify error includes the specific custom field name
        expect(error.message).toMatch(/customfield_\d+/);
        
        // Ensure error follows the expected ApiError structure
        expect(error.name).toBe('ApiError');
        
        // Check for errorMessages array structure in the error
        expect(error.message).toContain('errorMessages');
        
        console.log('✅ Detailed custom field error information verified');
      }
    });
  });

  describe('Field Validation with Invalid Fields', () => {
    it('should provide suggestions for invalid fields', async () => {
      const result = await server.handleCallTool({
        name: 'searchIssues',
        arguments: {
          jql: "project = DSCWA ORDER BY updated DESC",
          fields: ["key", "summry", "staus"], // Intentional typos
          maxResults: 1
        }
      });

      const resultText = result.content[0].text;
      const parsedResult = JSON.parse(resultText);

      // Should have warnings for invalid fields
      expect(parsedResult.warning).toBeDefined();
      expect(parsedResult.warning).toContain('Some fields were invalid');
      
      // Should include suggestions
      expect(parsedResult.warning).toContain('Suggestions for');
      
      // Should still return data with valid fields
      expect(parsedResult.data).toBeDefined();
      expect(parsedResult.data.issues).toBeDefined();
      
      console.log('✅ Invalid fields handled with suggestions:', parsedResult.warning);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JQL gracefully', async () => {
      await expect(
        server.handleCallTool({
          name: 'searchIssues',
          arguments: {
            jql: "invalid jql syntax here",
            fields: ["key", "summary"],
            maxResults: 1
          }
        })
      ).rejects.toThrow();
    });

    it('should handle empty fields array', async () => {
      const result = await server.handleCallTool({
        name: 'searchIssues',
        arguments: {
          jql: "project = DSCWA ORDER BY updated DESC",
          fields: [],
          maxResults: 1
        }
      });

      const resultText = result.content[0].text;
      const parsedResult = JSON.parse(resultText);

      // Should work fine with empty fields (returns all fields)
      expect(parsedResult.warning).toBeUndefined();
      
      if (parsedResult.issues && parsedResult.issues.length > 0) {
        const firstIssue = parsedResult.issues[0];
        expect(firstIssue).toHaveProperty('key');
        expect(firstIssue).toHaveProperty('fields');
        console.log(`✅ Empty fields array returned issue: ${firstIssue.key}`);
      }
    });
  });

  describe('Performance and Limits', () => {
    it('should respect maxResults parameter', async () => {
      const result = await server.handleCallTool({
        name: 'searchIssues',
        arguments: {
          jql: "project = DSCWA ORDER BY updated DESC",
          fields: ["key"],
          maxResults: 3
        }
      });

      const resultText = result.content[0].text;
      const parsedResult = JSON.parse(resultText);

      expect(parsedResult.maxResults).toBe(3);
      
      if (parsedResult.issues) {
        expect(parsedResult.issues.length).toBeLessThanOrEqual(3);
        console.log(`✅ Returned ${parsedResult.issues.length} issues (max 3 requested)`);
      }
    });
  });
});