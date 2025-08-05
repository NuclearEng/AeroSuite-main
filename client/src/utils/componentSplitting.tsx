/**
 * Component Splitting Utility
 * 
 * This file provides utilities for component-based code splitting,
 * allowing UI components to be loaded on demand.
 * 
 * Implementation of RF033 - Implement code splitting for frontend
 */

import React, { ComponentType } from 'react';
import { createLazyComponent, withSuspense, DefaultLoading, useInViewLazyLoad } from './codeSplitting';
import { codeSplittingConfig, LoadPriority, ComponentConfig } from './codeSplittingConfig';

// Type for component module imports
type ComponentImportFn = () => Promise<{ default: ComponentType<any> }>;

// Map of component names to their import functions
interface ComponentImportMap {
  [name: string]: ComponentImportFn;
}

/**
 * Map of common components to their import functions
 * This allows for consistent code splitting of frequently used components
 */
export const componentImports: ComponentImportMap = {
  // Common UI components
  'DataTable': () => import('../components/ui-library/molecules/DataTable'),
  'SearchBar': () => import('../components/ui-library/molecules/SearchBar'),
  'FilterPanel': () => import('../components/ui-library/molecules/FilterPanel'),
  'Pagination': () => import('../components/ui-library/molecules/Pagination'),
  'FileUploader': () => import('../components/ui-library/molecules/FileUploader'),
  'RichTextEditor': () => import('../components/ui-library/molecules/RichTextEditor'),
  
  // Chart components
  'LineChart': () => import('../components/ui-library/molecules/charts/LineChart'),
  'BarChart': () => import('../components/ui-library/molecules/charts/BarChart'),
  'PieChart': () => import('../components/ui-library/molecules/charts/PieChart'),
  'ScatterChart': () => import('../components/ui-library/molecules/charts/ScatterChart'),
  
  // Form components
  'FormBuilder': () => import('../components/ui-library/organisms/FormBuilder'),
  'DynamicForm': () => import('../components/ui-library/organisms/DynamicForm'),
  'FormStepper': () => import('../components/ui-library/molecules/FormStepper'),
  
  // Dashboard widgets
  'StatCard': () => import('../components/dashboard/widgets/StatCard'),
  'ActivityFeed': () => import('../components/dashboard/widgets/ActivityFeed'),
  'NotificationList': () => import('../components/dashboard/widgets/NotificationList'),
  'RecentItems': () => import('../components/dashboard/widgets/RecentItems'),
  
  // Modal components
  'ConfirmDialog': () => import('../components/ui-library/molecules/ConfirmDialog'),
  'DetailDialog': () => import('../components/ui-library/molecules/DetailDialog'),
  'SlideOutPanel': () => import('../components/ui-library/molecules/SlideOutPanel'),
  
  // Map components
  'MapView': () => import('../components/ui-library/organisms/MapView'),
  'LocationPicker': () => import('../components/ui-library/molecules/LocationPicker'),
  
  // Advanced components
  'DataGrid': () => import('../components/ui-library/organisms/DataGrid'),
  'KanbanBoard': () => import('../components/ui-library/organisms/KanbanBoard'),
  'Calendar': () => import('../components/ui-library/organisms/Calendar'),
  'DocumentViewer': () => import('../components/ui-library/organisms/DocumentViewer'),
  'VideoPlayer': () => import('../components/ui-library/molecules/VideoPlayer'),
  
  // Supplier components
  'SupplierCard': () => import('../components/suppliers/SupplierCard'),
  'SupplierRiskIndicator': () => import('../components/suppliers/SupplierRiskIndicator'),
  
  // Customer components
  'CustomerCard': () => import('../components/customers/CustomerCard'),
  
  // Inspection components
  'InspectionCard': () => import('../components/inspections/InspectionCard'),
  'InspectionForm': () => import('../components/inspections/InspectionForm'),
};

/**
 * Get component configuration from the name
 * 
 * @param componentName Component name
 * @returns Component configuration with priority and prefetch settings
 */
export function getComponentConfig(componentName: string): ComponentConfig {
  const { components } = codeSplittingConfig;
  
  // Check if this is a critical component
  if (components.critical.includes(componentName)) {
    return {
      name: componentName,
      priority: LoadPriority.CRITICAL,
      prefetch: true,
      preload: true
    };
  }
  
  // Check if this is a prefetch component
  if (components.prefetch.includes(componentName)) {
    return {
      name: componentName,
      priority: LoadPriority.HIGH,
      prefetch: true,
      preload: false
    };
  }
  
  // Check for custom component config
  const customConfig = components.custom.find(comp => comp.name === componentName);
  if (customConfig) {
    return customConfig;
  }
  
  // Default configuration
  return {
    name: componentName,
    priority: LoadPriority.MEDIUM,
    prefetch: false,
    preload: false
  };
}

/**
 * Create a lazy-loaded component
 * 
 * @param componentName Name of the component in the componentImports map
 * @param options Additional options for lazy loading
 * @returns Lazy-loaded component
 */
export function createLazyUIComponent<P = {}>(
  componentName: string,
  options: {
    fallback?: React.ReactNode;
    loadingDelay?: number;
    errorComponent?: React.ComponentType<{ error: Error; retry: () => void }>;
  } = {}
): React.FC<P> {
  const importFn = componentImports[componentName];
  if (!importFn) {
    throw new Error(`No import function found for component: ${componentName}`);
  }
  
  const config = getComponentConfig(componentName);
  const { fallback = <DefaultLoading />, loadingDelay = 200, errorComponent } = options;
  
  const LazyComponent = createLazyComponent(importFn, {
    prefetch: config.prefetch,
    preload: config.preload,
    priority: config.priority,
    chunkName: `component-${componentName}`
  });
  
  return withSuspense(LazyComponent, { fallback, loadingDelay, errorComponent });
}

/**
 * Create a component that loads when it comes into view
 * 
 * @param componentName Name of the component in the componentImports map
 * @param options Additional options for lazy loading
 * @returns [ref, Component] - Ref to attach to container and the component if loaded
 */
export function createInViewComponent<P = {}>(
  componentName: string,
  options: {
    rootMargin?: string;
    fallback?: React.ReactNode;
    loadingDelay?: number;
  } = {}
) {
  const importFn = componentImports[componentName];
  if (!importFn) {
    throw new Error(`No import function found for component: ${componentName}`);
  }
  
  const config = getComponentConfig(componentName);
  
  return useInViewLazyLoad(importFn, {
    ...options,
    prefetch: config.prefetch,
    preload: config.preload,
    priority: config.priority,
    chunkName: `inview-${componentName}`
  });
}

/**
 * Prefetch components by name
 * 
 * @param componentNames Array of component names to prefetch
 */
export function prefetchComponents(componentNames: string[]): void {
  if (!codeSplittingConfig.enabled) return;
  
  componentNames.forEach(name => {
    const importFn = componentImports[name];
    if (importFn) {
      const config = getComponentConfig(name);
      
      if (config.priority === LoadPriority.HIGH || config.priority === LoadPriority.CRITICAL) {
        // High priority - load immediately
        importFn().catch(() => {});
      } else {
        // Lower priority - load when idle
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(() => {
            importFn().catch(() => {});
          });
        } else {
          // Fallback for browsers without requestIdleCallback
          setTimeout(() => {
            importFn().catch(() => {});
          }, 1000);
        }
      }
    }
  });
}

export default {
  componentImports,
  getComponentConfig,
  createLazyUIComponent,
  createInViewComponent,
  prefetchComponents
}; 