/**
 * Feature Flag Model
 * 
 * This model represents a feature flag configuration stored in MongoDB.
 */

const mongoose = require('mongoose');

const featureFlagSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      // Validate feature flag key format (e.g., 'namespace.feature')
      validate: {
        validator: function(v) {
          return /^[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)+$/.test(v);
        },
        message: props => `${props.value} is not a valid feature flag key format (e.g., 'namespace.feature')`
      }
    },
    enabled: {
      type: Boolean,
      default: false
    },
    description: {
      type: String,
      trim: true
    },
    owner: {
      type: String,
      trim: true
    },
    rolloutPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    segmentRules: {
      type: Object,
      default: {}
    },
    environmentsEnabled: {
      type: [String],
      default: ['development']
    },
    lastToggled: {
      type: Date
    },
    metadata: {
      type: Object,
      default: {}
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for status
featureFlagSchema.virtual('status').get(function() {
  if (!this.enabled) return 'disabled';
  if (this.rolloutPercentage === 0) return 'disabled';
  if (this.rolloutPercentage < 100) return 'partial';
  return 'enabled';
});

// Methods to convert between model and service format
featureFlagSchema.methods.toServiceFormat = function() {
  return {
    enabled: this.enabled,
    description: this.description,
    createdAt: this.createdAt,
    modifiedAt: this.updatedAt,
    owner: this.owner,
    rolloutPercentage: this.rolloutPercentage,
    segmentRules: this.segmentRules || {},
    environmentsEnabled: this.environmentsEnabled || ['development'],
    metadata: this.metadata || {}
  };
};

// Static method to sync with service format
featureFlagSchema.statics.fromServiceFormat = function(key, data) {
  return {
    key,
    enabled: data.enabled,
    description: data.description,
    owner: data.owner,
    rolloutPercentage: data.rolloutPercentage,
    segmentRules: data.segmentRules,
    environmentsEnabled: data.environmentsEnabled,
    metadata: data.metadata || {},
    lastToggled: data.enabled !== undefined ? new Date() : undefined
  };
};

// Indexes for efficient queries
featureFlagSchema.index({ key: 1 });
featureFlagSchema.index({ enabled: 1 });
featureFlagSchema.index({ 'environmentsEnabled': 1 });

const FeatureFlag = mongoose.model('FeatureFlag', featureFlagSchema);

module.exports = FeatureFlag; 