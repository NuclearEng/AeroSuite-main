// Import app and server
const { app, server } = require('./app');
const config = require('./config');
const logger = require('./infrastructure/logger');

// Start server
const PORT = config.port;

// Add error handling for server startup
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use. Please choose a different port.`);
  } else {
    logger.error(`Error starting server: ${error.message}`);
  }
  process.exit(1);
});

// Start listening for requests
server.listen(PORT, config.host, () => {
  logger.info(`Server running on ${config.host}:${PORT}`);
  logger.info(`Environment: ${config.env}`);
  logger.info(`API Version: ${config.apiVersion}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
  
  // Force shutdown after timeout
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
}); 