import { HybridResourceHandler } from '@/server/resources/hybrid-resource-handler.js';
import type { JiraClientWrapper } from '@/client/jira-client-wrapper.js';
import type { JiraField } from '@/types/jira-types.js';
import type { FieldDefinition } from '@/types/field-definition.js';

/**
 * Dynamic Field Discovery & Caching Tests (Task-8)
 * 
 * Focus: Cache Testing for getDynamicCustomFields() method
 * - TTL behavior verification
 * - Race condition prevention
 * - LRU eviction strategy
 * - Cache hit/miss patterns
 * - Error handling and graceful fallback
 * - Performance optimization validation
 */

describe('HybridResourceHandler - Dynamic Field Discovery & Caching', () => {
  let hybridHandler: HybridResourceHandler;
  let mockJiraClient: jest.Mocked<JiraClientWrapper>;
  let mockFields: JiraField[];

  beforeEach(() => {
    // Setup mock Jira client
    mockJiraClient = {
      searchFields: jest.fn(),
    } as any;

    // Setup mock field data
    mockFields = [
      {
        id: 'customfield_10001',
        name: 'Story Points',
        custom: true,
        schema: { type: 'number' },
      },
      {
        id: 'customfield_10002',
        name: 'Epic Link',
        custom: true,
        schema: { type: 'string' },
      },
      {
        id: 'summary',
        name: 'Summary',
        custom: false,
        schema: { type: 'string' },
      },
    ];

    // Mock successful API response
    mockJiraClient.searchFields.mockResolvedValue(mockFields);
  });

  describe('Cache TTL Behavior', () => {
    test('should return cached data when within TTL', async () => {
      // Arrange: Handler with 1-hour TTL
      hybridHandler = new HybridResourceHandler(mockJiraClient, true, 3600, 100);
      
      // Act: First call to populate cache
      const result1 = await hybridHandler['discoverDynamicFields']('issue');
      
      // Reset mock to verify cache hit
      mockJiraClient.searchFields.mockClear();
      
      // Act: Second call should use cache
      const result2 = await hybridHandler['discoverDynamicFields']('issue');
      
      // Assert: API should not be called again
      expect(mockJiraClient.searchFields).not.toHaveBeenCalled();
      expect(result2).toEqual(result1);
      expect(result2).toHaveLength(2); // Only custom fields
    });

    test('should fetch fresh data when cache expires', async () => {
      // Arrange: Handler with very short TTL (1ms)
      hybridHandler = new HybridResourceHandler(mockJiraClient, true, 0.001, 100);
      
      // Act: First call to populate cache
      await hybridHandler['discoverDynamicFields']('issue');
      
      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Reset mock to verify fresh fetch
      mockJiraClient.searchFields.mockClear();
      
      // Act: Second call should fetch fresh data
      await hybridHandler['discoverDynamicFields']('issue');
      
      // Assert: API should be called again
      expect(mockJiraClient.searchFields).toHaveBeenCalledTimes(1);
    });

    test('should update last accessed time on cache hit', async () => {
      // Arrange: Handler with sufficient TTL
      hybridHandler = new HybridResourceHandler(mockJiraClient, true, 3600, 100);
      
      // Access private cache for testing
      const cache = hybridHandler['customFieldsCache'];
      
      // Act: First call to populate cache
      await hybridHandler['discoverDynamicFields']('issue');
      const cacheKey = hybridHandler['buildCacheKey']('issue');
      const firstAccess = cache.get(cacheKey)?.lastAccessed;
      
      // Wait a bit then access again
      await new Promise(resolve => setTimeout(resolve, 5));
      await hybridHandler['discoverDynamicFields']('issue');
      const secondAccess = cache.get(cacheKey)?.lastAccessed;
      
      // Assert: Last accessed time should be updated
      expect(secondAccess).toBeGreaterThan(firstAccess!);
    });
  });

  describe('Race Condition Prevention', () => {
    test('should prevent multiple concurrent API calls for same entity', async () => {
      // Arrange: Handler with cache enabled
      hybridHandler = new HybridResourceHandler(mockJiraClient, true, 3600, 100);
      
      // Setup delayed API response to simulate race condition
      let resolvePromise: (value: JiraField[]) => void;
      const delayedPromise = new Promise<JiraField[]>(resolve => {
        resolvePromise = resolve;
      });
      mockJiraClient.searchFields.mockReturnValue(delayedPromise);
      
      // Act: Start multiple concurrent calls
      const promise1 = hybridHandler['discoverDynamicFields']('issue');
      const promise2 = hybridHandler['discoverDynamicFields']('issue');
      const promise3 = hybridHandler['discoverDynamicFields']('issue');
      
      // Resolve the API call
      resolvePromise!(mockFields);
      
      // Wait for all promises to complete
      const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3]);
      
      // Assert: API should only be called once, all results should be identical
      expect(mockJiraClient.searchFields).toHaveBeenCalledTimes(1);
      expect(result2).toEqual(result1);
      expect(result3).toEqual(result1);
    });

    test('should clean up pending request after completion', async () => {
      // Arrange: Handler with cache enabled
      hybridHandler = new HybridResourceHandler(mockJiraClient, true, 3600, 100);
      
      // Act: Make a call and wait for completion
      await hybridHandler['discoverDynamicFields']('issue');
      
      // Assert: Pending requests map should be empty
      const pendingRequests = hybridHandler['pendingRequests'];
      expect(pendingRequests.size).toBe(0);
    });

    test('should handle different entity types concurrently', async () => {
      // Arrange: Handler with cache enabled
      hybridHandler = new HybridResourceHandler(mockJiraClient, true, 3600, 100);
      
      // Act: Start concurrent calls for different entity types
      const issuePromise = hybridHandler['discoverDynamicFields']('issue');
      const projectPromise = hybridHandler['discoverDynamicFields']('project');
      
      await Promise.all([issuePromise, projectPromise]);
      
      // Assert: Should have separate cache entries
      const cache = hybridHandler['customFieldsCache'];
      expect(cache.has('issue-fields')).toBe(true);
      expect(cache.has('project-fields')).toBe(true);
      expect(mockJiraClient.searchFields).toHaveBeenCalledTimes(2);
    });
  });

  describe('LRU Cache Eviction', () => {
    test('should evict least recently used entry when cache is full', async () => {
      // Arrange: Handler with small cache size (2 entries)
      hybridHandler = new HybridResourceHandler(mockJiraClient, true, 3600, 2);
      
      // Act: Fill cache beyond capacity
      await hybridHandler['discoverDynamicFields']('issue');    // Entry 1
      await hybridHandler['discoverDynamicFields']('project');  // Entry 2
      await hybridHandler['discoverDynamicFields']('user');     // Should evict Entry 1
      
      // Assert: First entry should be evicted
      const cache = hybridHandler['customFieldsCache'];
      expect(cache.has('issue-fields')).toBe(false);      // Evicted
      expect(cache.has('project-fields')).toBe(true);     // Kept
      expect(cache.has('user-fields')).toBe(true);        // New entry
      expect(cache.size).toBe(2);
    });

    test('should not evict recently accessed entries', async () => {
      // Arrange: Handler with small cache size (2 entries)
      hybridHandler = new HybridResourceHandler(mockJiraClient, true, 3600, 2);
      
      // Act: Fill cache
      await hybridHandler['discoverDynamicFields']('issue');    // Entry 1
      await hybridHandler['discoverDynamicFields']('project');  // Entry 2
      
      // Access first entry to make it recently used
      await hybridHandler['discoverDynamicFields']('issue');    // Makes 'issue' most recent
      
      // Add third entry - should evict 'project', not 'issue'
      await hybridHandler['discoverDynamicFields']('user');
      
      // Assert: Project should be evicted, not issue
      const cache = hybridHandler['customFieldsCache'];
      expect(cache.has('issue-fields')).toBe(true);       // Kept (recently accessed)
      expect(cache.has('project-fields')).toBe(false);    // Evicted (least recent)
      expect(cache.has('user-fields')).toBe(true);        // New entry
    });

    test('should handle edge case when cache is at exactly max size', async () => {
      // Arrange: Handler with cache size 1
      hybridHandler = new HybridResourceHandler(mockJiraClient, true, 3600, 1);
      
      // Act: Add entry, then add another
      await hybridHandler['discoverDynamicFields']('issue');
      await hybridHandler['discoverDynamicFields']('project');
      
      // Assert: Only latest entry should remain
      const cache = hybridHandler['customFieldsCache'];
      expect(cache.has('issue-fields')).toBe(false);
      expect(cache.has('project-fields')).toBe(true);
      expect(cache.size).toBe(1);
    });
  });

  describe('Cache Performance Optimization', () => {
    test('should achieve sub-5ms response time for cached results', async () => {
      // Arrange: Handler with cache enabled
      hybridHandler = new HybridResourceHandler(mockJiraClient, true, 3600, 100);
      
      // Prime the cache
      await hybridHandler['discoverDynamicFields']('issue');
      
      // Act: Measure cached response time
      const startTime = Date.now();
      await hybridHandler['discoverDynamicFields']('issue');
      const responseTime = Date.now() - startTime;
      
      // Assert: Should be very fast (sub-5ms)
      expect(responseTime).toBeLessThan(5);
    });

    test('should minimize API calls through intelligent caching', async () => {
      // Arrange: Handler with cache enabled
      hybridHandler = new HybridResourceHandler(mockJiraClient, true, 3600, 100);
      
      // Act: Make multiple calls for same entity type
      await hybridHandler['discoverDynamicFields']('issue');
      await hybridHandler['discoverDynamicFields']('issue');
      await hybridHandler['discoverDynamicFields']('issue');
      
      // Assert: API should only be called once
      expect(mockJiraClient.searchFields).toHaveBeenCalledTimes(1);
    });

    test('should filter and convert fields efficiently', async () => {
      // Arrange: Large field set to test performance
      const largeFieldSet: JiraField[] = Array.from({ length: 200 }, (_, i) => ({
        id: `customfield_${10000 + i}`,
        name: `Custom Field ${i}`,
        custom: i % 2 === 0, // Mix of custom and system fields
        schema: { type: 'string' },
      }));
      
      mockJiraClient.searchFields.mockResolvedValue(largeFieldSet);
      hybridHandler = new HybridResourceHandler(mockJiraClient, true, 3600, 100);
      
      // Act: Process large field set
      const startTime = Date.now();
      const result = await hybridHandler['discoverDynamicFields']('issue');
      const processingTime = Date.now() - startTime;
      
      // Assert: Should only return custom fields and process efficiently
      expect(result).toHaveLength(100); // Only custom fields (50% of 200)
      expect(processingTime).toBeLessThan(50); // Should be fast
      result.forEach(field => {
        expect(field.source).toBe('dynamic');
        expect(field.id).toMatch(/^customfield_/);
      });
    });
  });

  describe('Error Handling and Graceful Fallback', () => {
    test('should return empty array on API failure', async () => {
      // Arrange: Mock API failure
      const apiError = new Error('API connection failed');
      mockJiraClient.searchFields.mockRejectedValue(apiError);
      hybridHandler = new HybridResourceHandler(mockJiraClient, true, 3600, 100);
      
      // Act: Call with failing API
      const result = await hybridHandler['discoverDynamicFields']('issue');
      
      // Assert: Should return empty array gracefully
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    test('should not cache failed requests', async () => {
      // Arrange: Mock API failure then success
      const apiError = new Error('Temporary API failure');
      mockJiraClient.searchFields
        .mockRejectedValueOnce(apiError)
        .mockResolvedValue(mockFields);
      
      hybridHandler = new HybridResourceHandler(mockJiraClient, true, 3600, 100);
      
      // Act: First call fails
      const result1 = await hybridHandler['discoverDynamicFields']('issue');
      
      // Second call succeeds
      const result2 = await hybridHandler['discoverDynamicFields']('issue');
      
      // Assert: Failed request not cached, successful request works
      expect(result1).toEqual([]);
      expect(result2).toHaveLength(2);
      expect(mockJiraClient.searchFields).toHaveBeenCalledTimes(2);
    });

    test('should handle malformed field data gracefully', async () => {
      // Arrange: Mock malformed field data
      const malformedFields = [
        { id: 'customfield_10001', name: 'Valid Field', custom: true },
        { id: null, name: 'Invalid Field 1', custom: true }, // null id
        { id: 'customfield_10002', name: null, custom: true }, // null name
        { id: '', name: 'Invalid Field 2', custom: true }, // empty id
        { custom: true }, // missing id and name
        { id: 'customfield_10003', name: 'Another Valid Field', custom: true },
      ];
      
      mockJiraClient.searchFields.mockResolvedValue(malformedFields as any);
      hybridHandler = new HybridResourceHandler(mockJiraClient, true, 3600, 100);
      
      // Act: Process malformed data
      const result = await hybridHandler['discoverDynamicFields']('issue');
      
      // Assert: Should only return valid fields
      expect(result).toHaveLength(2);
      expect(result.every(field => field.id && field.name)).toBe(true);
    });

    test('should validate entity type input', async () => {
      // Arrange: Handler with cache enabled
      hybridHandler = new HybridResourceHandler(mockJiraClient, true, 3600, 100);
      
      // Act & Assert: Invalid entity types should return empty array
      expect(await hybridHandler['discoverDynamicFields']('')).toEqual([]);
      expect(await hybridHandler['discoverDynamicFields'](null as any)).toEqual([]);
      expect(await hybridHandler['discoverDynamicFields'](undefined as any)).toEqual([]);
      expect(await hybridHandler['discoverDynamicFields'](123 as any)).toEqual([]);
      
      // API should not be called for invalid inputs
      expect(mockJiraClient.searchFields).not.toHaveBeenCalled();
    });
  });

  describe('Cache Key Generation and Validation', () => {
    test('should generate consistent cache keys', async () => {
      // Arrange: Handler with cache enabled
      hybridHandler = new HybridResourceHandler(mockJiraClient, true, 3600, 100);
      
      // Act: Generate cache keys
      const key1 = hybridHandler['buildCacheKey']('issue');
      const key2 = hybridHandler['buildCacheKey']('ISSUE'); // Different case
      const key3 = hybridHandler['buildCacheKey']('issue');
      
      // Assert: Should be consistent and lowercase
      expect(key1).toBe('issue-fields');
      expect(key2).toBe('issue-fields'); // Should normalize to lowercase
      expect(key3).toBe(key1); // Should be identical
    });

    test('should reject invalid cache key inputs', () => {
      // Arrange: Handler with cache enabled
      hybridHandler = new HybridResourceHandler(mockJiraClient, true, 3600, 100);
      
      // Act & Assert: Should throw for invalid inputs
      expect(() => hybridHandler['buildCacheKey']('')).toThrow('Invalid entity type');
      expect(() => hybridHandler['buildCacheKey'](null as any)).toThrow('Invalid entity type');
      expect(() => hybridHandler['buildCacheKey'](undefined as any)).toThrow('Invalid entity type');
      expect(() => hybridHandler['buildCacheKey'](123 as any)).toThrow('Invalid entity type');
    });

    test('should handle special characters in entity types', () => {
      // Arrange: Handler with cache enabled
      hybridHandler = new HybridResourceHandler(mockJiraClient, true, 3600, 100);
      
      // Act: Generate keys for entity types with special characters
      const key1 = hybridHandler['buildCacheKey']('issue-type');
      const key2 = hybridHandler['buildCacheKey']('custom_field');
      
      // Assert: Should handle special characters
      expect(key1).toBe('issue-type-fields');
      expect(key2).toBe('custom_field-fields');
    });
  });

  describe('Field Conversion and Validation', () => {
    test('should convert Jira fields to FieldDefinition format correctly', async () => {
      // Arrange: Handler with cache enabled
      hybridHandler = new HybridResourceHandler(mockJiraClient, true, 3600, 100);
      
      // Act: Discover fields and check conversion
      const result = await hybridHandler['discoverDynamicFields']('issue');
      
      // Assert: Check field structure
      expect(result).toHaveLength(2);
      
      const storyPointsField = result.find(f => f.id === 'customfield_10001');
      expect(storyPointsField).toMatchObject({
        id: 'customfield_10001',
        name: 'Story Points',
        description: 'Dynamic custom field: Story Points',
        type: 'string', // Mapped from number type
        source: 'dynamic',
        confidence: 'high',
      });
      
      expect(storyPointsField?.accessPaths).toHaveLength(1);
      expect(storyPointsField?.accessPaths[0]).toMatchObject({
        path: 'customfield_10001',
        description: 'Access Story Points value',
        frequency: 'medium',
      });
    });

    test('should map Jira types to correct field types', () => {
      // Arrange: Handler with cache enabled
      hybridHandler = new HybridResourceHandler(mockJiraClient, true, 3600, 100);
      
      // Act: Test type mappings through private method
      expect(hybridHandler['mapJiraTypeToFieldType']('array')).toBe('array');
      expect(hybridHandler['mapJiraTypeToFieldType']('object')).toBe('object');
      expect(hybridHandler['mapJiraTypeToFieldType']('user')).toBe('object');
      expect(hybridHandler['mapJiraTypeToFieldType']('string')).toBe('string');
      expect(hybridHandler['mapJiraTypeToFieldType']('number')).toBe('string');
      expect(hybridHandler['mapJiraTypeToFieldType']('')).toBe('string');
      expect(hybridHandler['mapJiraTypeToFieldType'](null as any)).toBe('string');
    });

    test('should map Jira types to correct TypeScript types', () => {
      // Arrange: Handler with cache enabled
      hybridHandler = new HybridResourceHandler(mockJiraClient, true, 3600, 100);
      
      // Act: Test TypeScript type mappings
      expect(hybridHandler['mapJiraTypeToTSType']('number')).toBe('number');
      expect(hybridHandler['mapJiraTypeToTSType']('boolean')).toBe('boolean');
      expect(hybridHandler['mapJiraTypeToTSType']('array')).toBe('any[]');
      expect(hybridHandler['mapJiraTypeToTSType']('object')).toBe('object');
      expect(hybridHandler['mapJiraTypeToTSType']('date')).toBe('string');
      expect(hybridHandler['mapJiraTypeToTSType']('datetime')).toBe('string');
      expect(hybridHandler['mapJiraTypeToTSType']('string')).toBe('string');
      expect(hybridHandler['mapJiraTypeToTSType']('')).toBe('string');
    });

    test('should validate field IDs correctly', () => {
      // Arrange: Handler with cache enabled
      hybridHandler = new HybridResourceHandler(mockJiraClient, true, 3600, 100);
      
      // Act & Assert: Test field ID validation
      expect(hybridHandler['isValidFieldId']('customfield_10001')).toBe(true);
      expect(hybridHandler['isValidFieldId']('summary')).toBe(true);
      expect(hybridHandler['isValidFieldId']('')).toBe(false);
      expect(hybridHandler['isValidFieldId']('   ')).toBe(false);
      expect(hybridHandler['isValidFieldId'](null)).toBe(false);
      expect(hybridHandler['isValidFieldId'](undefined)).toBe(false);
      expect(hybridHandler['isValidFieldId'](123)).toBe(false);
    });
  });

  describe('Cache Statistics and Monitoring', () => {
    test('should maintain accurate cache size', async () => {
      // Arrange: Handler with cache enabled
      hybridHandler = new HybridResourceHandler(mockJiraClient, true, 3600, 5);
      
      // Act: Add entries and track size
      await hybridHandler['discoverDynamicFields']('issue');
      expect(hybridHandler['customFieldsCache'].size).toBe(1);
      
      await hybridHandler['discoverDynamicFields']('project');
      expect(hybridHandler['customFieldsCache'].size).toBe(2);
      
      await hybridHandler['discoverDynamicFields']('user');
      expect(hybridHandler['customFieldsCache'].size).toBe(3);
    });

    test('should handle cache timestamps correctly', async () => {
      // Arrange: Handler with cache enabled
      hybridHandler = new HybridResourceHandler(mockJiraClient, true, 3600, 100);
      
      const startTime = Date.now();
      
      // Act: Add cache entry
      await hybridHandler['discoverDynamicFields']('issue');
      
      const endTime = Date.now();
      const cacheEntry = hybridHandler['customFieldsCache'].get('issue-fields');
      
      // Assert: Timestamp should be within test execution time
      expect(cacheEntry?.timestamp).toBeGreaterThanOrEqual(startTime);
      expect(cacheEntry?.timestamp).toBeLessThanOrEqual(endTime);
      expect(cacheEntry?.lastAccessed).toBe(cacheEntry?.timestamp);
    });
  });
});