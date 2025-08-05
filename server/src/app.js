/**
 * Main application entry point
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { rateLimit } = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const path = require('path');
const cluster = require('./cluster');
const routes = require('./routes');
const globalErrorHandler = require('./middleware/global-error.middleware');
const { logSecurityEvent, SEC_EVENT_SEVERITY } = require('./utils/securityEventLogger');
const securityEventManagement = require('./services/securityEventManagement');
const threatDetection = require('./services/threatDetection');
const encryptionCore = require('./core/encryption');
const dataProtectionService = require('./services/data-protection.service');
const auditLoggingService = require('./services/audit-logging.service');
const auditLoggingMiddleware = require('./middleware/audit-logging.middleware');
const autoScalingOptimizer = require('./utils/autoScalingOptimizer');
const realtimeNotificationService = require('./services/realtime-notification.service');
const logger = require('./infrastructure/logger');
const config = require('./config');
const { enforceHTTPS } = require('./middleware/encryption.middleware');
const securityHeaders = require('./middleware/security-headers.middleware');
const configureCors = require('./middleware/cors.middleware');

// Create Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = socketIo(server, {
  cors: {
    origin: config.corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  },
  path: '/socket.io',
});

// Initialize real-time notification service
realtimeNotificationService.initialize(io);

// Apply CORS configuration
app.use(configureCors());

// Apply security headers
const securityHeadersMiddleware = securityHeaders();
securityHeadersMiddleware.forEach(middleware => app.use(middleware));

app.use(compression()); // Compress responses

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data sanitization
app.use(mongoSanitize()); // Against NoSQL query injection
app.use(xss()); // Against XSS
app.use(hpp()); // Prevent parameter pollution

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api', limiter);

// Cookie parser
app.use(cookieParser());

// Auto-scaling performance tracking
app.use(autoScalingOptimizer.requestTrackerMiddleware);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
}

// Request ID middleware
app.use((req, res, next) => {
  req.id = req.id || `req-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Trust proxy for secure cookies and HTTPS detection
app.set('trust proxy', 1);

// Enforce HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use(enforceHTTPS());
}

// Apply audit logging middleware
app.use(auditLoggingMiddleware);

// Routes
app.use('/api', routes);

// Add scaling metrics API endpoint
app.get('/api/internal/scaling-metrics', (req, res) => {
  res.json({
    metrics: autoScalingOptimizer.getMetrics(),
    scalingEfficiency: autoScalingOptimizer.getScalingEfficiency()
  });
});

// 404 handler - Convert to standardized error format
app.all('*', (req, res, next) => {
  const { NotFoundError } = require('./utils/errorHandler');
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server!`));
});

// Global error handler
app.use(globalErrorHandler);

// Initialize services
(async () => {
  try {
    // Initialize security event management
    await securityEventManagement.initialize();
    
    // Initialize threat detection system
    await threatDetection.initialize();
    
    // Initialize encryption core
    await encryptionCore.initialize();
    
    // Initialize data protection service
    await dataProtectionService.initialize();
    
    // Initialize audit logging service
    await auditLoggingService.initialize();
    
    // Initialize auto-scaling optimizer
    await autoScalingOptimizer.initialize();
    
    // Initialize real-time notification service
    await realtimeNotificationService.initialize(io);
    
    // Log application start
    logSecurityEvent(
      'SYSTEM',
      SEC_EVENT_SEVERITY.INFO,
      'Application started',
      { component: 'App', action: 'START' }
    );
  } catch (error) {
    console.error('Error initializing services:', error);
  }
})();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  try {
    // Shut down auto-scaling optimizer
    await autoScalingOptimizer.shutdown();
    
    // Shut down real-time notification service
    await realtimeNotificationService.shutdown();
    
    // Add any other cleanup
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
  }
});

// Export app and server
module.exports = { app, server }; 