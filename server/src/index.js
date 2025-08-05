const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const cluster = require('cluster');
const cookieParser = require('cookie-parser');
const { logger } = require('./utils/logger');

// Load environment variables
dotenv.config();

// Import error handler
const { errorHandler, NotFoundError } = require('./utils/errorHandler');

// Import health check system
const healthCheck = require('./utils/healthCheck');
const { monitorDiskSpace, checkBackupStatus, checkServiceHealth } = require('./monitoring/health-check');

// Import worker manager
const workerManager = require('./utils/worker-manager');

// Import distributed session management
const distributedSession = require('./middleware/distributedSession.middleware');

// Import auto-scaling management - RF039
const autoScaling = require('./middleware/auto-scaling.middleware');

// Import metrics
const { metricsMiddleware, metricsRouter, updateWorkerPoolMetrics } = require('./monitoring/metrics');

// Import API response optimizer
const responseOptimizer = require('./utils/responseOptimizer');

// Import API security middleware
const apiSecurity = require('./middleware/api-security.middleware');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const customerRoutes = require('./routes/customer.routes');
const supplierRoutes = require('./routes/supplier.routes');
const inspectionRoutes = require('./routes/inspection.routes');
const reportRoutes = require('./routes/report.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const monitoringRoutes = require('./routes/monitoring.routes');
const notificationRoutes = require('./routes/notification.routes');
const riskAssessmentRoutes = require('./routes/riskAssessment.routes');
const supplierAuditRoutes = require('./routes/supplierAudit.routes');
const adminRoutes = require('./routes/admin.routes');
const dimensionalAccuracyRoutes = require('./routes/dimensionalAccuracy.routes');
const cacheRoutes = require('./routes/cache.routes');
const privacyRoutes = require('./routes/privacy.routes');
const documentRoutes = require('./routes/document.routes');
const metricsRoutes = require('./routes/metrics.routes');
const featureFlagsRoutes = require('./routes/featureFlags.routes');

// Import health check manager - RF042
const { healthCheckManager } = require('./controllers/health-check.controller');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Request ID middleware
app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Custom logging format
morgan.token('id', (req) => req.id);
const logFormat = ':id :method :url :status :response-time ms - :res[content-length]';

// Cookie parser middleware
app.use(cookieParser());

// Initialize distributed session management
let sessionManagerPromise = distributedSession.initializeSessionManager();

// Initialize auto-scaling manager - RF039
let autoScalingManagerPromise = autoScaling.initializeAutoScalingManager();

// Session middleware for distributed sessions
app.use(distributedSession.createSessionMiddleware());

// Session security middleware
app.use(distributedSession.createSecurityMiddleware());

// Auto-scaling request tracking middleware - RF039
app.use(autoScaling.createRequestTrackerMiddleware());

// Apply security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://*"],
      connectSrc: ["'self'", "https://*"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"],
    },
  },
  xssFilter: true,
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  expectCt: {
    maxAge: 86400, // 24 hours in seconds
    enforce: true
  },
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  frameguard: { action: 'deny' },
  dnsPrefetchControl: { allow: false }
}));

// Set additional custom security headers
app.use((req, res, next) => {
  // Feature-Policy/Permissions-Policy header
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  
  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Cache-Control for static assets
  if (req.path.startsWith('/static/') || req.path.startsWith('/assets/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  next();
});

// Configure CORS with more secure options
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key', 'X-CSRF-Token'],
  exposedHeaders: ['X-Request-ID'],
  credentials: true,
  maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));

app.use(compression()); // Add compression for better performance
app.use(express.json({ limit: '10mb' })); // Increase payload limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(logFormat));

// Apply metrics middleware
app.use(metricsMiddleware);

// Apply response optimization
app.use(...responseOptimizer.createOptimizedApi({
  cache: {
    enabled: process.env.NODE_ENV === 'production' || process.env.ENABLE_API_CACHE === 'true',
    ttl: 300 // 5 minutes
  },
  compression: {
    enabled: true,
    threshold: 1024 // Only compress responses larger than 1KB
  },
  optimization: {
    transformResponse: true,
    enableETag: true
  }
}));

// Apply API security middleware to all routes
app.use(apiSecurity.apiEndpointSecurity);
app.use(apiSecurity.sqlInjectionProtection);
app.use(apiSecurity.protectSensitiveData);

// Apply rate limiting with different configurations for different endpoints
const standardLimiter = apiSecurity.createRateLimiter({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100 // 100 requests per 15 minutes
});

// More strict rate limiting for authentication endpoints
const authLimiter = apiSecurity.createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  }
});

// Apply standard rate limiting to all routes
app.use(standardLimiter);

// Set optimal MongoDB connection options for performance
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 100, // Adjust based on expected load
  minPoolSize: 5,   // Keep at least 5 connections open
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  heartbeatFrequencyMS: 30000, // Check server status every 30 seconds
  serverSelectionTimeoutMS: 30000, // Wait 30 seconds for server selection
  keepAlive: true,
  keepAliveInitialDelay: 300000, // 5 minutes
  bufferCommands: false, // Disable command buffering for better memory usage
  maxConnecting: 10, // Limit concurrent connection attempts
};

// Connect to MongoDB with startup validation
mongoose
  .connect(process.env.MONGODB_URI, mongooseOptions)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Wait for session manager initialization
    try {
      await sessionManagerPromise;
      console.log('Distributed session manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize distributed session manager:', error);
      if (process.env.NODE_ENV === 'production') {
        console.error('Session management is required in production, exiting process');
        process.exit(1);
      }
    }
    
    // Wait for auto-scaling manager initialization - RF039
    try {
      await autoScalingManagerPromise;
      console.log('Auto-scaling manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize auto-scaling manager:', error);
      // Don't exit on auto-scaling failure, it's not critical for operation
    }
    
    // Enable query monitoring in development for optimization
    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', (collectionName, methodName, ...args) => {
        console.log(`Mongoose: ${collectionName}.${methodName}(${JSON.stringify(args)})`);
      });
    }
    
    // Run health check validation
    const isHealthy = await healthCheck.validateStartupRequirements();
    if (!isHealthy && process.env.NODE_ENV === 'production') {
      console.error('Health check failed during startup, exiting process');
      process.exit(1);
    }
    
    // Start health check monitoring
    healthCheck.startPeriodicChecks(process.env.HEALTH_CHECK_INTERVAL || 60000);
    
    // Run database index optimization on startup if enabled
    if (process.env.OPTIMIZE_DB_ON_STARTUP === 'true') {
      try {
        const { optimizeAllIndexes } = require('./scripts/optimizeIndexes');
        await optimizeAllIndexes();
        console.log('Database indexes optimized during startup');
      } catch (err) {
        console.error('Failed to optimize database indexes:', err);
      }
    }
    
    // Run database migrations on startup if enabled
    if (process.env.RUN_MIGRATIONS_ON_STARTUP === 'true') {
      try {
        const migrationService = require('./services/migration.service');
        const result = await migrationService.runPendingMigrations();
        console.log(`Database migrations completed: ${result.migrationsRun} migration(s) applied`);
      } catch (err) {
        console.error('Failed to run database migrations:', err);
        if (process.env.NODE_ENV === 'production' && process.env.MIGRATIONS_REQUIRED === 'true') {
          console.error('Migrations are required in production but failed, exiting process');
          process.exit(1);
        }
      }
    }
    
    console.log('Server startup complete and healthy');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    // Exit in production, continue in development to allow troubleshooting
    if (process.env.NODE_ENV === 'production') {
      console.error('Critical error during startup, exiting process');
      process.exit(1);
    }
  });

// Store worker manager in global for health checks
global.workerManager = workerManager;

// Initialize worker threads if not in worker process
if (!cluster.isWorker) {
  workerManager.initialize();
  
  // Update worker metrics periodically
  setInterval(() => {
    const stats = workerManager.getStatus();
    updateWorkerPoolMetrics(stats);
  }, 10000);
}

// Metrics and monitoring routes
app.use('/api/monitoring', metricsRouter);
app.use('/api/monitoring', monitoringRoutes);

// API routes with appropriate security middleware
app.use('/api/auth', authLimiter, authRoutes); // Apply stricter rate limiting to auth routes
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/risk-assessments', riskAssessmentRoutes);
app.use('/api/supplier-audits', supplierAuditRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dimensional-accuracy', dimensionalAccuracyRoutes);
app.use('/api/cache', cacheRoutes);
app.use('/api/privacy', privacyRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/feature-flags', featureFlagsRoutes);

// External API routes with API key authentication
app.use('/api/v1/external', apiSecurity.apiKeyAuth, (req, res, next) => {
  // Apply API key authentication to external API endpoints
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  const status = healthCheckManager.getOverallStatus();
  const httpStatus = status === 'healthy' || status === 'degraded' ? 200 : 503;
  
  // Add additional metrics
  const systemInfo = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
    nodeVersion: process.version,
    pid: process.pid
  };
  
  if (!cluster.isWorker) {
    systemInfo.workers = workerManager.getStatus();
  }
  
  res.status(httpStatus).json({
    status,
    system: systemInfo,
    timestamp: new Date().toISOString()
  });
});

// Add API health endpoint for CI/CD workflows
app.get('/api/health', (req, res) => {
  const status = healthCheckManager.getOverallStatus();
  const httpStatus = status === 'healthy' || status === 'degraded' ? 200 : 503;
  
  // Simplified response for CI/CD
  res.status(httpStatus).json({
    status,
    message: 'API health check',
    timestamp: new Date().toISOString()
  });
});

// Advanced health monitoring endpoints
app.get('/health/disk', async (req, res) => {
  try {
    const diskInfo = await monitorDiskSpace();
    res.json(diskInfo);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve disk information',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.get('/health/backups', async (req, res) => {
  try {
    const backupStatus = await checkBackupStatus();
    res.json(backupStatus);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve backup information',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.get('/health/detailed', async (req, res) => {
  try {
    // Run all health checks
    await healthCheck.runAllChecks();
    const healthStatus = healthCheck.getStatus();
    
    // Get additional system information
    const [diskInfo, backupStatus] = await Promise.all([
      monitorDiskSpace(),
      checkBackupStatus()
    ]);
    
    // Gather environment info
    const environmentInfo = {
      nodeEnv: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    };
    
    // Get HTTP server stats if available
    const httpStats = server ? {
      connections: server.connections,
      maxConnections: server.maxConnections,
      timeout: server.timeout,
      keepAliveTimeout: server.keepAliveTimeout
    } : null;
    
    // Get auto-scaling status - RF039
    const autoScalingStatus = autoScaling.getMetrics();
    
    // Return comprehensive health report
    res.json({
      timestamp: new Date().toISOString(),
      status: healthStatus.status,
      components: healthStatus,
      disk: diskInfo,
      backups: backupStatus,
      environment: environmentInfo,
      http: httpStats,
      autoScaling: autoScalingStatus,
      pid: process.pid,
      isMaster: !cluster.isWorker,
      workers: !cluster.isWorker ? workerManager.getStatus() : null
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve detailed health information',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.get('/health/service', async (req, res) => {
  try {
    const serviceInfo = await checkServiceHealth();
    res.json(serviceInfo);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve service information',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 404 handler
app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.originalUrl} not found`));
});

// Global error handling middleware
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (PID: ${process.pid})`);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Received shutdown signal, starting graceful shutdown...');
  
  // Shutdown distributed session manager
  try {
    const sessionManager = require('./core/DistributedSessionManager').getInstance();
    if (sessionManager && sessionManager.initialized) {
      await sessionManager.shutdown();
      console.log('Distributed session manager shut down successfully');
    }
  } catch (error) {
    console.error('Error shutting down distributed session manager:', error);
  }
  
  // Shutdown auto-scaling manager - RF039
  try {
    await autoScaling.shutdown();
    console.log('Auto-scaling manager shut down successfully');
  } catch (error) {
    console.error('Error shutting down auto-scaling manager:', error);
  }
  
  // Stop health checks - RF042
  healthCheckManager.stopPeriodicChecks();
  
  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed.');
    
    // Close database connection
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed.');
      
      // Shutdown worker threads if not in worker process
      if (!cluster.isWorker) {
        workerManager.shutdown();
      }
      
      console.log('Shutdown complete, exiting process.');
      process.exit(0);
    });
  });
  
  // Force close after timeout
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Handle termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥');
  console.error(err.name, err.message, err.stack);
  
  // Don't exit in production, just log the error
  if (process.env.NODE_ENV === 'production') {
    console.error('Continuing execution despite unhandled rejection');
  } else {
    // In development, exit to highlight the issue
    gracefulShutdown();
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥');
  console.error(err.name, err.message, err.stack);
  
  // Always exit on uncaught exceptions
  gracefulShutdown();
});

module.exports = app; 