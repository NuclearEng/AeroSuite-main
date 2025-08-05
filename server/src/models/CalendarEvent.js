/**
 * Calendar Event Model
 * 
 * Defines the schema for calendar events
 * Task: TS366 - Calendar integration implementation
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CalendarEventSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  start: {
    type: Date,
    required: true
  },
  end: {
    type: Date
  },
  allDay: {
    type: Boolean,
    default: false
  },
  location: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  url: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['inspection', 'audit', 'meeting', 'deadline', 'reminder', 'other'],
    default: 'other'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  sourceId: {
    type: String,
    trim: true
  },
  meta: {
    type: Map,
    of: Schema.Types.Mixed
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
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
CalendarEventSchema.index({ start: 1 });
CalendarEventSchema.index({ userId: 1, start: 1 });
CalendarEventSchema.index({ type: 1, start: 1 });
CalendarEventSchema.index({ isPublic: 1 });

module.exports = mongoose.model('CalendarEvent', CalendarEventSchema); 