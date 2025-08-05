// Import app and server
const { app, server } = require('./app');
const config = require('./config');
const logger = require('./infrastructure/logger');

// Start server
const PORT = config.port || 3000;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
}); 