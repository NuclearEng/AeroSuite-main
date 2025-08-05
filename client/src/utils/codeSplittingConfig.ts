/**
 * Code Splitting Configuration
 * 
 * This file contains configuration options for code splitting strategies
 * across the AeroSuite application.
 * 
 * Implementation of RF033 - Implement code splitting for frontend
 */

// Define priority levels for component loading
export enum LoadPriority {
  CRITICAL = 'critical',  // Must be loaded immediately
  HIGH = 'high',          // Should be loaded early
  MEDIUM = 'medium',      // Can be loaded after critical content
  LOW = 'low',            // Can be loaded when browser is idle
  ON_DEMAND = 'on-demand' // Only load when explicitly requested
}

// Configuration for route-based code splitting
export interface RouteConfig {
  path: string;
  priority: LoadPriority;
  prefetch?: boolean;
  preload?: boolean;
}

// Configuration for component-based code splitting
export interface ComponentConfig {
  name: string;
  priority: LoadPriority;
  prefetch?: boolean;
  preload?: boolean;
}

// Global code splitting configuration
export const codeSplittingConfig = {
  // Enable/disable code splitting features
  enabled: true,
  
  // Maximum concurrent loading chunks
  maxConcurrentLoads: 5,
  
  // Chunk size thresholds (in KB)
  chunkSizeThresholds: {
    tiny: 20,    // Chunks smaller than this will be inlined
    small: 50,   // Small chunks may be grouped together
    medium: 200, // Medium sized chunks
    large: 500   // Large chunks may be split further
  },
  
  // Route-based splitting configuration
  routes: {
    // Critical routes that should be included in the main bundle
    critical: ['/auth/login', '/dashboard'],
    
    // Routes that should be prefetched when the app loads
    prefetch: ['/customers', '/suppliers', '/inspections'],
    
    // Routes that should be preloaded when their parent route is loaded
    preloadChildren: true,
    
    // Custom route configurations
    custom: [
      { path: '/reports', priority: LoadPriority.MEDIUM, prefetch: true },
      { path: '/settings', priority: LoadPriority.LOW, prefetch: false },
      { path: '/ai-analysis', priority: LoadPriority.ON_DEMAND, prefetch: false }
    ] as RouteConfig[]
  },
  
  // Component-based splitting configuration
  components: {
    // Components that should be included in the main bundle
    critical: ['MainLayout', 'Navbar', 'Sidebar'],
    
    // Components that should be prefetched when the app loads
    prefetch: ['DataTable', 'FilterPanel', 'SearchBar'],
    
    // Custom component configurations
    custom: [
      { name: 'Chart', priority: LoadPriority.MEDIUM, prefetch: true },
      { name: 'FileUploader', priority: LoadPriority.LOW, prefetch: false },
      { name: 'RichTextEditor', priority: LoadPriority.ON_DEMAND, prefetch: false }
    ] as ComponentConfig[]
  },
  
  // Vendor chunk splitting configuration
  vendors: {
    // Separate large libraries into their own chunks
    separateChunks: ['@mui/material', 'react-dom', 'recharts', 'lodash'],
    
    // Group small related libraries together
    groupedChunks: {
      'react-core': ['react', 'react-dom', 'react-router', 'react-router-dom'],
      'data-libs': ['lodash', 'date-fns', 'uuid'],
      'ui-libs': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled']
    }
  },
  
  // Preloading strategy
  preloading: {
    // Use <link rel="preload"> for critical resources
    usePreloadLinks: true,
    
    // Use IntersectionObserver for preloading when elements come into view
    useIntersectionObserver: true,
    
    // Preload resources when mouse hovers over links
    preloadOnHover: true,
    
    // Delay in ms before starting preload on hover
    hoverDelay: 100
  }
};

export default codeSplittingConfig; 