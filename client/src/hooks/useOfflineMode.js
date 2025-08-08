import { useState, useEffect } from 'react';
import { addConnectivityListeners, isOnline } from '../utils/serviceWorkerUtils';

/**
 * Hook for handling offline mode functionality
 * @returns {Object} Object containing isOffline flag and utility functions
 */
const useOfflineMode = () => {
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [offlineFeatures, setOfflineFeatures] = useState({
    dashboard: true,
    suppliers: {
      list: true,
      details: false,
      edit: false
    },
    customers: {
      list: true,
      details: false
    },
    inspections: {
      list: false,
      details: false
    }
  });

  useEffect(() => {
    // Set up online/offline listeners
    const removeListeners = addConnectivityListeners(
      () => setIsOffline(false),
      () => setIsOffline(true)
    );

    // Clean up listeners on unmount
    return () => {
      removeListeners();
    };
  }, []);

  /**
   * Check if a specific feature is enabled in offline mode
   * @param {string} featurePath - Dot notation path to the feature (e.g., 'suppliers.list')
   * @returns {boolean} Whether the feature is enabled
   */
  const isFeatureEnabled = (featurePath) => {
    if (!isOffline) return true;

    // Handle simple features
    if (!featurePath.includes('.')) {
      return offlineFeatures[featurePath] || false;
    }

    // Handle nested features
    const parts = featurePath.split('.');
    let current = offlineFeatures;

    for (const part of parts) {
      if (current[part] === undefined) return false;
      
      if (typeof current[part] === 'boolean') {
        return current[part];
      }
      
      current = current[part];
    }

    return Boolean(current);
  };

  /**
   * Get cached data for offline use
   * @param {string} key - Cache key
   * @returns {Promise<any>} Cached data or null
   */
  const getCachedData = async (key) => {
    try {
      // In a real app, this would get data from IndexedDB
      const cachedData = localStorage.getItem(`offline_${key}`);
      return cachedData ? JSON.parse(cachedData) : null;
    } catch (_error) {
      console.error('Error getting cached data:', _error);
      return null;
    }
  };

  /**
   * Store data for offline use
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   */
  const cacheData = (key, data) => {
    try {
      // In a real app, this would store data in IndexedDB
      localStorage.setItem(`offline_${key}`, JSON.stringify(data));
    } catch (_error) {
      console.error('Error caching data:', _error);
    }
  };

  /**
   * Queue an action to be performed when back online
   * @param {string} action - Action type
   * @param {any} data - Action data
   */
  const queueOfflineAction = (action, data) => {
    try {
      // Get existing queue
      const queueString = localStorage.getItem('offline_action_queue') || '[]';
      const queue = JSON.parse(queueString);
      
      // Add new action to queue
      queue.push({
        id: Date.now(),
        action,
        data,
        timestamp: new Date().toISOString()
      });
      
      // Save updated queue
      localStorage.setItem('offline_action_queue', JSON.stringify(queue));
    } catch (_error) {
      console.error('Error queueing offline action:', _error);
    }
  };

  return {
    isOffline,
    isFeatureEnabled,
    getCachedData,
    cacheData,
    queueOfflineAction
  };
};

export default useOfflineMode; 