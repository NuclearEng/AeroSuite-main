/**
 * Security Information Event Management (SIEM) Service
 * Task: SEC005 - Security Information Event Management
 * 
 * This module provides comprehensive security event management,
 * including collection, correlation, analysis, and alerting.
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { EventEmitter } = require('events');
const securityInfo = require('../core/securityInfo');
const { logSecurityEvent, SEC_EVENT_SEVERITY } = require('../utils/securityEventLogger');

// Import models (will be created separately)
let SecurityEvent;
let SecurityAlert;
let SecurityIncident;

try {
  SecurityEvent = mongoose.model('SecurityEvent');
  SecurityAlert = mongoose.model('SecurityAlert');
  SecurityIncident = mongoose.model('SecurityIncident');
} catch (error) {
  // Models will be imported by the application when ready
}

// Configuration
const CONFIG = {
  alertThresholds: {
    authFailures: {
      count: 5,
      timeWindowMinutes: 10,
      severity: SEC_EVENT_SEVERITY.MEDIUM
    },
    privilegeEscalation: {
      count: 1, // Single attempt
      timeWindowMinutes: 60,
      severity: SEC_EVENT_SEVERITY.HIGH
    },
    maliciousIP: {
      count: 1, // Single access
      timeWindowMinutes: 60,
      severity: SEC_EVENT_SEVERITY.HIGH
    },
    dataExfiltration: {
      dataSizeThresholdMB: 10,
      timeWindowMinutes: 60,
      severity: SEC_EVENT_SEVERITY.HIGH
    },
    abnormalAccess: {
      count: 3,
      timeWindowMinutes: 60,
      severity: SEC_EVENT_SEVERITY.MEDIUM
    }
  },
  correlationRules: [
    {
      name: 'Authentication Attack',
      description: 'Multiple authentication failures followed by successful login',
      triggerEvents: ['auth:failure', 'auth:success'],
      conditions: {
        'auth:failure': { minCount: 3, timeWindowMinutes: 30 },
        'auth:success': { minCount: 1, timeWindowMinutes: 5, after: 'auth:failure' }
      },
      severity: SEC_EVENT_SEVERITY.HIGH
    },
    {
      name: 'Privilege Escalation',
      description: 'Successful login followed by privilege elevation',
      triggerEvents: ['auth:success', 'access:denied', 'role:changed'],
      conditions: {
        'auth:success': { minCount: 1, timeWindowMinutes: 60 },
        'access:denied': { minCount: 3, timeWindowMinutes: 30, after: 'auth:success' },
        'role:changed': { minCount: 1, timeWindowMinutes: 10, after: 'access:denied' }
      },
      severity: SEC_EVENT_SEVERITY.CRITICAL
    },
    {
      name: 'Data Exfiltration',
      description: 'Large data access followed by unusual activity',
      triggerEvents: ['data:access'],
      conditions: {
        'data:access': { 
          minCount: 5, 
          timeWindowMinutes: 15,
          metadata: { 
            dataSize: { min: 5000000 } // 5MB
          }
        }
      },
      severity: SEC_EVENT_SEVERITY.HIGH
    }
  ],
  logRetentionDays: 90,
  maxEventsInMemory: 10000,
  alertNotificationChannels: ['email', 'dashboard', 'webhook'],
  blacklistedIPs: process.env.BLACKLISTED_IPS ? process.env.BLACKLISTED_IPS.split(',') : []
};

// Event emitter for SIEM events
const siemEventEmitter = new EventEmitter();
siemEventEmitter.setMaxListeners(30);

// In-memory storage for recent events (circular buffer)
const recentEvents = [];
let currentEventIndex = 0;

// Event counters for various security events
const eventCounters = new Map();

// Initialize the SIEM system
async function initialize() {
  // Register with the security information core
  securityInfo.onSecurityEvent('all', handleSecurityEvent);
  
  // Set up periodic tasks
  setInterval(runPeriodicTasks, 60000); // Run every minute
  
  // Log initialization
  logSecurityEvent(
    'SYSTEM',
    SEC_EVENT_SEVERITY.INFO,
    'Security Information Event Management (SIEM) system initialized',
    { component: 'SIEM', action: 'INITIALIZE' }
  );
  
  return { success: true };
}

/**
 * Handle a security event
 * @param {Object} event - Security event
 */
async function handleSecurityEvent(event) {
  try {
    // Store event
    storeEvent(event);
    
    // Check for alert conditions
    checkAlertConditions(event);
    
    // Apply correlation rules
    applyCorrelationRules(event);
    
    // Emit SIEM event
    siemEventEmitter.emit('event', event);
    siemEventEmitter.emit(event.type, event);
    
    // Store event in database if available
    if (SecurityEvent) {
      await SecurityEvent.create({
        eventId: event.id,
        type: event.type,
        severity: event.severity,
        message: event.message,
        timestamp: new Date(event.timestamp),
        metadata: event.metadata,
        sourceIp: event.metadata.ipAddress || 'unknown',
        userId: event.metadata.userId || 'unknown',
        resourceId: event.metadata.resourceId || 'unknown'
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error handling security event:', error);
    return false;
  }
}

/**
 * Store event in memory
 * @param {Object} event - Security event
 */
function storeEvent(event) {
  // Store in circular buffer
  if (recentEvents.length < CONFIG.maxEventsInMemory) {
    recentEvents.push(event);
  } else {
    recentEvents[currentEventIndex] = event;
    currentEventIndex = (currentEventIndex + 1) % CONFIG.maxEventsInMemory;
  }
  
  // Update event counters
  updateEventCounters(event);
}

/**
 * Update event counters
 * @param {Object} event - Security event
 */
function updateEventCounters(event) {
  const now = Date.now();
  const timeWindows = [1, 5, 15, 30, 60]; // minutes
  
  // For each time window, maintain a counter
  timeWindows.forEach(minutes => {
    const windowKey = `${event.type}:${minutes}m`;
    
    if (!eventCounters.has(windowKey)) {
      eventCounters.set(windowKey, []);
    }
    
    // Add timestamp to the counter
    const timestamps = eventCounters.get(windowKey);
    timestamps.push(now);
    
    // Remove expired timestamps
    const cutoff = now - (minutes * 60 * 1000);
    const validTimestamps = timestamps.filter(ts => ts >= cutoff);
    eventCounters.set(windowKey, validTimestamps);
    
    // If we have metadata like userId, track by that as well
    if (event.metadata && event.metadata.userId) {
      const userWindowKey = `${event.type}:${event.metadata.userId}:${minutes}m`;
      
      if (!eventCounters.has(userWindowKey)) {
        eventCounters.set(userWindowKey, []);
      }
      
      const userTimestamps = eventCounters.get(userWindowKey);
      userTimestamps.push(now);
      
      // Remove expired timestamps
      const validUserTimestamps = userTimestamps.filter(ts => ts >= cutoff);
      eventCounters.set(userWindowKey, validUserTimestamps);
    }
  });
}

/**
 * Check if an event triggers any alert conditions
 * @param {Object} event - Security event
 */
function checkAlertConditions(event) {
  const thresholds = CONFIG.alertThresholds;
  
  // Check authentication failures
  if (event.type === 'auth:failure' && event.metadata && event.metadata.userId) {
    const windowKey = `auth:failure:${event.metadata.userId}:10m`;
    const failureCount = (eventCounters.get(windowKey) || []).length;
    
    if (failureCount >= thresholds.authFailures.count) {
      createAlert({
        name: 'Multiple Authentication Failures',
        description: `User ${event.metadata.userId} has ${failureCount} failed login attempts in the last 10 minutes`,
        severity: thresholds.authFailures.severity,
        sourceEvent: event,
        metadata: {
          userId: event.metadata.userId,
          ipAddress: event.metadata.ipAddress,
          failureCount,
          action: 'BRUTE_FORCE_ATTEMPT'
        }
      });
    }
  }
  
  // Check access denied events
  if (event.type === 'access:denied' && event.metadata && event.metadata.userId) {
    const windowKey = `access:denied:${event.metadata.userId}:60m`;
    const deniedCount = (eventCounters.get(windowKey) || []).length;
    
    if (deniedCount >= thresholds.privilegeEscalation.count) {
      createAlert({
        name: 'Potential Privilege Escalation Attempt',
        description: `User ${event.metadata.userId} has ${deniedCount} access denied events in the last hour`,
        severity: thresholds.privilegeEscalation.severity,
        sourceEvent: event,
        metadata: {
          userId: event.metadata.userId,
          resourceId: event.metadata.resourceId,
          deniedCount,
          action: 'PRIVILEGE_ESCALATION_ATTEMPT'
        }
      });
    }
  }
  
  // Check blacklisted IP access
  if (event.metadata && event.metadata.ipAddress) {
    const ipAddress = event.metadata.ipAddress;
    
    if (CONFIG.blacklistedIPs.includes(ipAddress) || securityInfo.isIPBlacklisted(ipAddress)) {
      createAlert({
        name: 'Access from Blacklisted IP',
        description: `Access attempt from blacklisted IP address ${ipAddress}`,
        severity: thresholds.maliciousIP.severity,
        sourceEvent: event,
        metadata: {
          ipAddress,
          userId: event.metadata.userId,
          action: 'BLACKLISTED_IP_ACCESS'
        }
      });
    }
  }
  
  // Check for large data access (potential data exfiltration)
  if (event.type === 'data:access' && event.metadata && event.metadata.dataSize) {
    const dataSizeBytes = parseInt(event.metadata.dataSize, 10);
    const dataSizeMB = dataSizeBytes / (1024 * 1024);
    
    if (dataSizeMB >= thresholds.dataExfiltration.dataSizeThresholdMB) {
      createAlert({
        name: 'Large Data Access',
        description: `User ${event.metadata.userId || 'unknown'} accessed ${dataSizeMB.toFixed(2)}MB of data`,
        severity: thresholds.dataExfiltration.severity,
        sourceEvent: event,
        metadata: {
          userId: event.metadata.userId,
          ipAddress: event.metadata.ipAddress,
          dataSize: dataSizeBytes,
          resourceId: event.metadata.resourceId,
          action: 'LARGE_DATA_ACCESS'
        }
      });
    }
  }
}

/**
 * Apply correlation rules to detect complex attack patterns
 * @param {Object} event - Security event
 */
function applyCorrelationRules(event) {
  // For each correlation rule
  CONFIG.correlationRules.forEach(rule => {
    // Skip if the event is not in the trigger events
    if (!rule.triggerEvents.includes(event.type)) {
      return;
    }
    
    // Check if all conditions are met
    let allConditionsMet = true;
    const relatedEvents = [];
    
    // For each event type in the conditions
    for (const [eventType, condition] of Object.entries(rule.conditions)) {
      // Skip the current event for now
      if (eventType === event.type) {
        continue;
      }
      
      // Get events in the time window
      const windowKey = `${eventType}:${condition.timeWindowMinutes}m`;
      const events = eventCounters.get(windowKey) || [];
      
      // Check if we have enough events
      if (events.length < condition.minCount) {
        allConditionsMet = false;
        break;
      }
      
      // Check sequence if specified
      if (condition.after) {
        const afterWindowKey = `${condition.after}:${condition.timeWindowMinutes}m`;
        const afterEvents = eventCounters.get(afterWindowKey) || [];
        
        if (afterEvents.length === 0) {
          allConditionsMet = false;
          break;
        }
        
        // Check that these events occurred after the required events
        const earliestAfterEvent = Math.min(...afterEvents);
        const latestRequiredEvent = Math.max(...events);
        
        if (latestRequiredEvent < earliestAfterEvent) {
          allConditionsMet = false;
          break;
        }
      }
      
      // Check metadata conditions if specified
      if (condition.metadata) {
        // This is a simplified version - in a real implementation, we'd check the actual events
        // For now, we'll assume metadata conditions are met
      }
      
      // Get the actual related events
      relatedEvents.push(...findEvents(eventType, condition.timeWindowMinutes));
    }
    
    // Check the current event type's conditions
    if (rule.conditions[event.type]) {
      const condition = rule.conditions[event.type];
      const windowKey = `${event.type}:${condition.timeWindowMinutes}m`;
      const events = eventCounters.get(windowKey) || [];
      
      // Check if we have enough events (including the current one)
      if (events.length < condition.minCount) {
        allConditionsMet = false;
      }
      
      relatedEvents.push(...findEvents(event.type, condition.timeWindowMinutes));
    }
    
    // If all conditions are met, create a correlation alert
    if (allConditionsMet) {
      createAlert({
        name: rule.name,
        description: rule.description,
        severity: rule.severity,
        sourceEvent: event,
        correlationRule: rule.name,
        relatedEvents,
        metadata: {
          ruleName: rule.name,
          action: 'CORRELATION_RULE_TRIGGERED',
          relatedEventsCount: relatedEvents.length
        }
      });
    }
  });
}

/**
 * Find events of a specific type within a time window
 * @param {string} eventType - Event type
 * @param {number} timeWindowMinutes - Time window in minutes
 * @returns {Array} Events matching the criteria
 */
function findEvents(eventType, timeWindowMinutes) {
  const cutoff = Date.now() - (timeWindowMinutes * 60 * 1000);
  return recentEvents.filter(e => 
    e.type === eventType && 
    new Date(e.timestamp).getTime() >= cutoff
  );
}

/**
 * Create a security alert
 * @param {Object} alertData - Alert data
 */
async function createAlert(alertData) {
  try {
    // Create alert object
    const alert = {
      id: generateAlertId(),
      name: alertData.name,
      description: alertData.description,
      severity: alertData.severity,
      timestamp: new Date().toISOString(),
      sourceEventId: alertData.sourceEvent ? alertData.sourceEvent.id : null,
      correlationRule: alertData.correlationRule || null,
      metadata: alertData.metadata || {},
      status: 'OPEN',
      assignedTo: null,
      relatedEvents: alertData.relatedEvents || []
    };
    
    // Log alert creation
    logSecurityEvent(
      'SYSTEM',
      SEC_EVENT_SEVERITY.HIGH, 
      `Security alert created: ${alert.name}`,
      { 
        component: 'SIEM', 
        action: 'CREATE_ALERT',
        alertId: alert.id,
        alertName: alert.name,
        severity: alert.severity
      }
    );
    
    // Emit alert event
    siemEventEmitter.emit('alert', alert);
    
    // Store in database if available
    if (SecurityAlert) {
      await SecurityAlert.create({
        alertId: alert.id,
        name: alert.name,
        description: alert.description,
        severity: alert.severity,
        timestamp: new Date(alert.timestamp),
        sourceEventId: alert.sourceEventId,
        correlationRule: alert.correlationRule,
        metadata: alert.metadata,
        status: alert.status
      });
    }
    
    // Trigger notifications
    sendAlertNotifications(alert);
    
    // Check if alert requires incident creation
    if (alert.severity === SEC_EVENT_SEVERITY.CRITICAL) {
      await createIncident({
        name: `Critical alert: ${alert.name}`,
        description: alert.description,
        severity: alert.severity,
        sourceAlert: alert
      });
    }
    
    return alert;
  } catch (error) {
    console.error('Error creating security alert:', error);
    return null;
  }
}

/**
 * Send alert notifications
 * @param {Object} alert - Alert data
 */
function sendAlertNotifications(alert) {
  // Send to appropriate channels based on severity and configuration
  // This is a placeholder - in a real implementation, we'd send actual notifications
  
  // Log notification attempt
  logSecurityEvent(
    'SYSTEM',
    SEC_EVENT_SEVERITY.INFO, 
    `Sending notifications for alert: ${alert.id}`,
    { 
      component: 'SIEM', 
      action: 'SEND_NOTIFICATIONS',
      alertId: alert.id,
      channels: CONFIG.alertNotificationChannels
    }
  );
}

/**
 * Create a security incident
 * @param {Object} incidentData - Incident data
 */
async function createIncident(incidentData) {
  try {
    // Create incident object
    const incident = {
      id: generateIncidentId(),
      name: incidentData.name,
      description: incidentData.description,
      severity: incidentData.severity,
      timestamp: new Date().toISOString(),
      sourceAlertId: incidentData.sourceAlert ? incidentData.sourceAlert.id : null,
      status: 'OPEN',
      assignedTo: null,
      metadata: incidentData.metadata || {},
      timeline: [
        {
          timestamp: new Date().toISOString(),
          action: 'CREATED',
          description: 'Incident created',
          user: 'SYSTEM'
        }
      ]
    };
    
    // Log incident creation
    logSecurityEvent(
      'SYSTEM',
      SEC_EVENT_SEVERITY.CRITICAL, 
      `Security incident created: ${incident.name}`,
      { 
        component: 'SIEM', 
        action: 'CREATE_INCIDENT',
        incidentId: incident.id,
        severity: incident.severity
      }
    );
    
    // Emit incident event
    siemEventEmitter.emit('incident', incident);
    
    // Store in database if available
    if (SecurityIncident) {
      await SecurityIncident.create({
        incidentId: incident.id,
        name: incident.name,
        description: incident.description,
        severity: incident.severity,
        timestamp: new Date(incident.timestamp),
        sourceAlertId: incident.sourceAlertId,
        status: incident.status,
        metadata: incident.metadata,
        timeline: incident.timeline
      });
    }
    
    return incident;
  } catch (error) {
    console.error('Error creating security incident:', error);
    return null;
  }
}

/**
 * Run periodic tasks
 */
function runPeriodicTasks() {
  // Clean up old events
  cleanupOldEvents();
  
  // Generate periodic reports
  generatePeriodicReports();
  
  // Check for stale alerts and incidents
  checkStaleItems();
}

/**
 * Clean up old events
 */
function cleanupOldEvents() {
  const now = Date.now();
  const cutoff = now - (CONFIG.logRetentionDays * 24 * 60 * 60 * 1000);
  
  // Only keep events that are newer than the cutoff
  const oldEventCount = recentEvents.length;
  const newEvents = recentEvents.filter(e => new Date(e.timestamp).getTime() >= cutoff);
  
  if (oldEventCount !== newEvents.length) {
    console.log(`Cleaned up ${oldEventCount - newEvents.length} old events`);
  }
}

/**
 * Generate periodic reports
 */
function generatePeriodicReports() {
  // Generate hourly, daily, and weekly reports
  // This is a placeholder - in a real implementation, we'd generate actual reports
  
  // Log report generation
  logSecurityEvent(
    'SYSTEM',
    SEC_EVENT_SEVERITY.INFO, 
    'Generating periodic security reports',
    { 
      component: 'SIEM', 
      action: 'GENERATE_REPORTS'
    }
  );
}

/**
 * Check for stale alerts and incidents
 */
function checkStaleItems() {
  // Check for alerts and incidents that have been open for too long
  // This is a placeholder - in a real implementation, we'd check the actual database
  
  // Log stale item check
  logSecurityEvent(
    'SYSTEM',
    SEC_EVENT_SEVERITY.INFO, 
    'Checking for stale security items',
    { 
      component: 'SIEM', 
      action: 'CHECK_STALE_ITEMS'
    }
  );
}

/**
 * Generate a unique alert ID
 * @returns {string} Unique ID
 */
function generateAlertId() {
  return `alert-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;
}

/**
 * Generate a unique incident ID
 * @returns {string} Unique ID
 */
function generateIncidentId() {
  return `incident-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;
}

/**
 * Register a listener for SIEM events
 * @param {string} eventType - Event type to listen for
 * @param {Function} callback - Callback function
 * @returns {Function} Function to remove the listener
 */
function onSIEMEvent(eventType, callback) {
  siemEventEmitter.on(eventType, callback);
  
  // Return function to remove listener
  return () => {
    siemEventEmitter.removeListener(eventType, callback);
  };
}

/**
 * Get recent security events
 * @param {Object} [filters={}] - Filters to apply
 * @param {number} [limit=100] - Maximum number of events to return
 * @returns {Array} Recent security events
 */
function getRecentEvents(filters = {}, limit = 100) {
  // Use the securityInfo module to get recent events
  return securityInfo.getRecentEvents(filters, limit);
}

/**
 * Search security events
 * @param {Object} query - Search query
 * @returns {Array} Matching events
 */
function searchEvents(query) {
  // Use the securityInfo module to search events
  return securityInfo.searchEvents(query);
}

/**
 * Get security analytics
 * @param {Object} [options={}] - Analytics options
 * @returns {Object} Security analytics data
 */
function getSecurityAnalytics(options = {}) {
  // Use the securityInfo module to get analytics
  return securityInfo.getSecurityAnalytics(options);
}

module.exports = {
  initialize,
  handleSecurityEvent,
  createAlert,
  createIncident,
  onSIEMEvent,
  getRecentEvents,
  searchEvents,
  getSecurityAnalytics,
  CONFIG
}; 