/**
 * Feature Flag Hook
 * 
 * This hook provides a convenient way to check if a feature flag is enabled.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAppSelector } from '../redux/store';
import featureFlagsService from '../services/featureFlags.service';

interface UseFeatureFlagOptions {
  defaultValue?: boolean;
  useCache?: boolean;
  pollInterval?: number | null;
}

/**
 * Hook for checking if a feature flag is enabled
 * 
 * @param flagKey - Feature flag key
 * @param options - Options for the hook
 * @returns [isEnabled, { loading, error, refresh }]
 */
const useFeatureFlag = (
  flagKey: string,
  options: UseFeatureFlagOptions = {}
): [boolean, { loading: boolean; error: string | null; refresh: () => Promise<void> }] => {
  const {
    defaultValue = false,
    useCache = true,
    pollInterval = null
  } = options;

  const [isEnabled, setIsEnabled] = useState<boolean>(defaultValue);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get feature flags from Redux store (admin only)
  const { flags, initialized } = useAppSelector(state => state.featureFlags);
  const flagFromStore = flags[flagKey];
  
  // Function to check if the flag is enabled
  const checkFlag = useCallback(async () => {
    try {
      setLoading(true);
      
      // If the flag is in the Redux store and it's initialized, use that value
      if (initialized && flagFromStore !== undefined) {
        setIsEnabled(flagFromStore.enabled);
      } else {
        // Otherwise, check via API
        const enabled = await featureFlagsService.isEnabled(flagKey, { useCache });
        setIsEnabled(enabled);
      }
      
      setError(null);
    } catch (_err) {
      console.error(`Error checking feature flag ${flagKey}:`, _err);
      setError(_err instanceof Error ? _err.message : 'Unknown error');
      
      // Fall back to default value on error
      setIsEnabled(defaultValue);
    } finally {
      setLoading(false);
    }
  }, [flagKey, useCache, defaultValue, initialized, flagFromStore]);
  
  // Function to refresh the flag status
  const refresh = useCallback(async () => {
    // Clear the cache for this flag before checking
    featureFlagsService.clearCache(flagKey);
    await checkFlag();
  }, [flagKey, checkFlag]);
  
  // Check the flag on mount and when dependencies change
  useEffect(() => {
    checkFlag();
  }, [checkFlag]);
  
  // Set up polling if requested
  useEffect(() => {
    if (pollInterval && pollInterval > 0) {
      const interval = setInterval(() => {
        checkFlag();
      }, pollInterval);
      
      return () => clearInterval(interval);
    }
  }, [pollInterval, checkFlag]);
  
  return [isEnabled, { loading, error, refresh }];
};

export default useFeatureFlag; 