import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import userAnalyticsService, { EventCategory } from '../services/userAnalytics.service';

/**
 * Hook for tracking user analytics
 * 
 * @param options Configuration options
 * @returns Analytics tracking methods
 */
export const useAnalytics = (options: {
  trackPageViews?: boolean;
  pageViewDelay?: number;
} = {}) => {
  const location = useLocation();
  const { trackPageViews = true, pageViewDelay = 500 } = options;
  
  // Track page views automatically
  useEffect(() => {
    if (trackPageViews) {
      // Small delay to ensure page has loaded
      const timeoutId = setTimeout(() => {
        const title = document.title;
        userAnalyticsService.trackPageView(location.pathname, title);
      }, pageViewDelay);
      
      return () => clearTimeout(timeoutId);
    }
  }, [location.pathname, trackPageViews, pageViewDelay]);
  
  // Wrap service methods for ease of use in components
  const trackEvent = useCallback(userAnalyticsService.trackEvent, []);
  
  const trackInteraction = useCallback(
    (action: string, label?: string, value?: number, metadata?: Record<string, any>) => {
      return userAnalyticsService.trackInteraction(action, label, value, metadata);
    },
    []
  );
  
  const trackFormInteraction = useCallback(
    (formId: string, action: string, metadata?: Record<string, any>) => {
      return userAnalyticsService.trackFormInteraction(formId, action, metadata);
    },
    []
  );
  
  const trackFeatureUsage = useCallback(
    (feature: string, action: string, metadata?: Record<string, any>) => {
      return userAnalyticsService.trackFeatureUsage(feature, action, metadata);
    },
    []
  );
  
  const trackConversion = useCallback(
    (conversionType: string, value?: number, metadata?: Record<string, any>) => {
      return userAnalyticsService.trackConversion(conversionType, value, metadata);
    },
    []
  );
  
  // Create tracking helpers for common UI interactions
  const trackButtonClick = useCallback(
    (buttonId: string, metadata?: Record<string, any>) => {
      return userAnalyticsService.trackInteraction('click', buttonId, undefined, metadata);
    },
    []
  );
  
  const trackLinkClick = useCallback(
    (linkUrl: string, metadata?: Record<string, any>) => {
      return userAnalyticsService.trackInteraction('click', linkUrl, undefined, {
        type: 'link',
        ...metadata
      });
    },
    []
  );
  
  const trackFormSubmit = useCallback(
    (formId: string, metadata?: Record<string, any>) => {
      return userAnalyticsService.trackFormInteraction(formId, 'submit', metadata);
    },
    []
  );
  
  const trackFormError = useCallback(
    (formId: string, errorDetails: Record<string, any>) => {
      return userAnalyticsService.trackFormInteraction(formId, 'error', errorDetails);
    },
    []
  );
  
  const trackSearch = useCallback(
    (searchTerm: string, resultsCount?: number, metadata?: Record<string, any>) => {
      return userAnalyticsService.trackInteraction('search', searchTerm, resultsCount, metadata);
    },
    []
  );
  
  const trackFilter = useCallback(
    (filterName: string, filterValue: string, metadata?: Record<string, any>) => {
      return userAnalyticsService.trackInteraction('filter', filterName, undefined, {
        value: filterValue,
        ...metadata
      });
    },
    []
  );
  
  const trackSort = useCallback(
    (sortField: string, sortDirection: 'asc' | 'desc', metadata?: Record<string, any>) => {
      return userAnalyticsService.trackInteraction('sort', sortField, undefined, {
        direction: sortDirection,
        ...metadata
      });
    },
    []
  );
  
  const trackTabChange = useCallback(
    (tabName: string, metadata?: Record<string, any>) => {
      return userAnalyticsService.trackInteraction('tab_change', tabName, undefined, metadata);
    },
    []
  );
  
  const trackModalOpen = useCallback(
    (modalId: string, metadata?: Record<string, any>) => {
      return userAnalyticsService.trackInteraction('modal_open', modalId, undefined, metadata);
    },
    []
  );
  
  const trackModalClose = useCallback(
    (modalId: string, metadata?: Record<string, any>) => {
      return userAnalyticsService.trackInteraction('modal_close', modalId, undefined, metadata);
    },
    []
  );
  
  return {
    // Core tracking methods
    trackEvent,
    trackInteraction,
    trackFormInteraction,
    trackFeatureUsage,
    trackConversion,
    
    // UI interaction helpers
    trackButtonClick,
    trackLinkClick,
    trackFormSubmit,
    trackFormError,
    trackSearch,
    trackFilter,
    trackSort,
    trackTabChange,
    trackModalOpen,
    trackModalClose
  };
};

export default useAnalytics; 