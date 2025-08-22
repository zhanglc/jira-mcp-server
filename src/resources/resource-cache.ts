/**
 * Resource Cache - Memory-based caching for resource content
 * 
 * Provides efficient caching with TTL and size limits
 */

import type { Logger } from 'winston';
import type { 
  ResourceUriPattern, 
  ResourceCacheEntry, 
  ResourceMetadata,
  IsoDateString
} from '@/types';

export class ResourceCache {
  private cache = new Map<ResourceUriPattern, ResourceCacheEntry>();
  private readonly maxSize: number = 100;
  private readonly defaultTtl: number = 3600; // 1 hour in seconds

  constructor(private logger: Logger) {
    // Clean expired entries every 5 minutes
    setInterval(() => {
      this.cleanExpiredEntries();
    }, 5 * 60 * 1000);
  }

  /**
   * Get cached resource content
   */
  async get(uri: ResourceUriPattern): Promise<ResourceCacheEntry | null> {
    const entry = this.cache.get(uri);
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
      this.cache.delete(uri);
      this.logger.debug(`Cache entry expired and removed: ${uri}`);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = new Date().toISOString() as IsoDateString;

    this.logger.debug(`Cache hit for resource: ${uri}`);
    return entry;
  }

  /**
   * Cache resource content
   */
  async set(
    uri: ResourceUriPattern, 
    content: any, 
    metadata: ResourceMetadata,
    ttl?: number
  ): Promise<void> {
    // Check cache size limit
    if (this.cache.size >= this.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + (ttl || this.defaultTtl) * 1000);

    const entry: ResourceCacheEntry = {
      uri,
      content,
      metadata,
      cachedAt: now.toISOString() as IsoDateString,
      expiresAt: expiresAt.toISOString() as IsoDateString,
      accessCount: 0,
      lastAccessed: now.toISOString() as IsoDateString,
      validated: true
    };

    this.cache.set(uri, entry);
    this.logger.debug(`Cached resource: ${uri} (expires: ${expiresAt.toISOString()})`);
  }

  /**
   * Delete cached resource
   */
  async delete(uri: ResourceUriPattern): Promise<boolean> {
    const deleted = this.cache.delete(uri);
    if (deleted) {
      this.logger.debug(`Removed from cache: ${uri}`);
    }
    return deleted;
  }

  /**
   * Clear all cached resources
   */
  async clear(): Promise<void> {
    const count = this.cache.size;
    this.cache.clear();
    this.logger.debug(`Cleared ${count} entries from resource cache`);
  }

  /**
   * Check if resource is cached
   */
  has(uri: ResourceUriPattern): boolean {
    const entry = this.cache.get(uri);
    if (!entry) {
      return false;
    }

    // Check expiration
    if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
      this.cache.delete(uri);
      return false;
    }

    return true;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    let totalAccess = 0;
    let validEntries = 0;
    const now = new Date();

    for (const entry of this.cache.values()) {
      totalAccess += entry.accessCount;
      
      if (!entry.expiresAt || new Date(entry.expiresAt) > now) {
        validEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      totalAccess,
      maxSize: this.maxSize,
      utilization: this.cache.size / this.maxSize
    };
  }

  /**
   * Clean expired cache entries
   */
  private cleanExpiredEntries(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [uri, entry] of this.cache.entries()) {
      if (entry.expiresAt && new Date(entry.expiresAt) < now) {
        this.cache.delete(uri);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned ${cleanedCount} expired cache entries`);
    }
  }

  /**
   * Evict least recently used entry to make space
   */
  private evictLeastRecentlyUsed(): void {
    let oldestUri: ResourceUriPattern | null = null;
    let oldestTime = new Date();

    for (const [uri, entry] of this.cache.entries()) {
      const lastAccessed = new Date(entry.lastAccessed);
      if (lastAccessed < oldestTime) {
        oldestTime = lastAccessed;
        oldestUri = uri;
      }
    }

    if (oldestUri) {
      this.cache.delete(oldestUri);
      this.logger.debug(`Evicted LRU cache entry: ${oldestUri}`);
    }
  }
}

/**
 * Cache statistics interface
 */
export interface CacheStats {
  totalEntries: number;
  validEntries: number;
  totalAccess: number;
  maxSize: number;
  utilization: number;
}