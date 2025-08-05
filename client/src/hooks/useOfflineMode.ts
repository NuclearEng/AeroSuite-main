import { useState, useEffect, useCallback } from 'react';
import { isOnline, addConnectivityListeners } from '../utils/serviceWorkerUtils';

interface UseOfflineModeOptions {
  onOffline?: () => void;
  onOnline?: () => void;
}

/**
 * Hook to manage offline status and network connectivity
 * 
 * @param options Configuration options
 * @returns Object with offline status and related utilities
 */
const useOfflineMode = (options: UseOfflineModeOptions = {}) => {
  const [isOffline, setIsOffline] = useState<boolean>(!isOnline());

  // Custom handlers from options
  const { onOffline, onOnline } = options;

  // Handle offline event
  const handleOffline = useCallback(() => {
    setIsOffline(true);
    if (onOffline) onOffline();
  }, [onOffline]);

  // Handle online event
  const handleOnline = useCallback(() => {
    setIsOffline(false);
    if (onOnline) onOnline();
  }, [onOnline]);

  // Set up online/offline event listeners
  useEffect(() => {
    // Set initial value
    setIsOffline(!isOnline());
    
    // Add event listeners for online/offline events
    const cleanup = addConnectivityListeners(handleOnline, handleOffline);
    
    return cleanup;
  }, [handleOffline, handleOnline]);

  /**
   * Check if a specific feature should be enabled in offline mode
   * @param featureKey The feature key to check
   * @returns true if the feature should be enabled
   */
  const isFeatureEnabled = useCallback((featureKey: string): boolean => {
    if (!isOffline) {
      // All features are enabled when online
      return true;
    }

    // Define which features are available offline
    const offlineFeatures: Record<string, boolean> = {
      'inspections.view': true,
      'inspections.create': false,
      'inspections.edit': true,
      'inspections.delete': false,
      'suppliers.view': true,
      'suppliers.create': false,
      'reports.view': true,
      'reports.generate': false,
      'customers.view': true,
    };

    return offlineFeatures[featureKey] || false;
  }, [isOffline]);

  return {
    isOffline,
    isOnline: !isOffline,
    isFeatureEnabled,
  };
};

export default useOfflineMode; 