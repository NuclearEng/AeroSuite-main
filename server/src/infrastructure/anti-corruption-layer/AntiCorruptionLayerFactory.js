/**
 * Anti-Corruption Layer Factory
 * 
 * This factory creates the appropriate Anti-Corruption Layer implementation
 * based on the ERP provider configuration.
 */

const { getActiveConfig } = require('../../config/erp-config');
const SapAntiCorruptionLayer = require('./SapAntiCorruptionLayer');
const OracleAntiCorruptionLayer = require('./OracleAntiCorruptionLayer');
const logger = require('../../utils/logger');

class AntiCorruptionLayerFactory {
  /**
   * Create an Anti-Corruption Layer instance based on the active ERP configuration
   * 
   * @returns {BaseAntiCorruptionLayer} - The appropriate ACL implementation
   */
  static createFromConfig() {
    const config = getActiveConfig();
    return AntiCorruptionLayerFactory.create(config.provider);
  }
  
  /**
   * Create an Anti-Corruption Layer instance for a specific ERP provider
   * 
   * @param {string} provider - The ERP provider name
   * @returns {BaseAntiCorruptionLayer} - The appropriate ACL implementation
   */
  static create(provider) {
    logger.info(`Creating Anti-Corruption Layer for provider: ${provider}`);
    
    switch (provider.toLowerCase()) {
      case 'sap':
        return new SapAntiCorruptionLayer();
      case 'oracle':
        return new OracleAntiCorruptionLayer();
      case 'mock':
        // For development and testing, use SAP implementation
        return new SapAntiCorruptionLayer();
      default:
        throw new Error(`Unsupported ERP provider for Anti-Corruption Layer: ${provider}`);
    }
  }
}

module.exports = AntiCorruptionLayerFactory; 