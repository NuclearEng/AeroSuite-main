/**
 * Feature Flags Configuration
 * 
 * This file contains configuration for the feature flagging system.
 * Feature flags allow for controlled rollout of features and A/B testing.
 * 
 * Environment Variables:
 * - FEATURE_FLAGS_ENABLED: Enable/disable the feature flag system (default: true)
 * - FEATURE_FLAGS_STORAGE: Storage type for feature flags (memory, redis, mongodb)
 * - FEATURE_FLAGS_REDIS_URL: Redis URL for feature flag storage
 * - FEATURE_FLAGS_SYNC_INTERVAL: Interval for syncing flags (in ms)
 */

// Default feature flags (used when no storage is configured or as initial values)
const defaultFlags = {
  // Core features
  'core.newNavigation': {
    enabled: false,
    description: 'New navigation experience',
    createdAt: new Date(),
    modifiedAt: new Date(),
    owner: 'UI Team',
    rolloutPercentage: 0,
    segmentRules: {},
    environmentsEnabled: ['development']
  },
  'core.darkModeV2': {
    enabled: true,
    description: 'Enhanced dark mode with custom theme support',
    createdAt: new Date(),
    modifiedAt: new Date(),
    owner: 'UI Team',
    rolloutPercentage: 100,
    segmentRules: {},
    environmentsEnabled: ['development', 'staging', 'production']
  },
  
  // Inspection features
  'inspections.aiAssist': {
    enabled: false,
    description: 'AI-assisted inspection analysis',
    createdAt: new Date(),
    modifiedAt: new Date(),
    owner: 'ML Team',
    rolloutPercentage: 0,
    segmentRules: {
      userRoles: ['admin']
    },
    environmentsEnabled: ['development']
  },
  'inspections.batchProcessing': {
    enabled: true,
    description: 'Batch processing of inspections',
    createdAt: new Date(),
    modifiedAt: new Date(),
    owner: 'Backend Team',
    rolloutPercentage: 100,
    segmentRules: {},
    environmentsEnabled: ['development', 'staging', 'production']
  },
  
  // Supplier features
  'suppliers.riskScoring': {
    enabled: true,
    description: 'Risk scoring for suppliers',
    createdAt: new Date(),
    modifiedAt: new Date(),
    owner: 'Data Science Team',
    rolloutPercentage: 100,
    segmentRules: {},
    environmentsEnabled: ['development', 'staging', 'production']
  },
  'suppliers.blockchainVerification': {
    enabled: false,
    description: 'Blockchain verification for supplier certifications',
    createdAt: new Date(),
    modifiedAt: new Date(),
    owner: 'Blockchain Team',
    rolloutPercentage: 0,
    segmentRules: {
      userRoles: ['admin']
    },
    environmentsEnabled: ['development']
  },
  
  // Dashboard features
  'dashboard.widgets.aiInsights': {
    enabled: false,
    description: 'AI insights widget on dashboard',
    createdAt: new Date(),
    modifiedAt: new Date(),
    owner: 'ML Team',
    rolloutPercentage: 0,
    segmentRules: {},
    environmentsEnabled: ['development']
  },
  'dashboard.realTimeUpdates': {
    enabled: true,
    description: 'Real-time updates for dashboard data',
    createdAt: new Date(),
    modifiedAt: new Date(),
    owner: 'Frontend Team',
    rolloutPercentage: 50,
    segmentRules: {},
    environmentsEnabled: ['development', 'staging']
  },
  
  // Report features
  'reports.pdfExport': {
    enabled: true,
    description: 'PDF export for reports',
    createdAt: new Date(),
    modifiedAt: new Date(),
    owner: 'Reports Team',
    rolloutPercentage: 100,
    segmentRules: {},
    environmentsEnabled: ['development', 'staging', 'production']
  },
  'reports.scheduling': {
    enabled: true,
    description: 'Report scheduling',
    createdAt: new Date(),
    modifiedAt: new Date(),
    owner: 'Reports Team',
    rolloutPercentage: 100,
    segmentRules: {},
    environmentsEnabled: ['development', 'staging', 'production']
  }
};

module.exports = {
  // Global settings
  enabled: process.env.FEATURE_FLAGS_ENABLED !== 'false',
  
  // Storage configuration
  storage: {
    type: process.env.FEATURE_FLAGS_STORAGE || 'memory', // memory, redis, mongodb
    redis: {
      url: process.env.FEATURE_FLAGS_REDIS_URL || 'redis://localhost:6379',
      keyPrefix: 'aerosuite:feature-flags:',
    },
    mongodb: {
      collection: 'featureFlags'
    }
  },
  
  // Sync configuration
  sync: {
    interval: parseInt(process.env.FEATURE_FLAGS_SYNC_INTERVAL || '60000', 10), // 1 minute in ms
    enabled: true
  },
  
  // Default feature flags
  defaultFlags,
  
  // Evaluation configuration
  evaluation: {
    // Hash function seed for consistent percentage rollouts
    hashSeed: process.env.FEATURE_FLAGS_HASH_SEED || 'aerosuite-feature-flags',
    
    // Default flag state if flag doesn't exist (should generally be false for safety)
    defaultState: false,
    
    // Cache TTL in milliseconds (10 seconds)
    cacheTTL: 10000
  }
}; 