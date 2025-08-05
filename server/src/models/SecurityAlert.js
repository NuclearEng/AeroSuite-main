/**
 * Security Alert Model
 * Related to: SEC005 - Security Information Event Management
 * 
 * Stores security alerts generated from security events for investigation.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SecurityAlertSchema = new Schema({
  // Unique alert identifier
  alertId: {
    type: String,
    required: true,
    index: true,
    unique: true
  },
  
  // Alert name
  name: {
    type: String,
    required: true
  },
  
  // Alert description
  description: {
    type: String,
    required: true
  },
  
  // Alert severity (CRITICAL, HIGH, MEDIUM, LOW, INFO)
  severity: {
    type: String,
    required: true,
    index: true,
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']
  },
  
  // Alert timestamp
  timestamp: {
    type: Date,
    required: true,
    index: true,
    default: Date.now
  },
  
  // Source event that triggered the alert
  sourceEventId: {
    type: String,
    index: true
  },
  
  // Correlation rule that generated the alert (if applicable)
  correlationRule: {
    type: String,
    index: true
  },
  
  // Additional metadata about the alert
  metadata: {
    type: Object,
    default: {}
  },
  
  // Alert status (OPEN, INVESTIGATING, RESOLVED, DISMISSED)
  status: {
    type: String,
    required: true,
    index: true,
    enum: ['OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED'],
    default: 'OPEN'
  },
  
  // User assigned to investigate the alert
  assignedTo: {
    type: String,
    index: true
  },
  
  // Resolution details
  resolution: {
    type: {
      resolvedAt: Date,
      resolvedBy: String,
      resolutionType: {
        type: String,
        enum: ['FALSE_POSITIVE', 'FIXED', 'ACCEPTED_RISK', 'ESCALATED', 'OTHER']
      },
      notes: String
    }
  },
  
  // Related incidents
  relatedIncidents: {
    type: [String],
    default: []
  },
  
  // Tags for categorization
  tags: {
    type: [String],
    default: []
  }
}, {
  timestamps: true,
  collection: 'security_alerts'
});

// Indexes for efficient querying
SecurityAlertSchema.index({ timestamp: 1, severity: 1 });
SecurityAlertSchema.index({ timestamp: 1, status: 1 });
SecurityAlertSchema.index({ timestamp: 1, assignedTo: 1 });
SecurityAlertSchema.index({ 'resolution.resolvedAt': 1 });

// Add text search index
SecurityAlertSchema.index({
  name: 'text',
  description: 'text',
  correlationRule: 'text',
  tags: 'text'
});

// Instance methods
SecurityAlertSchema.methods = {
  /**
   * Convert to JSON with formatted timestamp
   */
  toJSON: function() {
    const obj = this.toObject();
    obj.timestamp = obj.timestamp.toISOString();
    if (obj.resolution && obj.resolution.resolvedAt) {
      obj.resolution.resolvedAt = obj.resolution.resolvedAt.toISOString();
    }
    return obj;
  },
  
  /**
   * Mark alert as under investigation
   * @param {string} userId - User investigating the alert
   * @returns {Promise} Updated alert
   */
  markAsInvestigating: function(userId) {
    this.status = 'INVESTIGATING';
    this.assignedTo = userId;
    return this.save();
  },
  
  /**
   * Resolve alert
   * @param {Object} resolution - Resolution details
   * @returns {Promise} Updated alert
   */
  resolve: function(resolution) {
    this.status = 'RESOLVED';
    this.resolution = {
      ...resolution,
      resolvedAt: new Date()
    };
    return this.save();
  },
  
  /**
   * Dismiss alert as false positive
   * @param {string} userId - User dismissing the alert
   * @param {string} notes - Dismissal notes
   * @returns {Promise} Updated alert
   */
  dismiss: function(userId, notes = '') {
    this.status = 'DISMISSED';
    this.resolution = {
      resolvedAt: new Date(),
      resolvedBy: userId,
      resolutionType: 'FALSE_POSITIVE',
      notes
    };
    return this.save();
  },
  
  /**
   * Link alert to an incident
   * @param {string} incidentId - Incident ID
   * @returns {Promise} Updated alert
   */
  linkToIncident: function(incidentId) {
    if (!this.relatedIncidents.includes(incidentId)) {
      this.relatedIncidents.push(incidentId);
    }
    return this.save();
  },
  
  /**
   * Add tags to alert
   * @param {Array<string>} tags - Tags to add
   * @returns {Promise} Updated alert
   */
  addTags: function(tags) {
    const uniqueTags = [...new Set([...this.tags, ...tags])];
    this.tags = uniqueTags;
    return this.save();
  }
};

// Static methods
SecurityAlertSchema.statics = {
  /**
   * Find open alerts
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Open alerts
   */
  findOpenAlerts: function(options = {}) {
    return this.find({ status: 'OPEN' }, null, options).sort({ timestamp: -1 });
  },
  
  /**
   * Find alerts by severity
   * @param {string} severity - Alert severity
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Alerts with the given severity
   */
  findBySeverity: function(severity, options = {}) {
    return this.find({ severity }, null, options).sort({ timestamp: -1 });
  },
  
  /**
   * Find alerts assigned to a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Alerts assigned to the user
   */
  findByAssignee: function(userId, options = {}) {
    return this.find({ assignedTo: userId }, null, options).sort({ timestamp: -1 });
  },
  
  /**
   * Find alerts by correlation rule
   * @param {string} ruleName - Correlation rule name
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Alerts generated by the rule
   */
  findByCorrelationRule: function(ruleName, options = {}) {
    return this.find({ correlationRule: ruleName }, null, options).sort({ timestamp: -1 });
  },
  
  /**
   * Find alerts by status and time range
   * @param {string} status - Alert status
   * @param {Date} startTime - Start of time range
   * @param {Date} endTime - End of time range
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Alerts matching criteria
   */
  findByStatusAndTimeRange: function(status, startTime, endTime, options = {}) {
    return this.find({
      status,
      timestamp: { $gte: startTime, $lte: endTime }
    }, null, options).sort({ timestamp: -1 });
  },
  
  /**
   * Search alerts by text query
   * @param {string} searchText - Text to search for
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Alerts matching search
   */
  searchByText: function(searchText, options = {}) {
    return this.find(
      { $text: { $search: searchText } },
      { score: { $meta: 'textScore' } },
      options
    ).sort({ score: { $meta: 'textScore' } });
  },
  
  /**
   * Get alert count by status
   * @param {Date} startTime - Start of time range
   * @param {Date} endTime - End of time range
   * @returns {Promise<Object>} Counts by status
   */
  getCountByStatus: function(startTime, endTime) {
    return this.aggregate([
      {
        $match: {
          timestamp: { $gte: startTime, $lte: endTime }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
  },
  
  /**
   * Get alert count by severity
   * @param {Date} startTime - Start of time range
   * @param {Date} endTime - End of time range
   * @returns {Promise<Object>} Counts by severity
   */
  getCountBySeverity: function(startTime, endTime) {
    return this.aggregate([
      {
        $match: {
          timestamp: { $gte: startTime, $lte: endTime }
        }
      },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);
  },
  
  /**
   * Get average resolution time (in hours)
   * @param {Date} startTime - Start of time range
   * @param {Date} endTime - End of time range
   * @returns {Promise<number>} Average resolution time
   */
  getAverageResolutionTime: function(startTime, endTime) {
    return this.aggregate([
      {
        $match: {
          status: 'RESOLVED',
          timestamp: { $gte: startTime, $lte: endTime },
          'resolution.resolvedAt': { $exists: true }
        }
      },
      {
        $project: {
          resolutionTime: {
            $divide: [
              { $subtract: ['$resolution.resolvedAt', '$timestamp'] },
              3600000 // Convert to hours
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgResolutionTime: { $avg: '$resolutionTime' }
        }
      }
    ]);
  }
};

const SecurityAlert = mongoose.model('SecurityAlert', SecurityAlertSchema);

module.exports = SecurityAlert; 