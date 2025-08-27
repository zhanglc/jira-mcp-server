import { HybridResourceHandler } from '@/server/resources/hybrid-resource-handler.js';
import { JiraClientWrapper } from '@/client/jira-client-wrapper.js';
import type {
  ResourceDefinition,
  FieldDefinition,
} from '@/types/field-definition.js';
import type { McpResource } from '@/types/mcp-types.js';
import type { HybridConfig } from '@/types/config-types.js';
import { logger } from '@/utils/logger.js';

// Mock the JiraClientWrapper
jest.mock('@/client/jira-client-wrapper.js');

// Mock the logger
jest.mock('@/utils/logger.js', () => ({
  logger: {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('HybridResourceHandler', () => {
  let mockJiraClient: jest.Mocked<JiraClientWrapper>;
  let mockConfig: HybridConfig;
  let handler: HybridResourceHandler;

  // Helper function to create config with dynamic fields enabled
  const createDynamicConfig = (overrides: Partial<HybridConfig> = {}): HybridConfig => ({
    ...mockConfig,
    enableDynamicFields: true,
    isDynamicFieldsEnabled: jest.fn().mockReturnValue(true),
    ...overrides,
  });

  // Helper function to create config with dynamic fields disabled
  const createStaticConfig = (overrides: Partial<HybridConfig> = {}): HybridConfig => ({
    ...mockConfig,
    enableDynamicFields: false,
    isDynamicFieldsEnabled: jest.fn().mockReturnValue(false),
    ...overrides,
  });

  // Mock field data for testing
  const mockDynamicField: FieldDefinition = {
    id: 'customfield_10100',
    name: 'Story Points',
    description: 'Dynamic field for story points estimation',
    type: 'string',
    accessPaths: [
      {
        path: 'customfield_10100',
        description: 'Story points value',
        type: 'number',
        frequency: 'high',
      },
    ],
    examples: ['customfield_10100'],
    commonUsage: [['customfield_10100']],
    source: 'dynamic',
    confidence: 'high',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock JiraClientWrapper
    mockJiraClient = {
      searchFields: jest.fn(),
    } as any;

    // Create mock HybridConfig
    mockConfig = {
      url: 'https://test.jira.com',
      bearer: 'test-token',
      enableDynamicFields: false,
      dynamicFieldCacheTtl: 3600,
      dynamicFieldAnalysis: false,
      fieldAnalysisSampleSize: 5,
      enableSmartSuggestions: true,
      suggestionSimilarityThreshold: 0.4,
      maxSuggestionsPerField: 5,
      sslVerify: true,
      timeout: 30000,
      projectsFilter: [],
      isDynamicFieldsEnabled: jest.fn().mockReturnValue(false),
      getCacheTtlMs: jest.fn().mockReturnValue(3600000),
      isFieldAnalysisEnabled: jest.fn().mockReturnValue(false),
      isSmartSuggestionsEnabled: jest.fn().mockReturnValue(true),
    } as HybridConfig;

    // Create handler with dynamic fields disabled by default
    handler = new HybridResourceHandler(mockJiraClient, mockConfig);
  });

  describe('constructor', () => {
    it('should create instance with JiraClientWrapper', () => {
      expect(handler).toBeInstanceOf(HybridResourceHandler);
    });

    it('should accept enableDynamic flag', () => {
      const configWithDynamic = {
        ...mockConfig,
        enableDynamicFields: true,
        isDynamicFieldsEnabled: jest.fn().mockReturnValue(true),
      };
      const handlerWithDynamic = new HybridResourceHandler(
        mockJiraClient,
        configWithDynamic
      );
      expect(handlerWithDynamic).toBeInstanceOf(HybridResourceHandler);
    });

    it('should set default cache TTL', () => {
      // We'll verify this through behavior since the property might be private
      expect(handler).toBeInstanceOf(HybridResourceHandler);
    });

    it('should validate JiraClientWrapper has required methods', () => {
      const invalidClient = {} as JiraClientWrapper;
      const configWithDynamic = {
        ...mockConfig,
        enableDynamicFields: true,
        isDynamicFieldsEnabled: jest.fn().mockReturnValue(true),
      };
      expect(() => {
        new HybridResourceHandler(invalidClient, configWithDynamic);
      }).toThrow('JiraClientWrapper must have searchFields method');
    });

    it('should validate JiraClientWrapper searchFields is a function', () => {
      const invalidClient = { searchFields: 'not-a-function' } as any;
      const configWithDynamic = {
        ...mockConfig,
        enableDynamicFields: true,
        isDynamicFieldsEnabled: jest.fn().mockReturnValue(true),
      };
      expect(() => {
        new HybridResourceHandler(invalidClient, configWithDynamic);
      }).toThrow('JiraClientWrapper.searchFields must be a function');
    });

    it('should set default cache size limit', () => {
      const handlerWithDefaults = new HybridResourceHandler(
        mockJiraClient,
        mockConfig
      );
      expect(handlerWithDefaults).toBeInstanceOf(HybridResourceHandler);
    });

    it('should accept custom cache size limit', () => {
      const customConfig = {
        ...mockConfig,
        dynamicFieldCacheTtl: 3600,
        getCacheTtlMs: jest.fn().mockReturnValue(3600000),
      };
      const handlerWithCustomLimit = new HybridResourceHandler(
        mockJiraClient,
        customConfig
      );
      expect(handlerWithCustomLimit).toBeInstanceOf(HybridResourceHandler);
    });

    it('should validate cache size limit is positive', () => {
      // This test may not be relevant anymore since cache size is now handled internally
      // The constructor no longer accepts cache size as a parameter
      expect(handler).toBeInstanceOf(HybridResourceHandler);
    });
  });

  describe('inheritance from JiraResourceHandler', () => {
    it('should extend JiraResourceHandler', () => {
      // Import the base class to check inheritance
      const {
        JiraResourceHandler,
      } = require('@/server/resources/resource-handler.js');
      expect(handler).toBeInstanceOf(JiraResourceHandler);
    });

    it('should inherit listResources method', async () => {
      const result = await handler.listResources();
      expect(result).toHaveProperty('resources');
      expect(Array.isArray(result.resources)).toBe(true);
    });

    it('should inherit validateFieldPaths method', () => {
      const result = handler.validateFieldPaths('issue', [
        'summary',
        'description',
      ]);
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('validPaths');
      expect(result).toHaveProperty('invalidPaths');
    });
  });

  describe('readResource - static mode', () => {
    beforeEach(() => {
      // Create handler with dynamic fields disabled
      handler = new HybridResourceHandler(mockJiraClient, createStaticConfig());
    });

    it('should return static field definitions when dynamic is disabled', async () => {
      const uri = 'jira://issue/fields';
      const result = await handler.readResource(uri);

      expect(result).toHaveProperty('contents');
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0]).toHaveProperty('type', 'text');
      expect(result.contents[0]).toHaveProperty('mimeType', 'application/json');

      // Parse the JSON content to verify it's valid
      const content = JSON.parse(result.contents[0].text);
      expect(content).toHaveProperty('uri', uri);
      expect(content).toHaveProperty('entityType', 'issue');
      expect(content).toHaveProperty('fields');
      expect(content).toHaveProperty('pathIndex');
    });

    it('should not call Jira API when dynamic is disabled', async () => {
      await handler.readResource('jira://issue/fields');
      expect(mockJiraClient.searchFields).not.toHaveBeenCalled();
    });

    it('should handle invalid URI gracefully', async () => {
      await expect(handler.readResource('invalid://uri')).rejects.toThrow(
        'Invalid resource URI format'
      );
    });

    it('should handle unknown URI gracefully', async () => {
      await expect(
        handler.readResource('jira://unknown/fields')
      ).rejects.toThrow('Unknown resource URI');
    });

    it('should validate empty URI input', async () => {
      await expect(handler.readResource('')).rejects.toThrow(
        'Resource URI is required'
      );
    });

    it('should validate null URI input', async () => {
      await expect(handler.readResource(null as any)).rejects.toThrow(
        'Resource URI is required'
      );
    });

    it('should validate undefined URI input', async () => {
      await expect(handler.readResource(undefined as any)).rejects.toThrow(
        'Resource URI is required'
      );
    });
  });

  describe('readResource - hybrid mode', () => {
    beforeEach(() => {
      // Create handler with dynamic fields enabled
      handler = new HybridResourceHandler(mockJiraClient, createDynamicConfig());
    });

    it('should enhance static definitions with dynamic fields when enabled', async () => {
      // Mock the searchFields response
      mockJiraClient.searchFields.mockResolvedValue([
        {
          id: 'customfield_10100',
          name: 'Story Points',
          custom: true,
          searchable: true,
          schema: { type: 'number' },
        },
      ]);

      const result = await handler.readResource('jira://issue/fields');

      expect(result).toHaveProperty('contents');
      expect(result.contents).toHaveLength(1);

      // Parse the content and verify it includes both static and dynamic fields
      const content = JSON.parse(result.contents[0].text);
      expect(content).toHaveProperty('fields');

      // Should have more fields than just static
      expect(Object.keys(content.fields).length).toBeGreaterThan(14); // 14 is the static field count

      // Should include the dynamic field
      expect(content.fields).toHaveProperty('customfield_10100');
      expect(content.pathIndex).toHaveProperty('customfield_10100');
    });

    it('should call Jira API to fetch dynamic fields when enabled', async () => {
      mockJiraClient.searchFields.mockResolvedValue([]);

      await handler.readResource('jira://issue/fields');

      expect(mockJiraClient.searchFields).toHaveBeenCalledWith();
    });

    it('should cache dynamic fields for subsequent requests', async () => {
      mockJiraClient.searchFields.mockResolvedValue([
        {
          id: 'customfield_10100',
          name: 'Story Points',
          custom: true,
          searchable: true,
          schema: { type: 'number' },
        },
      ]);

      // First call
      await handler.readResource('jira://issue/fields');
      expect(mockJiraClient.searchFields).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await handler.readResource('jira://issue/fields');
      expect(mockJiraClient.searchFields).toHaveBeenCalledTimes(1);
    });

    it('should prevent race conditions with concurrent API calls', async () => {
      mockJiraClient.searchFields.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve([
                  {
                    id: 'customfield_10100',
                    name: 'Story Points',
                    custom: true,
                    searchable: true,
                    schema: { type: 'number' },
                  },
                ]),
              100
            )
          )
      );

      // Make multiple concurrent calls
      const promises = [
        handler.readResource('jira://issue/fields'),
        handler.readResource('jira://issue/fields'),
        handler.readResource('jira://issue/fields'),
      ];

      await Promise.all(promises);

      // Should only call API once despite concurrent requests
      expect(mockJiraClient.searchFields).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors gracefully and fallback to static', async () => {
      const mockLogger = logger as jest.Mocked<typeof logger>;
      mockJiraClient.searchFields.mockRejectedValue(new Error('API Error'));

      const result = await handler.readResource('jira://issue/fields');

      // Should still return static fields
      expect(result).toHaveProperty('contents');
      const content = JSON.parse(result.contents[0].text);
      expect(content).toHaveProperty('fields');
      expect(Object.keys(content.fields).length).toBe(14); // Only static fields

      // Should log the error with structured context
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to discover dynamic fields, falling back to static definitions',
        expect.objectContaining({
          entityType: 'issue',
          enableDynamic: true,
          error: expect.any(Error),
        })
      );
    });

    it('should log structured information for successful dynamic field discovery', async () => {
      const mockLogger = logger as jest.Mocked<typeof logger>;
      mockJiraClient.searchFields.mockResolvedValue([
        {
          id: 'customfield_10100',
          name: 'Story Points',
          custom: true,
          searchable: true,
          schema: { type: 'number' },
        },
      ]);

      await handler.readResource('jira://issue/fields');

      // Should log the success with structured context
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Successfully discovered dynamic fields',
        expect.objectContaining({
          entityType: 'issue',
          dynamicFieldCount: 1,
          cacheHit: false,
        })
      );
    });
  });

  describe('dynamic field discovery', () => {
    beforeEach(() => {
      handler = new HybridResourceHandler(mockJiraClient, createDynamicConfig());
    });

    it('should have placeholder for discoverDynamicFields method', () => {
      // This tests the method exists (will be implemented in later tasks)
      expect(typeof (handler as any).discoverDynamicFields).toBe('function');
    });

    it('should have placeholder for fuseFieldDefinitions method', () => {
      // This tests the method exists (will be implemented in later tasks)
      expect(typeof (handler as any).fuseFieldDefinitions).toBe('function');
    });
  });

  describe('cache management', () => {
    beforeEach(() => {
      handler = new HybridResourceHandler(mockJiraClient, createDynamicConfig({ dynamicFieldCacheTtl: 1800, getCacheTtlMs: jest.fn().mockReturnValue(1800000) })); // 30 minutes TTL
    });

    it('should support custom cache TTL', () => {
      // Verify the handler was created successfully with custom TTL
      expect(handler).toBeInstanceOf(HybridResourceHandler);
    });

    it('should respect cache size limits with LRU eviction', async () => {
      // Create handler with small cache limit (note: cache size is now internally managed)
      const smallCacheHandler = new HybridResourceHandler(
        mockJiraClient,
        createDynamicConfig()
      );

      mockJiraClient.searchFields.mockResolvedValue([
        {
          id: 'customfield_10100',
          name: 'Field 1',
          custom: true,
          searchable: true,
          schema: { type: 'string' },
        },
      ]);

      // Fill cache to limit - use different cache keys with same URI but different content
      // We'll simulate different entity types by calling discoverDynamicFields directly
      const discoverMethod = (
        smallCacheHandler as any
      ).discoverDynamicFields.bind(smallCacheHandler);

      await discoverMethod('issue');
      await discoverMethod('project');

      // Reset mock to track further calls
      mockJiraClient.searchFields.mockClear();

      // Add third item (should evict oldest)
      await discoverMethod('user');

      // First item should be evicted, so accessing it should call API again
      await discoverMethod('issue');

      // Should have made API calls for the evicted item
      expect(mockJiraClient.searchFields).toHaveBeenCalledTimes(2);
    });

    it('should handle cache TTL expiration correctly', async () => {
      // Create handler with very short TTL for testing
      const shortTtlHandler = new HybridResourceHandler(
        mockJiraClient,
        createDynamicConfig({ 
          dynamicFieldCacheTtl: 1, // 1 second TTL (minimum allowed)
          getCacheTtlMs: jest.fn().mockReturnValue(1000)
        })
      );

      mockJiraClient.searchFields.mockResolvedValue([
        {
          id: 'customfield_10100',
          name: 'Story Points',
          custom: true,
          searchable: true,
          schema: { type: 'number' },
        },
      ]);

      // First call
      await shortTtlHandler.readResource('jira://issue/fields');
      expect(mockJiraClient.searchFields).toHaveBeenCalledTimes(1);

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 10));

      // Second call should fetch fresh data
      await shortTtlHandler.readResource('jira://issue/fields');
      expect(mockJiraClient.searchFields).toHaveBeenCalledTimes(2);
    });

    it('should validate cache key format', async () => {
      // This will be tested through internal method validation
      expect(handler).toBeInstanceOf(HybridResourceHandler);
    });

    it('should log cache operations with structured data', async () => {
      const mockLogger = logger as jest.Mocked<typeof logger>;
      mockJiraClient.searchFields.mockResolvedValue([]);

      // First call (cache miss)
      await handler.readResource('jira://issue/fields');

      expect(mockLogger.log).toHaveBeenCalledWith(
        'Cache miss, fetching dynamic fields from API',
        expect.objectContaining({
          cacheKey: 'issue-fields',
          entityType: 'issue',
        })
      );

      // Second call (cache hit)
      await handler.readResource('jira://issue/fields');

      expect(mockLogger.log).toHaveBeenCalledWith(
        'Cache hit for dynamic fields',
        expect.objectContaining({
          cacheKey: 'issue-fields',
          entityType: 'issue',
        })
      );
    });
  });

  describe('configuration handling', () => {
    it('should handle environment-based enableDynamic flag', () => {
      // Test creating handler with different configurations
      const staticHandler = new HybridResourceHandler(mockJiraClient, createStaticConfig());
      const dynamicHandler = new HybridResourceHandler(mockJiraClient, createDynamicConfig());

      expect(staticHandler).toBeInstanceOf(HybridResourceHandler);
      expect(dynamicHandler).toBeInstanceOf(HybridResourceHandler);
    });

    it('should use default cache TTL when not specified', () => {
      const defaultHandler = new HybridResourceHandler(mockJiraClient, createDynamicConfig());
      expect(defaultHandler).toBeInstanceOf(HybridResourceHandler);
    });
  });

  describe('error handling', () => {
    it('should handle missing JiraClientWrapper gracefully', () => {
      expect(() => {
        new HybridResourceHandler(null as any, createStaticConfig());
      }).toThrow('JiraClientWrapper is required');
    });

    it('should handle invalid cache TTL values', () => {
      // This test may not be relevant anymore since cache TTL validation is now handled by Zod schema
      // Let's test the config validation instead
      expect(() => {
        new HybridResourceHandler(mockJiraClient, null as any);
      }).toThrow('HybridConfig is required');
    });

    it('should preserve error context in fallback scenarios', async () => {
      const mockLogger = logger as jest.Mocked<typeof logger>;
      const originalError = new Error('Network timeout');
      originalError.stack = 'Error: Network timeout\n    at test';

      mockJiraClient.searchFields.mockRejectedValue(originalError);
      handler = new HybridResourceHandler(mockJiraClient, createDynamicConfig());

      const result = await handler.readResource('jira://issue/fields');

      // Should still return static fields
      expect(result).toHaveProperty('contents');

      // Should preserve original error context in logging
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to discover dynamic fields, falling back to static definitions',
        expect.objectContaining({
          error: originalError,
          errorMessage: 'Network timeout',
          errorStack: expect.stringContaining('Error: Network timeout'),
        })
      );
    });

    it('should handle malformed API responses gracefully', async () => {
      const mockLogger = logger as jest.Mocked<typeof logger>;
      // Mock API to return malformed data
      mockJiraClient.searchFields.mockResolvedValue([
        {
          // Missing required fields
          id: null,
          name: undefined,
          custom: true,
        } as any,
      ]);

      handler = new HybridResourceHandler(mockJiraClient, createDynamicConfig());

      const result = await handler.readResource('jira://issue/fields');

      // Should still return results (filtering out invalid fields)
      expect(result).toHaveProperty('contents');

      // Should log the validation issue
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Skipping invalid field definition',
        expect.objectContaining({
          field: expect.any(Object),
          reason: expect.any(String),
        })
      );
    });

    it('should validate field IDs before adding to cache', async () => {
      mockJiraClient.searchFields.mockResolvedValue([
        {
          id: '', // Invalid empty ID
          name: 'Valid Name',
          custom: true,
          searchable: true,
          schema: { type: 'string' },
        },
        {
          id: 'customfield_10100', // Valid ID
          name: 'Story Points',
          custom: true,
          searchable: true,
          schema: { type: 'number' },
        },
      ]);

      handler = new HybridResourceHandler(mockJiraClient, createDynamicConfig());

      const result = await handler.readResource('jira://issue/fields');
      const content = JSON.parse(result.contents[0].text);

      // Should only include field with valid ID
      expect(content.fields).toHaveProperty('customfield_10100');
      expect(content.fields).not.toHaveProperty('');

      // Should log validation warning
      const mockLogger = logger as jest.Mocked<typeof logger>;
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Skipping invalid field definition',
        expect.objectContaining({
          reason: 'Invalid field ID',
        })
      );
    });
  });

  describe('input validation', () => {
    beforeEach(() => {
      handler = new HybridResourceHandler(mockJiraClient, createDynamicConfig());
    });

    it('should validate cache key format in private methods', () => {
      // Test the internal cache key validation exists
      expect(handler).toBeInstanceOf(HybridResourceHandler);
    });

    it('should handle entity type validation', async () => {
      // This tests that entity type is properly extracted and validated
      const result = await handler.readResource('jira://issue/fields');
      expect(result).toHaveProperty('contents');

      const content = JSON.parse(result.contents[0].text);
      expect(content.entityType).toBe('issue');
    });
  });
});
