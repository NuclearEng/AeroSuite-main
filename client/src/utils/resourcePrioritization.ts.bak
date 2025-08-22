/**
 * AeroSuite Resource Prioritization Utilities
 * 
 * This file provides utilities for optimizing resource loading by implementing
 * modern web platform features such as resource hints, priority hints, and
 * selective loading strategies to ensure critical resources are loaded first.
 */

/**
 * Resource types that can be prioritized
 */
export enum ResourceType {
  SCRIPT = 'script',
  STYLE = 'style',
  IMAGE = 'image',
  FONT = 'font',
  FETCH = 'fetch'
}

/**
 * Resource loading priorities
 */
export enum ResourcePriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  AUTO = 'auto'
}

/**
 * Resource loading strategies
 */
export enum ResourceStrategy {
  PRELOAD = 'preload',
  PREFETCH = 'prefetch',
  PRECONNECT = 'preconnect',
  DNS_PREFETCH = 'dns-prefetch',
  LAZY = 'lazy'
}

/**
 * Resource hint configuration
 */
export interface ResourceHint {
  url: string;
  type: ResourceType;
  strategy: ResourceStrategy;
  priority?: ResourcePriority;
  attributes?: Record<string, string>;
}

/**
 * Create a preload link for critical resources
 * 
 * @param resource Resource hint configuration
 * @returns HTML element or null if browser doesn't support it
 */
export function createResourceHint(resource: ResourceHint): HTMLElement | null {
  // Don't create hints if document is not available (SSR)
  if (typeof document === 'undefined') return null;
  
  const link = document.createElement('link');
  
  // Set the basic attributes
  link.href = resource.url;
  link.rel = resource.strategy;
  
  // Set the correct as attribute based on resource type
  switch (resource.type) {
    case ResourceType.SCRIPT:
      link.setAttribute('as', 'script');
      break;
    case ResourceType.STYLE:
      link.setAttribute('as', 'style');
      break;
    case ResourceType.IMAGE:
      link.setAttribute('as', 'image');
      break;
    case ResourceType.FONT:
      link.setAttribute('as', 'font');
      link.setAttribute('crossorigin', 'anonymous');
      break;
    case ResourceType.FETCH:
      link.setAttribute('as', 'fetch');
      break;
  }
  
  // Add priority hints if available
  if (resource.priority) {
    // Using setAttribute since the fetchpriority property might not be
    // widely supported yet
    link.setAttribute('fetchpriority', resource.priority);
  }
  
  // Add any additional attributes
  if (resource.attributes) {
    Object.entries(resource.attributes).forEach(([key, value]) => {
      link.setAttribute(key, value);
    });
  }
  
  return link;
}

/**
 * Add a resource hint to the document head
 * 
 * @param resource Resource hint configuration
 * @returns The created HTML element or null
 */
export function addResourceHint(resource: ResourceHint): HTMLElement | null {
  const link = createResourceHint(resource);
  if (link && typeof document !== 'undefined') {
    document.head.appendChild(link);
    return link;
  }
  return null;
}

/**
 * Create and add multiple resource hints at once
 * 
 * @param resources Array of resource hint configurations
 * @returns Array of created HTML elements
 */
export function addResourceHints(resources: ResourceHint[]): (HTMLElement | null)[] {
  return resources.map(addResourceHint);
}

/**
 * Prioritizes image loading by setting fetchpriority attribute
 * 
 * @param imageElement The image element to prioritize
 * @param priority The loading priority
 */
export function prioritizeImage(
  imageElement: HTMLImageElement,
  priority: ResourcePriority
): void {
  if (!imageElement) return;
  
  // Set fetch priority - convert to actual browser attribute values
  const fetchPriority = priority === ResourcePriority.CRITICAL || priority === ResourcePriority.HIGH 
    ? 'high' 
    : priority === ResourcePriority.MEDIUM 
      ? 'medium' 
      : 'low';
  imageElement.setAttribute('fetchpriority', fetchPriority);
  
  // If it's a low priority image, use native lazy loading
  if (priority === ResourcePriority.LOW) {
    imageElement.loading = 'lazy';
  } else if (priority === ResourcePriority.CRITICAL || priority === ResourcePriority.HIGH) {
    // For high priority, ensure eager loading
    imageElement.loading = 'eager';
  }
}

/**
 * Preconnect to important third-party domains to speed up subsequent requests
 * 
 * @param domains Array of domains to preconnect to
 * @param useDNSPrefetch Whether to also add dns-prefetch as fallback
 * @returns Array of created HTML elements
 */
export function preconnectToDomains(
  domains: string[],
  useDNSPrefetch: boolean = true
): (HTMLElement | null)[] {
  const hints: ResourceHint[] = [];
  
  domains.forEach(domain => {
    // Add preconnect hint
    hints.push({
      url: domain,
      type: ResourceType.FETCH,
      strategy: ResourceStrategy.PRECONNECT,
      attributes: { crossorigin: 'anonymous' }
    });
    
    // Add dns-prefetch as fallback for older browsers
    if (useDNSPrefetch) {
      hints.push({
        url: domain,
        type: ResourceType.FETCH,
        strategy: ResourceStrategy.DNS_PREFETCH
      });
    }
  });
  
  return addResourceHints(hints);
}

/**
 * Preload critical page assets
 * 
 * @param assets Array of assets to preload
 * @returns Array of created HTML elements
 */
export function preloadCriticalAssets(
  assets: {url: string, type: ResourceType, priority?: ResourcePriority}[]
): (HTMLElement | null)[] {
  const hints: ResourceHint[] = assets.map(asset => ({
    url: asset.url,
    type: asset.type,
    strategy: ResourceStrategy.PRELOAD,
    priority: asset.priority || ResourcePriority.HIGH
  }));
  
  return addResourceHints(hints);
}

/**
 * Creates a priority queue for loading resources in optimal order
 */
export class ResourcePriorityQueue {
  private highPriority: ResourceHint[] = [];
  private mediumPriority: ResourceHint[] = [];
  private lowPriority: ResourceHint[] = [];
  private processed = new Set<string>();
  
  /**
   * Add a resource to the priority queue
   * 
   * @param resource Resource hint configuration
   * @param priority The loading priority
   */
  add(resource: Omit<ResourceHint, 'priority'>, priority: ResourcePriority): void {
    const resourceWithPriority = { ...resource, priority };
    
    // Skip if already processed
    if (this.processed.has(resource.url)) return;
    
    // Add to the appropriate queue
    switch (priority) {
      case ResourcePriority.CRITICAL:
      case ResourcePriority.HIGH:
        this.highPriority.push(resourceWithPriority);
        break;
      case ResourcePriority.MEDIUM:
        this.mediumPriority.push(resourceWithPriority);
        break;
      case ResourcePriority.LOW:
        this.lowPriority.push(resourceWithPriority);
        break;
    }
    
    this.processed.add(resource.url);
  }
  
  /**
   * Process the queue and add resource hints in priority order
   * 
   * @returns Array of created HTML elements
   */
  process(): (HTMLElement | null)[] {
    const results: (HTMLElement | null)[] = [];
    
    // Process high priority immediately
    this.highPriority.forEach(resource => {
      results.push(addResourceHint(resource));
    });
    
    // Process medium priority after a small delay
    if (this.mediumPriority.length > 0) {
      setTimeout(() => {
        this.mediumPriority.forEach(addResourceHint);
      }, 200);
    }
    
    // Process low priority during idle time
    if (this.lowPriority.length > 0 && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        this.lowPriority.forEach(resource => {
          // Change strategy to prefetch for low priority items
          addResourceHint({
            ...resource,
            strategy: ResourceStrategy.PREFETCH
          });
        });
      });
    } else if (this.lowPriority.length > 0) {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        this.lowPriority.forEach(resource => {
          addResourceHint({
            ...resource,
            strategy: ResourceStrategy.PREFETCH
          });
        });
      }, 1000);
    }
    
    return results;
  }
  
  /**
   * Clear the queue
   */
  clear(): void {
    this.highPriority = [];
    this.mediumPriority = [];
    this.lowPriority = [];
    this.processed.clear();
  }
}

/**
 * Create a data URL for an inline image to eliminate a network request
 * Useful for small, critical images like logos
 * 
 * @param base64Data Base64-encoded image data
 * @param mimeType Image MIME type
 * @returns Data URL string
 */
export function createInlineImageUrl(base64Data: string, mimeType: string): string {
  return `data:${mimeType};base64,${base64Data}`;
}

/**
 * Automatically prioritize all images on a page based on their visibility
 * 
 * @param containerSelector The CSS selector for the container to look within
 */
export function autoPrioritizeImages(containerSelector: string = 'body'): void {
  if (typeof document === 'undefined') return;
  
  const container = document.querySelector(containerSelector);
  if (!container) return;
  
  // Find all images in the container
  const images = container.querySelectorAll('img');
  
  // Set up IntersectionObserver if available
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const img = entry.target as HTMLImageElement;
          
          if (entry.isIntersecting) {
            // Image is visible, prioritize loading
            img.loading = 'eager';
            
            if ('fetchpriority' in img) {
              img.setAttribute('fetchpriority', ResourcePriority.HIGH);
            }
            
            // If the image has a data-src, load it now
            if (img.dataset.src) {
              img.src = img.dataset.src;
            }
            
            // Unobserve once prioritized
            observer.unobserve(img);
          }
        });
      },
      { rootMargin: '200px 0px' } // Start loading images when they're within 200px of the viewport
    );
    
    // Observe all images
    images.forEach(img => observer.observe(img));
  } else {
    // Fallback for browsers without IntersectionObserver
    // Just set the priority based on position in the document
    images.forEach((img, index) => {
      const priority = index < 5 ? ResourcePriority.HIGH : ResourcePriority.LOW;
      prioritizeImage(img as HTMLImageElement, priority);
    });
  }
}

/**
 * Generate link preload tags for critical CSS
 * 
 * @param cssFiles Array of CSS file URLs to preload
 * @returns HTML string with preload link tags
 */
export function generateCSSPreloadTags(cssFiles: string[]): string {
  return cssFiles.map(file => 
    `<link rel="preload" href="${file}" as="style" fetchpriority="high" />`
  ).join('\n');
}

/**
 * Generate script preload tags for critical JavaScript
 * 
 * @param jsFiles Array of JS file URLs to preload
 * @returns HTML string with preload link tags
 */
export function generateScriptPreloadTags(jsFiles: string[]): string {
  return jsFiles.map(file => 
    `<link rel="preload" href="${file}" as="script" fetchpriority="high" />`
  ).join('\n');
}

/**
 * Resource Prioritization Utilities
 * 
 * This module provides utilities for optimizing resource loading sequence
 * and implementing resource hints like preload, prefetch, and preconnect.
 */

/**
 * Creates a preload link for critical resources
 * 
 * @param href - URL of the resource to preload
 * @param as - Resource type (e.g., 'script', 'style', 'image', 'font')
 * @param type - MIME type of the resource
 * @param crossOrigin - Cross-origin attribute value
 * @param media - Media query for the resource
 * @returns The created link element
 */
export function preloadResource(
  href: string,
  as: 'script' | 'style' | 'image' | 'font' | 'fetch' | 'audio' | 'video' | 'document',
  type?: string,
  crossOrigin?: 'anonymous' | 'use-credentials',
  media?: string
): HTMLLinkElement {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  
  if (type) link.type = type;
  if (crossOrigin) link.crossOrigin = crossOrigin;
  if (media) link.media = media;
  
  document.head.appendChild(link);
  return link;
}

/**
 * Creates a prefetch link for resources likely to be needed in the future
 * 
 * @param href - URL of the resource to prefetch
 * @param as - Resource type (optional)
 * @returns The created link element
 */
export function prefetchResource(
  href: string,
  as?: 'script' | 'style' | 'image' | 'font' | 'fetch' | 'audio' | 'video' | 'document'
): HTMLLinkElement {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  if (as) link.as = as;
  
  document.head.appendChild(link);
  return link;
}

/**
 * Creates a preconnect link for early connection establishment
 * 
 * @param href - URL to preconnect to
 * @param crossOrigin - Cross-origin attribute value
 * @returns The created link element
 */
export function preconnect(
  href: string,
  crossOrigin?: 'anonymous' | 'use-credentials'
): HTMLLinkElement {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = href;
  
  if (crossOrigin) link.crossOrigin = crossOrigin;
  
  document.head.appendChild(link);
  return link;
}

/**
 * Creates a DNS prefetch link for early DNS resolution
 * 
 * @param href - URL to prefetch DNS for
 * @returns The created link element
 */
export function dnsPrefetch(href: string): HTMLLinkElement {
  const link = document.createElement('link');
  link.rel = 'dns-prefetch';
  link.href = href;
  
  document.head.appendChild(link);
  return link;
}

/**
 * Preloads critical CSS
 * 
 * @param href - URL of the CSS file
 * @returns The created link element
 */
export function preloadCss(href: string): HTMLLinkElement {
  return preloadResource(href, 'style', 'text/css');
}

/**
 * Preloads critical JavaScript
 * 
 * @param href - URL of the JavaScript file
 * @returns The created link element
 */
export function preloadScript(href: string): HTMLLinkElement {
  return preloadResource(href, 'script', 'application/javascript');
}

/**
 * Preloads a font file
 * 
 * @param href - URL of the font file
 * @param type - MIME type of the font (e.g., 'font/woff2')
 * @param crossOrigin - Cross-origin attribute value (typically 'anonymous')
 * @returns The created link element
 */
export function preloadFont(
  href: string,
  type: string,
  crossOrigin: 'anonymous' | 'use-credentials' = 'anonymous'
): HTMLLinkElement {
  return preloadResource(href, 'font', type, crossOrigin);
}

/**
 * Preloads an image
 * 
 * @param href - URL of the image
 * @param media - Media query for the image
 * @returns The created link element
 */
export function preloadImage(href: string, media?: string): HTMLLinkElement {
  return preloadResource(href, 'image', undefined, undefined, media);
}

/**
 * Sets up common third-party domain preconnects
 * 
 * @param domains - Array of domains to preconnect to
 */
export function setupCommonPreconnects(domains: string[]): void {
  domains.forEach(domain => {
    preconnect(domain, 'anonymous');
    // Also add DNS prefetch as a fallback for browsers that don't support preconnect
    dnsPrefetch(domain);
  });
}

/**
 * Prioritizes resource loading based on critical path
 * 
 * @param resources - Array of resources to prioritize
 */
export function prioritizeResources(
  resources: Array<{
    href: string;
    type: 'script' | 'style' | 'image' | 'font' | 'fetch';
    priority: 'critical' | 'high' | 'medium' | 'low';
    loadImmediately?: boolean;
  }>
): void {
  // Sort resources by priority
  const sortedResources = [...resources].sort((a, b) => {
    const priorityOrder = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3
    };
    
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
  
  // Process critical and high priority resources immediately
  sortedResources
    .filter(resource => resource.priority === 'critical' || resource.priority === 'high' || resource.loadImmediately)
    .forEach(resource => {
      preloadResource(resource.href, resource.type);
    });
  
  // Prefetch medium priority resources
  setTimeout(() => {
    sortedResources
      .filter(resource => resource.priority === 'medium')
      .forEach(resource => {
        prefetchResource(resource.href, resource.type);
      });
  }, 200);
  
  // Prefetch low priority resources after a longer delay
  setTimeout(() => {
    sortedResources
      .filter(resource => resource.priority === 'low')
      .forEach(resource => {
        prefetchResource(resource.href, resource.type);
      });
  }, 1000);
}

/**
 * Sets up resource hints for the application
 * 
 * @param config - Configuration object with domains and resources
 */
export function setupResourceHints(config: {
  preconnect?: string[];
  dnsPrefetch?: string[];
  preload?: Array<{
    href: string;
    as: 'script' | 'style' | 'image' | 'font' | 'fetch' | 'audio' | 'video' | 'document';
    type?: string;
    crossOrigin?: 'anonymous' | 'use-credentials';
    media?: string;
  }>;
  prefetch?: Array<{
    href: string;
    as?: 'script' | 'style' | 'image' | 'font' | 'fetch' | 'audio' | 'video' | 'document';
  }>;
}): void {
  // Set up preconnects
  if (config.preconnect && config.preconnect.length > 0) {
    config.preconnect.forEach(domain => {
      preconnect(domain, 'anonymous');
    });
  }
  
  // Set up DNS prefetches
  if (config.dnsPrefetch && config.dnsPrefetch.length > 0) {
    config.dnsPrefetch.forEach(domain => {
      dnsPrefetch(domain);
    });
  }
  
  // Set up preloads
  if (config.preload && config.preload.length > 0) {
    config.preload.forEach(resource => {
      preloadResource(
        resource.href,
        resource.as,
        resource.type,
        resource.crossOrigin,
        resource.media
      );
    });
  }
  
  // Set up prefetches
  if (config.prefetch && config.prefetch.length > 0) {
    config.prefetch.forEach(resource => {
      prefetchResource(resource.href, resource.as);
    });
  }
}

/**
 * Creates a script that optimizes the loading sequence of resources
 * 
 * @returns The created script element
 */
export function optimizeLoadingSequence(): HTMLScriptElement {
  const script = document.createElement('script');
  script.textContent = `
    // Optimize loading sequence
    (function() {
      // Detect requestIdleCallback support
      const requestIdleCallback = window.requestIdleCallback || 
        function(cb) { return setTimeout(() => { 
          const start = Date.now();
          cb({ 
            didTimeout: false, 
            timeRemaining: () => Math.max(0, 50 - (Date.now() - start)) 
          }); 
        }, 1); };
      
      // Detect connection speed
      const connection = navigator.connection || 
        navigator.mozConnection || 
        navigator.webkitConnection || 
        { effectiveType: '4g' };
      
      // Define loading strategies based on connection type
      const loadStrategy = {
        'slow-2g': { criticalOnly: true, delay: 5000 },
        '2g': { criticalOnly: true, delay: 3000 },
        '3g': { criticalOnly: false, delay: 1000 },
        '4g': { criticalOnly: false, delay: 200 },
        'unknown': { criticalOnly: false, delay: 500 }
      };
      
      // Get current strategy
      const strategy = loadStrategy[connection.effectiveType] || loadStrategy.unknown;
      
      // Function to load non-critical resources
      function loadNonCritical() {
        // Find all non-critical scripts and styles
        const nonCritical = document.querySelectorAll('link[data-priority="low"], script[data-priority="low"]');
        
        // Load them one by one
        Array.from(nonCritical).forEach((element, index) => {
          setTimeout(() => {
            if (element.tagName === 'LINK') {
              element.setAttribute('href', element.getAttribute('data-href'));
            } else if (element.tagName === 'SCRIPT') {
              const newScript = document.createElement('script');
              Array.from(element.attributes).forEach(attr => {
                if (attr.name !== 'data-src' && attr.name !== 'data-priority') {
                  newScript.setAttribute(attr.name, attr.value);
                }
              });
              newScript.src = element.getAttribute('data-src');
              element.parentNode.replaceChild(newScript, element);
            }
          }, index * 100);
        });
      }
      
      // Schedule non-critical resource loading
      if (!strategy.criticalOnly) {
        requestIdleCallback(() => {
          setTimeout(loadNonCritical, strategy.delay);
        });
      }
    })();
  `;
  
  document.head.appendChild(script);
  return script;
}

export default {
  ResourceType,
  ResourcePriority,
  ResourceStrategy,
  createResourceHint,
  addResourceHint,
  addResourceHints,
  prioritizeImage,
  preconnectToDomains,
  preloadCriticalAssets,
  ResourcePriorityQueue,
  createInlineImageUrl,
  autoPrioritizeImages,
  generateCSSPreloadTags,
  generateScriptPreloadTags,
  preloadResource,
  prefetchResource,
  preconnect,
  dnsPrefetch,
  preloadCss,
  preloadScript,
  preloadFont,
  preloadImage,
  setupCommonPreconnects,
  prioritizeResources,
  setupResourceHints,
  optimizeLoadingSequence
}; 