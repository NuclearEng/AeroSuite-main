/**
 * Threat Detection System
 * Task: SEC006 - Threat Detection System
 * 
 * This module provides advanced threat detection capabilities by analyzing
 * security events and identifying potential security threats using various
 * detection mechanisms including pattern matching, behavioral analysis,
 * and anomaly detection.
 */

const { EventEmitter } = require('events');
const securityEventManagement = require('./securityEventManagement');
const { logSecurityEvent, SEC_EVENT_SEVERITY } = require('../utils/securityEventLogger');

// Threat detection event emitter
const threatEventEmitter = new EventEmitter();
threatEventEmitter.setMaxListeners(20);

// Detection mechanisms
const DETECTION_MECHANISMS = {
  PATTERN_MATCHING: 'PATTERN_MATCHING',
  BEHAVIORAL_ANALYSIS: 'BEHAVIORAL_ANALYSIS',
  ANOMALY_DETECTION: 'ANOMALY_DETECTION',
  THREAT_INTELLIGENCE: 'THREAT_INTELLIGENCE',
  RULE_BASED: 'RULE_BASED'
};

// Threat types
const THREAT_TYPES = {
  BRUTE_FORCE: 'BRUTE_FORCE',
  PRIVILEGE_ESCALATION: 'PRIVILEGE_ESCALATION',
  DATA_EXFILTRATION: 'DATA_EXFILTRATION',
  MALWARE: 'MALWARE',
  INSIDER_THREAT: 'INSIDER_THREAT',
  DDOS: 'DDOS',
  ACCOUNT_COMPROMISE: 'ACCOUNT_COMPROMISE',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY'
};

// Default threat detection rules
const defaultRules = [
  {
    id: 'TD001',
    name: 'Authentication Brute Force',
    description: 'Detects multiple failed authentication attempts',
    enabled: true,
    type: THREAT_TYPES.BRUTE_FORCE,
    mechanism: DETECTION_MECHANISMS.PATTERN_MATCHING,
    severity: SEC_EVENT_SEVERITY.HIGH,
    threshold: {
      count: 5,
      timeWindowMinutes: 5
    },
    eventType: 'auth:failure',
    conditions: {
      groupBy: 'userId',
      aggregation: 'count'
    },
    response: {
      createAlert: true,
      createIncident: false,
      autoContainment: true,
      containmentAction: 'LOCK_ACCOUNT'
    }
  },
  {
    id: 'TD002',
    name: 'Privilege Escalation Attempt',
    description: 'Detects attempts to escalate privileges',
    enabled: true,
    type: THREAT_TYPES.PRIVILEGE_ESCALATION,
    mechanism: DETECTION_MECHANISMS.BEHAVIORAL_ANALYSIS,
    severity: SEC_EVENT_SEVERITY.CRITICAL,
    patterns: [
      {
        sequence: ['auth:success', 'access:denied', 'access:denied', 'role:changed'],
        timeWindowMinutes: 30
      }
    ],
    conditions: {
      groupBy: 'userId'
    },
    response: {
      createAlert: true,
      createIncident: true,
      autoContainment: true,
      containmentAction: 'REVOKE_SESSION'
    }
  },
  {
    id: 'TD003',
    name: 'Unusual Login Time',
    description: 'Detects logins at unusual times for a user',
    enabled: true,
    type: THREAT_TYPES.SUSPICIOUS_ACTIVITY,
    mechanism: DETECTION_MECHANISMS.ANOMALY_DETECTION,
    severity: SEC_EVENT_SEVERITY.MEDIUM,
    eventType: 'auth:success',
    conditions: {
      baselineField: 'timestamp',
      baselinePeriodDays: 30,
      deviationThreshold: 3
    },
    response: {
      createAlert: true,
      createIncident: false,
      autoContainment: false
    }
  },
  {
    id: 'TD004',
    name: 'Large Data Access',
    description: 'Detects unusually large data access operations',
    enabled: true,
    type: THREAT_TYPES.DATA_EXFILTRATION,
    mechanism: DETECTION_MECHANISMS.ANOMALY_DETECTION,
    severity: SEC_EVENT_SEVERITY.HIGH,
    eventType: 'data:access',
    conditions: {
      baselineField: 'metadata.dataSize',
      baselinePeriodDays: 14,
      deviationThreshold: 2.5
    },
    response: {
      createAlert: true,
      createIncident: false,
      autoContainment: false
    }
  },
  {
    id: 'TD005',
    name: 'Multiple Country Access',
    description: 'Detects access from multiple countries in a short time period',
    enabled: true,
    type: THREAT_TYPES.ACCOUNT_COMPROMISE,
    mechanism: DETECTION_MECHANISMS.BEHAVIORAL_ANALYSIS,
    severity: SEC_EVENT_SEVERITY.HIGH,
    eventType: 'auth:success',
    conditions: {
      groupBy: 'userId',
      uniqueValues: 'metadata.country',
      threshold: 2,
      timeWindowMinutes: 60
    },
    response: {
      createAlert: true,
      createIncident: true,
      autoContainment: true,
      containmentAction: 'REQUIRE_MFA'
    }
  }
];

// Active threat detection rules
let activeRules = [...defaultRules];

// User behavior baselines
const userBaselines = new Map();

// Initialize the threat detection system
async function initialize() {
  // Register with the SIEM
  securityEventManagement.onSIEMEvent('event', handleSecurityEvent);
  securityEventManagement.onSIEMEvent('alert', handleSecurityAlert);
  
  // Log initialization
  logSecurityEvent(
    'SYSTEM',
    SEC_EVENT_SEVERITY.INFO,
    'Threat Detection System initialized',
    { component: 'ThreatDetection', action: 'INITIALIZE' }
  );
  
  // Start baseline calculation
  calculateBaselines();
  
  return { success: true };
}

/**
 * Handle security event for threat detection
 * @param {Object} event - Security event
 */
async function handleSecurityEvent(event) {
  try {
    // Apply detection rules
    for (const rule of activeRules) {
      if (!rule.enabled) continue;
      
      // Skip if event type doesn't match
      if (rule.eventType && rule.eventType !== event.type) continue;
      
      // Apply the appropriate detection mechanism
      let threatDetected = false;
      
      switch (rule.mechanism) {
        case DETECTION_MECHANISMS.PATTERN_MATCHING:
          threatDetected = applyPatternMatching(event, rule);
          break;
        
        case DETECTION_MECHANISMS.BEHAVIORAL_ANALYSIS:
          threatDetected = applyBehavioralAnalysis(event, rule);
          break;
        
        case DETECTION_MECHANISMS.ANOMALY_DETECTION:
          threatDetected = applyAnomalyDetection(event, rule);
          break;
        
        case DETECTION_MECHANISMS.THREAT_INTELLIGENCE:
          threatDetected = applyThreatIntelligence(event, rule);
          break;
        
        case DETECTION_MECHANISMS.RULE_BASED:
          threatDetected = applyRuleBasedDetection(event, rule);
          break;
      }
      
      // Handle detected threat
      if (threatDetected) {
        await handleThreatDetection(event, rule);
      }
    }
    
    // Update user behavior baseline
    updateUserBaseline(event);
    
    return true;
  } catch (error) {
    console.error('Error in threat detection:', error);
    return false;
  }
}

/**
 * Handle security alert for correlation
 * @param {Object} alert - Security alert
 */
async function handleSecurityAlert(alert) {
  // This would implement alert correlation logic
  // For now, we'll just log the alert
  logSecurityEvent(
    'THREAT',
    SEC_EVENT_SEVERITY.INFO,
    `Processing alert in threat detection: ${alert.name}`,
    { 
      component: 'ThreatDetection', 
      action: 'PROCESS_ALERT',
      alertId: alert.id
    }
  );
}

/**
 * Apply pattern matching detection
 * @param {Object} event - Security event
 * @param {Object} rule - Detection rule
 * @returns {boolean} True if threat detected
 */
function applyPatternMatching(event, rule) {
  // Simple threshold-based pattern matching
  if (rule.threshold) {
    const { count, timeWindowMinutes } = rule.threshold;
    const { groupBy } = rule.conditions;
    
    // If we need to group by a field
    if (groupBy) {
      const groupValue = getNestedValue(event, groupBy);
      if (!groupValue) return false;
      
      const windowKey = `${event.type}:${groupValue}:${timeWindowMinutes}m`;
      const events = getRecentEventsCount(windowKey);
      
      return events >= count;
    } else {
      const windowKey = `${event.type}:${timeWindowMinutes}m`;
      const events = getRecentEventsCount(windowKey);
      
      return events >= count;
    }
  }
  
  return false;
}

/**
 * Apply behavioral analysis detection
 * @param {Object} event - Security event
 * @param {Object} rule - Detection rule
 * @returns {boolean} True if threat detected
 */
function applyBehavioralAnalysis(event, rule) {
  // Sequence-based pattern detection
  if (rule.patterns) {
    for (const pattern of rule.patterns) {
      const { sequence, timeWindowMinutes } = pattern;
      const { groupBy } = rule.conditions;
      
      // If we need to group by a field
      if (groupBy) {
        const groupValue = getNestedValue(event, groupBy);
        if (!groupValue) continue;
        
        // Check if the sequence matches
        const matches = checkEventSequence(sequence, groupValue, timeWindowMinutes);
        if (matches) return true;
      } else {
        // Check if the sequence matches
        const matches = checkEventSequence(sequence, null, timeWindowMinutes);
        if (matches) return true;
      }
    }
  }
  
  // Unique values threshold detection
  if (rule.conditions && rule.conditions.uniqueValues) {
    const { groupBy, uniqueValues, threshold, timeWindowMinutes } = rule.conditions;
    
    if (!groupBy || !uniqueValues) return false;
    
    const groupValue = getNestedValue(event, groupBy);
    if (!groupValue) return false;
    
    const uniqueValueSet = getUniqueValuesForGroup(
      event.type, 
      groupValue, 
      uniqueValues, 
      timeWindowMinutes
    );
    
    return uniqueValueSet.size >= threshold;
  }
  
  return false;
}

/**
 * Apply anomaly detection
 * @param {Object} event - Security event
 * @param {Object} rule - Detection rule
 * @returns {boolean} True if threat detected
 */
function applyAnomalyDetection(event, rule) {
  if (!rule.conditions || !rule.conditions.baselineField) return false;
  
  const { baselineField, deviationThreshold } = rule.conditions;
  const userId = event.metadata && event.metadata.userId;
  
  if (!userId) return false;
  
  // Get the value to check from the event
  const fieldValue = getNestedValue(event, baselineField);
  if (fieldValue === undefined) return false;
  
  // Get user baseline
  const userBaseline = getUserBaseline(userId, event.type, baselineField);
  if (!userBaseline) return false;
  
  // Check if value deviates from baseline
  return isAnomaly(fieldValue, userBaseline, deviationThreshold);
}

/**
 * Apply threat intelligence detection
 * @param {Object} event - Security event
 * @param {Object} rule - Detection rule
 * @returns {boolean} True if threat detected
 */
function applyThreatIntelligence(event, rule) {
  // Ensure rule has the required threat intelligence config
  if (!rule.threatIntelligence) {
    return false;
  }

  // Extract relevant fields from event based on rule configuration
  const { indicatorField, indicatorType } = rule.threatIntelligence;
  const indicator = getNestedValue(event, indicatorField);
  
  if (!indicator) {
    return false;
  }
  
  // Check against known threat intelligence feeds
  switch (indicatorType) {
    case 'IP':
      return checkMaliciousIP(indicator, rule.threatIntelligence.sources);
    
    case 'DOMAIN':
      return checkMaliciousDomain(indicator, rule.threatIntelligence.sources);
    
    case 'HASH':
      return checkMaliciousHash(indicator, rule.threatIntelligence.sources);
    
    case 'URL':
      return checkMaliciousURL(indicator, rule.threatIntelligence.sources);
    
    default:
      return false;
  }
}

/**
 * Check if an IP is in the malicious IP list
 * @param {string} ip - IP address to check
 * @param {Array} sources - Threat intelligence sources to check
 * @returns {boolean} - Whether IP is malicious
 */
function checkMaliciousIP(ip, sources = ['local', 'cloud']) {
  // Mock implementation - in production this would query actual threat intel feeds
  const maliciousIPs = {
    local: [
      '1.2.3.4',
      '5.6.7.8',
      '192.168.1.100',
      '10.0.0.99'
    ],
    cloud: [
      '9.10.11.12',
      '13.14.15.16'
    ]
  };
  
  // Check each requested source
  return sources.some(source => {
    if (!maliciousIPs[source]) return false;
    return maliciousIPs[source].includes(ip);
  });
}

/**
 * Check if a domain is in the malicious domain list
 * @param {string} domain - Domain to check
 * @param {Array} sources - Threat intelligence sources to check
 * @returns {boolean} - Whether domain is malicious
 */
function checkMaliciousDomain(domain, sources = ['local', 'cloud']) {
  // Mock implementation - in production this would query actual threat intel feeds
  const maliciousDomains = {
    local: [
      'malicious-domain.com',
      'phishing-site.net',
      'malware-distribution.org'
    ],
    cloud: [
      'evil-domain.com',
      'ransomware.xyz'
    ]
  };
  
  // Check each requested source
  return sources.some(source => {
    if (!maliciousDomains[source]) return false;
    return maliciousDomains[source].includes(domain);
  });
}

/**
 * Check if a file hash is in the malicious hash list
 * @param {string} hash - File hash to check
 * @param {Array} sources - Threat intelligence sources to check
 * @returns {boolean} - Whether hash is malicious
 */
function checkMaliciousHash(hash, sources = ['local', 'cloud']) {
  // Mock implementation - in production this would query actual threat intel feeds
  const maliciousHashes = {
    local: [
      'aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d',
      '9e107d9d372bb6826bd81d3542a419d6',
      '2fd4e1c67a2d28fced849ee1bb76e7391b93eb12'
    ],
    cloud: [
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      'd41d8cd98f00b204e9800998ecf8427e'
    ]
  };
  
  // Check each requested source
  return sources.some(source => {
    if (!maliciousHashes[source]) return false;
    return maliciousHashes[source].includes(hash);
  });
}

/**
 * Check if a URL is in the malicious URL list
 * @param {string} url - URL to check
 * @param {Array} sources - Threat intelligence sources to check
 * @returns {boolean} - Whether URL is malicious
 */
function checkMaliciousURL(url, sources = ['local', 'cloud']) {
  // Mock implementation - in production this would query actual threat intel feeds
  const maliciousURLs = {
    local: [
      'http://malicious-domain.com/malware.exe',
      'https://phishing-site.net/login',
      'http://malware-distribution.org/payload'
    ],
    cloud: [
      'https://evil-domain.com/exploit',
      'http://ransomware.xyz/encrypt'
    ]
  };
  
  // Known malicious domains for URL checking
  const maliciousDomains = {
    local: [
      'malicious-domain.com',
      'phishing-site.net',
      'malware-distribution.org'
    ],
    cloud: [
      'evil-domain.com',
      'ransomware.xyz'
    ]
  };
  
  // Check each requested source and also check if URL contains a malicious domain
  return sources.some(source => {
    if (!maliciousURLs[source]) return false;
    
    // Direct match
    if (maliciousURLs[source].includes(url)) return true;
    
    // Check if URL contains any malicious domain
    return maliciousDomains && maliciousDomains[source] && 
      maliciousDomains[source].some(domain => url.includes(domain));
  });
}

/**
 * Apply rule-based detection
 * @param {Object} event - Security event
 * @param {Object} rule - Detection rule
 * @returns {boolean} True if threat detected
 */
function applyRuleBasedDetection(event, rule) {
  // Ensure rule has conditions
  if (!rule.conditions) {
    return false;
  }
  
  // Apply each condition in the rule
  return evaluateConditions(event, rule.conditions);
}

/**
 * Evaluate conditions against an event
 * @param {Object} event - Security event
 * @param {Object} conditions - Rule conditions
 * @returns {boolean} - Whether conditions match
 */
function evaluateConditions(event, conditions) {
  // Each condition is connected with AND logic by default
  for (const key in conditions) {
    // Skip meta properties
    if (key === 'operator' || key === 'negated') {
      continue;
    }
    
    // Handle sub-conditions (can be connected with OR)
    if (Array.isArray(conditions[key])) {
      const subResults = conditions[key].map(subCondition => 
        evaluateConditions(event, subCondition)
      );
      
      // By default sub-conditions use OR logic
      const operator = conditions.operator || 'OR';
      const result = operator === 'OR' 
        ? subResults.some(r => r) 
        : subResults.every(r => r);
      
      // Apply negation if specified
      if (conditions.negated) {
        return !result;
      }
      return result;
    }
    
    // Handle simple field comparison
    const eventValue = getNestedValue(event, key);
    const conditionValue = conditions[key];
    
    // If eventValue is undefined or null and we're testing for existence
    if ((eventValue === undefined || eventValue === null) && conditionValue !== null) {
      return false;
    }
    
    // Handle different comparison types
    if (typeof conditionValue === 'object' && conditionValue !== null) {
      // Complex comparison
      if (!compareValues(eventValue, conditionValue)) {
        return false;
      }
    } else {
      // Simple equality
      if (eventValue !== conditionValue) {
        return false;
      }
    }
  }
  
  // All conditions passed
  return true;
}

/**
 * Compare values with different operators
 * @param {any} eventValue - Value from the event
 * @param {Object} condition - Condition with operator and value
 * @returns {boolean} - Whether the comparison succeeds
 */
function compareValues(eventValue, condition) {
  const { op, value } = condition;
  
  switch (op) {
    case 'eq':
      return eventValue === value;
    case 'neq':
      return eventValue !== value;
    case 'gt':
      return eventValue > value;
    case 'gte':
      return eventValue >= value;
    case 'lt':
      return eventValue < value;
    case 'lte':
      return eventValue <= value;
    case 'contains':
      return eventValue.includes(value);
    case 'startsWith':
      return eventValue.startsWith(value);
    case 'endsWith':
      return eventValue.endsWith(value);
    case 'in':
      return Array.isArray(value) && value.includes(eventValue);
    case 'nin':
      return Array.isArray(value) && !value.includes(eventValue);
    case 'exists':
      return eventValue !== undefined && eventValue !== null;
    default:
      return false;
  }
}

/**
 * Handle a detected threat
 * @param {Object} event - Security event
 * @param {Object} rule - Detection rule
 */
async function handleThreatDetection(event, rule) {
  // Create a threat object
  const threat = {
    id: `threat-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`,
    name: rule.name,
    description: rule.description,
    severity: rule.severity,
    type: rule.type,
    mechanism: rule.mechanism,
    timestamp: new Date().toISOString(),
    sourceEventId: event.id,
    ruleId: rule.id,
    metadata: {
      ...event.metadata,
      threatDetectionRule: rule.id
    }
  };
  
  // Log threat detection
  logSecurityEvent(
    'THREAT',
    rule.severity,
    `Threat detected: ${rule.name}`,
    { 
      component: 'ThreatDetection', 
      action: 'THREAT_DETECTED',
      threatId: threat.id,
      ruleId: rule.id,
      sourceEventId: event.id,
      userId: event.metadata?.userId
    }
  );
  
  // Emit threat event
  threatEventEmitter.emit('threat', threat);
  
  // Handle response actions
  if (rule.response) {
    // Create alert if configured
    if (rule.response.createAlert) {
      await securityEventManagement.createAlert({
        name: `Threat: ${rule.name}`,
        description: `${rule.description}. Detected by ${rule.mechanism} mechanism.`,
        severity: rule.severity,
        sourceEvent: event,
        metadata: {
          threatId: threat.id,
          ruleId: rule.id,
          threatType: rule.type,
          detectionMechanism: rule.mechanism,
          ...event.metadata
        }
      });
    }
    
    // Create incident if configured
    if (rule.response.createIncident) {
      await securityEventManagement.createIncident({
        name: `Threat Incident: ${rule.name}`,
        description: `${rule.description}. Severity: ${rule.severity}. Detected by ${rule.mechanism} mechanism.`,
        severity: rule.severity,
        type: mapThreatTypeToIncidentType(rule.type),
        sourceAlert: { id: threat.id },
        metadata: {
          threatId: threat.id,
          ruleId: rule.id,
          threatType: rule.type,
          detectionMechanism: rule.mechanism,
          ...event.metadata
        }
      });
    }
    
    // Execute auto-containment if configured
    if (rule.response.autoContainment && rule.response.containmentAction) {
      await executeContainment(event, rule.response.containmentAction, threat);
    }
  }
}

/**
 * Map threat type to incident type
 * @param {string} threatType - Threat type
 * @returns {string} Incident type
 */
function mapThreatTypeToIncidentType(threatType) {
  const mapping = {
    [THREAT_TYPES.BRUTE_FORCE]: 'UNAUTHORIZED_ACCESS',
    [THREAT_TYPES.PRIVILEGE_ESCALATION]: 'PRIVILEGE_ESCALATION',
    [THREAT_TYPES.DATA_EXFILTRATION]: 'DATA_BREACH',
    [THREAT_TYPES.MALWARE]: 'MALWARE',
    [THREAT_TYPES.INSIDER_THREAT]: 'INSIDER_THREAT',
    [THREAT_TYPES.DDOS]: 'DENIAL_OF_SERVICE',
    [THREAT_TYPES.ACCOUNT_COMPROMISE]: 'UNAUTHORIZED_ACCESS',
    [THREAT_TYPES.UNAUTHORIZED_ACCESS]: 'UNAUTHORIZED_ACCESS',
    [THREAT_TYPES.SUSPICIOUS_ACTIVITY]: 'OTHER'
  };
  
  return mapping[threatType] || 'OTHER';
}

/**
 * Execute containment action
 * @param {Object} event - Security event
 * @param {string} action - Containment action
 * @param {Object} threat - Threat object
 */
async function executeContainment(event, action, threat) {
  // Log containment action
  logSecurityEvent(
    'THREAT',
    SEC_EVENT_SEVERITY.HIGH,
    `Executing containment action: ${action}`,
    { 
      component: 'ThreatDetection', 
      action: 'CONTAINMENT',
      containmentAction: action,
      threatId: threat.id,
      userId: event.metadata?.userId
    }
  );
  
  // This would implement actual containment actions
  // For now, we'll just log the action
  console.log(`[ThreatDetection] Containment action ${action} for threat ${threat.id}`);
  
  // In a real implementation, this would call the appropriate service to
  // execute the containment action (e.g., lock account, revoke session, etc.)
}

/**
 * Get recent events count
 * @param {string} windowKey - Window key
 * @returns {number} Event count
 */
function getRecentEventsCount(windowKey) {
  // This would normally get the count from the SIEM event counters
  // For now, we'll return a random number for testing
  return Math.floor(Math.random() * 10);
}

/**
 * Check if event sequence matches
 * @param {Array<string>} sequence - Event sequence
 * @param {string} groupValue - Group value
 * @param {number} timeWindowMinutes - Time window in minutes
 * @returns {boolean} True if sequence matches
 */
function checkEventSequence(sequence, groupValue, timeWindowMinutes) {
  // This would normally check the sequence against recent events
  // For now, we'll return a random result for testing
  return Math.random() > 0.7;
}

/**
 * Get unique values for group
 * @param {string} eventType - Event type
 * @param {string} groupValue - Group value
 * @param {string} fieldPath - Field path for unique values
 * @param {number} timeWindowMinutes - Time window in minutes
 * @returns {Set} Set of unique values
 */
function getUniqueValuesForGroup(eventType, groupValue, fieldPath, timeWindowMinutes) {
  // This would normally get unique values from recent events
  // For now, we'll return a set with random values for testing
  const uniqueValues = new Set();
  const count = Math.floor(Math.random() * 3) + 1;
  
  for (let i = 0; i < count; i++) {
    uniqueValues.add(`value-${i}`);
  }
  
  return uniqueValues;
}

/**
 * Update user behavior baseline
 * @param {Object} event - Security event
 */
function updateUserBaseline(event) {
  const userId = event.metadata && event.metadata.userId;
  if (!userId) return;
  
  // Initialize user baseline if not exists
  if (!userBaselines.has(userId)) {
    userBaselines.set(userId, {
      eventCounts: {},
      fieldValues: {}
    });
  }
  
  const userBaseline = userBaselines.get(userId);
  
  // Update event counts
  if (!userBaseline.eventCounts[event.type]) {
    userBaseline.eventCounts[event.type] = 0;
  }
  userBaseline.eventCounts[event.type]++;
  
  // Update field values for anomaly detection
  if (!userBaseline.fieldValues[event.type]) {
    userBaseline.fieldValues[event.type] = {};
  }
  
  // For each field in the event, update baseline values
  updateFieldBaselines(userBaseline.fieldValues[event.type], event);
}

/**
 * Update field baselines
 * @param {Object} fieldBaselines - Field baselines
 * @param {Object} event - Security event
 */
function updateFieldBaselines(fieldBaselines, event) {
  // Update timestamp baseline
  if (!fieldBaselines.timestamp) {
    fieldBaselines.timestamp = {
      values: [],
      mean: 0,
      stdDev: 0
    };
  }
  
  // Add timestamp hour to values
  const hour = new Date(event.timestamp).getHours();
  fieldBaselines.timestamp.values.push(hour);
  
  // Keep only last 100 values
  if (fieldBaselines.timestamp.values.length > 100) {
    fieldBaselines.timestamp.values.shift();
  }
  
  // Update mean and standard deviation
  updateStatistics(fieldBaselines.timestamp);
  
  // Update other field baselines based on metadata
  if (event.metadata) {
    for (const [key, value] of Object.entries(event.metadata)) {
      // Only track numeric values
      if (typeof value === 'number') {
        if (!fieldBaselines[key]) {
          fieldBaselines[key] = {
            values: [],
            mean: 0,
            stdDev: 0
          };
        }
        
        fieldBaselines[key].values.push(value);
        
        // Keep only last 100 values
        if (fieldBaselines[key].values.length > 100) {
          fieldBaselines[key].values.shift();
        }
        
        // Update mean and standard deviation
        updateStatistics(fieldBaselines[key]);
      }
    }
  }
}

/**
 * Update statistics
 * @param {Object} baseline - Baseline object
 */
function updateStatistics(baseline) {
  const { values } = baseline;
  
  if (values.length === 0) return;
  
  // Calculate mean
  const sum = values.reduce((acc, val) => acc + val, 0);
  baseline.mean = sum / values.length;
  
  // Calculate standard deviation
  const squaredDifferences = values.map(val => Math.pow(val - baseline.mean, 2));
  const variance = squaredDifferences.reduce((acc, val) => acc + val, 0) / values.length;
  baseline.stdDev = Math.sqrt(variance);
}

/**
 * Get user baseline
 * @param {string} userId - User ID
 * @param {string} eventType - Event type
 * @param {string} fieldPath - Field path
 * @returns {Object} Baseline statistics
 */
function getUserBaseline(userId, eventType, fieldPath) {
  const userBaseline = userBaselines.get(userId);
  if (!userBaseline) return null;
  
  const eventBaseline = userBaseline.fieldValues[eventType];
  if (!eventBaseline) return null;
  
  // Handle nested fields
  const parts = fieldPath.split('.');
  let current = eventBaseline;
  
  for (const part of parts) {
    if (!current[part]) return null;
    current = current[part];
  }
  
  return current;
}

/**
 * Check if value is anomalous
 * @param {number} value - Value to check
 * @param {Object} baseline - Baseline statistics
 * @param {number} threshold - Deviation threshold
 * @returns {boolean} True if anomalous
 */
function isAnomaly(value, baseline, threshold) {
  if (!baseline || baseline.values.length < 10) return false;
  
  // Calculate Z-score
  const zScore = Math.abs((value - baseline.mean) / baseline.stdDev);
  
  // Return true if Z-score exceeds threshold
  return zScore > threshold;
}

/**
 * Get nested value from object
 * @param {Object} obj - Object
 * @param {string} path - Path
 * @returns {any} Value
 */
function getNestedValue(obj, path) {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  
  return current;
}

/**
 * Calculate baselines periodically
 */
function calculateBaselines() {
  // This would normally calculate baselines for all users
  // For now, we'll just log that it's running
  console.log('[ThreatDetection] Calculating baselines');
  
  // Schedule next calculation
  setTimeout(calculateBaselines, 3600000); // Run every hour
}

/**
 * Register a threat detection listener
 * @param {string} eventType - Event type
 * @param {Function} callback - Callback function
 * @returns {Function} Function to remove listener
 */
function onThreatEvent(eventType, callback) {
  threatEventEmitter.on(eventType, callback);
  
  // Return function to remove listener
  return () => {
    threatEventEmitter.removeListener(eventType, callback);
  };
}

/**
 * Add a custom detection rule
 * @param {Object} rule - Detection rule
 * @returns {boolean} Success
 */
function addRule(rule) {
  // Validate rule
  if (!rule.id || !rule.name || !rule.mechanism || !rule.type || !rule.severity) {
    return false;
  }
  
  // Check if rule with same ID already exists
  const existingIndex = activeRules.findIndex(r => r.id === rule.id);
  
  if (existingIndex >= 0) {
    // Update existing rule
    activeRules[existingIndex] = rule;
  } else {
    // Add new rule
    activeRules.push(rule);
  }
  
  // Log rule addition
  logSecurityEvent(
    'SYSTEM',
    SEC_EVENT_SEVERITY.INFO,
    `Threat detection rule added: ${rule.name}`,
    { 
      component: 'ThreatDetection', 
      action: 'ADD_RULE',
      ruleId: rule.id
    }
  );
  
  return true;
}

/**
 * Update an existing detection rule
 * @param {string} ruleId - Rule ID
 * @param {Object} updates - Rule updates
 * @returns {boolean} Success
 */
function updateRule(ruleId, updates) {
  // Find rule
  const ruleIndex = activeRules.findIndex(r => r.id === ruleId);
  
  if (ruleIndex < 0) {
    return false;
  }
  
  // Update rule
  activeRules[ruleIndex] = {
    ...activeRules[ruleIndex],
    ...updates
  };
  
  // Log rule update
  logSecurityEvent(
    'SYSTEM',
    SEC_EVENT_SEVERITY.INFO,
    `Threat detection rule updated: ${activeRules[ruleIndex].name}`,
    { 
      component: 'ThreatDetection', 
      action: 'UPDATE_RULE',
      ruleId
    }
  );
  
  return true;
}

/**
 * Delete a detection rule
 * @param {string} ruleId - Rule ID
 * @returns {boolean} Success
 */
function deleteRule(ruleId) {
  // Find rule
  const ruleIndex = activeRules.findIndex(r => r.id === ruleId);
  
  if (ruleIndex < 0) {
    return false;
  }
  
  // Get rule name for logging
  const ruleName = activeRules[ruleIndex].name;
  
  // Remove rule
  activeRules.splice(ruleIndex, 1);
  
  // Log rule deletion
  logSecurityEvent(
    'SYSTEM',
    SEC_EVENT_SEVERITY.INFO,
    `Threat detection rule deleted: ${ruleName}`,
    { 
      component: 'ThreatDetection', 
      action: 'DELETE_RULE',
      ruleId
    }
  );
  
  return true;
}

/**
 * Get all detection rules
 * @returns {Array} Detection rules
 */
function getRules() {
  return [...activeRules];
}

/**
 * Reset rules to defaults
 * @returns {boolean} Success
 */
function resetRulesToDefaults() {
  activeRules = [...defaultRules];
  
  // Log reset
  logSecurityEvent(
    'SYSTEM',
    SEC_EVENT_SEVERITY.INFO,
    'Threat detection rules reset to defaults',
    { 
      component: 'ThreatDetection', 
      action: 'RESET_RULES'
    }
  );
  
  return true;
}

/**
 * Test a rule against historical data
 * @param {Object} rule - Detection rule
 * @returns {Object} Test results
 */
async function testRule(rule) {
  // This would normally test the rule against historical data
  // For now, we'll return mock results
  return {
    ruleId: rule.id,
    eventsProcessed: 100,
    detections: 5,
    falsePositives: 1,
    effectiveness: 0.95,
    timestamp: new Date().toISOString()
  };
}

// Module exports
module.exports = {
  initialize,
  handleSecurityEvent,
  onThreatEvent,
  addRule,
  updateRule,
  deleteRule,
  getRules,
  resetRulesToDefaults,
  testRule,
  
  // Export private functions for testing
  __test__: {
    applyPatternMatching,
    applyBehavioralAnalysis,
    applyAnomalyDetection,
    applyThreatIntelligence,
    applyRuleBasedDetection,
    checkMaliciousIP,
    checkMaliciousDomain,
    checkMaliciousHash,
    checkMaliciousURL,
    evaluateConditions,
    compareValues,
    handleThreatDetection,
    executeContainment,
    getNestedValue,
    calculateBaselines
  },
  DETECTION_MECHANISMS,
  THREAT_TYPES
}; 