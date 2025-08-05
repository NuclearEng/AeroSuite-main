/**
 * Calendar Integration Model
 * 
 * Defines the schema for calendar integrations with external services
 * Task: TS366 - Calendar integration implementation
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CalendarIntegrationSchema = new Schema({
  type: {
    type: String,
    enum: ['internal', 'google', 'outlook', 'ical'],
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  isConnected: {
    type: Boolean,
    default: false
  },
  accessToken: {
    type: String,
    trim: true
  },
  refreshToken: {
    type: String,
    trim: true
  },
  expiresAt: {
    type: Date
  },
  lastSync: {
    type: Date
  },
  settings: {
    type: Map,
    of: Schema.Types.Mixed
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create indexes for efficient querying
CalendarIntegrationSchema.index({ userId: 1, type: 1 }, { unique: true });
CalendarIntegrationSchema.index({ userId: 1, isConnected: 1 });

module.exports = mongoose.model('CalendarIntegration', CalendarIntegrationSchema); 