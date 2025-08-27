import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { JiraMcpServer } from '@/server/jira-mcp-server.js';
import { JiraClientWrapper } from '@/client/jira-client-wrapper.js';
import { testUtils } from '../setup.js';
import { logger } from '@/utils/logger.js';
import { E2ETestHelper } from '../helpers/e2e-test-helper.js';
import type { ValidatedHybridConfig } from '@/types/config-types.js';

/**
 * End-to-End Complete Workflow Tests
 * 
 * This test suite validates the complete MCP server lifecycle and hybrid architecture
 * in realistic scenarios that simulate real-world AI assistant usage patterns.
 * 
 * Test Coverage:
 * 1. Complete MCP server lifecycle (startup, operation, shutdown)
 * 2. Hybrid field architecture end-to-end workflow
 * 3. Resource discovery and reading across all entity types
 * 4. Tool validation with intelligent suggestions
 * 5. Performance and stability under realistic load
 * 6. Error recovery and graceful degradation
 */
describe('E2E: Complete Workflow Tests', () => {
  let testHelper: E2ETestHelper;
  let jiraClient: JiraClientWrapper;
  let testConfig: { url: string; bearer: string };

  // Test timeout for E2E operations
  const E2E_TIMEOUT = 30000;

  beforeAll(async () => {
    // Skip if integration environment not available
    try {
      testUtils.skipIfNoIntegration();
      testConfig = testUtils.getTestConfig();
    } catch (error) {
      console.warn('Skipping E2E tests: Integration environment not configured');
      return;
    }

    // Initialize test helper and Jira client for validation
    testHelper = new E2ETestHelper();
    jiraClient = new JiraClientWrapper({
      url: testConfig.url,
      bearer: testConfig.bearer,
    });

    logger.log('E2E Tests: Starting complete workflow validation');
  }, E2E_TIMEOUT);

  afterAll(async () => {
    if (testHelper) {
      try {
        await testHelper.cleanup();
        logger.log('E2E Tests: Test helper cleanup completed');
      } catch (error) {
        logger.error('E2E Tests: Error during cleanup', { error });
      }
    }
  });

  describe('Complete MCP Server Lifecycle', () => {
    test('should perform complete lifecycle with performance metrics', async () => {
      if (!testUtils.canRunIntegrationTests()) {
        console.warn('Skipping E2E test: Integration environment not configured');
        return;
      }

      const lifecycleResults = await testHelper.testServerLifecycle();

      // Validate lifecycle performance
      expect(lifecycleResults.startupTime).toBeLessThan(5000); // < 5 seconds startup
      expect(lifecycleResults.shutdownTime).toBeLessThan(1000); // < 1 second shutdown
      expect(lifecycleResults.resourceCount).toBeGreaterThanOrEqual(4); // At least 4 resource types
      expect(lifecycleResults.toolCount).toBeGreaterThanOrEqual(19); // At least 19 tools
      expect(lifecycleResults.isReady).toBe(true); // Server should be ready

      logger.log('E2E Lifecycle Results:', {
        startupTime: `${lifecycleResults.startupTime}ms`,
        shutdownTime: `${lifecycleResults.shutdownTime}ms`,
        resourceCount: lifecycleResults.resourceCount,
        toolCount: lifecycleResults.toolCount
      });
    }, E2E_TIMEOUT);

    test('should handle server operations correctly', async () => {
      if (!testUtils.canRunIntegrationTests()) {
        console.warn('Skipping E2E test: Integration environment not configured');
        return;
      }

      const server = await testHelper.createTestServer();

      // Verify server capabilities
      const serverInfo = server.getServerInfo();
      expect(serverInfo.name).toBe('jira-mcp-server');
      expect(serverInfo.version).toBe('1.0.0');
      expect(serverInfo.capabilities.tools).toBe(true);
      expect(serverInfo.capabilities.resources).toBe(true);

      // Test resource discovery
      const listResourcesResult = await server.handleListResources({});
      expect(listResourcesResult.resources).toBeDefined();
      expect(listResourcesResult.resources.length).toBeGreaterThan(0);

      // Verify expected resource URIs
      const resourceUris = listResourcesResult.resources.map(r => r.uri);
      const expectedResources = [
        'jira://issue/fields',
        'jira://project/fields', 
        'jira://user/fields',
        'jira://agile/fields'
      ];

      expectedResources.forEach(expectedUri => {
        expect(resourceUris).toContain(expectedUri);
      });

      // Test tool discovery
      const listToolsResult = await server.handleListTools({});
      expect(listToolsResult.tools).toBeDefined();
      expect(listToolsResult.tools.length).toBeGreaterThanOrEqual(19);

      // Verify critical tools
      const toolNames = listToolsResult.tools.map(t => t.name);
      const criticalTools = [
        'searchIssues',
        'getIssue', 
        'getAllProjects',
        'getCurrentUser',
        'searchFields'
      ];

      criticalTools.forEach(toolName => {
        expect(toolNames).toContain(toolName);
      });

      // Test resource reading
      for (const resourceUri of expectedResources) {
        const readResult = await server.handleReadResource({ uri: resourceUri });
        
        expect(readResult.contents).toBeDefined();
        expect(readResult.contents.length).toBeGreaterThan(0);
        
        const content = readResult.contents[0];
        expect(content.uri).toBe(resourceUri);
        expect(content.mimeType).toBe('application/json');
        
        const resourceData = JSON.parse(content.text);
        expect(resourceData.entity).toBeDefined();
        expect(resourceData.fields).toBeDefined();
        expect(Array.isArray(resourceData.fields)).toBe(true);
        expect(resourceData.fields.length).toBeGreaterThan(0);
      }

      // Test tool execution
      const searchFieldsResult = await server.handleCallTool({
        name: 'searchFields',
        arguments: { query: 'summary' }
      });

      const searchFieldsData = JSON.parse(searchFieldsResult.content[0].text);
      expect(searchFieldsData.success).toBe(true);
      expect(Array.isArray(searchFieldsData.fields)).toBe(true);

      const getUserResult = await server.handleCallTool({
        name: 'getCurrentUser',
        arguments: {}
      });

      const userData = JSON.parse(getUserResult.content[0].text);
      expect(userData.success).toBe(true);
      expect(userData.user).toBeDefined();

      logger.log('E2E server operations completed successfully');
    }, E2E_TIMEOUT);
  });

  describe('Hybrid Architecture End-to-End Workflow', () => {
    test('should demonstrate complete static → dynamic → usage → validation workflow', async () => {
      if (!testUtils.canRunIntegrationTests()) {
        console.warn('Skipping E2E test: Integration environment not configured');
        return;
      }

      const hybridResults = await testHelper.testHybridWorkflow();

      // Validate hybrid architecture metrics
      expect(hybridResults.staticFieldCount).toBeGreaterThanOrEqual(42); // Minimum static fields
      expect(hybridResults.totalFieldCount).toBeGreaterThanOrEqual(hybridResults.staticFieldCount);
      expect(hybridResults.cacheHitTime).toBeLessThan(hybridResults.cacheMissTime); // Cache should be faster
      expect(hybridResults.cacheHitTime).toBeLessThan(100); // Cache hits should be very fast
      expect(hybridResults.validationResult.success).toBe(true);

      logger.log('E2E Hybrid Architecture Results:', {
        staticFields: hybridResults.staticFieldCount,
        dynamicFields: hybridResults.dynamicFieldCount,
        totalFields: hybridResults.totalFieldCount,
        cacheHitTime: `${hybridResults.cacheHitTime}ms`,
        cacheMissTime: `${hybridResults.cacheMissTime}ms`,
        validationSuccess: hybridResults.validationResult.success
      });

      // Verify field structure quality
      if (hybridResults.dynamicFieldCount > 0) {
        expect(hybridResults.totalFieldCount).toBeGreaterThan(hybridResults.staticFieldCount);
        logger.log(`Dynamic field discovery working: ${hybridResults.dynamicFieldCount} custom fields found`);
      } else {
        logger.log('No dynamic fields discovered (static mode or no custom fields)');
      }
    }, E2E_TIMEOUT);

    test('should handle field usage analysis and validation correctly', async () => {
      if (!testUtils.canRunIntegrationTests()) {
        console.warn('Skipping E2E test: Integration environment not configured');
        return;
      }

      const server = await testHelper.createTestServer({ enableDynamic: true });

      // Test field usage analysis through tool calls
      const testFields = ['summary', 'description', 'status.name', 'assignee.displayName'];
      
      for (const fieldPath of testFields) {
        const searchResult = await server.handleCallTool({
          name: 'searchIssues',
          arguments: {
            jql: 'summary ~ "test"',
            fields: [fieldPath],
            maxResults: 1
          }
        });

        expect(searchResult.content).toBeDefined();
        const resultData = JSON.parse(searchResult.content[0].text);
        expect(resultData.success).toBe(true);
        
        logger.log(`Field path validated: ${fieldPath}`);
      }

      // Test enhanced field validation
      const validFields = ['summary', 'status.name', 'assignee.emailAddress'];
      const validationResult = await server.handleCallTool({
        name: 'searchIssues',
        arguments: {
          jql: 'project is not empty',
          fields: validFields,
          maxResults: 1
        }
      });

      const validationData = JSON.parse(validationResult.content[0].text);
      expect(validationData.success).toBe(true);

      // Test invalid field handling with suggestions
      try {
        await server.handleCallTool({
          name: 'searchIssues',
          arguments: {
            jql: 'project is not empty',
            fields: ['invalid_field_path', 'assignee.invalidProperty'],
            maxResults: 1
          }
        });
      } catch (error: any) {
        // Should provide intelligent error handling
        expect(error.message).toMatch(/validation|field|invalid/i);
        logger.log('Invalid field validation handled correctly');
      }

      logger.log('Field usage analysis and validation completed successfully');
    }, E2E_TIMEOUT);
  });

  describe('Real-World AI Assistant Usage Scenarios', () => {
    test('should handle complex multi-step AI assistant workflows', async () => {
      if (!testUtils.canRunIntegrationTests()) {
        console.warn('Skipping E2E test: Integration environment not configured');
        return;
      }

      const aiUsageResults = await testHelper.simulateAIAssistantUsage();

      // Validate AI assistant workflow success
      expect(aiUsageResults.projectDiscoverySuccess).toBe(true);
      expect(aiUsageResults.fieldLookupSuccess).toBe(true);
      expect(aiUsageResults.resourceBasedDiscoverySuccess).toBe(true);
      expect(aiUsageResults.overallSuccess).toBe(true);

      logger.log('E2E AI Assistant Usage Results:', {
        projectDiscovery: aiUsageResults.projectDiscoverySuccess,
        issueAnalysis: aiUsageResults.issueAnalysisSuccess,
        fieldLookup: aiUsageResults.fieldLookupSuccess,
        resourceDiscovery: aiUsageResults.resourceBasedDiscoverySuccess,
        overallSuccess: aiUsageResults.overallSuccess
      });

      // Issue analysis might fail if no issues exist in projects
      if (!aiUsageResults.issueAnalysisSuccess) {
        logger.warn('Issue analysis failed - likely no issues available in test projects');
      }
    }, E2E_TIMEOUT);

    test('should provide AI-friendly field information and metadata', async () => {
      if (!testUtils.canRunIntegrationTests()) {
        console.warn('Skipping E2E test: Integration environment not configured');
        return;
      }

      const server = await testHelper.createTestServer({ enableDynamic: true });

      // Test field definition lookup for AI understanding
      const fieldSearchResult = await server.handleCallTool({
        name: 'searchFields',
        arguments: { query: 'status' }
      });

      const fieldData = JSON.parse(fieldSearchResult.content[0].text);
      expect(fieldData.success).toBe(true);
      expect(Array.isArray(fieldData.fields)).toBe(true);

      // Verify AI-friendly field information
      const statusFields = fieldData.fields.filter((f: any) => 
        f.name.toLowerCase().includes('status') || f.id.includes('status')
      );
      expect(statusFields.length).toBeGreaterThan(0);

      // Test resource-based field discovery
      const resourceResult = await server.handleReadResource({
        uri: 'jira://issue/fields'
      });

      const resourceData = JSON.parse(resourceResult.contents[0].text);
      expect(resourceData.fields).toBeDefined();
      expect(resourceData.fields.length).toBeGreaterThan(40);

      // Verify field metadata structure for AI interpretation
      const sampleField = resourceData.fields.find((f: any) => f.id === 'summary');
      expect(sampleField).toBeDefined();
      expect(sampleField.description).toBeDefined();
      expect(sampleField.type).toBeDefined();
      expect(sampleField.paths).toBeDefined();
      expect(Array.isArray(sampleField.paths)).toBe(true);

      // Verify nested field paths are available
      const assigneeField = resourceData.fields.find((f: any) => f.id === 'assignee');
      if (assigneeField) {
        expect(assigneeField.paths).toContain('assignee.displayName');
        expect(assigneeField.paths).toContain('assignee.emailAddress');
      }

      logger.log('AI-friendly field information validation completed');
    }, E2E_TIMEOUT);
  });

  describe('Performance and Stability Validation', () => {
    test('should maintain performance under realistic load', async () => {
      if (!testUtils.canRunIntegrationTests()) {
        console.warn('Skipping E2E test: Integration environment not configured');
        return;
      }

      const performanceResults = await testHelper.testPerformanceUnderLoad({
        concurrentRequests: 10,
        requestTypes: ['listResources', 'listTools', 'readResource', 'getCurrentUser', 'searchFields'],
        iterations: 20
      });

      // Validate performance metrics
      expect(performanceResults.successRate).toBeGreaterThan(0.8); // At least 80% success
      expect(performanceResults.averageTime).toBeLessThan(1000); // Average < 1 second
      expect(performanceResults.memoryIncrease).toBeLessThan(100); // < 100MB memory increase

      logger.log('E2E Performance Results:', {
        totalTime: `${performanceResults.totalTime}ms`,
        averageTime: `${performanceResults.averageTime.toFixed(2)}ms`,
        successRate: `${(performanceResults.successRate * 100).toFixed(2)}%`,
        memoryIncrease: `${performanceResults.memoryIncrease.toFixed(2)}MB`,
        errorCount: performanceResults.errors.length
      });

      // Log any errors for debugging
      if (performanceResults.errors.length > 0) {
        logger.warn('Performance test errors:', performanceResults.errors.slice(0, 5));
      }
    }, E2E_TIMEOUT * 2);

    test('should handle concurrent operations without degradation', async () => {
      if (!testUtils.canRunIntegrationTests()) {
        console.warn('Skipping E2E test: Integration environment not configured');
        return;
      }

      const server = await testHelper.createTestServer({ enableDynamic: true });

      // Test concurrent operations of different types
      const startTime = Date.now();
      const concurrentPromises = [
        // Resource operations
        ...Array(5).fill(0).map(() => 
          server.handleReadResource({ uri: 'jira://issue/fields' })
        ),
        // Tool operations
        ...Array(5).fill(0).map(() => 
          server.handleCallTool({ name: 'getCurrentUser', arguments: {} })
        ),
        // List operations
        ...Array(5).fill(0).map(() => 
          server.handleListResources({})
        ),
        ...Array(5).fill(0).map(() => 
          server.handleListTools({})
        )
      ];

      const results = await Promise.allSettled(concurrentPromises);
      const duration = Date.now() - startTime;

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      const successRate = successful / results.length;

      expect(successRate).toBeGreaterThan(0.8); // At least 80% success
      expect(duration).toBeLessThan(10000); // Less than 10 seconds total

      logger.log(`Concurrent operations: ${successful}/${results.length} successful in ${duration}ms`);
    }, E2E_TIMEOUT);
  });

  describe('Error Recovery and Graceful Degradation', () => {
    test('should handle comprehensive error scenarios with recovery', async () => {
      if (!testUtils.canRunIntegrationTests()) {
        console.warn('Skipping E2E test: Integration environment not configured');
        return;
      }

      const errorRecoveryResults = await testHelper.testErrorRecovery();

      // Validate error handling capabilities
      expect(errorRecoveryResults.networkErrorHandled).toBe(true);
      expect(errorRecoveryResults.authErrorHandled).toBe(true);
      expect(errorRecoveryResults.invalidDataHandled).toBe(true);
      expect(errorRecoveryResults.recoverySuccessful).toBe(true);

      logger.log('E2E Error Recovery Results:', {
        networkError: errorRecoveryResults.networkErrorHandled,
        authError: errorRecoveryResults.authErrorHandled,
        invalidData: errorRecoveryResults.invalidDataHandled,
        recovery: errorRecoveryResults.recoverySuccessful
      });
    }, E2E_TIMEOUT);

    test('should provide meaningful error messages and suggestions', async () => {
      if (!testUtils.canRunIntegrationTests()) {
        console.warn('Skipping E2E test: Integration environment not configured');
        return;
      }

      const server = await testHelper.createTestServer();

      // Test invalid tool calls
      try {
        await server.handleCallTool({
          name: 'nonExistentTool',
          arguments: {}
        });
        fail('Should have thrown error for non-existent tool');
      } catch (error: any) {
        expect(error.code).toBe(ErrorCode.MethodNotFound);
        expect(error.message).toContain('nonExistentTool');
      }

      // Test invalid resource URIs
      try {
        await server.handleReadResource({
          uri: 'invalid://resource/uri'
        });
        fail('Should have thrown error for invalid resource URI');
      } catch (error: any) {
        expect(error.code).toBe(ErrorCode.InvalidRequest);
        expect(error.message).toMatch(/uri|resource|invalid/i);
      }

      // Test malformed tool arguments with helpful messages
      try {
        await server.handleCallTool({
          name: 'searchIssues',
          arguments: {
            jql: 'invalid syntax ^^^',
            maxResults: -1
          }
        });
      } catch (error: any) {
        expect(error.message).toMatch(/jql|syntax|invalid/i);
        expect(error.message.length).toBeGreaterThan(10); // Should be descriptive
      }

      logger.log('Error message quality validation completed');
    }, E2E_TIMEOUT);

    test('should maintain resilience under error conditions', async () => {
      if (!testUtils.canRunIntegrationTests()) {
        console.warn('Skipping E2E test: Integration environment not configured');
        return;
      }

      const server = await testHelper.createTestServer();

      // Generate a series of errors followed by valid operations
      const operations = [];
      
      // Add error-prone operations
      for (let i = 0; i < 5; i++) {
        operations.push(
          server.handleCallTool({
            name: 'searchIssues',
            arguments: { jql: `invalid syntax ${i} ^^^` }
          }).catch(() => 'error')
        );
      }

      // Add valid operations
      for (let i = 0; i < 5; i++) {
        operations.push(
          server.handleCallTool({
            name: 'getCurrentUser',
            arguments: {}
          })
        );
      }

      const results = await Promise.allSettled(operations);
      
      // Should have some errors and some successes
      const errors = results.filter(r => r.status === 'rejected' || 
        (r.status === 'fulfilled' && r.value === 'error')).length;
      const successes = results.filter(r => r.status === 'fulfilled' && 
        r.value !== 'error').length;

      expect(errors).toBeGreaterThan(0); // Should have detected errors
      expect(successes).toBeGreaterThan(0); // Should have had successes despite errors
      
      // Server should remain functional after errors
      const finalTest = await server.handleListResources({});
      expect(finalTest.resources).toBeDefined();
      expect(finalTest.resources.length).toBeGreaterThan(0);

      logger.log(`Resilience test: ${errors} errors, ${successes} successes, server remained functional`);
    }, E2E_TIMEOUT);
  });
});