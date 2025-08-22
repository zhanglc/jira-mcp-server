/**
 * Unit tests for ResourceManager
 */

import { ResourceManager } from '@/resources/resource-manager';
import { ResourceCache } from '@/resources/resource-cache';
import { FieldDefinitionProvider } from '@/resources/field-definitions';
import type { ResourceUriPattern, JiraServerConfig } from '@/types';
import { createMockLogger } from '../../utils/test-helpers';

// Mock dependencies
jest.mock('@/resources/resource-cache');
jest.mock('@/resources/field-definitions');

describe('ResourceManager', () => {
  let resourceManager: ResourceManager;
  let mockCache: jest.Mocked<ResourceCache>;
  let mockFieldProvider: jest.Mocked<FieldDefinitionProvider>;
  let mockLogger: any;
  let mockConfig: JiraServerConfig;

  beforeEach(() => {
    mockLogger = createMockLogger();
    mockConfig = {
      url: 'https://test-jira.company.com',
      personalToken: 'test-token',
      sslVerify: true,
      timeout: 30000
    };

    // Create mocked instances
    mockCache = new ResourceCache(mockLogger) as jest.Mocked<ResourceCache>;
    mockFieldProvider = new FieldDefinitionProvider(mockConfig, mockLogger) as jest.Mocked<FieldDefinitionProvider>;

    resourceManager = new ResourceManager(mockCache, mockFieldProvider, mockLogger);
  });

  describe('registerResource', () => {
    it('should register valid resources successfully', async () => {
      const uri: ResourceUriPattern = 'jira://fields/issue';
      const name = 'Issue Fields';
      const description = 'Field definitions for issues';

      await resourceManager.registerResource(uri, name, description);

      // Verify resource is registered
      const registeredResources = resourceManager.getRegisteredResources();
      expect(registeredResources.has(uri)).toBe(true);

      const resourceInfo = registeredResources.get(uri)!;
      expect(resourceInfo.name).toBe(name);
      expect(resourceInfo.description).toBe(description);
      expect(resourceInfo.uri).toBe(uri);
    });

    it('should reject invalid URIs', async () => {
      const invalidUri = 'invalid://fields/issue' as ResourceUriPattern;

      await expect(
        resourceManager.registerResource(invalidUri, 'Test', 'Test description')
      ).rejects.toThrow('Invalid resource URI');
    });

    it('should log successful registration', async () => {
      const uri: ResourceUriPattern = 'jira://fields/project';
      
      await resourceManager.registerResource(uri, 'Project Fields', 'Project field definitions');

      expect(mockLogger.debug).toHaveBeenCalledWith(`Registered resource: ${uri}`);
    });
  });

  describe('listResources', () => {
    beforeEach(async () => {
      // Register some test resources
      await resourceManager.registerResource('jira://fields/issue', 'Issue Fields', 'Issue field definitions');
      await resourceManager.registerResource('jira://fields/project', 'Project Fields', 'Project field definitions');
    });

    it('should return list of registered resources', async () => {
      const result = await resourceManager.listResources();

      expect(result).toHaveProperty('resources');
      expect(Array.isArray(result.resources)).toBe(true);
      expect(result.resources).toHaveLength(2);

      // Check resource metadata structure
      result.resources.forEach(resource => {
        expect(resource).toHaveProperty('uri');
        expect(resource).toHaveProperty('name');
        expect(resource).toHaveProperty('description');
        expect(resource).toHaveProperty('version');
        expect(resource).toHaveProperty('lastModified');
        expect(resource).toHaveProperty('contentType');
        expect(resource.contentType).toBe('application/json');
        expect(resource.version).toBe('1.0.0');
      });
    });

    it('should include cache control metadata', async () => {
      const result = await resourceManager.listResources();

      result.resources.forEach(resource => {
        expect(resource).toHaveProperty('cacheControl');
        expect(resource.cacheControl).toEqual({
          maxAge: 3600,
          private: false,
          noStore: false
        });
      });
    });
  });

  describe('getResource', () => {
    const testUri: ResourceUriPattern = 'jira://fields/issue';
    const mockContent = {
      fields: {
        key: { type: 'string', description: 'Issue key' }
      },
      metadata: {
        entityType: 'issue',
        version: '1.0.0',
        lastUpdated: '2024-01-01T00:00:00.000Z',
        source: 'configuration',
        customFieldsIncluded: false,
        totalFields: 1
      }
    };

    beforeEach(async () => {
      // Register the resource
      await resourceManager.registerResource(testUri, 'Issue Fields', 'Issue field definitions');
      
      // Mock field provider response
      mockFieldProvider.getIssueFields.mockResolvedValue(mockContent);
    });

    it('should return cached content when available', async () => {
      const cachedEntry = {
        uri: testUri,
        content: mockContent,
        metadata: {} as any,
        cachedAt: '2024-01-01T00:00:00.000Z',
        accessCount: 1,
        lastAccessed: '2024-01-01T00:00:00.000Z',
        validated: true
      };

      mockCache.get.mockResolvedValue(cachedEntry);

      const result = await resourceManager.getResource(testUri);

      expect(mockCache.get).toHaveBeenCalledWith(testUri);
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].uri).toBe(testUri);
      expect(result.contents[0].mimeType).toBe('application/json');
      expect(JSON.parse(result.contents[0].text)).toEqual(mockContent);

      expect(mockLogger.debug).toHaveBeenCalledWith(`Serving cached resource: ${testUri}`);
    });

    it('should generate content when not cached', async () => {
      mockCache.get.mockResolvedValue(null);

      const result = await resourceManager.getResource(testUri);

      expect(mockCache.get).toHaveBeenCalledWith(testUri);
      expect(mockFieldProvider.getIssueFields).toHaveBeenCalled();
      expect(mockCache.set).toHaveBeenCalledWith(
        testUri,
        mockContent,
        expect.objectContaining({
          uri: testUri,
          name: 'Issue Fields',
          description: 'Issue field definitions',
          contentType: 'application/json'
        })
      );

      expect(result.contents).toHaveLength(1);
      expect(JSON.parse(result.contents[0].text)).toEqual(mockContent);
    });

    it('should validate access before serving content', async () => {
      const invalidUri = 'jira://fields/invalid' as ResourceUriPattern;

      await expect(
        resourceManager.getResource(invalidUri)
      ).rejects.toThrow('Resource not found');
    });

    it('should validate field schema content', async () => {
      mockCache.get.mockResolvedValue(null);

      await resourceManager.getResource(testUri);

      // Should not throw or log errors for valid content
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should handle content generation errors', async () => {
      mockCache.get.mockResolvedValue(null);
      mockFieldProvider.getIssueFields.mockRejectedValue(new Error('Provider error'));

      await expect(
        resourceManager.getResource(testUri)
      ).rejects.toThrow('Provider error');

      expect(mockLogger.error).toHaveBeenCalledWith(
        `Failed to generate resource content for ${testUri}:`,
        expect.any(Error)
      );
    });

    it('should handle different resource types', async () => {
      const testCases = [
        { uri: 'jira://fields/project' as ResourceUriPattern, method: 'getProjectFields' },
        { uri: 'jira://fields/user' as ResourceUriPattern, method: 'getUserFields' },
        { uri: 'jira://fields/board' as ResourceUriPattern, method: 'getBoardFields' },
        { uri: 'jira://fields/sprint' as ResourceUriPattern, method: 'getSprintFields' },
        { uri: 'jira://fields/worklog' as ResourceUriPattern, method: 'getWorklogFields' },
        { uri: 'jira://fields/custom' as ResourceUriPattern, method: 'getCustomFields' }
      ];

      for (const testCase of testCases) {
        // Register resource
        await resourceManager.registerResource(testCase.uri, 'Test', 'Test description');
        
        // Mock provider method
        (mockFieldProvider as any)[testCase.method].mockResolvedValue(mockContent);
        mockCache.get.mockResolvedValue(null);

        // Test resource generation
        await resourceManager.getResource(testCase.uri);

        expect((mockFieldProvider as any)[testCase.method]).toHaveBeenCalled();
      }
    });
  });

  describe('clearCache', () => {
    it('should clear specific resource cache', async () => {
      const uri: ResourceUriPattern = 'jira://fields/issue';
      
      await resourceManager.clearCache(uri);

      expect(mockCache.delete).toHaveBeenCalledWith(uri);
      expect(mockLogger.debug).toHaveBeenCalledWith(`Cleared cache for resource: ${uri}`);
    });

    it('should clear all cache when no URI specified', async () => {
      await resourceManager.clearCache();

      expect(mockCache.clear).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith('Cleared all resource cache');
    });
  });

  describe('getRegisteredResources', () => {
    it('should return copy of registered resources', async () => {
      await resourceManager.registerResource('jira://fields/issue', 'Issue Fields', 'Issue field definitions');

      const resources = resourceManager.getRegisteredResources();

      expect(resources.size).toBe(1);
      expect(resources.has('jira://fields/issue')).toBe(true);

      // Should be a copy, not the original
      resources.clear();
      const newResources = resourceManager.getRegisteredResources();
      expect(newResources.size).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should handle unknown resource URIs in handler creation', async () => {
      // This tests the internal createResourceHandler method indirectly
      await resourceManager.registerResource('jira://fields/issue', 'Test', 'Test');
      
      // Mock an unknown URI by modifying the internal map
      const resources = (resourceManager as any).resources;
      resources.set('jira://unknown/test' as ResourceUriPattern, {
        uri: 'jira://unknown/test',
        name: 'Test',
        description: 'Test',
        registeredAt: new Date().toISOString(),
        handler: () => { throw new Error('Unknown resource URI'); }
      });

      await expect(
        resourceManager.getResource('jira://unknown/test' as ResourceUriPattern)
      ).rejects.toThrow();
    });

    it('should handle validation warnings gracefully', async () => {
      const uri: ResourceUriPattern = 'jira://fields/issue';
      await resourceManager.registerResource(uri, 'Test', 'Test');

      // Mock content that will generate warnings
      const contentWithWarnings = {
        fields: { key: { type: 'string' } }, // Missing description
        metadata: {
          entityType: 'issue',
          version: '1.0.0',
          lastUpdated: '2024-01-01T00:00:00.000Z',
          source: 'configuration',
          customFieldsIncluded: false,
          totalFields: 999 // Wrong count
        }
      };

      mockFieldProvider.getIssueFields.mockResolvedValue(contentWithWarnings);
      mockCache.get.mockResolvedValue(null);

      // Should complete successfully despite warnings
      const result = await resourceManager.getResource(uri);
      expect(result).toBeDefined();
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });
});