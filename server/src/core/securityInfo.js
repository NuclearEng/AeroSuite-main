/**
 * Security Information Core
 * Task: TS119 - Security Information Core
 * 
 * This module provides centralized security information management,
 * including event collection, security analytics, and threat detection.
 */

const fs = require('fs');
const path = require('path');
const { createWriteStream } = require('fs');
const { Transform } = require('stream');
const { EventEmitter } = require('events');
const { logSecurityEvent, SEC_EVENT_SEVERITY } = require('../utils/securityEventLogger');

// Security event emitter
const securityEventEmitter = new EventEmitter();

// Configure maximum number of listeners to avoid memory leaks
securityEventEmitter.setMaxListeners(20);

// In-memory event storage (limited size, should use proper database in production)
const inMemoryEvents = [];
const MAX_IN_MEMORY_EVENTS = 1000;

// Security event types
const SECURITY_EVENT_TYPES = {
  AUTH_SUCCESS: 'auth:success',
  AUTH_FAILURE: 'auth:failure',
  ACCESS_DENIED: 'access:denied',
  ACCESS_GRANTED: 'access:granted',
  DATA_ACCESS: 'data:access',
  DATA_MODIFICATION: 'data:modification',
  SYSTEM_CHANGE: 'system:change',
  API_ACCESS: 'api:access',
  CONFIG_CHANGE: 'config:change',
  USER_CREATED: 'user:created',
  USER_MODIFIED: 'user:modified',
  USER_DELETED: 'user:deleted',
  ROLE_CHANGED: 'role:changed',
  PERMISSION_CHANGED: 'permission:changed',
  MALICIOUS_ACTIVITY: 'malicious:activity',
  THREAT_DETECTED: 'threat:detected',
  SECURITY_ALERT: 'security:alert'
};

/**
 * Initialize security information core
 * @param {Object} options - Configuration options
 * @returns {Promise<void>}
 */
async function initialize(options = {}) {
  // Ensure logs directory exists
  const logsDir = options.logsDir || path.join(process.cwd(), 'logs', 'security');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  // Set up file logging if enabled
  if (options.enableFileLogging !== false) {
    setupFileLogging(logsDir);
  }
  
  // Set up event listeners
  setupEventListeners();
  
  // Log initialization
  logSecurityEvent(
    'SYSTEM',
    SEC_EVENT_SEVERITY.INFO, 
    'Security Information Core initialized',
    { component: 'SecurityInfoCore', action: 'INITIALIZE' }
  );
}

/**
 * Record a security event
 * @param {string} type - Event type from SECURITY_EVENT_TYPES
 * @param {string} severity - Event severity from SEC_EVENT_SEVERITY
 * @param {string} message - Event message
 * @param {Object} metadata - Additional event metadata
 * @returns {Object} Recorded event object
 */
function recordEvent(type, severity, message, metadata = {}) {
  // Create event object
  const event = {
    id: generateEventId(),
    type,
    severity,
    message,
    timestamp: new Date().toISOString(),
    metadata: {
      ...metadata,
      hostname: require('os').hostname(),
      pid: process.pid,
      environment: process.env.NODE_ENV || 'development'
    }
  };
  
  // Add to in-memory storage (limited size)
  inMemoryEvents.unshift(event);
  if (inMemoryEvents.length > MAX_IN_MEMORY_EVENTS) {
    inMemoryEvents.pop();
  }
  
  // Emit event for listeners
  securityEventEmitter.emit(type, event);
  securityEventEmitter.emit('all', event);
  
  return event;
}

/**
 * Get recent security events
 * @param {Object} [filters={}] - Optional filters for events
 * @param {number} [limit=100] - Maximum number of events to return
 * @returns {Array<Object>} Security events
 */
function getRecentEvents(filters = {}, limit = 100) {
  let events = [...inMemoryEvents];
  
  // Apply filters
  if (filters.type) {
    events = events.filter(event => event.type === filters.type);
  }
  
  if (filters.severity) {
    events = events.filter(event => event.severity === filters.severity);
  }
  
  if (filters.startTime) {
    const startTime = new Date(filters.startTime).getTime();
    events = events.filter(event => new Date(event.timestamp).getTime() >= startTime);
  }
  
  if (filters.endTime) {
    const endTime = new Date(filters.endTime).getTime();
    events = events.filter(event => new Date(event.timestamp).getTime() <= endTime);
  }
  
  if (filters.userId) {
    events = events.filter(event => event.metadata.userId === filters.userId);
  }
  
  // Apply limit
  return events.slice(0, limit);
}

/**
 * Register a security event listener
 * @param {string} eventType - Event type to listen for (or 'all' for all events)
 * @param {Function} callback - Callback function
 * @returns {Function} Function to remove the listener
 */
function onSecurityEvent(eventType, callback) {
  securityEventEmitter.on(eventType, callback);
  
  // Return function to remove listener
  return () => {
    securityEventEmitter.removeListener(eventType, callback);
  };
}

/**
 * Get basic security analytics
 * @param {Object} [options={}] - Options for analytics
 * @returns {Object} Security analytics data
 */
function getSecurityAnalytics(options = {}) {
  const events = options.events || inMemoryEvents;
  
  // Count events by type
  const eventsByType = {};
  for (const event of events) {
    eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
  }
  
  // Count events by severity
  const eventsBySeverity = {};
  for (const event of events) {
    eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
  }
  
  // Create time series data (hourly)
  const timeSeriesData = {};
  for (const event of events) {
    const hour = new Date(event.timestamp).toISOString().slice(0, 13) + ':00:00Z';
    timeSeriesData[hour] = (timeSeriesData[hour] || 0) + 1;
  }
  
  return {
    totalEvents: events.length,
    eventsByType,
    eventsBySeverity,
    timeSeriesData: Object.entries(timeSeriesData).map(([time, count]) => ({ time, count })),
    latestEvent: events[0] || null,
    oldestEvent: events[events.length - 1] || null
  };
}

/**
 * Search security events
 * @param {Object} query - Search query
 * @returns {Array<Object>} Matching events
 */
function searchEvents(query) {
  let events = [...inMemoryEvents];
  
  // Filter by text
  if (query.text) {
    const searchText = query.text.toLowerCase();
    events = events.filter(event => 
      event.message.toLowerCase().includes(searchText) || 
      JSON.stringify(event.metadata).toLowerCase().includes(searchText)
    );
  }
  
  // Apply other filters
  if (query.filters) {
    events = getRecentEvents(query.filters, events.length);
  }
  
  // Apply sorting
  if (query.sortBy) {
    const sortField = query.sortBy;
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    
    events.sort((a, b) => {
      if (sortField === 'timestamp') {
        return sortOrder * (new Date(a.timestamp) - new Date(b.timestamp));
      } else if (sortField.startsWith('metadata.')) {
        const metadataField = sortField.substring(9);
        return sortOrder * (a.metadata[metadataField] > b.metadata[metadataField] ? 1 : -1);
      } else {
        return sortOrder * (a[sortField] > b[sortField] ? 1 : -1);
      }
    });
  }
  
  // Apply pagination
  if (query.limit) {
    const limit = parseInt(query.limit, 10);
    const offset = parseInt(query.offset, 10) || 0;
    events = events.slice(offset, offset + limit);
  }
  
  return events;
}

/**
 * Check if an IP address is in the blacklist
 * @param {string} ipAddress - IP address to check
 * @returns {boolean} True if IP is blacklisted
 */
function isIPBlacklisted(ipAddress) {
  // In a real implementation, this would check against a proper blacklist database
  const blacklistedIPs = process.env.BLACKLISTED_IPS ? process.env.BLACKLISTED_IPS.split(',') : [];
  return blacklistedIPs.includes(ipAddress);
}

/**
 * Generate a unique event ID
 * @returns {string} Unique ID
 * @private
 */
function generateEventId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Set up file logging for security events
 * @param {string} logsDir - Directory for log files
 * @private
 */
function setupFileLogging(logsDir) {
  // Create log files by severity
  const logStreams = {};
  
  for (const severity in SEC_EVENT_SEVERITY) {
    const logFile = path.join(logsDir, `${severity.toLowerCase()}.log`);
    logStreams[severity] = createWriteStream(logFile, { flags: 'a' });
  }
  
  // Create all events log
  const allEventsLog = path.join(logsDir, 'all-events.log');
  logStreams.ALL = createWriteStream(allEventsLog, { flags: 'a' });
  
  // Add listener for all events
  securityEventEmitter.on('all', (event) => {
    const logLine = `[${event.timestamp}] [${event.severity}] [${event.type}] ${event.message} ${JSON.stringify(event.metadata)}\n`;
    
    // Write to severity-specific log
    if (logStreams[event.severity]) {
      logStreams[event.severity].write(logLine);
    }
    
    // Write to all events log
    logStreams.ALL.write(logLine);
  });
}

/**
 * Set up event listeners for specific security event types
 * @private
 */
function setupEventListeners() {
  // Listen for authentication failures
  securityEventEmitter.on(SECURITY_EVENT_TYPES.AUTH_FAILURE, (event) => {
    // In a real implementation, this could trigger alerts or countermeasures
    if (event.metadata.consecutiveFailures >= 5) {
      recordEvent(
        SECURITY_EVENT_TYPES.SECURITY_ALERT,
        SEC_EVENT_SEVERITY.HIGH,
        `Multiple authentication failures for user ${event.metadata.userId || 'unknown'}`,
        {
          userId: event.metadata.userId,
          ipAddress: event.metadata.ipAddress,
          consecutiveFailures: event.metadata.consecutiveFailures,
          action: 'POSSIBLE_BRUTE_FORCE'
        }
      );
    }
  });
  
  // Listen for malicious activity
  securityEventEmitter.on(SECURITY_EVENT_TYPES.MALICIOUS_ACTIVITY, (event) => {
    // Record a threat detection event
    recordEvent(
      SECURITY_EVENT_TYPES.THREAT_DETECTED,
      SEC_EVENT_SEVERITY.HIGH,
      `Potential threat detected: ${event.message}`,
      {
        ...event.metadata,
        originalEventId: event.id,
        threatType: event.metadata.threatType || 'UNKNOWN'
      }
    );
  });
}

module.exports = {
  initialize,
  recordEvent,
  getRecentEvents,
  onSecurityEvent,
  getSecurityAnalytics,
  searchEvents,
  isIPBlacklisted,
  SECURITY_EVENT_TYPES
}; 