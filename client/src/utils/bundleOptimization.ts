/**
 * Bundle Size Optimization Utilities
 * 
 * This file provides utilities to optimize bundle size through various techniques:
 * - Dynamic imports with prioritization
 * - Tree shaking helpers
 * - Module registry for tracking loaded modules
 * - Import cost analysis
 * 
 * Implementation of RF035 - Optimize bundle size
 */

import { LoadPriority } from './codeSplittingConfig';

// Type definitions
type ImportFunction<T> = () => Promise<{ default: T }>;
type ModuleRegistry = Record<string, { loaded: boolean, size: number }>;

// Global module registry to track loaded modules and their sizes
const moduleRegistry: ModuleRegistry = {};

/**
 * Register a module in the global registry
 * 
 * @param moduleName Name/identifier for the module
 * @param size Approximate size of the module in KB
 */
export function registerModule(moduleName: string, size: number): void {
  if (!moduleRegistry[moduleName]) {
    moduleRegistry[moduleName] = {
      loaded: false,
      size
    };
  }
}

/**
 * Mark a module as loaded in the registry
 * 
 * @param moduleName Name/identifier for the module
 */
export function markModuleLoaded(moduleName: string): void {
  if (moduleRegistry[moduleName]) {
    moduleRegistry[moduleName].loaded = true;
  } else {
    registerModule(moduleName, 0);
    moduleRegistry[moduleName].loaded = true;
  }
}

/**
 * Get the total size of loaded modules
 * 
 * @returns Total size in KB of all loaded modules
 */
export function getTotalLoadedSize(): number {
  return Object.values(moduleRegistry)
    .filter(module => module.loaded)
    .reduce((total, module) => total + module.size, 0);
}

/**
 * Get the total size of registered modules
 * 
 * @returns Total size in KB of all registered modules
 */
export function getTotalRegisteredSize(): number {
  return Object.values(moduleRegistry)
    .reduce((total, module) => total + module.size, 0);
}

/**
 * Get a report of loaded modules
 * 
 * @returns Object containing loaded modules and their sizes
 */
export function getLoadedModulesReport(): Record<string, number> {
  const report: Record<string, number> = {};
  
  Object.entries(moduleRegistry)
    .filter(([_, module]) => module.loaded)
    .forEach(([name, module]) => {
      report[name] = module.size;
    });
  
  return report;
}

/**
 * Optimized dynamic import with size tracking
 * 
 * @param importFn Function that returns a dynamic import
 * @param moduleName Name/identifier for the module
 * @param size Approximate size of the module in KB
 * @returns Promise resolving to the imported module
 */
export async function optimizedImport<T>(
  importFn: ImportFunction<T>,
  moduleName: string,
  size: number = 0
): Promise<{ default: T }> {
  // Register the module if not already registered
  registerModule(moduleName, size);
  
  try {
    // Import the module
    const module = await importFn();
    
    // Mark as loaded
    markModuleLoaded(moduleName);
    
    // Return the module
    return module;
  } catch (_error) {
    console.error(`Failed to load module ${moduleName}:`, _error);
    throw _error;
  }
}

/**
 * Prioritized imports - loads modules in order of priority
 * 
 * @param imports Array of import configurations
 * @returns Promise resolving when all imports are complete
 */
export async function prioritizedImports(
  imports: Array<{
    importFn: ImportFunction<any>;
    moduleName: string;
    priority: LoadPriority;
    size?: number;
  }>
): Promise<Record<string, any>> {
  // Sort imports by priority (highest first)
  const sortedImports = [...imports].sort((a, b) => a.priority - b.priority);
  
  // Group imports by priority
  const importsByPriority: Record<LoadPriority, typeof imports> = {
    [LoadPriority.CRITICAL]: [],
    [LoadPriority.HIGH]: [],
    [LoadPriority.MEDIUM]: [],
    [LoadPriority.LOW]: [],
    [LoadPriority.ON_DEMAND]: []
  };
  
  sortedImports.forEach(importItem => {
    importsByPriority[importItem.priority].push(importItem);
  });
  
  const results: Record<string, any> = {};
  
  // Load critical imports immediately
  await Promise.all(
    importsByPriority[LoadPriority.CRITICAL].map(async ({ importFn, moduleName, size = 0 }) => {
      const module = await optimizedImport(importFn, moduleName, size);
      results[moduleName] = module.default;
    })
  );
  
  // Load high priority imports immediately after critical
  await Promise.all(
    importsByPriority[LoadPriority.HIGH].map(async ({ importFn, moduleName, size = 0 }) => {
      const module = await optimizedImport(importFn, moduleName, size);
      results[moduleName] = module.default;
    })
  );
  
  // Schedule medium priority imports
  setTimeout(() => {
    Promise.all(
      importsByPriority[LoadPriority.MEDIUM].map(async ({ importFn, moduleName, size = 0 }) => {
        try {
          const module = await optimizedImport(importFn, moduleName, size);
          results[moduleName] = module.default;
        } catch (_error) {
          console.error(`Failed to load medium priority module ${moduleName}:`, _error);
        }
      })
    );
  }, 1000);
  
  // Schedule low priority imports
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      Promise.all(
        importsByPriority[LoadPriority.LOW].map(async ({ importFn, moduleName, size = 0 }) => {
          try {
            const module = await optimizedImport(importFn, moduleName, size);
            results[moduleName] = module.default;
          } catch (_error) {
            console.error(`Failed to load low priority module ${moduleName}:`, _error);
          }
        })
      );
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      Promise.all(
        importsByPriority[LoadPriority.LOW].map(async ({ importFn, moduleName, size = 0 }) => {
          try {
            const module = await optimizedImport(importFn, moduleName, size);
            results[moduleName] = module.default;
          } catch (_error) {
            console.error(`Failed to load low priority module ${moduleName}:`, _error);
          }
        })
      );
    }, 3000);
  }
  
  // ON_DEMAND imports are not loaded automatically
  
  return results;
}

/**
 * Tree shaking helper - creates a proxy that only imports what's used
 * 
 * @param importFn Function that returns a dynamic import
 * @param moduleName Name/identifier for the module
 * @param size Approximate size of the module in KB
 * @returns Proxy object that loads the module on first property access
 */
export function createTreeShakingProxy<T extends object>(
  importFn: ImportFunction<T>,
  moduleName: string,
  size: number = 0
): T {
  let modulePromise: Promise<{ default: T }> | null = null;
  let moduleInstance: T | null = null;
  
  return new Proxy({} as T, {
    get(target, prop) {
      // Initialize the module load if not already started
      if (!modulePromise) {
        modulePromise = optimizedImport(importFn, moduleName, size);
        
        modulePromise.then(
          module => {
            moduleInstance = module.default;
          }
        ).catch(error => {
          console.error(`Failed to load module ${moduleName}:`, _error);
        });
      }
      
      // If module is already loaded, return the property
      if (moduleInstance) {
        return Reflect.get(moduleInstance, prop);
      }
      
      // Otherwise return a function that waits for the module to load
      if (typeof prop === 'string' || typeof prop === 'number' || typeof prop === 'symbol') {
        return (...args: any[]) => {
          return modulePromise!.then(module => {
            moduleInstance = module.default;
            const method = Reflect.get(moduleInstance, prop);
            if (typeof method === 'function') {
              return method.apply(moduleInstance, args);
            }
            return method;
          });
        };
      }
      
      return undefined;
    }
  });
}

/**
 * Import size analysis - logs the size of imports to help identify large modules
 * Only used in development
 * 
 * @param moduleName Name of the module
 * @param importPromise Promise from a dynamic import
 */
export function analyzeImportSize<T>(
  moduleName: string,
  importPromise: Promise<T>
): Promise<T> {
  if (process.env.NODE_ENV !== 'development') {
    return importPromise;
  }
  
  const startTime = performance.now();
  
  return importPromise.then(module => {
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    console.log(`[Bundle Analysis] Module "${moduleName}" loaded in ${loadTime.toFixed(2)}ms`);
    
    // Estimate size based on JSON stringification (very rough estimate)
    try {
      const size = new Blob([JSON.stringify(module)]).size / 1024;
      console.log(`[Bundle Analysis] Estimated size: ${size.toFixed(2)} KB`);
      
      // Register the module with the estimated size
      registerModule(moduleName, size);
    } catch (_e) {
      console.log(`[Bundle Analysis] Could not estimate size for "${moduleName}"`);
    }
    
    return module;
  });
}

export default {
  optimizedImport,
  prioritizedImports,
  createTreeShakingProxy,
  analyzeImportSize,
  registerModule,
  markModuleLoaded,
  getTotalLoadedSize,
  getTotalRegisteredSize,
  getLoadedModulesReport
}; 