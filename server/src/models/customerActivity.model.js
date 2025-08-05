const mongoose = require('mongoose');

/**
 * Customer Activity Schema
 * 
 * Used to track various activities related to customers
 * Activities can include: inspections, communication, document updates, etc.
 */
const customerActivitySchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true
    },
    activityType: {
      type: String,
      required: true,
      enum: [
        'inspection_scheduled',
        'inspection_completed',
        'document_added',
        'document_updated',
        'communication',
        'status_change',
        'supplier_added',
        'supplier_removed',
        'note_added',
        'contract_updated',
        'user_assigned',
        'custom'
      ]
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    relatedEntities: {
      // Optional references to other entities involved in the activity
      inspection: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inspection'
      },
      supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier'
      },
      document: {
        type: String // Document path or ID
      }
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    },
    isSystem: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Indexes for faster queries
customerActivitySchema.index({ createdAt: -1 });
customerActivitySchema.index({ activityType: 1, customerId: 1 });

// Static method to add a new activity
customerActivitySchema.statics.addActivity = async function(activityData) {
  return this.create(activityData);
};

// Static method to get recent activities for a customer
customerActivitySchema.statics.getRecentActivities = async function(customerId, limit = 20, skip = 0) {
  return this.find({ customerId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('performedBy', 'firstName lastName avatar')
    .populate('relatedEntities.inspection', 'inspectionNumber title')
    .populate('relatedEntities.supplier', 'name code');
};

const CustomerActivity = mongoose.model('CustomerActivity', customerActivitySchema);

module.exports = CustomerActivity; 