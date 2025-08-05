/**
 * Logger utility for AI/ML modules
 * 
 * This module provides standardized logging for AI/ML related operations
 * with additional context and formatting specific to AI tasks.
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs', 'ai');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define custom format for AI module logs
const aiLogFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.printf(({ level, message, timestamp, module, operation, duration }) => {
    const baseLog = `${timestamp} [${level.toUpperCase()}] AI/${module || 'general'}: ${message}`;
    const operationInfo = operation ? ` (Operation: ${operation})` : '';
    const durationInfo = duration ? ` (Duration: ${duration}ms)` : '';
    
    return `${baseLog}${operationInfo}${durationInfo}`;
  })
);

// Create winston logger instance
const logger = winston.createLogger({
  level: process.env.AI_LOG_LEVEL || 'info',
  format: aiLogFormat,
  defaultMeta: { service: 'ai-service' },
  transports: [
    // Console logging
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        aiLogFormat
      )
    }),
    // File logging - error level
    new winston.transports.File({ 
      filename: path.join(logsDir, 'ai-error.log'),
      level: 'error'
    }),
    // File logging - all levels
    new winston.transports.File({ 
      filename: path.join(logsDir, 'ai-combined.log')
    }),
  ],
  // Handle exceptions
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'ai-exceptions.log')
    })
  ]
});

// Add convenience methods for common AI operations
logger.modelInference = (modelName, message, duration) => {
  logger.info(message, { 
    module: 'models', 
    operation: modelName, 
    duration 
  });
};

logger.dataProcessing = (operation, message, duration) => {
  logger.info(message, { 
    module: 'data', 
    operation, 
    duration 
  });
};

logger.prediction = (modelName, message, accuracy) => {
  logger.info(message, { 
    module: 'prediction', 
    operation: modelName, 
    accuracy 
  });
};

module.exports = logger; 