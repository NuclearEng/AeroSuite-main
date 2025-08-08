/**
 * Logger Utility
 * 
 * Provides logging functionality for the application.
 * Exported in a backwards-compatible way so both of these work:
 *  - const logger = require('../utils/logger');
 *  - const { logger, Logger } = require('../utils/logger');
 */

class Logger {
  constructor(context = 'App') {
    this.context = context;
  }

  info(message, ...args) {
    console.log(`[${new Date().toISOString()}] [INFO] [${this.context}] ${message}`, ...args);
  }

  debug(message, ...args) {
    console.log(`[${new Date().toISOString()}] [DEBUG] [${this.context}] ${message}`, ...args);
  }

  warn(message, ...args) {
    console.warn(`[${new Date().toISOString()}] [WARN] [${this.context}] ${message}`, ...args);
  }

  error(message, ...args) {
    console.error(`[${new Date().toISOString()}] [ERROR] [${this.context}] ${message}`, ...args);
  }
}

// Default singleton logger
const defaultLogger = new Logger('Server');

// Support both default and named exports
module.exports = defaultLogger;
module.exports.logger = defaultLogger;
module.exports.Logger = Logger;