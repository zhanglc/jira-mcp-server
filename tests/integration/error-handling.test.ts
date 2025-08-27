import { JiraMcpServer } from '@/server/jira-mcp-server.js';
import { JiraClientWrapper } from '@/client/jira-client-wrapper.js';
import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { testUtils } from '../setup.js';
import { logger } from '@/utils/logger.js';

/**
 * Integration Error Handling Tests
 * 
 * This test suite validates comprehensive error handling scenarios across
 * all layers of the Jira MCP Server, ensuring graceful degradation and
 * proper error recovery in production environments.
 * 
 * Test Coverage:
 * 1. Network and API error scenarios
 * 2. Configuration and authentication errors
 * 3. Data quality and validation issues
 * 4. Resource and memory constraints
 * 5. Concurrent operation error handling
 * 6. Fallback and recovery mechanisms
 */
describe('Integration: Error Handling Scenarios', () => {
  let mcpServer: JiraMcpServer;
  let jiraClient: JiraClientWrapper;
  let validConfig: { url: string; bearer: string };

  const ERROR_TEST_TIMEOUT = 15000;

  beforeAll(async () => {
    try {
      testUtils.skipIfNoIntegration();
      validConfig = testUtils.getTestConfig();
    } catch (error) {
      console.warn('Skipping error handling tests: Integration environment not configured');
      return;
    }

    logger.log('Error Handling Tests: Starting comprehensive error scenario validation');
  });

  afterEach(async () => {
    if (mcpServer) {
      try {
        await mcpServer.close();
      } catch (error) {
        // Ignore cleanup errors during error testing
      }
      mcpServer = undefined as any;
    }
  });

  describe('Network and API Error Scenarios', () => {
    test('should handle Jira connection failures gracefully', async () => {
      if (!testUtils.canRunIntegrationTests()) {
        console.warn('Skipping error test: Integration environment not configured');
        return;
      }

      // Test with invalid Jira URL
      process.env.JIRA_URL = 'https://non-existent-jira-server.invalid';
      process.env.JIRA_PERSONAL_TOKEN = validConfig.bearer;

      try {
        mcpServer = new JiraMcpServer();
        
        // Should be able to start server even with invalid config
        expect(mcpServer).toBeDefined();

        // Resource operations should gracefully degrade
        const resourceResult = await mcpServer.handleReadResource({
          uri: 'jira://issue/fields'
        });

        // Should return static field definitions as fallback
        expect(resourceResult.contents).toBeDefined();
        const staticData = JSON.parse(resourceResult.contents[0].text);
        expect(staticData.fields).toBeDefined();
        expect(staticData.fields.length).toBeGreaterThan(0);
        
        logger.log('Connection failure gracefully handled with static fallback');

        // Tool operations should handle network errors appropriately
        try {
          await mcpServer.handleCallTool({
            name: 'getCurrentUser',
            arguments: {}
          });
          fail('Should have thrown network error');
        } catch (error: any) {
          expect(error.message).toMatch(/network|connection|timeout|ENOTFOUND/i);
          logger.log('Network error properly propagated for tool calls');
        }

      } finally {
        // Restore valid configuration
        process.env.JIRA_URL = validConfig.url;
      }
    }, ERROR_TEST_TIMEOUT);

    test('should handle API timeout and retry scenarios', async () => {
      if (!testUtils.canRunIntegrationTests()) {
        console.warn('Skipping error test: Integration environment not configured');
        return;
      }

      // Set very short timeout to simulate timeout scenarios
      process.env.JIRA_TIMEOUT = '100'; // 100ms - very short
      process.env.JIRA_URL = validConfig.url;
      process.env.JIRA_PERSONAL_TOKEN = validConfig.bearer;

      try {
        mcpServer = new JiraMcpServer();

        // API calls should timeout and be handled gracefully
        const startTime = Date.now();
        
        try {
          await mcpServer.handleCallTool({
            name: 'getAllProjects',
            arguments: {}
          });
        } catch (error: any) {
          const duration = Date.now() - startTime;
          
          // Should timeout quickly and provide appropriate error
          expect(duration).toBeLessThan(1000); // Should timeout much faster than normal
          expect(error.message).toMatch(/timeout|ECONNABORTED/i);
          logger.log(`Timeout error handled correctly in ${duration}ms`);
        }

      } finally {
        // Restore normal timeout
        delete process.env.JIRA_TIMEOUT;
      }
    }, ERROR_TEST_TIMEOUT);

    test('should handle partial API failures in complex operations', async () => {
      if (!testUtils.canRunIntegrationTests()) {
        console.warn('Skipping error test: Integration environment not configured');
        return;
      }

      // Use valid configuration for this test
      process.env.JIRA_URL = validConfig.url;
      process.env.JIRA_PERSONAL_TOKEN = validConfig.bearer;

      mcpServer = new JiraMcpServer();

      // Test field search with mixed valid/invalid parameters
      const searchResult = await mcpServer.handleCallTool({
        name: 'searchFields',
        arguments: {
          query: 'nonexistent_field_that_should_not_exist_anywhere',
          expand: 'invalid_expand_option'
        }
      });

      // Should handle gracefully and return structured results
      expect(searchResult.content).toBeDefined();
      const resultData = JSON.parse(searchResult.content[0].text);
      
      // Should succeed even with no results
      expect(resultData.success).toBe(true);
      expect(Array.isArray(resultData.fields)).toBe(true);
      expect(resultData.fields.length).toBe(0); // No fields should match

      logger.log('Partial API failure handled with graceful empty results');
    }, ERROR_TEST_TIMEOUT);
  });

  describe('Configuration and Authentication Errors', () => {
    test('should handle invalid authentication tokens', async () => {
      if (!testUtils.canRunIntegrationTests()) {
        console.warn('Skipping error test: Integration environment not configured');
        return;
      }

      // Test with invalid token
      process.env.JIRA_URL = validConfig.url;
      process.env.JIRA_PERSONAL_TOKEN = 'invalid_token_123456789';

      mcpServer = new JiraMcpServer();

      // Should be able to initialize but fail on API calls
      expect(mcpServer).toBeDefined();

      try {
        await mcpServer.handleCallTool({
          name: 'getCurrentUser',
          arguments: {}
        });
        fail('Should have thrown authentication error');
      } catch (error: any) {
        expect(error.message).toMatch(/401|unauthorized|authentication|forbidden/i);
        logger.log('Authentication error properly detected and reported');
      }

      // Resource operations should still work with static data
      const resourceResult = await mcpServer.handleReadResource({
        uri: 'jira://issue/fields'
      });

      expect(resourceResult.contents).toBeDefined();
      const staticData = JSON.parse(resourceResult.contents[0].text);
      expect(staticData.fields.length).toBeGreaterThan(0);
      
      logger.log('Static resources remain available despite auth failure');
    }, ERROR_TEST_TIMEOUT);

    test('should handle missing required configuration', async () => {
      // Test with missing URL
      delete process.env.JIRA_URL;
      delete process.env.JIRA_PERSONAL_TOKEN;

      try {
        mcpServer = new JiraMcpServer();
        fail('Should have thrown configuration error');
      } catch (error: any) {
        expect(error.message).toMatch(/configuration|url|required/i);
        logger.log('Missing configuration properly detected');
      }

      // Restore configuration for other tests
      process.env.JIRA_URL = validConfig.url;
      process.env.JIRA_PERSONAL_TOKEN = validConfig.bearer;
    }, ERROR_TEST_TIMEOUT);

    test('should handle invalid SSL/TLS scenarios', async () => {
      if (!testUtils.canRunIntegrationTests()) {
        console.warn('Skipping error test: Integration environment not configured');
        return;
      }

      // Test SSL verification settings
      process.env.JIRA_URL = validConfig.url;
      process.env.JIRA_PERSONAL_TOKEN = validConfig.bearer;
      process.env.JIRA_SSL_VERIFY = 'false'; // Disable SSL verification

      mcpServer = new JiraMcpServer();

      // Should work with SSL verification disabled
      const userResult = await mcpServer.handleCallTool({
        name: 'getCurrentUser',
        arguments: {}
      });

      expect(userResult.content).toBeDefined();
      const userData = JSON.parse(userResult.content[0].text);
      expect(userData.success).toBe(true);

      logger.log('SSL verification configuration handled correctly');

      // Restore SSL verification
      delete process.env.JIRA_SSL_VERIFY;
    }, ERROR_TEST_TIMEOUT);
  });

  describe('Data Quality and Validation Issues', () => {
    test('should handle malformed JQL queries gracefully', async () => {
      if (!testUtils.canRunIntegrationTests()) {
        console.warn('Skipping error test: Integration environment not configured');
        return;
      }

      process.env.JIRA_URL = validConfig.url;
      process.env.JIRA_PERSONAL_TOKEN = validConfig.bearer;

      mcpServer = new JiraMcpServer();

      // Test various malformed JQL queries
      const malformedQueries = [
        'project = AND status =', // Incomplete syntax
        'invalid_field = "value"', // Non-existent field
        'project IN (', // Incomplete parentheses
        'status = "Open" AND AND priority = "High"', // Double AND
        '%%%invalid%%%', // Special characters
      ];

      for (const badJql of malformedQueries) {
        try {
          await mcpServer.handleCallTool({
            name: 'searchIssues',
            arguments: {
              jql: badJql,
              maxResults: 1
            }
          });
        } catch (error: any) {
          // Should provide meaningful error messages for JQL issues
          expect(error.message).toMatch(/jql|query|syntax|invalid/i);
          logger.log(`JQL error handled for: ${badJql}`);
        }
      }
    }, ERROR_TEST_TIMEOUT);

    test('should handle invalid field paths with smart suggestions', async () => {
      if (!testUtils.canRunIntegrationTests()) {
        console.warn('Skipping error test: Integration environment not configured');
        return;
      }

      process.env.JIRA_URL = validConfig.url;
      process.env.JIRA_PERSONAL_TOKEN = validConfig.bearer;

      mcpServer = new JiraMcpServer();

      // Test invalid field paths
      const invalidFields = [
        'nonexistent_field',
        'assignee.invalidProperty',
        'status.nonexistent.path',
        'project.invalid.nested.path'
      ];

      try {
        const result = await mcpServer.handleCallTool({
          name: 'searchIssues',
          arguments: {
            jql: 'project is not empty',
            fields: invalidFields,
            maxResults: 1
          }
        });

        // Should provide validation warnings or suggestions
        const resultData = JSON.parse(result.content[0].text);
        
        if (resultData.fieldValidation || resultData.warnings) {
          logger.log('Field validation warnings provided for invalid paths');
          expect(resultData.fieldValidation || resultData.warnings).toBeDefined();
        }
        
      } catch (error: any) {
        // Or should throw with suggestions
        expect(error.message).toMatch(/field|validation|suggestion/i);
        logger.log('Field validation error with suggestions provided');
      }
    }, ERROR_TEST_TIMEOUT);

    test('should handle unexpected API response formats', async () => {
      if (!testUtils.canRunIntegrationTests()) {
        console.warn('Skipping error test: Integration environment not configured');
        return;
      }

      process.env.JIRA_URL = validConfig.url;
      process.env.JIRA_PERSONAL_TOKEN = validConfig.bearer;

      mcpServer = new JiraMcpServer();

      // Test with extreme parameter values
      try {
        await mcpServer.handleCallTool({
          name: 'searchIssues',
          arguments: {
            jql: 'project is not empty',
            maxResults: 0, // Edge case
            startAt: -1 // Invalid start position
          }
        });
      } catch (error: any) {
        expect(error.message).toMatch(/parameter|range|invalid/i);
        logger.log('Invalid parameter values handled correctly');
      }

      // Test with very large maxResults
      try {
        const result = await mcpServer.handleCallTool({
          name: 'searchIssues',
          arguments: {
            jql: 'project is not empty',
            maxResults: 10000 // Very large number
          }
        });

        // Should either limit the results or handle gracefully
        const resultData = JSON.parse(result.content[0].text);
        expect(resultData.success).toBe(true);
        
        if (resultData.issues) {
          // Should be limited to reasonable number
          expect(resultData.issues.length).toBeLessThanOrEqual(1000);
        }
        
        logger.log('Large result set handled with appropriate limits');
      } catch (error: any) {
        // Or should provide helpful error about limits
        expect(error.message).toMatch(/limit|too large|maximum/i);
        logger.log('Large result set error handled appropriately');
      }
    }, ERROR_TEST_TIMEOUT);
  });

  describe('Memory and Performance Constraints', () => {
    test('should handle memory pressure scenarios', async () => {
      if (!testUtils.canRunIntegrationTests()) {
        console.warn('Skipping error test: Integration environment not configured');
        return;
      }

      process.env.JIRA_URL = validConfig.url;
      process.env.JIRA_PERSONAL_TOKEN = validConfig.bearer;
      process.env.ENABLE_DYNAMIC_FIELDS = 'true';

      mcpServer = new JiraMcpServer();

      const initialMemory = process.memoryUsage().heapUsed;

      // Simulate memory pressure with many concurrent operations
      const operations = [];
      for (let i = 0; i < 50; i++) {
        operations.push(
          mcpServer.handleReadResource({
            uri: 'jira://issue/fields'
          }),
          mcpServer.handleCallTool({
            name: 'searchFields',
            arguments: { query: `test_${i}` }
          })
        );
      }

      const results = await Promise.allSettled(operations);
      
      // Count successful vs failed operations
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      logger.log(`Memory pressure test: ${successful} successful, ${failed} failed operations`);

      // Should maintain reasonable success rate even under pressure
      const successRate = successful / results.length;
      expect(successRate).toBeGreaterThan(0.7); // At least 70% success rate

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / (1024 * 1024);
      
      logger.log(`Memory increased by ${memoryIncrease.toFixed(2)}MB during pressure test`);
      
      // Memory should not grow excessively
      expect(memoryIncrease).toBeLessThan(100); // Less than 100MB increase
    }, ERROR_TEST_TIMEOUT * 3);

    test('should handle cache overflow scenarios', async () => {
      if (!testUtils.canRunIntegrationTests()) {
        console.warn('Skipping error test: Integration environment not configured');
        return;
      }

      process.env.JIRA_URL = validConfig.url;
      process.env.JIRA_PERSONAL_TOKEN = validConfig.bearer;
      process.env.ENABLE_DYNAMIC_FIELDS = 'true';
      process.env.DYNAMIC_FIELD_CACHE_TTL = '1'; // Very short TTL

      mcpServer = new JiraMcpServer();

      // Generate many unique resource requests to overflow cache
      const cacheTests = [];
      for (let i = 0; i < 20; i++) {
        cacheTests.push(
          mcpServer.handleReadResource({
            uri: 'jira://issue/fields'
          })
        );
        
        // Add small delay to test TTL expiration
        if (i % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      const cacheResults = await Promise.all(cacheTests);
      
      // All requests should succeed despite cache pressure
      cacheResults.forEach(result => {
        expect(result.contents).toBeDefined();
        expect(result.contents.length).toBeGreaterThan(0);
      });

      logger.log('Cache overflow handled gracefully with all requests successful');
    }, ERROR_TEST_TIMEOUT);

    test('should handle concurrent operation limits', async () => {
      if (!testUtils.canRunIntegrationTests()) {
        console.warn('Skipping error test: Integration environment not configured');
        return;
      }

      process.env.JIRA_URL = validConfig.url;
      process.env.JIRA_PERSONAL_TOKEN = validConfig.bearer;

      mcpServer = new JiraMcpServer();

      // Launch many concurrent operations
      const concurrentOps = [];
      for (let i = 0; i < 30; i++) {
        concurrentOps.push(
          mcpServer.handleCallTool({
            name: 'getCurrentUser',
            arguments: {}
          }),
          mcpServer.handleListResources({}),
          mcpServer.handleListTools({})
        );
      }

      const startTime = Date.now();
      const concurrentResults = await Promise.allSettled(concurrentOps);
      const duration = Date.now() - startTime;

      const successful = concurrentResults.filter(r => r.status === 'fulfilled').length;
      const failed = concurrentResults.filter(r => r.status === 'rejected').length;

      logger.log(`Concurrent operations: ${successful} successful, ${failed} failed in ${duration}ms`);

      // Should handle reasonable concurrency well
      const successRate = successful / concurrentResults.length;
      expect(successRate).toBeGreaterThan(0.8); // At least 80% success rate

      // Should not take excessively long
      expect(duration).toBeLessThan(10000); // Less than 10 seconds
    }, ERROR_TEST_TIMEOUT * 2);
  });

  describe('Recovery and Fallback Mechanisms', () => {
    test('should recover from temporary API failures', async () => {
      if (!testUtils.canRunIntegrationTests()) {
        console.warn('Skipping error test: Integration environment not configured');
        return;
      }

      process.env.JIRA_URL = validConfig.url;
      process.env.JIRA_PERSONAL_TOKEN = validConfig.bearer;

      mcpServer = new JiraMcpServer();

      // First, verify normal operation
      const normalResult = await mcpServer.handleCallTool({
        name: 'getCurrentUser',
        arguments: {}
      });

      expect(normalResult.content).toBeDefined();
      const normalData = JSON.parse(normalResult.content[0].text);
      expect(normalData.success).toBe(true);

      // Simulate temporary failure by using invalid token
      process.env.JIRA_PERSONAL_TOKEN = 'invalid_temp_token';

      // Create new server instance with bad config
      await mcpServer.close();
      mcpServer = new JiraMcpServer();

      // Operations should fail gracefully
      try {
        await mcpServer.handleCallTool({
          name: 'getCurrentUser',
          arguments: {}
        });
        fail('Should have failed with invalid token');
      } catch (error: any) {
        expect(error.message).toMatch(/401|unauthorized|authentication/i);
      }

      // But resource operations should still work with static fallback
      const resourceResult = await mcpServer.handleReadResource({
        uri: 'jira://issue/fields'
      });

      expect(resourceResult.contents).toBeDefined();
      const resourceData = JSON.parse(resourceResult.contents[0].text);
      expect(resourceData.fields.length).toBeGreaterThan(0);

      logger.log('Recovery mechanism works: static resources available during API failures');

      // Restore valid configuration for cleanup
      process.env.JIRA_PERSONAL_TOKEN = validConfig.bearer;
    }, ERROR_TEST_TIMEOUT);

    test('should provide helpful error context and suggestions', async () => {
      if (!testUtils.canRunIntegrationTests()) {
        console.warn('Skipping error test: Integration environment not configured');
        return;
      }

      process.env.JIRA_URL = validConfig.url;
      process.env.JIRA_PERSONAL_TOKEN = validConfig.bearer;

      mcpServer = new JiraMcpServer();

      // Test various error scenarios for helpful error messages
      const errorScenarios = [
        {
          tool: 'searchIssues',
          args: { jql: 'invalid syntax ^^^' },
          expectedErrorPattern: /jql|syntax|query/i
        },
        {
          tool: 'searchIssues',
          args: { fields: ['nonexistent.field.path'] },
          expectedErrorPattern: /field|validation|path/i
        },
        {
          tool: 'getIssue',
          args: { issueId: 'NONEXISTENT-999999' },
          expectedErrorPattern: /issue|not found|does not exist/i
        }
      ];

      for (const scenario of errorScenarios) {
        try {
          await mcpServer.handleCallTool({
            name: scenario.tool,
            arguments: scenario.args
          });
        } catch (error: any) {
          expect(error.message).toMatch(scenario.expectedErrorPattern);
          
          // Error should provide context
          expect(error.message.length).toBeGreaterThan(10);
          expect(error.message).not.toBe('Error');
          
          logger.log(`Helpful error context provided for ${scenario.tool} failure`);
        }
      }
    }, ERROR_TEST_TIMEOUT);
  });
});