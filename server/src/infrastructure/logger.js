/**
 * Simple logger implementation for the AeroSuite server
 * This is a drop-in replacement for winston logger
 */

// Import our own simple logger implementation
const { logger, Logger } = require('../utils/logger');

// Create winston-like interface without requiring winston
const winstonLogger = {
  info: (message, ...args) => logger.info(message, ...args),
  warn: (message, ...args) => logger.warn(message, ...args),
  error: (message, ...args) => logger.error(message, ...args),
  debug: (message, ...args) => logger.debug(message, ...args),
  
  // Winston format methods (simplified)
  format: {
    combine: () => ({}),
    timestamp: () => ({}),
    printf: () => ({}),
    colorize: () => ({}),
    json: () => ({})
  },
  
  // Winston transports (simplified)
  transports: {
    Console: function() { return {}; },
    File: function() { return {}; }
  },
  
  // Create a new logger instance with winston-compatible API
  createLogger: (config) => {
    const contextName = config.defaultMeta?.service || 'Server';
    const contextLogger = new Logger(contextName);
    
    return {
      info: (message, ...args) => contextLogger.info(message, ...args),
      warn: (message, ...args) => contextLogger.warn(message, ...args),
      error: (message, ...args) => contextLogger.error(message, ...args),
      debug: (message, ...args) => contextLogger.debug(message, ...args),
      
      // Add winston-compatible methods
      add: () => ({}),
      remove: () => ({}),
      clear: () => ({}),
      profile: () => ({}),
      configure: () => ({})
    };
  }
};

// Export winston-compatible interface
module.exports = winstonLogger; 