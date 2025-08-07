/**
 * Simple logger implementation for the AeroSuite server
 * This is a drop-in replacement for winston logger
 */

// Import our enhanced logger implementation
const { logger, Logger } = require('../utils/logger');

// Create winston-like interface without requiring winston
const winstonLogger = {
  info: (message, ...args) => logger.info(message, ...args),
  warn: (message, ...args) => logger.warn(message, ...args),
  error: (message, ...args) => logger.error(message, ...args),
  debug: (message, ...args) => logger.debug(message, ...args),
  log: (level, message, ...args) => logger[level] ? logger[level](message, ...args) : logger.info(message, ...args),
  
  // Add withContext method for compatibility
  withContext: (context, req) => logger.withContext(context, req),
  
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
      log: (level, message, ...args) => contextLogger[level] ? contextLogger[level](message, ...args) : contextLogger.info(message, ...args),
      
      // Add winston-compatible methods
      add: () => ({}),
      remove: () => ({}),
      clear: () => ({}),
      profile: () => ({}),
      configure: () => ({}),
      
      // Add withContext method
      withContext: (context, req) => contextLogger.withContext(context, req)
    };
  }
};

// Export winston-compatible interface
module.exports = winstonLogger; 