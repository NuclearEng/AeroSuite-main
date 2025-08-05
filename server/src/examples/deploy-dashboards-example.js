/**
 * deploy-dashboards-example.js
 * 
 * Example script to deploy Grafana dashboards
 * Implements RF048 - Create monitoring dashboards
 */

const { getDashboardService } = require('../infrastructure/monitoring/DashboardService');
const logger = require('../infrastructure/logger');

/**
 * Deploy dashboards
 */
async function deployDashboards() {
  logger.info('Starting dashboard deployment');
  
  try {
    const dashboardService = getDashboardService();
    
    // Create Prometheus datasource if it doesn't exist
    logger.info('Creating Prometheus datasource');
    const datasourceResult = await dashboardService.createPrometheusDatasource();
    logger.info('Prometheus datasource result:', datasourceResult);
    
    // Deploy all dashboards
    logger.info('Deploying all dashboards');
    const results = await dashboardService.deployAllDashboards();
    
    // Log results
    logger.info('Dashboard deployment results:');
    results.forEach(result => {
      if (result.status === 'success') {
        logger.info(`✅ ${result.name}: ${result.url}`);
      } else {
        logger.error(`❌ ${result.name}: ${result.error}`);
      }
    });
    
    // Summary
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    
    logger.info(`Deployment complete: ${successCount} succeeded, ${errorCount} failed`);
    
    return results;
  } catch (error) {
    logger.error('Dashboard deployment failed:', error);
    throw error;
  }
}

// Run if this script is executed directly
if (require.main === module) {
  deployDashboards()
    .then(() => {
      logger.info('Dashboard deployment script completed');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Dashboard deployment script failed:', error);
      process.exit(1);
    });
} else {
  // Export for use as a module
  module.exports = {
    deployDashboards
  };
} 