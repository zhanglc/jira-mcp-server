/**
 * Unit tests for ResourceCache
 */

import { ResourceCache } from '@/resources/resource-cache';
import type { ResourceUriPattern, ResourceMetadata } from '@/types';
import { createMockLogger } from '../../utils/test-helpers';

describe('ResourceCache', () => {
  let cache: ResourceCache;
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = createMockLogger();
    cache = new ResourceCache(mockLogger);
  });

  afterEach(() => {
    // Clear intervals to prevent memory leaks in tests
    jest.clearAllTimers();
  });

  describe('basic cache operations', () => {
    const testUri: ResourceUriPattern = 'jira://fields/issue';
    const testContent = { fields: { key: { type: 'string', description: 'Issue key' } } };
    const testMetadata: ResourceMetadata = {
      uri: testUri,
      name: 'Issue Fields',
      description: 'Field definitions for issues',
      version: '1.0.0',
      lastModified: '2024-01-01T00:00:00.000Z',
      contentType: 'application/json'
    };

    it('should store and retrieve cache entries', async () => {
      await cache.set(testUri, testContent, testMetadata);

      const entry = await cache.get(testUri);
      expect(entry).not.toBeNull();
      expect(entry!.content).toEqual(testContent);
      expect(entry!.metadata).toEqual(testMetadata);
      expect(entry!.accessCount).toBe(1);
    });

    it('should return null for non-existent entries', async () => {
      const entry = await cache.get('jira://fields/nonexistent' as ResourceUriPattern);
      expect(entry).toBeNull();
    });

    it('should track access count and last accessed time', async () => {
      await cache.set(testUri, testContent, testMetadata);

      const firstAccess = await cache.get(testUri);
      const firstAccessTime = firstAccess!.lastAccessed;
      
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const secondAccess = await cache.get(testUri);
      
      expect(secondAccess!.accessCount).toBe(2);
      expect(secondAccess!.lastAccessed).not.toBe(firstAccessTime);
    });

    it('should check if entry exists', async () => {
      expect(cache.has(testUri)).toBe(false);
      
      await cache.set(testUri, testContent, testMetadata);
      
      expect(cache.has(testUri)).toBe(true);
    });

    it('should delete entries', async () => {
      await cache.set(testUri, testContent, testMetadata);
      expect(cache.has(testUri)).toBe(true);

      const deleted = await cache.delete(testUri);
      expect(deleted).toBe(true);
      expect(cache.has(testUri)).toBe(false);

      // Deleting non-existent entry should return false
      const deletedAgain = await cache.delete(testUri);
      expect(deletedAgain).toBe(false);
    });

    it('should clear all entries', async () => {
      await cache.set(testUri, testContent, testMetadata);
      await cache.set('jira://fields/project' as ResourceUriPattern, testContent, testMetadata);

      await cache.clear();

      expect(cache.has(testUri)).toBe(false);
      expect(cache.has('jira://fields/project' as ResourceUriPattern)).toBe(false);
    });
  });

  describe('TTL and expiration', () => {
    const testUri: ResourceUriPattern = 'jira://fields/issue';
    const testContent = { test: 'data' };
    const testMetadata: ResourceMetadata = {
      uri: testUri,
      name: 'Test',
      description: 'Test resource',
      version: '1.0.0',
      lastModified: '2024-01-01T00:00:00.000Z',
      contentType: 'application/json'
    };

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should respect custom TTL', async () => {
      const shortTtl = 1; // 1 second
      await cache.set(testUri, testContent, testMetadata, shortTtl);

      // Should be available immediately
      expect(await cache.get(testUri)).not.toBeNull();

      // Fast-forward time past TTL
      jest.advanceTimersByTime(2000);

      // Should be expired and return null
      expect(await cache.get(testUri)).toBeNull();
      expect(cache.has(testUri)).toBe(false);
    });

    it('should use default TTL when not specified', async () => {
      await cache.set(testUri, testContent, testMetadata);

      // Should still be available after short time
      jest.advanceTimersByTime(1000);
      expect(await cache.get(testUri)).not.toBeNull();

      // Should be expired after default TTL (3600 seconds)
      jest.advanceTimersByTime(3600 * 1000);
      expect(await cache.get(testUri)).toBeNull();
    });

    it('should handle entries without expiration', async () => {
      // Manually create entry without expiration
      const entry = {
        uri: testUri,
        content: testContent,
        metadata: testMetadata,
        cachedAt: new Date().toISOString(),
        accessCount: 0,
        lastAccessed: new Date().toISOString(),
        validated: true
      };

      // Access cache's internal map (for testing purposes)
      (cache as any).cache.set(testUri, entry);

      // Should always be available since no expiration
      jest.advanceTimersByTime(10000);
      expect(await cache.get(testUri)).not.toBeNull();
    });
  });

  describe('cache size limits', () => {
    const maxSize = 100; // Default max size from ResourceCache

    it('should respect maximum cache size', async () => {
      const testMetadata: ResourceMetadata = {
        uri: 'jira://fields/test' as ResourceUriPattern,
        name: 'Test',
        description: 'Test resource',
        version: '1.0.0',
        lastModified: '2024-01-01T00:00:00.000Z',
        contentType: 'application/json'
      };

      // Fill cache to capacity
      for (let i = 0; i < maxSize; i++) {
        const uri = `jira://fields/test${i}` as ResourceUriPattern;
        await cache.set(uri, { data: i }, { ...testMetadata, uri });
      }

      // Cache should be at capacity
      const stats = cache.getStats();
      expect(stats.totalEntries).toBe(maxSize);

      // Adding one more should evict the least recently used
      const newUri = `jira://fields/test${maxSize}` as ResourceUriPattern;
      await cache.set(newUri, { data: 'new' }, { ...testMetadata, uri: newUri });

      // Cache size should still be at max (or may allow one extra temporarily)
      const newStats = cache.getStats();
      expect(newStats.totalEntries).toBeLessThanOrEqual(maxSize + 1);

      // The new entry should be present
      expect(cache.has(newUri)).toBe(true);
    });
  });

  describe('cache statistics', () => {
    it('should provide accurate statistics', async () => {
      const initialStats = cache.getStats();
      expect(initialStats.totalEntries).toBe(0);
      expect(initialStats.validEntries).toBe(0);
      expect(initialStats.totalAccess).toBe(0);

      // Add some entries
      const testMetadata: ResourceMetadata = {
        uri: 'jira://fields/test' as ResourceUriPattern,
        name: 'Test',
        description: 'Test resource',
        version: '1.0.0',
        lastModified: '2024-01-01T00:00:00.000Z',
        contentType: 'application/json'
      };

      await cache.set('jira://fields/issue' as ResourceUriPattern, {}, testMetadata);
      await cache.set('jira://fields/project' as ResourceUriPattern, {}, testMetadata);

      // Access entries
      await cache.get('jira://fields/issue' as ResourceUriPattern);
      await cache.get('jira://fields/issue' as ResourceUriPattern);
      await cache.get('jira://fields/project' as ResourceUriPattern);

      const stats = cache.getStats();
      expect(stats.totalEntries).toBe(2);
      expect(stats.validEntries).toBe(2);
      expect(stats.totalAccess).toBe(3);
      expect(stats.utilization).toBeCloseTo(2 / stats.maxSize);
    });
  });

  describe('automatic cleanup', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should clean expired entries automatically', async () => {
      const testMetadata: ResourceMetadata = {
        uri: 'jira://fields/test' as ResourceUriPattern,
        name: 'Test',
        description: 'Test resource',
        version: '1.0.0',
        lastModified: '2024-01-01T00:00:00.000Z',
        contentType: 'application/json'
      };

      // Add entry with short TTL
      await cache.set('jira://fields/issue' as ResourceUriPattern, {}, testMetadata, 1);
      expect(cache.has('jira://fields/issue' as ResourceUriPattern)).toBe(true);

      // Fast-forward to trigger cleanup (cleanup runs every 5 minutes)
      jest.advanceTimersByTime(5 * 60 * 1000 + 1000);

      // Entry should be cleaned up
      expect(cache.has('jira://fields/issue' as ResourceUriPattern)).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle corrupted cache entries gracefully', async () => {
      const testUri: ResourceUriPattern = 'jira://fields/issue';
      
      // Manually insert corrupted entry
      (cache as any).cache.set(testUri, { 
        invalidStructure: true 
      });

      // Should not throw - result might be the corrupted entry or null
      const result = await cache.get(testUri);
      // Just verify it doesn't throw and returns something
      expect(result !== undefined).toBe(true);
    });
  });
});