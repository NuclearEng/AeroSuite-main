/**
 * Security Event Model
 * Related to: SEC005 - Security Information Event Management
 * 
 * Stores security events for auditing, compliance, and security analysis.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SecurityEventSchema = new Schema({
  // Unique event identifier
  eventId: {
    type: String,
    required: true,
    index: true,
    unique: true
  },
  
  // Event type (auth:failure, access:denied, etc.)
  type: {
    type: String,
    required: true,
    index: true
  },
  
  // Event severity (CRITICAL, HIGH, MEDIUM, LOW, INFO)
  severity: {
    type: String,
    required: true,
    index: true,
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']
  },
  
  // Event message
  message: {
    type: String,
    required: true
  },
  
  // Event timestamp
  timestamp: {
    type: Date,
    required: true,
    index: true,
    default: Date.now
  },
  
  // Source IP address
  sourceIp: {
    type: String,
    index: true
  },
  
  // User ID associated with the event
  userId: {
    type: String,
    index: true
  },
  
  // Resource ID involved in the event
  resourceId: {
    type: String,
    index: true
  },
  
  // Component that generated the event
  component: {
    type: String,
    index: true
  },
  
  // Action performed
  action: {
    type: String,
    index: true
  },
  
  // Result of the action (SUCCESS, FAILURE, etc.)
  result: {
    type: String,
    index: true
  },
  
  // Additional metadata about the event
  metadata: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'security_events'
});

// Indexes for efficient querying
SecurityEventSchema.index({ timestamp: 1, type: 1 });
SecurityEventSchema.index({ timestamp: 1, severity: 1 });
SecurityEventSchema.index({ timestamp: 1, userId: 1 });
SecurityEventSchema.index({ timestamp: 1, sourceIp: 1 });
SecurityEventSchema.index({ timestamp: 1, component: 1 });
SecurityEventSchema.index({ timestamp: 1, action: 1 });
SecurityEventSchema.index({ timestamp: 1, result: 1 });

// Time-to-live index for automatic data cleanup (90 days)
SecurityEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Add text search index
SecurityEventSchema.index({
  message: 'text',
  type: 'text',
  component: 'text',
  action: 'text'
});

// Instance methods
SecurityEventSchema.methods = {
  /**
   * Convert to JSON with formatted timestamp
   */
  toJSON: function() {
    const obj = this.toObject();
    obj.timestamp = obj.timestamp.toISOString();
    return obj;
  }
};

// Static methods
SecurityEventSchema.statics = {
  /**
   * Find events by user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Events for the user
   */
  findByUser: function(userId, options = {}) {
    return this.find({ userId }, null, options).sort({ timestamp: -1 });
  },
  
  /**
   * Find events by IP address
   * @param {string} ipAddress - IP address
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Events from the IP
   */
  findByIP: function(ipAddress, options = {}) {
    return this.find({ sourceIp: ipAddress }, null, options).sort({ timestamp: -1 });
  },
  
  /**
   * Find events by type and time range
   * @param {string} type - Event type
   * @param {Date} startTime - Start of time range
   * @param {Date} endTime - End of time range
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Events matching criteria
   */
  findByTypeAndTimeRange: function(type, startTime, endTime, options = {}) {
    return this.find({
      type,
      timestamp: { $gte: startTime, $lte: endTime }
    }, null, options).sort({ timestamp: -1 });
  },
  
  /**
   * Find events by severity and time range
   * @param {string} severity - Event severity
   * @param {Date} startTime - Start of time range
   * @param {Date} endTime - End of time range
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Events matching criteria
   */
  findBySeverityAndTimeRange: function(severity, startTime, endTime, options = {}) {
    return this.find({
      severity,
      timestamp: { $gte: startTime, $lte: endTime }
    }, null, options).sort({ timestamp: -1 });
  },
  
  /**
   * Search events by text query
   * @param {string} searchText - Text to search for
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Events matching search
   */
  searchByText: function(searchText, options = {}) {
    return this.find(
      { $text: { $search: searchText } },
      { score: { $meta: 'textScore' } },
      options
    ).sort({ score: { $meta: 'textScore' } });
  },
  
  /**
   * Get event count by type
   * @param {Date} startTime - Start of time range
   * @param {Date} endTime - End of time range
   * @returns {Promise<Object>} Counts by type
   */
  getCountByType: function(startTime, endTime) {
    return this.aggregate([
      {
        $match: {
          timestamp: { $gte: startTime, $lte: endTime }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);
  },
  
  /**
   * Get event count by severity
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
  }
};

const SecurityEvent = mongoose.model('SecurityEvent', SecurityEventSchema);

module.exports = SecurityEvent; 