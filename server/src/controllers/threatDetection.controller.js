/**
 * Threat Detection Controller
 * Related to: SEC006 - Threat Detection System
 * 
 * Handles API endpoints for threat detection management.
 */

const threatDetection = require('../services/threatDetection');
const { logSecurityEvent, SEC_EVENT_SEVERITY } = require('../utils/securityEventLogger');

/**
 * Initialize the threat detection system
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function initialize(req, res) {
  try {
    const result = await threatDetection.initialize();
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error initializing threat detection:', error);
    return res.status(500).json({ error: 'Failed to initialize threat detection system' });
  }
}

/**
 * Get all detection rules
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function getRules(req, res) {
  try {
    const rules = threatDetection.getRules();
    
    // Log access
    logSecurityEvent(
      'API',
      SEC_EVENT_SEVERITY.INFO,
      'Threat detection rules retrieved',
      {
        component: 'ThreatDetection',
        action: 'GET_RULES',
        userId: req.user?.id || 'anonymous',
        rulesCount: rules.length
      }
    );
    
    return res.status(200).json({ rules });
  } catch (error) {
    console.error('Error retrieving threat detection rules:', error);
    return res.status(500).json({ error: 'Failed to retrieve threat detection rules' });
  }
}

/**
 * Add a new detection rule
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function addRule(req, res) {
  try {
    const rule = req.body;
    const userId = req.user?.id || 'system';
    
    // Validate required fields
    if (!rule.id || !rule.name || !rule.mechanism || !rule.type || !rule.severity) {
      return res.status(400).json({ 
        error: 'Missing required fields (id, name, mechanism, type, severity)' 
      });
    }
    
    // Add rule
    const success = threatDetection.addRule(rule);
    
    if (!success) {
      return res.status(400).json({ error: 'Failed to add rule' });
    }
    
    // Log rule addition
    logSecurityEvent(
      'API',
      SEC_EVENT_SEVERITY.INFO,
      `Threat detection rule added: ${rule.name}`,
      {
        component: 'ThreatDetection',
        action: 'ADD_RULE',
        userId,
        ruleId: rule.id
      }
    );
    
    return res.status(201).json({ success: true, rule });
  } catch (error) {
    console.error('Error adding threat detection rule:', error);
    return res.status(500).json({ error: 'Failed to add threat detection rule' });
  }
}

/**
 * Update an existing detection rule
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function updateRule(req, res) {
  try {
    const { ruleId } = req.params;
    const updates = req.body;
    const userId = req.user?.id || 'system';
    
    // Update rule
    const success = threatDetection.updateRule(ruleId, updates);
    
    if (!success) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    
    // Log rule update
    logSecurityEvent(
      'API',
      SEC_EVENT_SEVERITY.INFO,
      `Threat detection rule updated: ${ruleId}`,
      {
        component: 'ThreatDetection',
        action: 'UPDATE_RULE',
        userId,
        ruleId
      }
    );
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating threat detection rule:', error);
    return res.status(500).json({ error: 'Failed to update threat detection rule' });
  }
}

/**
 * Delete a detection rule
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function deleteRule(req, res) {
  try {
    const { ruleId } = req.params;
    const userId = req.user?.id || 'system';
    
    // Delete rule
    const success = threatDetection.deleteRule(ruleId);
    
    if (!success) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    
    // Log rule deletion
    logSecurityEvent(
      'API',
      SEC_EVENT_SEVERITY.INFO,
      `Threat detection rule deleted: ${ruleId}`,
      {
        component: 'ThreatDetection',
        action: 'DELETE_RULE',
        userId,
        ruleId
      }
    );
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting threat detection rule:', error);
    return res.status(500).json({ error: 'Failed to delete threat detection rule' });
  }
}

/**
 * Reset rules to defaults
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function resetRules(req, res) {
  try {
    const userId = req.user?.id || 'system';
    
    // Reset rules
    const success = threatDetection.resetRulesToDefaults();
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to reset rules' });
    }
    
    // Log rules reset
    logSecurityEvent(
      'API',
      SEC_EVENT_SEVERITY.INFO,
      'Threat detection rules reset to defaults',
      {
        component: 'ThreatDetection',
        action: 'RESET_RULES',
        userId
      }
    );
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error resetting threat detection rules:', error);
    return res.status(500).json({ error: 'Failed to reset threat detection rules' });
  }
}

/**
 * Test a detection rule
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function testRule(req, res) {
  try {
    const rule = req.body;
    const userId = req.user?.id || 'system';
    
    // Validate required fields
    if (!rule.id || !rule.name || !rule.mechanism || !rule.type || !rule.severity) {
      return res.status(400).json({ 
        error: 'Missing required fields (id, name, mechanism, type, severity)' 
      });
    }
    
    // Test rule
    const results = await threatDetection.testRule(rule);
    
    // Log rule test
    logSecurityEvent(
      'API',
      SEC_EVENT_SEVERITY.INFO,
      `Threat detection rule tested: ${rule.name}`,
      {
        component: 'ThreatDetection',
        action: 'TEST_RULE',
        userId,
        ruleId: rule.id,
        effectiveness: results.effectiveness
      }
    );
    
    return res.status(200).json({ results });
  } catch (error) {
    console.error('Error testing threat detection rule:', error);
    return res.status(500).json({ error: 'Failed to test threat detection rule' });
  }
}

/**
 * Get detection mechanisms
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function getDetectionMechanisms(req, res) {
  try {
    const mechanisms = threatDetection.DETECTION_MECHANISMS;
    return res.status(200).json({ mechanisms });
  } catch (error) {
    console.error('Error retrieving detection mechanisms:', error);
    return res.status(500).json({ error: 'Failed to retrieve detection mechanisms' });
  }
}

/**
 * Get threat types
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function getThreatTypes(req, res) {
  try {
    const types = threatDetection.THREAT_TYPES;
    return res.status(200).json({ types });
  } catch (error) {
    console.error('Error retrieving threat types:', error);
    return res.status(500).json({ error: 'Failed to retrieve threat types' });
  }
}

module.exports = {
  initialize,
  getRules,
  addRule,
  updateRule,
  deleteRule,
  resetRules,
  testRule,
  getDetectionMechanisms,
  getThreatTypes
}; 