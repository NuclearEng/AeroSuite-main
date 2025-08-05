import { useEffect, useRef, useCallback } from 'react';
import resourcePrioritization, {
  ResourceType,
  ResourcePriority,
  ResourceStrategy,
  ResourceHint
} from '../utils/resourcePrioritization';

interface UseResourcePrioritizationOptions {
  /**
   * Resource prioritization options to apply on component mount
   */
  preconnectDomains?: string[];
  
  /**
   * Critical CSS files to preload
   */
  criticalCss?: string[];
  
  /**
   * Critical JS files to preload
   */
  criticalJs?: string[];
  
  /**
   * Critical images to preload
   */
  criticalImages?: string[];
  
  /**
   * Should automatically prioritize images within the component
   */
  autoPrioritizeImages?: boolean;
  
  /**
   * Selector for the container to auto-prioritize images within
   */
  containerSelector?: string;
}

/**
 * Custom hook for resource prioritization
 * 
 * @param options Resource prioritization options
 * @returns Functions for manual resource prioritization
 */
function useResourcePrioritization(options: UseResourcePrioritizationOptions = {}) {
  const {
    preconnectDomains = [],
    criticalCss = [],
    criticalJs = [],
    criticalImages = [],
    autoPrioritizeImages = false,
    containerSelector
  } = options;
  
  const containerRef = useRef<HTMLElement | null>(null);
  const hintsAdded = useRef<Set<string>>(new Set());
  
  // Set container reference
  const setContainerRef = useCallback((ref: HTMLElement | null) => {
    containerRef.current = ref;
  }, []);
  
  // Preload a resource with specific priority
  const preloadResource = useCallback((url: string, type: ResourceType, priority: ResourcePriority = ResourcePriority.HIGH) => {
    // Skip if already preloaded
    if (hintsAdded.current.has(url)) return;
    
    resourcePrioritization.addResourceHint({
      url,
      type,
      strategy: ResourceStrategy.PRELOAD,
      priority
    });
    
    hintsAdded.current.add(url);
  }, []);
  
  // Prefetch a resource for future use
  const prefetchResource = useCallback((url: string, type: ResourceType) => {
    // Skip if already prefetched
    if (hintsAdded.current.has(url)) return;
    
    resourcePrioritization.addResourceHint({
      url,
      type,
      strategy: ResourceStrategy.PREFETCH,
      priority: ResourcePriority.LOW
    });
    
    hintsAdded.current.add(url);
  }, []);
  
  // Preconnect to an external domain
  const preconnectToDomain = useCallback((domain: string) => {
    // Skip if already preconnected
    if (hintsAdded.current.has(domain)) return;
    
    resourcePrioritization.preconnectToDomains([domain]);
    hintsAdded.current.add(domain);
  }, []);
  
  // Prioritize an image element
  const prioritizeImage = useCallback((imageElement: HTMLImageElement, priority: ResourcePriority) => {
    if (!imageElement) return;
    resourcePrioritization.prioritizeImage(imageElement, priority);
  }, []);
  
  // Apply resource prioritization settings on mount
  useEffect(() => {
    // Preconnect to specified domains
    if (preconnectDomains.length > 0) {
      resourcePrioritization.preconnectToDomains(preconnectDomains);
      preconnectDomains.forEach(domain => hintsAdded.current.add(domain));
    }
    
    // Preload critical CSS
    criticalCss.forEach(url => {
      preloadResource(url, ResourceType.STYLE, ResourcePriority.CRITICAL);
    });
    
    // Preload critical JS
    criticalJs.forEach(url => {
      preloadResource(url, ResourceType.SCRIPT, ResourcePriority.CRITICAL);
    });
    
    // Preload critical images
    criticalImages.forEach(url => {
      preloadResource(url, ResourceType.IMAGE, ResourcePriority.HIGH);
    });
    
    // Auto-prioritize images if enabled
    if (autoPrioritizeImages) {
      // Use container selector if provided, otherwise use containerRef
      if (containerSelector) {
        resourcePrioritization.autoPrioritizeImages(containerSelector);
      } else if (containerRef.current) {
        // If we have a ref but no selector, use element directly
        const images = containerRef.current.querySelectorAll('img');
        images.forEach((img, index) => {
          const priority = index < 3 ? ResourcePriority.HIGH : ResourcePriority.LOW;
          resourcePrioritization.prioritizeImage(img, priority);
        });
      }
    }
    
    return () => {
      // Cleanup is not really needed for resource hints as they're designed to be 
      // persistent during the page lifecycle
    };
  }, [
    preconnectDomains,
    criticalCss,
    criticalJs,
    criticalImages,
    autoPrioritizeImages,
    containerSelector,
    preloadResource
  ]);
  
  return {
    preloadResource,
    prefetchResource,
    preconnectToDomain,
    prioritizeImage,
    setContainerRef
  };
}

export default useResourcePrioritization; 