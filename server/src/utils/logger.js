/**
 * Logger Utility
 * 
 * Provides logging functionality for the application
 */

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
  }
};

module.exports = { logger }; 