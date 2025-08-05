/**
 * Feature Flags Service
 * 
 * Client-side service for interacting with feature flags.
 * Provides API for checking, managing, and caching feature flags.
 */

import axios from 'axios';
import { store } from '../redux/store';
import { setFlags, toggleFlag, addFlag, removeFlag, updateFlag } from '../redux/slices/featureFlags.slice';

// Types
export interface FeatureFlag {
  enabled: boolean;
  description: string;
  createdAt: string;
  modifiedAt: string;
  owner: string;
  rolloutPercentage: number;
  segmentRules: Record<string, any>;
  environmentsEnabled: string[];
  metadata?: Record<string, any>;
}

export type FlagStatus = 'enabled' | 'disabled' | 'partial';

// Cache settings
const FLAG_CACHE_TTL = 60000; // 1 minute in milliseconds
const FLAG_CACHE_KEY_PREFIX = 'feature-flag:';

// In-memory cache
interface CacheEntry {
  data: boolean;
  timestamp: number;
}
const flagCache = new Map<string, CacheEntry>();

/**
 * Feature Flags Service
 */
const featureFlagsService = {
  /**
   * Check if a feature flag is enabled
   * @param key - Feature flag key
   * @param options - Options for checking the flag
   * @returns Promise<boolean>
   */
  async isEnabled(key: string, options: { useCache?: boolean } = {}): Promise<boolean> {
    const opts = {
      useCache: true,
      ...options
    };

    // Try to get from cache first
    if (opts.useCache) {
      const cachedValue = this.getFromCache(key);
      if (cachedValue !== null) {
        return cachedValue;
      }
    }

    try {
      const response = await axios.get(`/api/feature-flags/${key}/status`);
      const enabled = response.data.data.enabled;
      
      // Cache the result
      this.saveToCache(key, enabled);
      
      return enabled;
    } catch (_error) {
      console.error(`Error checking feature flag ${key}:`, error);
      return false;
    }
  },

  /**
   * Get all feature flags (admin only)
   * @returns Promise<Record<string, FeatureFlag>>
   */
  async getAllFlags(): Promise<Record<string, FeatureFlag>> {
    try {
      const response = await axios.get('/api/feature-flags');
      const flags = response.data.data;
      
      // Update Redux store
      store.dispatch(setFlags(flags));
      
      return flags;
    } catch (_error) {
      console.error('Error fetching feature flags:', error);
      return {};
    }
  },

  /**
   * Update a feature flag (admin only)
   * @param key - Feature flag key
   * @param flagData - Feature flag data
   * @returns Promise<FeatureFlag>
   */
  async updateFlag(key: string, flagData: Partial<FeatureFlag>): Promise<FeatureFlag> {
    try {
      const response = await axios.put(`/api/feature-flags/${key}`, flagData);
      const updatedFlag = response.data.data;
      
      // Update Redux store
      store.dispatch(updateFlag({ key, flag: updatedFlag }));
      
      // Clear cache for this flag
      this.clearCache(key);
      
      return updatedFlag;
    } catch (_error) {
      console.error(`Error updating feature flag ${key}:`, error);
      throw error;
    }
  },

  /**
   * Toggle a feature flag (admin only)
   * @param key - Feature flag key
   * @returns Promise<FeatureFlag>
   */
  async toggleFlag(key: string): Promise<FeatureFlag> {
    try {
      // Get current flag data
      const { [key]: currentFlag } = await this.getAllFlags();
      
      if (!currentFlag) {
        throw new Error(`Feature flag ${key} not found`);
      }
      
      // Toggle the flag
      const updatedFlag = await this.updateFlag(key, { 
        enabled: !currentFlag.enabled 
      });
      
      // Update Redux store
      store.dispatch(toggleFlag(key));
      
      return updatedFlag;
    } catch (_error) {
      console.error(`Error toggling feature flag ${key}:`, error);
      throw error;
    }
  },

  /**
   * Delete a feature flag (admin only)
   * @param key - Feature flag key
   * @returns Promise<boolean>
   */
  async deleteFlag(key: string): Promise<boolean> {
    try {
      await axios.delete(`/api/feature-flags/${key}`);
      
      // Update Redux store
      store.dispatch(removeFlag(key));
      
      // Clear cache for this flag
      this.clearCache(key);
      
      return true;
    } catch (_error) {
      console.error(`Error deleting feature flag ${key}:`, error);
      return false;
    }
  },

  /**
   * Sync feature flags (admin only)
   * @returns Promise<boolean>
   */
  async syncFlags(): Promise<boolean> {
    try {
      await axios.post('/api/feature-flags/sync');
      
      // Refresh flags in Redux store
      await this.getAllFlags();
      
      // Clear all cache
      this.clearAllCache();
      
      return true;
    } catch (_error) {
      console.error('Error syncing feature flags:', error);
      return false;
    }
  },

  /**
   * Get a feature flag from cache
   * @param key - Feature flag key
   * @returns boolean | null
   */
  getFromCache(key: string): boolean | null {
    const cacheKey = `${FLAG_CACHE_KEY_PREFIX}${key}`;
    const entry = flagCache.get(cacheKey);
    
    if (!entry) {
      return null;
    }
    
    // Check if cache is still valid
    if (Date.now() - entry.timestamp > FLAG_CACHE_TTL) {
      flagCache.delete(cacheKey);
      return null;
    }
    
    return entry.data;
  },

  /**
   * Save a feature flag to cache
   * @param key - Feature flag key
   * @param value - Flag value
   */
  saveToCache(key: string, value: boolean): void {
    const cacheKey = `${FLAG_CACHE_KEY_PREFIX}${key}`;
    flagCache.set(cacheKey, {
      data: value,
      timestamp: Date.now()
    });
  },

  /**
   * Clear cache for a specific flag
   * @param key - Feature flag key
   */
  clearCache(key: string): void {
    const cacheKey = `${FLAG_CACHE_KEY_PREFIX}${key}`;
    flagCache.delete(cacheKey);
  },

  /**
   * Clear all feature flag cache
   */
  clearAllCache(): void {
    flagCache.clear();
  }
};

export default featureFlagsService; 