import { JiraMcpServer } from '@/server/jira-mcp-server.js';
import { JiraClientWrapper } from '@/client/jira-client-wrapper.js';
import { logger } from '@/utils/logger.js';
import { testUtils } from '../setup.js';

/**
 * E2E Test Helper
 * 
 * Provides utilities for comprehensive end-to-end testing of the Jira MCP Server,
 * including lifecycle management, performance monitoring, and error simulation.
 */
export class E2ETestHelper {
  private servers: JiraMcpServer[] = [];
  private cleanupHandlers: (() => Promise<void>)[] = [];

  /**
   * Create a properly configured MCP server for testing
   */
  async createTestServer(config?: {
    enableDynamic?: boolean;
    cacheTtl?: number;
    maxCacheSize?: number;
  }): Promise<JiraMcpServer> {
    if (!testUtils.canRunIntegrationTests()) {
      throw new Error('Integration environment not configured');
    }

    const testConfig = testUtils.getTestConfig();

    // Set up environment for this test server
    const originalEnv = this.backupEnvironment();
    
    process.env.JIRA_URL = testConfig.url;
    process.env.JIRA_PERSONAL_TOKEN = testConfig.bearer;
    
    if (config?.enableDynamic !== undefined) {
      process.env.ENABLE_DYNAMIC_FIELDS = config.enableDynamic.toString();
    }
    
    if (config?.cacheTtl !== undefined) {
      process.env.DYNAMIC_FIELD_CACHE_TTL = config.cacheTtl.toString();
    }

    const server = new JiraMcpServer();
    this.servers.push(server);

    // Register cleanup
    this.cleanupHandlers.push(async () => {
      try {
        await server.close();
      } catch (error) {
        logger.warn('Error closing test server during cleanup', { error });
      }
      this.restoreEnvironment(originalEnv);
    });

    return server;
  }

  /**
   * Create a test server with invalid configuration for error testing
   */
  async createInvalidConfigServer(invalidConfig: {
    invalidUrl?: boolean;
    invalidToken?: boolean;
    missingUrl?: boolean;
    missingToken?: boolean;
  }): Promise<JiraMcpServer> {
    const originalEnv = this.backupEnvironment();
    const testConfig = testUtils.getTestConfig();

    if (invalidConfig.missingUrl) {
      delete process.env.JIRA_URL;
    } else if (invalidConfig.invalidUrl) {
      process.env.JIRA_URL = 'https://invalid-jira-server.test';
    } else {
      process.env.JIRA_URL = testConfig.url;
    }

    if (invalidConfig.missingToken) {
      delete process.env.JIRA_PERSONAL_TOKEN;
    } else if (invalidConfig.invalidToken) {
      process.env.JIRA_PERSONAL_TOKEN = 'invalid_token_12345';
    } else {
      process.env.JIRA_PERSONAL_TOKEN = testConfig.bearer;
    }

    try {
      const server = new JiraMcpServer();
      this.servers.push(server);

      // Register cleanup
      this.cleanupHandlers.push(async () => {
        try {
          await server.close();
        } catch (error) {
          // Ignore errors during cleanup of invalid config server
        }
        this.restoreEnvironment(originalEnv);
      });

      return server;
    } catch (error) {
      this.restoreEnvironment(originalEnv);
      throw error;
    }
  }

  /**
   * Test complete server lifecycle
   */
  async testServerLifecycle(): Promise<{
    startupTime: number;
    shutdownTime: number;
    isReady: boolean;
    resourceCount: number;
    toolCount: number;
  }> {
    const server = await this.createTestServer();

    // Test startup
    const startTime = Date.now();
    expect(server.isReady()).toBe(true);
    const startupTime = Date.now() - startTime;

    // Test basic operations
    const listResourcesResult = await server.handleListResources({});
    const listToolsResult = await server.handleListTools({});

    // Test shutdown
    const shutdownStart = Date.now();
    await server.close();
    const shutdownTime = Date.now() - shutdownStart;

    return {
      startupTime,
      shutdownTime,
      isReady: server.isReady(),
      resourceCount: listResourcesResult.resources.length,
      toolCount: listToolsResult.tools.length,
    };
  }

  /**
   * Test hybrid architecture workflow
   */
  async testHybridWorkflow(): Promise<{
    staticFieldCount: number;
    dynamicFieldCount: number;
    totalFieldCount: number;
    cacheHitTime: number;
    cacheMissTime: number;
    validationResult: any;
  }> {
    const server = await this.createTestServer({ enableDynamic: true });

    // Phase 1: Static fields
    const staticStart = Date.now();
    const staticResource = await server.handleReadResource({
      uri: 'jira://issue/fields'
    });
    const staticTime = Date.now() - staticStart;

    const staticData = JSON.parse(staticResource.contents[0].text);
    const staticFieldCount = staticData.fields.length;

    // Phase 2: Dynamic fields (first call - cache miss)
    const dynamicStart = Date.now();
    const dynamicResource = await server.handleReadResource({
      uri: 'jira://issue/fields'
    });
    const cacheMissTime = Date.now() - dynamicStart;

    const dynamicData = JSON.parse(dynamicResource.contents[0].text);
    const totalFieldCount = dynamicData.fields.length;
    const dynamicFieldCount = Math.max(0, totalFieldCount - staticFieldCount);

    // Phase 3: Cache hit test
    const cacheHitStart = Date.now();
    await server.handleReadResource({
      uri: 'jira://issue/fields'
    });
    const cacheHitTime = Date.now() - cacheHitStart;

    // Phase 4: Validation test
    const validationResult = await server.handleCallTool({
      name: 'searchIssues',
      arguments: {
        jql: 'project is not empty',
        fields: ['summary', 'status.name', 'assignee.displayName'],
        maxResults: 1
      }
    });

    return {
      staticFieldCount,
      dynamicFieldCount,
      totalFieldCount,
      cacheHitTime,
      cacheMissTime,
      validationResult: JSON.parse(validationResult.content[0].text)
    };
  }

  /**
   * Test performance under load
   */
  async testPerformanceUnderLoad(config: {
    concurrentRequests: number;
    requestTypes: string[];
    iterations: number;
  }): Promise<{
    totalTime: number;
    averageTime: number;
    successRate: number;
    memoryIncrease: number;
    errors: string[];
  }> {
    const server = await this.createTestServer();
    const initialMemory = process.memoryUsage().heapUsed;
    const errors: string[] = [];

    const startTime = Date.now();
    const allPromises: Promise<any>[] = [];

    for (let i = 0; i < config.iterations; i++) {
      const promises = config.requestTypes.map(async (requestType) => {
        try {
          switch (requestType) {
            case 'listResources':
              return await server.handleListResources({});
            case 'listTools':
              return await server.handleListTools({});
            case 'readResource':
              return await server.handleReadResource({ uri: 'jira://issue/fields' });
            case 'getCurrentUser':
              return await server.handleCallTool({ name: 'getCurrentUser', arguments: {} });
            case 'searchFields':
              return await server.handleCallTool({ name: 'searchFields', arguments: { query: 'summary' } });
            default:
              throw new Error(`Unknown request type: ${requestType}`);
          }
        } catch (error: any) {
          errors.push(`${requestType}: ${error.message}`);
          throw error;
        }
      });

      allPromises.push(...promises);

      // Process in batches to avoid overwhelming the system
      if (allPromises.length >= config.concurrentRequests) {
        await Promise.allSettled(allPromises.splice(0, config.concurrentRequests));
      }
    }

    // Process remaining requests
    const results = await Promise.allSettled(allPromises);
    const totalTime = Date.now() - startTime;

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const successRate = successful / results.length;

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = (finalMemory - initialMemory) / (1024 * 1024); // MB

    return {
      totalTime,
      averageTime: totalTime / results.length,
      successRate,
      memoryIncrease,
      errors: errors.slice(0, 10) // Limit error list
    };
  }

  /**
   * Test error recovery scenarios
   */
  async testErrorRecovery(): Promise<{
    networkErrorHandled: boolean;
    authErrorHandled: boolean;
    invalidDataHandled: boolean;
    recoverySuccessful: boolean;
  }> {
    let networkErrorHandled = false;
    let authErrorHandled = false;
    let invalidDataHandled = false;
    let recoverySuccessful = false;

    try {
      // Test 1: Network error handling
      const invalidServer = await this.createInvalidConfigServer({ invalidUrl: true });
      
      try {
        await invalidServer.handleCallTool({
          name: 'getCurrentUser',
          arguments: {}
        });
      } catch (error: any) {
        if (error.message.match(/network|connection|ENOTFOUND/i)) {
          networkErrorHandled = true;
        }
      }

      // Test 2: Auth error handling
      const authServer = await this.createInvalidConfigServer({ invalidToken: true });
      
      try {
        await authServer.handleCallTool({
          name: 'getCurrentUser',
          arguments: {}
        });
      } catch (error: any) {
        if (error.message.match(/401|unauthorized|authentication/i)) {
          authErrorHandled = true;
        }
      }

      // Test 3: Invalid data handling
      const validServer = await this.createTestServer();
      
      try {
        await validServer.handleCallTool({
          name: 'searchIssues',
          arguments: {
            jql: 'invalid syntax ^^^',
            fields: ['nonexistent.field']
          }
        });
      } catch (error: any) {
        if (error.message.match(/jql|field|validation|invalid/i)) {
          invalidDataHandled = true;
        }
      }

      // Test 4: Recovery after error
      const userResult = await validServer.handleCallTool({
        name: 'getCurrentUser',
        arguments: {}
      });
      
      const userData = JSON.parse(userResult.content[0].text);
      if (userData.success) {
        recoverySuccessful = true;
      }

    } catch (error) {
      logger.error('Error during error recovery testing', { error });
    }

    return {
      networkErrorHandled,
      authErrorHandled,
      invalidDataHandled,
      recoverySuccessful
    };
  }

  /**
   * Simulate AI assistant usage patterns
   */
  async simulateAIAssistantUsage(): Promise<{
    projectDiscoverySuccess: boolean;
    issueAnalysisSuccess: boolean;
    fieldLookupSuccess: boolean;
    resourceBasedDiscoverySuccess: boolean;
    overallSuccess: boolean;
  }> {
    const server = await this.createTestServer({ enableDynamic: true });

    let projectDiscoverySuccess = false;
    let issueAnalysisSuccess = false;
    let fieldLookupSuccess = false;
    let resourceBasedDiscoverySuccess = false;

    try {
      // Step 1: Project discovery
      const projectsResult = await server.handleCallTool({
        name: 'getAllProjects',
        arguments: {}
      });

      const projectsData = JSON.parse(projectsResult.content[0].text);
      if (projectsData.success && Array.isArray(projectsData.projects)) {
        projectDiscoverySuccess = true;

        // Step 2: Issue analysis (if projects available)
        if (projectsData.projects.length > 0) {
          const testProject = projectsData.projects[0];
          
          const issuesResult = await server.handleCallTool({
            name: 'searchIssues',
            arguments: {
              jql: `project = "${testProject.key}"`,
              fields: ['summary', 'status.name', 'assignee.displayName'],
              maxResults: 5
            }
          });

          const issuesData = JSON.parse(issuesResult.content[0].text);
          if (issuesData.success) {
            issueAnalysisSuccess = true;
          }
        }
      }

      // Step 3: Field lookup
      const fieldResult = await server.handleCallTool({
        name: 'searchFields',
        arguments: { query: 'status' }
      });

      const fieldData = JSON.parse(fieldResult.content[0].text);
      if (fieldData.success && Array.isArray(fieldData.fields)) {
        fieldLookupSuccess = true;
      }

      // Step 4: Resource-based discovery
      const resourceResult = await server.handleReadResource({
        uri: 'jira://issue/fields'
      });

      if (resourceResult.contents && resourceResult.contents.length > 0) {
        const resourceData = JSON.parse(resourceResult.contents[0].text);
        if (resourceData.fields && Array.isArray(resourceData.fields)) {
          resourceBasedDiscoverySuccess = true;
        }
      }

    } catch (error) {
      logger.error('Error during AI assistant usage simulation', { error });
    }

    const overallSuccess = projectDiscoverySuccess && 
                          issueAnalysisSuccess && 
                          fieldLookupSuccess && 
                          resourceBasedDiscoverySuccess;

    return {
      projectDiscoverySuccess,
      issueAnalysisSuccess,
      fieldLookupSuccess,
      resourceBasedDiscoverySuccess,
      overallSuccess
    };
  }

  /**
   * Clean up all test resources
   */
  async cleanup(): Promise<void> {
    for (const cleanupHandler of this.cleanupHandlers) {
      try {
        await cleanupHandler();
      } catch (error) {
        logger.warn('Error during test cleanup', { error });
      }
    }

    this.servers = [];
    this.cleanupHandlers = [];
  }

  /**
   * Backup current environment variables
   */
  private backupEnvironment(): Record<string, string | undefined> {
    return {
      JIRA_URL: process.env.JIRA_URL,
      JIRA_PERSONAL_TOKEN: process.env.JIRA_PERSONAL_TOKEN,
      ENABLE_DYNAMIC_FIELDS: process.env.ENABLE_DYNAMIC_FIELDS,
      DYNAMIC_FIELD_CACHE_TTL: process.env.DYNAMIC_FIELD_CACHE_TTL,
      JIRA_TIMEOUT: process.env.JIRA_TIMEOUT,
      JIRA_SSL_VERIFY: process.env.JIRA_SSL_VERIFY,
    };
  }

  /**
   * Restore environment variables
   */
  private restoreEnvironment(backup: Record<string, string | undefined>): void {
    for (const [key, value] of Object.entries(backup)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}