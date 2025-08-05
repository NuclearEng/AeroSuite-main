// Import SMS configuration
const smsConfig = require('./sms.config');

// Import document configuration
const documentsConfig = require('./documents.config');

// Import SSO configuration
const ssoConfig = require('./sso.config');

// Import feature flags configuration
const featureFlagsConfig = require('./feature-flags.config');

module.exports = {
  // Add SMS configuration
  sms: smsConfig,
  
  // Add document management configuration
  documents: documentsConfig,
  
  // Add SSO configuration
  sso: ssoConfig,
  
  // Add feature flags configuration
  featureFlags: featureFlagsConfig
}; 