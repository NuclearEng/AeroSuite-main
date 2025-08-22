/**
 * Route Splitting Utility
 * 
 * This file provides utilities for route-based code splitting,
 * mapping routes to their dynamic import functions.
 * 
 * Implementation of RF033 - Implement code splitting for frontend
 */

import React, { ComponentType } from 'react';
import { lazyRoute } from './codeSplitting';
import { codeSplittingConfig, LoadPriority, RouteConfig } from './codeSplittingConfig';

// Type for route module imports
type RouteImportFn = () => Promise<{ default: ComponentType<any> }>;

// Map of route paths to their import functions
interface RouteImportMap {
  [path: string]: RouteImportFn;
}

// Route module with metadata
interface RouteModule {
  path: string;
  importFn: RouteImportFn;
  priority: LoadPriority;
  prefetch: boolean;
  preload: boolean;
}

/**
 * Map of all route paths to their import functions
 * This should be kept in sync with the routes.tsx file
 */
export const routeImports: RouteImportMap = {
  // Auth routes
  '/auth/login': () => import('../pages/auth/Login'),
  '/auth/register': () => import('../pages/auth/Register'),
  '/auth/forgot-password': () => import('../pages/auth/ForgotPassword'),
  '/auth/reset-password': () => import('../pages/auth/ResetPassword'),
  
  // Dashboard routes
  '/dashboard': () => import('../pages/dashboard/Dashboard'),
  '/metrics': () => import('../pages/dashboard/MetricsDashboard'),
  
  // Customer routes
  '/customers': () => import('../pages/customers/CustomerList'),
  '/customers/create': () => import('../pages/customers/CreateCustomer'),
  '/customers/:id': () => import('../pages/customers/CustomerDetail'),
  '/customers/:id/edit': () => import('../pages/customers/EditCustomer'),
  
  // Supplier routes
  '/suppliers': () => import('../pages/suppliers/SupplierList'),
  '/suppliers/create': () => import('../pages/suppliers/CreateSupplier'),
  '/suppliers/:id': () => import('../pages/suppliers/SupplierDetail'),
  '/suppliers/:id/edit': () => import('../pages/suppliers/EditSupplier'),
  '/suppliers/network': () => import('../pages/suppliers/SupplierNetwork'),
  '/suppliers/risk-assessment': () => import('../pages/suppliers/SupplierRiskAssessment'),
  '/suppliers/audit-checklist': () => import('../pages/suppliers/SupplierAuditChecklist'),
  '/suppliers/:supplierId/quality': () => import('../pages/suppliers/SupplierQualityManagement'),
  
  // Inspection routes
  '/inspections': () => import('../pages/inspections/InspectionList'),
  '/inspections/schedule': () => import('../pages/inspections/ScheduleInspection'),
  '/inspections/:id': () => import('../pages/inspections/InspectionDetail'),
  '/inspections/:id/conduct': () => import('../pages/inspections/ConductInspection'),
  
  // Component routes
  '/components': () => import('../pages/components/ComponentList'),
  '/components/create': () => import('../pages/components/CreateComponent'),
  '/components/:id': () => import('../pages/components/ComponentDetail'),
  '/components/:id/edit': () => import('../pages/components/EditComponent'),
  
  // Report routes
  '/reports': () => import('../pages/reports/ReportBuilder'),
  '/reports/visualizations': () => import('../pages/reports/DataVisualizationDemo'),
  
  // Settings routes
  '/settings': () => import('../pages/settings/SettingsPage'),
  '/settings/language': () => import('../pages/settings/LanguageSettings'),
  
  // Monitoring routes
  '/monitoring': () => import('../pages/monitoring/PerformanceMetricsDashboard'),
  '/monitoring/performance': () => import('../pages/monitoring/PerformanceMetricsDashboard'),
  '/monitoring/backups': () => import('../pages/monitoring/BackupVerification'),
  
  // AI Analysis routes
  '/ai-analysis': () => import('../pages/ai-analysis/AIAnalysisPage'),
  
  // Demo routes
  '/demos/image-optimization': () => import('../pages/ImageOptimizationDemo'),
  '/demos/caching-strategy': () => import('../pages/CachingStrategyDemo'),
  '/demos/request-batching': () => import('../pages/RequestBatchingDemo'),
  '/demos/code-splitting': () => import('../pages/CodeSplittingDemo'),
  '/demos/bundle-optimization': () => import('../pages/BundleOptimizationDemo'),
  '/demos/resource-prioritization': () => import('../pages/ResourcePrioritizationDemo'),
  '/demos/client-data-caching': () => import('../pages/ClientDataCachingDemo'),
  '/demos/loading-states': () => import('../pages/LoadingStatesDemo'),
  '/demos/responsive-design': () => import('../pages/ResponsiveDesignDemo'),
  '/demos/micro-interactions': () => import('../pages/MicroInteractionsDemo'),
  
  // Error routes
  '/not-found': () => import('../pages/NotFound'),
};

/**
 * Get route configuration from the path
 * 
 * @param path Route path
 * @returns Route configuration with priority and prefetch settings
 */
export function getRouteConfig(path: string): RouteConfig {
  const { routes } = codeSplittingConfig;
  
  // Check if this is a critical route
  if (routes.critical.includes(path)) {
    return {
      path,
      priority: LoadPriority.CRITICAL,
      prefetch: true,
      preload: true
    };
  }
  
  // Check if this is a prefetch route
  if (routes.prefetch.includes(path)) {
    return {
      path,
      priority: LoadPriority.HIGH,
      prefetch: true,
      preload: false
    };
  }
  
  // Check for custom route config
  const customConfig = routes.custom.find(route => route.path === path);
  if (customConfig) {
    return customConfig;
  }
  
  // Default configuration
  return {
    path,
    priority: LoadPriority.MEDIUM,
    prefetch: false,
    preload: false
  };
}

/**
 * Get all route modules with their configurations
 * 
 * @returns Array of route modules with metadata
 */
export function getAllRouteModules(): RouteModule[] {
  return Object.entries(routeImports).map(([path, importFn]: any) => {
    const config = getRouteConfig(path);
    return {
      path,
      importFn,
      priority: config.priority,
      prefetch: config.prefetch || false,
      preload: config.preload || false
    };
  });
}

/**
 * Create a lazy-loaded component for a route
 * 
 * @param path Route path
 * @returns Lazy-loaded component
 */
export function createLazyRouteComponent(path: string): React.FC<any> {
  const importFn = routeImports[path];
  if (!importFn) {
    throw new Error(`No import function found for route: ${path}`);
  }
  
  const config = getRouteConfig(path);
  
  return lazyRoute(importFn, {
    prefetch: config.prefetch,
    preload: config.preload,
    priority: config.priority,
    chunkName: `route-${path.replace(/\//g, '-').replace(/:/g, '_')}`
  });
}

/**
 * Prefetch routes based on the current route
 * 
 * @param currentPath Current route path
 */
export function prefetchRelatedRoutes(currentPath: string): void {
  if (!codeSplittingConfig.enabled) return;
  
  const allRoutes = getAllRouteModules();
  
  // Prefetch direct child routes if enabled
  if (codeSplittingConfig.routes.preloadChildren) {
    allRoutes
      .filter(route => route.path.startsWith(currentPath) && route.path !== currentPath)
      .forEach(route => {
        const importFn = routeImports[route.path];
        if (importFn) {
          // Use low priority for child routes
          setTimeout(() => {
            importFn().catch(() => {});
          }, 1000);
        }
      });
  }
  
  // Prefetch high priority routes
  allRoutes
    .filter(route => route.priority === LoadPriority.HIGH && route.prefetch)
    .forEach(route => {
      const importFn = routeImports[route.path];
      if (importFn) {
        setTimeout(() => {
          importFn().catch(() => {});
        }, 2000);
      }
    });
}

export default {
  routeImports,
  getRouteConfig,
  getAllRouteModules,
  createLazyRouteComponent,
  prefetchRelatedRoutes
}; 