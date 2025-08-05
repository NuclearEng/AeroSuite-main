/**
 * Security Event Management Controller
 * Related to: SEC005 - Security Information Event Management
 * 
 * Handles API endpoints for security events, alerts, and incidents.
 */

const securityEventManagement = require('../services/securityEventManagement');
const SecurityEvent = require('../models/SecurityEvent');
const SecurityAlert = require('../models/SecurityAlert');
const SecurityIncident = require('../models/SecurityIncident');
const { logSecurityEvent, SEC_EVENT_SEVERITY } = require('../utils/securityEventLogger');

/**
 * Initialize the SIEM system
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function initialize(req, res) {
  try {
    const result = await securityEventManagement.initialize();
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error initializing SIEM:', error);
    return res.status(500).json({ error: 'Failed to initialize SIEM system' });
  }
}

/**
 * Get recent security events
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getEvents(req, res) {
  try {
    const { 
      type, 
      severity, 
      startTime, 
      endTime, 
      userId, 
      sourceIp,
      limit = 100, 
      offset = 0 
    } = req.query;
    
    // Build filter object
    const filters = {};
    
    if (type) filters.type = type;
    if (severity) filters.severity = severity;
    if (userId) filters.userId = userId;
    if (sourceIp) filters.sourceIp = sourceIp;
    
    if (startTime) {
      filters.timestamp = filters.timestamp || {};
      filters.timestamp.$gte = new Date(startTime);
    }
    
    if (endTime) {
      filters.timestamp = filters.timestamp || {};
      filters.timestamp.$lte = new Date(endTime);
    }
    
    // Query database
    const events = await SecurityEvent.find(filters)
      .sort({ timestamp: -1 })
      .skip(parseInt(offset, 10))
      .limit(parseInt(limit, 10));
    
    // Get total count
    const totalCount = await SecurityEvent.countDocuments(filters);
    
    // Log API access
    logSecurityEvent(
      'API',
      SEC_EVENT_SEVERITY.INFO,
      'Security events retrieved',
      {
        component: 'SIEM',
        action: 'GET_EVENTS',
        userId: req.user?.id || 'anonymous',
        resultCount: events.length,
        filters: JSON.stringify(filters)
      }
    );
    
    return res.status(200).json({
      events,
      pagination: {
        total: totalCount,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        hasMore: totalCount > (parseInt(offset, 10) + events.length)
      }
    });
  } catch (error) {
    console.error('Error retrieving security events:', error);
    return res.status(500).json({ error: 'Failed to retrieve security events' });
  }
}

/**
 * Search security events
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function searchEvents(req, res) {
  try {
    const { query, limit = 100 } = req.body;
    
    // Validate request
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    // Perform search
    const events = await securityEventManagement.searchEvents(query);
    
    // Limit results
    const limitedEvents = events.slice(0, parseInt(limit, 10));
    
    // Log search
    logSecurityEvent(
      'API',
      SEC_EVENT_SEVERITY.INFO,
      'Security events searched',
      {
        component: 'SIEM',
        action: 'SEARCH_EVENTS',
        userId: req.user?.id || 'anonymous',
        query: JSON.stringify(query),
        resultCount: limitedEvents.length
      }
    );
    
    return res.status(200).json({
      events: limitedEvents,
      total: events.length,
      limit: parseInt(limit, 10)
    });
  } catch (error) {
    console.error('Error searching security events:', error);
    return res.status(500).json({ error: 'Failed to search security events' });
  }
}

/**
 * Get security analytics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getAnalytics(req, res) {
  try {
    const { startTime, endTime } = req.query;
    
    // Validate request
    if (!startTime || !endTime) {
      return res.status(400).json({ error: 'Start time and end time are required' });
    }
    
    // Parse dates
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    // Validate date range
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    
    // Get analytics
    const analytics = await securityEventManagement.getSecurityAnalytics({ startTime: start, endTime: end });
    
    // Log analytics access
    logSecurityEvent(
      'API',
      SEC_EVENT_SEVERITY.INFO,
      'Security analytics retrieved',
      {
        component: 'SIEM',
        action: 'GET_ANALYTICS',
        userId: req.user?.id || 'anonymous',
        timeRange: `${start.toISOString()} to ${end.toISOString()}`
      }
    );
    
    return res.status(200).json(analytics);
  } catch (error) {
    console.error('Error retrieving security analytics:', error);
    return res.status(500).json({ error: 'Failed to retrieve security analytics' });
  }
}

/**
 * Get alerts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getAlerts(req, res) {
  try {
    const { 
      status, 
      severity, 
      startTime, 
      endTime, 
      assignedTo,
      correlationRule,
      limit = 100, 
      offset = 0 
    } = req.query;
    
    // Build filter object
    const filters = {};
    
    if (status) filters.status = status;
    if (severity) filters.severity = severity;
    if (assignedTo) filters.assignedTo = assignedTo;
    if (correlationRule) filters.correlationRule = correlationRule;
    
    if (startTime) {
      filters.timestamp = filters.timestamp || {};
      filters.timestamp.$gte = new Date(startTime);
    }
    
    if (endTime) {
      filters.timestamp = filters.timestamp || {};
      filters.timestamp.$lte = new Date(endTime);
    }
    
    // Query database
    const alerts = await SecurityAlert.find(filters)
      .sort({ severity: 1, timestamp: -1 })
      .skip(parseInt(offset, 10))
      .limit(parseInt(limit, 10));
    
    // Get total count
    const totalCount = await SecurityAlert.countDocuments(filters);
    
    // Log API access
    logSecurityEvent(
      'API',
      SEC_EVENT_SEVERITY.INFO,
      'Security alerts retrieved',
      {
        component: 'SIEM',
        action: 'GET_ALERTS',
        userId: req.user?.id || 'anonymous',
        resultCount: alerts.length,
        filters: JSON.stringify(filters)
      }
    );
    
    return res.status(200).json({
      alerts,
      pagination: {
        total: totalCount,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        hasMore: totalCount > (parseInt(offset, 10) + alerts.length)
      }
    });
  } catch (error) {
    console.error('Error retrieving security alerts:', error);
    return res.status(500).json({ error: 'Failed to retrieve security alerts' });
  }
}

/**
 * Get a specific alert by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getAlertById(req, res) {
  try {
    const { alertId } = req.params;
    
    // Find alert
    const alert = await SecurityAlert.findOne({ alertId });
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    // Log API access
    logSecurityEvent(
      'API',
      SEC_EVENT_SEVERITY.INFO,
      'Security alert retrieved',
      {
        component: 'SIEM',
        action: 'GET_ALERT_DETAIL',
        userId: req.user?.id || 'anonymous',
        alertId
      }
    );
    
    return res.status(200).json(alert);
  } catch (error) {
    console.error('Error retrieving security alert:', error);
    return res.status(500).json({ error: 'Failed to retrieve security alert' });
  }
}

/**
 * Update alert status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function updateAlertStatus(req, res) {
  try {
    const { alertId } = req.params;
    const { status, notes } = req.body;
    const userId = req.user?.id || 'system';
    
    // Validate request
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Find alert
    const alert = await SecurityAlert.findOne({ alertId });
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    // Update status based on action
    let updatedAlert;
    
    switch (status) {
      case 'INVESTIGATING':
        updatedAlert = await alert.markAsInvestigating(userId);
        break;
      
      case 'RESOLVED':
        updatedAlert = await alert.resolve({
          resolvedBy: userId,
          resolutionType: req.body.resolutionType || 'FIXED',
          notes: notes || ''
        });
        break;
      
      case 'DISMISSED':
        updatedAlert = await alert.dismiss(userId, notes);
        break;
      
      default:
        return res.status(400).json({ error: 'Invalid status' });
    }
    
    // Log status change
    logSecurityEvent(
      'API',
      SEC_EVENT_SEVERITY.INFO,
      `Security alert status updated to ${status}`,
      {
        component: 'SIEM',
        action: 'UPDATE_ALERT_STATUS',
        userId,
        alertId,
        newStatus: status
      }
    );
    
    return res.status(200).json(updatedAlert);
  } catch (error) {
    console.error('Error updating security alert:', error);
    return res.status(500).json({ error: 'Failed to update security alert' });
  }
}

/**
 * Get incidents
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getIncidents(req, res) {
  try {
    const { 
      status, 
      severity, 
      type,
      phase,
      startTime, 
      endTime, 
      assignedTo,
      limit = 100, 
      offset = 0 
    } = req.query;
    
    // Build filter object
    const filters = {};
    
    if (status) filters.status = status;
    if (severity) filters.severity = severity;
    if (type) filters.type = type;
    if (phase) filters.phase = phase;
    if (assignedTo) filters.assignedTo = assignedTo;
    
    if (startTime) {
      filters.timestamp = filters.timestamp || {};
      filters.timestamp.$gte = new Date(startTime);
    }
    
    if (endTime) {
      filters.timestamp = filters.timestamp || {};
      filters.timestamp.$lte = new Date(endTime);
    }
    
    // Query database
    const incidents = await SecurityIncident.find(filters)
      .sort({ severity: 1, timestamp: -1 })
      .skip(parseInt(offset, 10))
      .limit(parseInt(limit, 10));
    
    // Get total count
    const totalCount = await SecurityIncident.countDocuments(filters);
    
    // Log API access
    logSecurityEvent(
      'API',
      SEC_EVENT_SEVERITY.INFO,
      'Security incidents retrieved',
      {
        component: 'SIEM',
        action: 'GET_INCIDENTS',
        userId: req.user?.id || 'anonymous',
        resultCount: incidents.length,
        filters: JSON.stringify(filters)
      }
    );
    
    return res.status(200).json({
      incidents,
      pagination: {
        total: totalCount,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        hasMore: totalCount > (parseInt(offset, 10) + incidents.length)
      }
    });
  } catch (error) {
    console.error('Error retrieving security incidents:', error);
    return res.status(500).json({ error: 'Failed to retrieve security incidents' });
  }
}

/**
 * Get a specific incident by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getIncidentById(req, res) {
  try {
    const { incidentId } = req.params;
    
    // Find incident
    const incident = await SecurityIncident.findOne({ incidentId });
    
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    
    // Log API access
    logSecurityEvent(
      'API',
      SEC_EVENT_SEVERITY.INFO,
      'Security incident retrieved',
      {
        component: 'SIEM',
        action: 'GET_INCIDENT_DETAIL',
        userId: req.user?.id || 'anonymous',
        incidentId
      }
    );
    
    return res.status(200).json(incident);
  } catch (error) {
    console.error('Error retrieving security incident:', error);
    return res.status(500).json({ error: 'Failed to retrieve security incident' });
  }
}

/**
 * Update incident status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function updateIncidentStatus(req, res) {
  try {
    const { incidentId } = req.params;
    const { status, description } = req.body;
    const userId = req.user?.id || 'system';
    
    // Validate request
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Find incident
    const incident = await SecurityIncident.findOne({ incidentId });
    
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    
    // Update status
    const updatedIncident = await incident.updateStatus(status, userId, description);
    
    // Log status change
    logSecurityEvent(
      'API',
      SEC_EVENT_SEVERITY.INFO,
      `Security incident status updated to ${status}`,
      {
        component: 'SIEM',
        action: 'UPDATE_INCIDENT_STATUS',
        userId,
        incidentId,
        newStatus: status
      }
    );
    
    return res.status(200).json(updatedIncident);
  } catch (error) {
    console.error('Error updating security incident:', error);
    return res.status(500).json({ error: 'Failed to update security incident' });
  }
}

/**
 * Add timeline entry to incident
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function addIncidentTimelineEntry(req, res) {
  try {
    const { incidentId } = req.params;
    const { action, description, data } = req.body;
    const userId = req.user?.id || 'system';
    
    // Validate request
    if (!action || !description) {
      return res.status(400).json({ error: 'Action and description are required' });
    }
    
    // Find incident
    const incident = await SecurityIncident.findOne({ incidentId });
    
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    
    // Add timeline entry
    const updatedIncident = await incident.addTimelineEntry(action, description, userId, data || {});
    
    // Log timeline addition
    logSecurityEvent(
      'API',
      SEC_EVENT_SEVERITY.INFO,
      'Security incident timeline updated',
      {
        component: 'SIEM',
        action: 'ADD_INCIDENT_TIMELINE',
        userId,
        incidentId,
        entryAction: action
      }
    );
    
    return res.status(200).json(updatedIncident);
  } catch (error) {
    console.error('Error updating security incident timeline:', error);
    return res.status(500).json({ error: 'Failed to update security incident timeline' });
  }
}

/**
 * Add artifact to incident
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function addIncidentArtifact(req, res) {
  try {
    const { incidentId } = req.params;
    const { name, type, description, location } = req.body;
    const userId = req.user?.id || 'system';
    
    // Validate request
    if (!name || !type || !location) {
      return res.status(400).json({ error: 'Name, type, and location are required' });
    }
    
    // Find incident
    const incident = await SecurityIncident.findOne({ incidentId });
    
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    
    // Add artifact
    const updatedIncident = await incident.addArtifact({
      name,
      type,
      description: description || '',
      location,
      addedBy: userId,
      metadata: req.body.metadata || {}
    });
    
    // Log artifact addition
    logSecurityEvent(
      'API',
      SEC_EVENT_SEVERITY.INFO,
      'Security incident artifact added',
      {
        component: 'SIEM',
        action: 'ADD_INCIDENT_ARTIFACT',
        userId,
        incidentId,
        artifactName: name,
        artifactType: type
      }
    );
    
    return res.status(200).json(updatedIncident);
  } catch (error) {
    console.error('Error adding security incident artifact:', error);
    return res.status(500).json({ error: 'Failed to add security incident artifact' });
  }
}

/**
 * Resolve incident
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function resolveIncident(req, res) {
  try {
    const { incidentId } = req.params;
    const { rootCause, actions, preventiveMeasures } = req.body;
    const userId = req.user?.id || 'system';
    
    // Validate request
    if (!rootCause || !actions) {
      return res.status(400).json({ error: 'Root cause and actions are required' });
    }
    
    // Find incident
    const incident = await SecurityIncident.findOne({ incidentId });
    
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    
    // Resolve incident
    const updatedIncident = await incident.resolve({
      rootCause,
      actions: Array.isArray(actions) ? actions : [actions],
      preventiveMeasures: Array.isArray(preventiveMeasures) ? preventiveMeasures : (preventiveMeasures ? [preventiveMeasures] : [])
    }, userId);
    
    // Log resolution
    logSecurityEvent(
      'API',
      SEC_EVENT_SEVERITY.INFO,
      'Security incident resolved',
      {
        component: 'SIEM',
        action: 'RESOLVE_INCIDENT',
        userId,
        incidentId,
        rootCause
      }
    );
    
    return res.status(200).json(updatedIncident);
  } catch (error) {
    console.error('Error resolving security incident:', error);
    return res.status(500).json({ error: 'Failed to resolve security incident' });
  }
}

/**
 * Get security event metrics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getEventMetrics(req, res) {
  try {
    const { startTime, endTime } = req.query;
    
    // Validate request
    if (!startTime || !endTime) {
      return res.status(400).json({ error: 'Start time and end time are required' });
    }
    
    // Parse dates
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    // Validate date range
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    
    // Get metrics
    const [typeCounts, severityCounts] = await Promise.all([
      SecurityEvent.getCountByType(start, end),
      SecurityEvent.getCountBySeverity(start, end)
    ]);
    
    // Log metrics access
    logSecurityEvent(
      'API',
      SEC_EVENT_SEVERITY.INFO,
      'Security event metrics retrieved',
      {
        component: 'SIEM',
        action: 'GET_EVENT_METRICS',
        userId: req.user?.id || 'anonymous',
        timeRange: `${start.toISOString()} to ${end.toISOString()}`
      }
    );
    
    return res.status(200).json({
      byType: typeCounts,
      bySeverity: severityCounts,
      timeRange: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    });
  } catch (error) {
    console.error('Error retrieving security event metrics:', error);
    return res.status(500).json({ error: 'Failed to retrieve security event metrics' });
  }
}

/**
 * Get alert metrics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getAlertMetrics(req, res) {
  try {
    const { startTime, endTime } = req.query;
    
    // Validate request
    if (!startTime || !endTime) {
      return res.status(400).json({ error: 'Start time and end time are required' });
    }
    
    // Parse dates
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    // Validate date range
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    
    // Get metrics
    const [statusCounts, severityCounts, resolutionTime] = await Promise.all([
      SecurityAlert.getCountByStatus(start, end),
      SecurityAlert.getCountBySeverity(start, end),
      SecurityAlert.getAverageResolutionTime(start, end)
    ]);
    
    // Log metrics access
    logSecurityEvent(
      'API',
      SEC_EVENT_SEVERITY.INFO,
      'Security alert metrics retrieved',
      {
        component: 'SIEM',
        action: 'GET_ALERT_METRICS',
        userId: req.user?.id || 'anonymous',
        timeRange: `${start.toISOString()} to ${end.toISOString()}`
      }
    );
    
    return res.status(200).json({
      byStatus: statusCounts,
      bySeverity: severityCounts,
      averageResolutionTimeHours: resolutionTime[0]?.avgResolutionTime || 0,
      timeRange: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    });
  } catch (error) {
    console.error('Error retrieving security alert metrics:', error);
    return res.status(500).json({ error: 'Failed to retrieve security alert metrics' });
  }
}

/**
 * Get incident metrics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getIncidentMetrics(req, res) {
  try {
    const { startTime, endTime } = req.query;
    
    // Validate request
    if (!startTime || !endTime) {
      return res.status(400).json({ error: 'Start time and end time are required' });
    }
    
    // Parse dates
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    // Validate date range
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    
    // Get metrics
    const metrics = await SecurityIncident.getMetrics(start, end);
    
    // Log metrics access
    logSecurityEvent(
      'API',
      SEC_EVENT_SEVERITY.INFO,
      'Security incident metrics retrieved',
      {
        component: 'SIEM',
        action: 'GET_INCIDENT_METRICS',
        userId: req.user?.id || 'anonymous',
        timeRange: `${start.toISOString()} to ${end.toISOString()}`
      }
    );
    
    return res.status(200).json({
      ...metrics,
      timeRange: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    });
  } catch (error) {
    console.error('Error retrieving security incident metrics:', error);
    return res.status(500).json({ error: 'Failed to retrieve security incident metrics' });
  }
}

module.exports = {
  initialize,
  getEvents,
  searchEvents,
  getAnalytics,
  getAlerts,
  getAlertById,
  updateAlertStatus,
  getIncidents,
  getIncidentById,
  updateIncidentStatus,
  addIncidentTimelineEntry,
  addIncidentArtifact,
  resolveIncident,
  getEventMetrics,
  getAlertMetrics,
  getIncidentMetrics
}; 