/**
 * Main configuration file
 * Centralizes all configuration settings for the application
 */

// Load environment variables
require('dotenv').config();

// Import SMS configuration
const smsConfig = require('./sms.config');

// Import document configuration
const documentsConfig = require('./documents.config');

// Import SSO configuration
const ssoConfig = require('./sso.config');

// Import feature flags configuration
const featureFlagsConfig = require('./feature-flags.config');

// Base configuration
const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  
  // Server
  port: parseInt(process.env.PORT || '5000', 10),
  host: process.env.HOST || '0.0.0.0',
  
  // API
  apiVersion: process.env.API_VERSION || 'v1',
  apiPrefix: process.env.API_PREFIX || '/api',
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  
  // Database
  db: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/aerosuite',
    options: {
      maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE || '10', 10),
      minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE || '2', 10),
      socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT || '45000', 10),
      connectTimeoutMS: parseInt(process.env.DB_CONNECT_TIMEOUT || '10000', 10),
      retryWrites: true,
      retryReads: true
    }
  },
  
  // Authentication
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    saltRounds: parseInt(process.env.SALT_ROUNDS || '10', 10)
  },
  
  // Security
  security: {
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes in ms
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    cspReportUri: process.env.CSP_REPORT_URI || null,
    trustedCDNs: process.env.TRUSTED_CDNS ? process.env.TRUSTED_CDNS.split(',') : ['https://cdn.aerosuite.com']
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    enableConsole: process.env.LOG_ENABLE_CONSOLE !== 'false',
    enableFile: process.env.LOG_ENABLE_FILE === 'true',
    filePath: process.env.LOG_FILE_PATH || 'logs/server.log'
  },
  
  // Add SMS configuration
  sms: smsConfig,
  
  // Add document management configuration
  documents: documentsConfig,
  
  // Add SSO configuration
  sso: ssoConfig,
  
  // Add feature flags configuration
  featureFlags: featureFlagsConfig
};

module.exports = config; 