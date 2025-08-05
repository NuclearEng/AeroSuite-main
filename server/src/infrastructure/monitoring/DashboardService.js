/**
 * DashboardService.js
 * 
 * Service for managing Grafana dashboards
 * Implements RF048 - Create monitoring dashboards
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const logger = require('../logger');
const config = require('../../config/metrics.config');

/**
 * Dashboard Service
 * 
 * Service for managing Grafana dashboards
 */
class DashboardService {
  /**
   * Create a new dashboard service
   * @param {Object} options - Dashboard service options
   */
  constructor(options = {}) {
    this.options = {
      grafanaUrl: process.env.GRAFANA_URL || 'http://grafana:3000',
      grafanaApiKey: process.env.GRAFANA_API_KEY || '',
      grafanaUsername: process.env.GRAFANA_USERNAME || 'admin',
      grafanaPassword: process.env.GRAFANA_PASSWORD || 'admin',
      dashboardsDir: path.join(__dirname, 'dashboards'),
      ...options
    };
    
    this.dashboards = [
      { id: 'system-metrics', name: 'AeroSuite System Metrics', file: 'system-dashboard.json' },
      { id: 'http-metrics', name: 'AeroSuite HTTP Metrics', file: 'http-dashboard.json' },
      { id: 'database-metrics', name: 'AeroSuite Database Metrics', file: 'database-dashboard.json' },
      { id: 'business-metrics', name: 'AeroSuite Business Metrics', file: 'business-dashboard.json' }
    ];
  }
  
  /**
   * Get HTTP client for Grafana API
   * @returns {Object} Axios instance
   * @private
   */
  _getHttpClient() {
    const headers = {};
    
    // Use API key if available, otherwise use basic auth
    if (this.options.grafanaApiKey) {
      headers.Authorization = `Bearer ${this.options.grafanaApiKey}`;
    }
    
    const client = axios.create({
      baseURL: this.options.grafanaUrl,
      headers,
      auth: !this.options.grafanaApiKey ? {
        username: this.options.grafanaUsername,
        password: this.options.grafanaPassword
      } : undefined
    });
    
    return client;
  }
  
  /**
   * Load dashboard from file
   * @param {string} filename - Dashboard filename
   * @returns {Object} Dashboard JSON
   * @private
   */
  async _loadDashboardFromFile(filename) {
    try {
      const filePath = path.join(this.options.dashboardsDir, filename);
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      logger.error(`Failed to load dashboard from file: ${filename}`, error);
      throw error;
    }
  }
  
  /**
   * Deploy dashboard to Grafana
   * @param {Object} dashboard - Dashboard JSON
   * @returns {Object} Deployment result
   * @private
   */
  async _deployDashboard(dashboard) {
    try {
      const client = this._getHttpClient();
      
      // Prepare dashboard payload
      const payload = {
        dashboard,
        overwrite: true,
        message: `Updated by AeroSuite DashboardService at ${new Date().toISOString()}`
      };
      
      // Deploy dashboard
      const response = await client.post('/api/dashboards/db', payload);
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to deploy dashboard: ${dashboard.title}`, error);
      throw error;
    }
  }
  
  /**
   * Deploy all dashboards to Grafana
   * @returns {Array} Deployment results
   */
  async deployAllDashboards() {
    const results = [];
    
    for (const dashboard of this.dashboards) {
      try {
        logger.info(`Deploying dashboard: ${dashboard.name}`);
        
        // Load dashboard from file
        const dashboardJson = await this._loadDashboardFromFile(dashboard.file);
        
        // Deploy dashboard
        const result = await this._deployDashboard(dashboardJson);
        
        results.push({
          id: dashboard.id,
          name: dashboard.name,
          status: 'success',
          url: result.url
        });
        
        logger.info(`Dashboard deployed successfully: ${dashboard.name} (${result.url})`);
      } catch (error) {
        results.push({
          id: dashboard.id,
          name: dashboard.name,
          status: 'error',
          error: error.message
        });
        
        logger.error(`Failed to deploy dashboard: ${dashboard.name}`, error);
      }
    }
    
    return results;
  }
  
  /**
   * Get dashboard by ID
   * @param {string} id - Dashboard ID
   * @returns {Object} Dashboard JSON
   */
  async getDashboard(id) {
    try {
      const client = this._getHttpClient();
      
      const response = await client.get(`/api/dashboards/uid/${id}`);
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to get dashboard: ${id}`, error);
      throw error;
    }
  }
  
  /**
   * Get all dashboards
   * @returns {Array} Dashboards
   */
  async getAllDashboards() {
    try {
      const client = this._getHttpClient();
      
      const response = await client.get('/api/search?type=dash-db');
      
      return response.data;
    } catch (error) {
      logger.error('Failed to get all dashboards', error);
      throw error;
    }
  }
  
  /**
   * Create datasource for Prometheus
   * @returns {Object} Datasource creation result
   */
  async createPrometheusDatasource() {
    try {
      const client = this._getHttpClient();
      
      // Check if datasource already exists
      try {
        await client.get('/api/datasources/name/Prometheus');
        logger.info('Prometheus datasource already exists');
        return { status: 'exists', message: 'Prometheus datasource already exists' };
      } catch (err) {
        // Datasource doesn't exist, create it
        if (err.response && err.response.status === 404) {
          const payload = {
            name: 'Prometheus',
            type: 'prometheus',
            url: process.env.PROMETHEUS_URL || 'http://prometheus:9090',
            access: 'proxy',
            isDefault: true
          };
          
          const response = await client.post('/api/datasources', payload);
          
          logger.info('Prometheus datasource created successfully');
          return response.data;
        }
        
        throw err;
      }
    } catch (error) {
      logger.error('Failed to create Prometheus datasource', error);
      throw error;
    }
  }
}

// Singleton instance
let instance = null;

/**
 * Get the dashboard service instance
 * @param {Object} options - Dashboard service options
 * @returns {DashboardService} Dashboard service instance
 */
function getDashboardService(options = {}) {
  if (!instance) {
    instance = new DashboardService(options);
  }
  return instance;
}

module.exports = {
  DashboardService,
  getDashboardService
}; 