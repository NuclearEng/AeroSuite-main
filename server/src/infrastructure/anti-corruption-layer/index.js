/**
 * Anti-Corruption Layer Module
 * 
 * This module exports all Anti-Corruption Layer components.
 */

const BaseAntiCorruptionLayer = require('./BaseAntiCorruptionLayer');
const SapAntiCorruptionLayer = require('./SapAntiCorruptionLayer');
const OracleAntiCorruptionLayer = require('./OracleAntiCorruptionLayer');
const AntiCorruptionLayerFactory = require('./AntiCorruptionLayerFactory');

module.exports = {
  BaseAntiCorruptionLayer,
  SapAntiCorruptionLayer,
  OracleAntiCorruptionLayer,
  AntiCorruptionLayerFactory,
  
  /**
   * Create an Anti-Corruption Layer instance based on the active ERP configuration
   * 
   * @returns {BaseAntiCorruptionLayer} - The appropriate ACL implementation
   */
  createAcl: () => AntiCorruptionLayerFactory.createFromConfig()
}; 