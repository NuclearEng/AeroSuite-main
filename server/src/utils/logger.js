/**
 * Logger Utility
 * 
 * Provides logging functionality for the application
 */

/**
 * Logger class for context-aware logging
 */
class Logger {
  constructor(contextName = 'App') {
    this.contextName = contextName;
  }
  
  info(message, ...args) {
    console.log(`[${new Date().toISOString()}] [INFO] [${this.contextName}] ${message}`, ...args);
  }
  
  debug(message, ...args) {
    console.log(`[${new Date().toISOString()}] [DEBUG] [${this.contextName}] ${message}`, ...args);
  }
  
  warn(message, ...args) {
    console.warn(`[${new Date().toISOString()}] [WARN] [${this.contextName}] ${message}`, ...args);
  }
  
  error(message, ...args) {
    console.error(`[${new Date().toISOString()}] [ERROR] [${this.contextName}] ${message}`, ...args);
  }
  
  withContext(context, req) {
    return context;
  }
}

/**
 * Simple logger implementation
 */
const logger = {
  info: (message, ...args) => {
    console.log(`[${new Date().toISOString()}] [INFO] ${message}`, ...args);
  },
  
  debug: (message, ...args) => {
    console.log(`[${new Date().toISOString()}] [DEBUG] ${message}`, ...args);
  },
  
  warn: (message, ...args) => {
    console.warn(`[${new Date().toISOString()}] [WARN] ${message}`, ...args);
  },
  
  error: (message, ...args) => {
    console.error(`[${new Date().toISOString()}] [ERROR] ${message}`, ...args);
  },
  
  withContext: (context, req) => {
    return context;
  },
  
  createContextLogger: (contextName) => {
    return new Logger(contextName);
  }
};

module.exports = { logger, Logger }; 