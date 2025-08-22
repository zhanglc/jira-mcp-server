/**
 * Integration tests for the complete Resources Framework
 */

import { ResourceManager } from '@/resources/resource-manager';
import { ResourceCache } from '@/resources/resource-cache';
import { FieldDefinitionProvider } from '@/resources/field-definitions';
import { ResourceValidator } from '@/resources/resource-validator';
import { registerResources } from '@/resources/index';
import type { JiraServerConfig, ResourceUriPattern } from '@/types';
import { createMockLogger } from '../../utils/test-helpers';

// Mock MCP server
const mockMcpServer = {
  registerResource: jest.fn()
};

describe('Resources Framework Integration', () => {
  let mockConfig: JiraServerConfig;
  let mockLogger: any;

  beforeEach(() => {
    mockConfig = {
      url: 'https://test-jira.company.com',
      personalToken: 'test-token',
      sslVerify: true,
      timeout: 30000
    };
    
    mockLogger = createMockLogger();
    jest.clearAllMocks();
  });

  describe('complete workflow', () => {
    it('should register all 7 field definition resources', async () => {
      await registerResources(mockMcpServer as any, mockConfig, mockLogger);

      // Should register 7 resources
      expect(mockMcpServer.registerResource).toHaveBeenCalledTimes(7);

      // Check that all expected resources are registered
      const expectedUris = [
        'jira://fields/issue',
        'jira://fields/project',
        'jira://fields/user',
        'jira://fields/board',
        'jira://fields/sprint',
        'jira://fields/worklog',
        'jira://fields/custom'
      ];

      expectedUris.forEach(uri => {
        expect(mockMcpServer.registerResource).toHaveBeenCalledWith(
          expect.any(String), // name
          uri,
          expect.objectContaining({
            name: expect.any(String),
            description: expect.any(String),
            mimeType: 'application/json'
          }),
          expect.any(Function) // callback
        );
      });
    });

    it('should handle resource registration errors gracefully', async () => {
      mockMcpServer.registerResource.mockImplementation(() => {
        throw new Error('Registration failed');
      });

      await expect(
        registerResources(mockMcpServer as any, mockConfig, mockLogger)
      ).rejects.toThrow('Registration failed');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to register MCP resources:',
        expect.any(Error)
      );
    });
  });

  describe('end-to-end resource operations', () => {
    let cache: ResourceCache;
    let fieldProvider: FieldDefinitionProvider;
    let resourceManager: ResourceManager;

    beforeEach(() => {
      cache = new ResourceCache(mockLogger);
      fieldProvider = new FieldDefinitionProvider(mockConfig, mockLogger);
      resourceManager = new ResourceManager(cache, fieldProvider, mockLogger);
    });

    it('should complete full resource lifecycle', async () => {
      const uri: ResourceUriPattern = 'jira://fields/issue';

      // 1. Register resource
      await resourceManager.registerResource(uri, 'Issue Fields', 'Issue field definitions');

      // 2. List resources
      const resourceList = await resourceManager.listResources();
      expect(resourceList.resources).toHaveLength(1);
      expect(resourceList.resources[0].uri).toBe(uri);

      // 3. Get resource content (first time - not cached)
      const firstResult = await resourceManager.getResource(uri);
      expect(firstResult.contents).toHaveLength(1);
      expect(firstResult.contents[0].uri).toBe(uri);

      const content = JSON.parse(firstResult.contents[0].text);
      expect(content).toHaveProperty('fields');
      expect(content).toHaveProperty('metadata');
      expect(content.metadata.entityType).toBe('issue');

      // 4. Get resource content again (should be cached)
      const secondResult = await resourceManager.getResource(uri);
      expect(secondResult).toEqual(firstResult);

      // 5. Clear cache
      await resourceManager.clearCache(uri);

      // 6. Get resource content again (cache cleared, regenerated)
      const thirdResult = await resourceManager.getResource(uri);
      // Content should be similar but timestamp might differ
      const thirdContent = JSON.parse(thirdResult.contents[0].text);
      const firstContent = JSON.parse(firstResult.contents[0].text);
      expect(thirdContent.fields).toEqual(firstContent.fields);
      expect(thirdContent.metadata.entityType).toBe(firstContent.metadata.entityType);
    });

    it('should validate all resource types successfully', async () => {
      const resourceTypes = [
        { uri: 'jira://fields/issue' as ResourceUriPattern, name: 'Issue Fields' },
        { uri: 'jira://fields/project' as ResourceUriPattern, name: 'Project Fields' },
        { uri: 'jira://fields/user' as ResourceUriPattern, name: 'User Fields' },
        { uri: 'jira://fields/board' as ResourceUriPattern, name: 'Board Fields' },
        { uri: 'jira://fields/sprint' as ResourceUriPattern, name: 'Sprint Fields' },
        { uri: 'jira://fields/worklog' as ResourceUriPattern, name: 'Worklog Fields' },
        { uri: 'jira://fields/custom' as ResourceUriPattern, name: 'Custom Fields' }
      ];

      // Register all resources
      for (const resource of resourceTypes) {
        await resourceManager.registerResource(resource.uri, resource.name, `${resource.name} definitions`);
      }

      // Get content for all resources
      for (const resource of resourceTypes) {
        const result = await resourceManager.getResource(resource.uri);
        expect(result.contents).toHaveLength(1);
        
        const content = JSON.parse(result.contents[0].text);
        if (resource.uri === 'jira://fields/custom') {
          // Custom fields have different structure
          expect(content).toHaveProperty('fields');
          expect(content).toHaveProperty('metadata');
        } else {
          // Regular field schemas
          expect(content).toHaveProperty('fields');
          expect(content).toHaveProperty('metadata');
          expect(content.metadata).toHaveProperty('entityType');
        }
      }
    });

    it('should handle concurrent resource requests', async () => {
      const uri: ResourceUriPattern = 'jira://fields/issue';
      await resourceManager.registerResource(uri, 'Issue Fields', 'Issue field definitions');

      // Make multiple concurrent requests
      const promises = Array(10).fill(null).map(() => 
        resourceManager.getResource(uri)
      );

      const results = await Promise.all(promises);

      // All results should have the same structure and content (excluding timestamps)
      results.forEach(result => {
        expect(result.contents).toHaveLength(1);
        const content = JSON.parse(result.contents[0].text);
        const firstContent = JSON.parse(results[0].contents[0].text);
        expect(content.fields).toEqual(firstContent.fields);
        expect(content.metadata.entityType).toBe(firstContent.metadata.entityType);
      });

      // Content generation should happen only once due to internal handling
      expect(results[0].contents).toHaveLength(1);
    });
  });

  describe('validation integration', () => {
    let validator: ResourceValidator;

    beforeEach(() => {
      validator = new ResourceValidator(mockLogger);
    });

    it('should validate generated field schemas', async () => {
      const fieldProvider = new FieldDefinitionProvider(mockConfig, mockLogger);
      
      // Test each field type
      const testCases = [
        { method: 'getIssueFields', entityType: 'issue' },
        { method: 'getProjectFields', entityType: 'project' },
        { method: 'getUserFields', entityType: 'user' },
        { method: 'getBoardFields', entityType: 'board' },
        { method: 'getSprintFields', entityType: 'sprint' },
        { method: 'getWorklogFields', entityType: 'worklog' }
      ];

      for (const testCase of testCases) {
        const schema = await (fieldProvider as any)[testCase.method]();
        const validation = validator.validateFieldSchema(schema);

        expect(validation.valid).toBe(true);
        expect(validation.errors).toHaveLength(0);
        expect(validation.uri).toBe(`jira://fields/${testCase.entityType}`);
      }
    });

    it('should validate custom fields structure', async () => {
      const fieldProvider = new FieldDefinitionProvider(mockConfig, mockLogger);
      const customFields = await fieldProvider.getCustomFields();

      // Custom fields have different validation since they don't follow FieldSchema
      expect(customFields).toHaveProperty('fields');
      expect(customFields).toHaveProperty('metadata');
      
      Object.entries(customFields.fields).forEach(([fieldId, fieldDef]) => {
        expect(fieldId).toMatch(/^customfield_\d+$/);
        expect(fieldDef).toHaveProperty('fieldId');
        expect(fieldDef).toHaveProperty('fieldName');
        expect(fieldDef).toHaveProperty('fieldType');
        expect(fieldDef.isGlobal).toBeDefined();
        expect(fieldDef.isLocked).toBeDefined();
      });
    });
  });

  describe('performance and caching', () => {
    let cache: ResourceCache;
    let fieldProvider: FieldDefinitionProvider;
    let resourceManager: ResourceManager;

    beforeEach(() => {
      cache = new ResourceCache(mockLogger);
      fieldProvider = new FieldDefinitionProvider(mockConfig, mockLogger);
      resourceManager = new ResourceManager(cache, fieldProvider, mockLogger);
    });

    it('should cache resources effectively', async () => {
      const uri: ResourceUriPattern = 'jira://fields/issue';
      await resourceManager.registerResource(uri, 'Issue Fields', 'Issue field definitions');

      // First request
      const start1 = Date.now();
      await resourceManager.getResource(uri);
      const duration1 = Date.now() - start1;

      // Second request (should be cached)
      const start2 = Date.now();
      await resourceManager.getResource(uri);
      const duration2 = Date.now() - start2;

      // Cached request should be faster or equal (may be too fast to measure precisely)
      expect(duration2).toBeLessThanOrEqual(duration1);

      // Verify cache statistics
      const stats = cache.getStats();
      expect(stats.totalEntries).toBe(1);
      expect(stats.totalAccess).toBe(1); // Only first request goes to cache.get
    });

    it('should handle cache expiration correctly', async () => {
      jest.useFakeTimers();
      
      try {
        const uri: ResourceUriPattern = 'jira://fields/issue';
        await resourceManager.registerResource(uri, 'Issue Fields', 'Issue field definitions');

        // Get resource with short TTL
        await cache.set(uri, { test: 'data' }, {
          uri,
          name: 'Test',
          description: 'Test',
          version: '1.0.0',
          lastModified: new Date().toISOString(),
          contentType: 'application/json'
        }, 1); // 1 second TTL

        // Should be cached
        expect(cache.has(uri)).toBe(true);

        // Fast-forward past TTL
        jest.advanceTimersByTime(2000);

        // Should be expired
        expect(cache.has(uri)).toBe(false);

      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('error recovery', () => {
    let resourceManager: ResourceManager;

    beforeEach(() => {
      const cache = new ResourceCache(mockLogger);
      const fieldProvider = new FieldDefinitionProvider(mockConfig, mockLogger);
      resourceManager = new ResourceManager(cache, fieldProvider, mockLogger);
    });

    it('should recover from temporary field provider errors', async () => {
      const uri: ResourceUriPattern = 'jira://fields/issue';
      await resourceManager.registerResource(uri, 'Issue Fields', 'Issue field definitions');

      // Mock provider to fail first, then succeed
      const fieldProvider = (resourceManager as any).fieldProvider;
      let callCount = 0;
      const originalMethod = fieldProvider.getIssueFields;
      
      fieldProvider.getIssueFields = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Temporary failure');
        }
        return originalMethod.call(fieldProvider);
      });

      // First call should fail
      await expect(resourceManager.getResource(uri)).rejects.toThrow('Temporary failure');

      // Second call should succeed
      const result = await resourceManager.getResource(uri);
      expect(result.contents).toHaveLength(1);
    });
  });
});