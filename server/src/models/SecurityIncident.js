/**
 * Security Incident Model
 * Related to: SEC005 - Security Information Event Management
 * 
 * Stores security incidents created from critical alerts that require
 * formal investigation, response, and resolution.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Timeline entry schema
const TimelineEntrySchema = new Schema({
  // Entry timestamp
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  // Action performed
  action: {
    type: String,
    required: true
  },
  
  // Description of the action
  description: {
    type: String,
    required: true
  },
  
  // User who performed the action
  user: {
    type: String,
    required: true
  },
  
  // Additional data related to the action
  data: {
    type: Object,
    default: {}
  }
}, { _id: true });

// Artifact schema
const ArtifactSchema = new Schema({
  // Artifact name
  name: {
    type: String,
    required: true
  },
  
  // Artifact type (LOG, SCREENSHOT, NETWORK_CAPTURE, etc.)
  type: {
    type: String,
    required: true
  },
  
  // Artifact description
  description: {
    type: String
  },
  
  // Path or URL to the artifact
  location: {
    type: String,
    required: true
  },
  
  // User who added the artifact
  addedBy: {
    type: String,
    required: true
  },
  
  // Timestamp when the artifact was added
  addedAt: {
    type: Date,
    default: Date.now
  },
  
  // Metadata about the artifact
  metadata: {
    type: Object,
    default: {}
  }
}, { _id: true });

// Main incident schema
const SecurityIncidentSchema = new Schema({
  // Unique incident identifier
  incidentId: {
    type: String,
    required: true,
    index: true,
    unique: true
  },
  
  // Incident name
  name: {
    type: String,
    required: true
  },
  
  // Incident description
  description: {
    type: String,
    required: true
  },
  
  // Incident severity (CRITICAL, HIGH, MEDIUM, LOW)
  severity: {
    type: String,
    required: true,
    index: true,
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
  },
  
  // Incident type
  type: {
    type: String,
    required: true,
    index: true,
    enum: [
      'MALWARE',
      'PHISHING',
      'UNAUTHORIZED_ACCESS',
      'DATA_BREACH',
      'DENIAL_OF_SERVICE',
      'RANSOMWARE',
      'PRIVILEGE_ESCALATION',
      'INSIDER_THREAT',
      'OTHER'
    ]
  },
  
  // Incident timestamp
  timestamp: {
    type: Date,
    required: true,
    index: true,
    default: Date.now
  },
  
  // Source alert that triggered the incident
  sourceAlertId: {
    type: String,
    index: true
  },
  
  // Incident status
  status: {
    type: String,
    required: true,
    index: true,
    enum: [
      'OPEN',            // Incident created
      'TRIAGING',        // Initial investigation
      'CONTAINING',      // Containing the incident
      'ERADICATING',     // Removing the threat
      'RECOVERING',      // Restoring systems
      'RESOLVED',        // Incident resolved
      'POST_MORTEM'      // Conducting post-incident review
    ],
    default: 'OPEN'
  },
  
  // Incident phase
  phase: {
    type: String,
    required: true,
    enum: [
      'IDENTIFICATION',
      'CONTAINMENT',
      'ERADICATION',
      'RECOVERY',
      'LESSONS_LEARNED'
    ],
    default: 'IDENTIFICATION'
  },
  
  // User assigned to handle the incident
  assignedTo: {
    type: String,
    index: true
  },
  
  // Incident response team
  responseTeam: {
    type: [String],
    default: []
  },
  
  // Incident timeline
  timeline: {
    type: [TimelineEntrySchema],
    default: []
  },
  
  // Affected systems
  affectedSystems: {
    type: [String],
    default: []
  },
  
  // Affected users
  affectedUsers: {
    type: [String],
    default: []
  },
  
  // Incident artifacts
  artifacts: {
    type: [ArtifactSchema],
    default: []
  },
  
  // Resolution details
  resolution: {
    type: {
      resolvedAt: Date,
      resolvedBy: String,
      rootCause: String,
      actions: [String],
      preventiveMeasures: [String]
    }
  },
  
  // Impact assessment
  impact: {
    type: {
      technicalImpact: {
        type: String,
        enum: ['NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
      },
      businessImpact: {
        type: String,
        enum: ['NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
      },
      financialImpact: {
        amount: Number,
        currency: String
      },
      complianceImpact: Boolean,
      description: String
    }
  },
  
  // Communication log
  communicationLog: {
    type: [{
      timestamp: Date,
      channel: String,
      recipients: [String],
      message: String,
      sentBy: String
    }],
    default: []
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
  },
  
  // Additional metadata
  metadata: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'security_incidents'
});

// Indexes for efficient querying
SecurityIncidentSchema.index({ timestamp: 1, severity: 1 });
SecurityIncidentSchema.index({ timestamp: 1, status: 1 });
SecurityIncidentSchema.index({ timestamp: 1, type: 1 });
SecurityIncidentSchema.index({ timestamp: 1, assignedTo: 1 });
SecurityIncidentSchema.index({ 'resolution.resolvedAt': 1 });
SecurityIncidentSchema.index({ 'affectedSystems': 1 });
SecurityIncidentSchema.index({ 'affectedUsers': 1 });

// Add text search index
SecurityIncidentSchema.index({
  name: 'text',
  description: 'text',
  tags: 'text',
  'timeline.description': 'text',
  'artifacts.description': 'text'
});

// Instance methods
SecurityIncidentSchema.methods = {
  /**
   * Convert to JSON with formatted timestamps
   */
  toJSON: function() {
    const obj = this.toObject();
    obj.timestamp = obj.timestamp.toISOString();
    
    if (obj.timeline) {
      obj.timeline.forEach(entry => {
        entry.timestamp = entry.timestamp.toISOString();
      });
    }
    
    if (obj.artifacts) {
      obj.artifacts.forEach(artifact => {
        artifact.addedAt = artifact.addedAt.toISOString();
      });
    }
    
    if (obj.resolution && obj.resolution.resolvedAt) {
      obj.resolution.resolvedAt = obj.resolution.resolvedAt.toISOString();
    }
    
    if (obj.communicationLog) {
      obj.communicationLog.forEach(entry => {
        entry.timestamp = entry.timestamp.toISOString();
      });
    }
    
    return obj;
  },
  
  /**
   * Update incident status
   * @param {string} status - New status
   * @param {string} userId - User making the change
   * @param {string} description - Description of the status change
   * @returns {Promise} Updated incident
   */
  updateStatus: function(status, userId, description) {
    this.status = status;
    
    // Add timeline entry
    this.timeline.push({
      timestamp: new Date(),
      action: 'STATUS_CHANGED',
      description: description || `Status changed to ${status}`,
      user: userId,
      data: { 
        oldStatus: this.status,
        newStatus: status
      }
    });
    
    // Update phase based on status
    switch (status) {
      case 'TRIAGING':
        this.phase = 'IDENTIFICATION';
        break;
      case 'CONTAINING':
        this.phase = 'CONTAINMENT';
        break;
      case 'ERADICATING':
        this.phase = 'ERADICATION';
        break;
      case 'RECOVERING':
        this.phase = 'RECOVERY';
        break;
      case 'POST_MORTEM':
        this.phase = 'LESSONS_LEARNED';
        break;
    }
    
    return this.save();
  },
  
  /**
   * Assign incident to a user
   * @param {string} userId - User to assign the incident to
   * @param {string} assignedBy - User making the assignment
   * @returns {Promise} Updated incident
   */
  assignTo: function(userId, assignedBy) {
    this.assignedTo = userId;
    
    // Add timeline entry
    this.timeline.push({
      timestamp: new Date(),
      action: 'ASSIGNED',
      description: `Incident assigned to ${userId}`,
      user: assignedBy,
      data: { assignedTo: userId }
    });
    
    return this.save();
  },
  
  /**
   * Add a team member to the response team
   * @param {string} userId - User to add
   * @param {string} addedBy - User adding the team member
   * @returns {Promise} Updated incident
   */
  addTeamMember: function(userId, addedBy) {
    if (!this.responseTeam.includes(userId)) {
      this.responseTeam.push(userId);
      
      // Add timeline entry
      this.timeline.push({
        timestamp: new Date(),
        action: 'TEAM_MEMBER_ADDED',
        description: `Added ${userId} to response team`,
        user: addedBy,
        data: { teamMember: userId }
      });
    }
    
    return this.save();
  },
  
  /**
   * Add a timeline entry
   * @param {string} action - Action performed
   * @param {string} description - Description of the action
   * @param {string} userId - User who performed the action
   * @param {Object} data - Additional data
   * @returns {Promise} Updated incident
   */
  addTimelineEntry: function(action, description, userId, data = {}) {
    this.timeline.push({
      timestamp: new Date(),
      action,
      description,
      user: userId,
      data
    });
    
    return this.save();
  },
  
  /**
   * Add an artifact
   * @param {Object} artifact - Artifact to add
   * @returns {Promise} Updated incident
   */
  addArtifact: function(artifact) {
    this.artifacts.push({
      ...artifact,
      addedAt: new Date()
    });
    
    // Add timeline entry
    this.timeline.push({
      timestamp: new Date(),
      action: 'ARTIFACT_ADDED',
      description: `Added artifact: ${artifact.name}`,
      user: artifact.addedBy,
      data: { artifactName: artifact.name, artifactType: artifact.type }
    });
    
    return this.save();
  },
  
  /**
   * Add affected system
   * @param {string} system - Affected system
   * @param {string} userId - User adding the system
   * @returns {Promise} Updated incident
   */
  addAffectedSystem: function(system, userId) {
    if (!this.affectedSystems.includes(system)) {
      this.affectedSystems.push(system);
      
      // Add timeline entry
      this.timeline.push({
        timestamp: new Date(),
        action: 'AFFECTED_SYSTEM_ADDED',
        description: `Added affected system: ${system}`,
        user: userId,
        data: { system }
      });
    }
    
    return this.save();
  },
  
  /**
   * Add affected user
   * @param {string} user - Affected user
   * @param {string} addedBy - User adding the affected user
   * @returns {Promise} Updated incident
   */
  addAffectedUser: function(user, addedBy) {
    if (!this.affectedUsers.includes(user)) {
      this.affectedUsers.push(user);
      
      // Add timeline entry
      this.timeline.push({
        timestamp: new Date(),
        action: 'AFFECTED_USER_ADDED',
        description: `Added affected user: ${user}`,
        user: addedBy,
        data: { affectedUser: user }
      });
    }
    
    return this.save();
  },
  
  /**
   * Resolve incident
   * @param {Object} resolution - Resolution details
   * @param {string} userId - User resolving the incident
   * @returns {Promise} Updated incident
   */
  resolve: function(resolution, userId) {
    this.status = 'RESOLVED';
    this.phase = 'LESSONS_LEARNED';
    this.resolution = {
      ...resolution,
      resolvedAt: new Date(),
      resolvedBy: userId
    };
    
    // Add timeline entry
    this.timeline.push({
      timestamp: new Date(),
      action: 'RESOLVED',
      description: `Incident resolved: ${resolution.rootCause}`,
      user: userId,
      data: { 
        rootCause: resolution.rootCause,
        actions: resolution.actions
      }
    });
    
    return this.save();
  },
  
  /**
   * Add a communication entry
   * @param {Object} communication - Communication details
   * @returns {Promise} Updated incident
   */
  addCommunication: function(communication) {
    this.communicationLog.push({
      ...communication,
      timestamp: new Date()
    });
    
    // Add timeline entry
    this.timeline.push({
      timestamp: new Date(),
      action: 'COMMUNICATION_SENT',
      description: `Communication sent via ${communication.channel}`,
      user: communication.sentBy,
      data: { 
        channel: communication.channel,
        recipientCount: communication.recipients.length
      }
    });
    
    return this.save();
  },
  
  /**
   * Link to another incident
   * @param {string} incidentId - Related incident ID
   * @param {string} userId - User linking the incidents
   * @returns {Promise} Updated incident
   */
  linkIncident: function(incidentId, userId) {
    if (!this.relatedIncidents.includes(incidentId)) {
      this.relatedIncidents.push(incidentId);
      
      // Add timeline entry
      this.timeline.push({
        timestamp: new Date(),
        action: 'INCIDENT_LINKED',
        description: `Linked to incident: ${incidentId}`,
        user: userId,
        data: { relatedIncidentId: incidentId }
      });
    }
    
    return this.save();
  },
  
  /**
   * Set impact assessment
   * @param {Object} impact - Impact assessment
   * @param {string} userId - User setting the impact
   * @returns {Promise} Updated incident
   */
  setImpact: function(impact, userId) {
    this.impact = impact;
    
    // Add timeline entry
    this.timeline.push({
      timestamp: new Date(),
      action: 'IMPACT_ASSESSED',
      description: `Impact assessment updated`,
      user: userId,
      data: { 
        technicalImpact: impact.technicalImpact,
        businessImpact: impact.businessImpact
      }
    });
    
    return this.save();
  }
};

// Static methods
SecurityIncidentSchema.statics = {
  /**
   * Find open incidents
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Open incidents
   */
  findOpenIncidents: function(options = {}) {
    return this.find({ 
      status: { $ne: 'RESOLVED' }
    }, null, options).sort({ severity: 1, timestamp: -1 });
  },
  
  /**
   * Find critical incidents
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Critical incidents
   */
  findCriticalIncidents: function(options = {}) {
    return this.find({ 
      severity: 'CRITICAL'
    }, null, options).sort({ timestamp: -1 });
  },
  
  /**
   * Find incidents by type
   * @param {string} type - Incident type
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Incidents of the specified type
   */
  findByType: function(type, options = {}) {
    return this.find({ type }, null, options).sort({ timestamp: -1 });
  },
  
  /**
   * Find incidents by status
   * @param {string} status - Incident status
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Incidents with the given status
   */
  findByStatus: function(status, options = {}) {
    return this.find({ status }, null, options).sort({ timestamp: -1 });
  },
  
  /**
   * Find incidents by phase
   * @param {string} phase - Incident phase
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Incidents in the specified phase
   */
  findByPhase: function(phase, options = {}) {
    return this.find({ phase }, null, options).sort({ timestamp: -1 });
  },
  
  /**
   * Find incidents assigned to a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Incidents assigned to the user
   */
  findByAssignee: function(userId, options = {}) {
    return this.find({ assignedTo: userId }, null, options).sort({ severity: 1, timestamp: -1 });
  },
  
  /**
   * Find incidents affecting a system
   * @param {string} system - System name
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Incidents affecting the system
   */
  findByAffectedSystem: function(system, options = {}) {
    return this.find({ affectedSystems: system }, null, options).sort({ timestamp: -1 });
  },
  
  /**
   * Find incidents affecting a user
   * @param {string} user - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Incidents affecting the user
   */
  findByAffectedUser: function(user, options = {}) {
    return this.find({ affectedUsers: user }, null, options).sort({ timestamp: -1 });
  },
  
  /**
   * Search incidents by text query
   * @param {string} searchText - Text to search for
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Incidents matching search
   */
  searchByText: function(searchText, options = {}) {
    return this.find(
      { $text: { $search: searchText } },
      { score: { $meta: 'textScore' } },
      options
    ).sort({ score: { $meta: 'textScore' } });
  },
  
  /**
   * Get metrics for incidents
   * @param {Date} startTime - Start of time range
   * @param {Date} endTime - End of time range
   * @returns {Promise<Object>} Incident metrics
   */
  getMetrics: function(startTime, endTime) {
    return Promise.all([
      // Count by status
      this.aggregate([
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
      ]),
      
      // Count by severity
      this.aggregate([
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
      ]),
      
      // Count by type
      this.aggregate([
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
      ]),
      
      // Average resolution time
      this.aggregate([
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
      ])
    ]).then(([statusCounts, severityCounts, typeCounts, resolutionTime]) => {
      return {
        byStatus: statusCounts,
        bySeverity: severityCounts,
        byType: typeCounts,
        averageResolutionTimeHours: resolutionTime[0]?.avgResolutionTime || 0
      };
    });
  }
};

const SecurityIncident = mongoose.model('SecurityIncident', SecurityIncidentSchema);

module.exports = SecurityIncident; 