import api from './api';

/**
 * Fetch system metrics
 * @returns {Promise<Object>} System metrics data
 */
export const getSystemMetrics = async () => {
  const response = await api.get('/api/monitoring/metrics/system');
  return response.data;
};

/**
 * Fetch application metrics
 * @returns {Promise<Object>} Application metrics data
 */
export const getApplicationMetrics = async () => {
  const response = await api.get('/api/monitoring/metrics/application');
  return response.data;
};

/**
 * Fetch request metrics
 * @returns {Promise<Object>} Request metrics data
 */
export const getRequestMetrics = async () => {
  const response = await api.get('/api/monitoring/metrics/requests');
  return response.data;
};

/**
 * Fetch database metrics
 * @returns {Promise<Object>} Database metrics data
 */
export const getDatabaseMetrics = async () => {
  const response = await api.get('/api/monitoring/metrics/database');
  return response.data;
};

/**
 * Fetch error metrics
 * @returns {Promise<Object>} Error metrics data
 */
export const getErrorMetrics = async () => {
  const response = await api.get('/api/monitoring/metrics/errors');
  return response.data;
};

/**
 * Fetch all metrics in a single call
 * @returns {Promise<Object>} All metrics data
 */
export const getAllMetrics = async () => {
  const response = await api.get('/api/monitoring/metrics/all');
  return response.data;
};

/**
 * Format metrics data for visualization
 * @param {Object} metrics The metrics data to format
 * @returns {Object} Formatted metrics for visualization
 */
export const formatMetricsForVisualization = (metrics) => {
  // Format system metrics
  const systemMetrics = {
    cpu: [
      {
        label: 'CPU Usage',
        data: [{ x: 'Usage', y: metrics.cpu.usage }],
        backgroundColor: '#4CAF50'
      }
    ],
    memory: [
      {
        label: 'Memory Usage',
        data: [
          { x: 'Used', y: metrics.memory.used },
          { x: 'Free', y: metrics.memory.free }
        ],
        backgroundColor: ['#F44336', '#2196F3']
      }
    ],
    disk: [
      {
        label: 'Disk Usage',
        data: [
          { x: 'Used', y: metrics.disk.used },
          { x: 'Free', y: metrics.disk.free }
        ],
        backgroundColor: ['#FF9800', '#4CAF50']
      }
    ]
  };

  // Format request metrics
  const requestMetrics = {
    statusCodes: [
      {
        label: 'Response Status Codes',
        data: Object.entries(metrics.responses.statusCodes).map(([code, count]) => ({
          x: code,
          y: count
        })),
        backgroundColor: Object.keys(metrics.responses.statusCodes).map(code => {
          if (code < 300) return '#4CAF50';
          if (code < 400) return '#FF9800';
          if (code < 500) return '#FFC107';
          return '#F44336';
        })
      }
    ],
    endpoints: [
      {
        label: 'Requests by Endpoint',
        data: Object.entries(metrics.requests.byEndpoint)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([endpoint, count]) => ({
            x: endpoint,
            y: count
          })),
        backgroundColor: '#2196F3'
      }
    ],
    performance: [
      {
        label: 'Response Time',
        data: [
          { x: 'Average', y: metrics.responses.responseTime.avg },
          { x: 'P95', y: metrics.responses.responseTime.p95 },
          { x: 'P99', y: metrics.responses.responseTime.p99 }
        ],
        backgroundColor: ['#4CAF50', '#FF9800', '#F44336']
      }
    ]
  };

  // Format error metrics
  const errorMetrics = [
    {
      label: 'Errors by Type',
      data: Object.entries(metrics.errors.byType).map(([type, count]) => ({
        x: type,
        y: count
      })),
      backgroundColor: ['#F44336', '#FF9800', '#FFC107']
    }
  ];

  // Format database metrics
  const databaseMetrics = {
    performance: [
      {
        label: 'Query Time',
        data: [
          { x: 'Average', y: metrics.database.queryTime.avg },
          { x: 'P95', y: metrics.database.queryTime.p95 },
          { x: 'P99', y: metrics.database.queryTime.p99 }
        ],
        backgroundColor: ['#4CAF50', '#FF9800', '#F44336']
      }
    ]
  };

  return {
    system: systemMetrics,
    requests: requestMetrics,
    errors: errorMetrics,
    database: databaseMetrics
  };
};

export default {
  getSystemMetrics,
  getApplicationMetrics,
  getRequestMetrics,
  getDatabaseMetrics,
  getErrorMetrics,
  getAllMetrics,
  formatMetricsForVisualization
}; 