/**
 * Client-side Cache Service
 * 
 * This service provides client-side caching capabilities for API responses
 * to complement server-side query caching.
 * 
 * Task: TS364 - Query result caching implementation
 */

// Cache storage
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class ClientCache {
  private cache: Map<string, CacheItem<any>>;
  private maxSize: number;
  private defaultTTL: number;
  private enabled: boolean;

  constructor(options: { maxSize?: number; defaultTTL?: number; enabled?: boolean } = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || 100;
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000; // 5 minutes in milliseconds
    this.enabled = options.enabled !== undefined ? options.enabled : true;
  }

  /**
   * Get an item from cache
   * @param key Cache key
   * @returns Cached data or null if not found or expired
   */
  get<T>(key: string): T | null {
    if (!this.enabled) return null;

    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }

  /**
   * Set an item in cache
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time to live in milliseconds (optional)
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    if (!this.enabled) return;
    
    // Evict oldest items if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.findOldestKey();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    });
  }

  /**
   * Delete an item from cache
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all items from cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear all items matching a pattern
   * @param pattern Regex pattern to match keys
   * @returns Number of items cleared
   */
  clearPattern(pattern: RegExp): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Find the oldest key in cache (for eviction)
   * @returns Oldest key or null if cache is empty
   */
  private findOldestKey(): string | null {
    if (this.cache.size === 0) return null;
    
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  getStats(): { size: number; maxSize: number; enabled: boolean } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      enabled: this.enabled
    };
  }

  /**
   * Enable or disable cache
   * @param enabled Whether cache is enabled
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.clear();
    }
  }
}

// Create singleton instance
const clientCache = new ClientCache({
  maxSize: 200,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  enabled: true
});

export default clientCache; 