/**
 * Monitoring Infrastructure Index
 * 
 * Exports all monitoring modules
 * Implements RF047 - Set up metrics collection
 * Implements RF048 - Create monitoring dashboards
 */

const { MetricsRegistry, getMetricsRegistry } = require('./MetricsRegistry');
const { HttpMetrics, getHttpMetrics } = require('./HttpMetrics');
const { DatabaseMetrics, getDatabaseMetrics } = require('./DatabaseMetrics');
const { BusinessMetrics, getBusinessMetrics } = require('./BusinessMetrics');
const { MetricsService, getMetricsService } = require('./MetricsService');
const { DashboardService, getDashboardService } = require('./DashboardService');

// Initialize metrics service
const metricsService = getMetricsService();

// HTTP metrics middleware
const metricsMiddleware = () => metricsService.getHttpMiddleware();

// Initialize dashboard service
const dashboardService = getDashboardService();

// Export all modules
module.exports = {
  // Classes
  MetricsRegistry,
  HttpMetrics,
  DatabaseMetrics,
  BusinessMetrics,
  MetricsService,
  DashboardService,
  
  // Singleton getters
  getMetricsRegistry,
  getHttpMetrics,
  getDatabaseMetrics,
  getBusinessMetrics,
  getMetricsService,
  getDashboardService,
  
  // Convenience exports
  metricsService,
  metricsMiddleware,
  dashboardService,
  
  // Prometheus metrics helpers
  getPrometheusMetrics: () => metricsService.getPrometheusMetrics(),
  getContentType: () => metricsService.getContentType(),
  getMetricsAsJson: () => metricsService.getMetricsAsJson(),
  resetMetrics: () => metricsService.resetMetrics(),
  
  // Dashboard helpers
  deployDashboards: () => dashboardService.deployAllDashboards(),
  createPrometheusDatasource: () => dashboardService.createPrometheusDatasource()
}; 