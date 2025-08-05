/**
 * @task TS008 - Client error reporting to server
 * @task TS376 - API versioning strategy implementation
 * @task TS378 - Advanced user permissions management
 * @task TS379 - Customer feedback collection system
 * @task RF017 - Standardize API contracts
 * @task RF019 - Create comprehensive API documentation
 * @task RF050 - Implement model serving endpoints
 * @task RF051 - Create feature engineering pipeline
 * @task RF052 - Add model registry
 * @task RF053 - Set up containerized training environments
 * @task RF054 - Implement experiment tracking
 * @task RF055 - Add automated model evaluation
 * @task RF056 - Create CI/CD pipeline for models
 * @task RF057 - Implement performance metrics tracking
 * @task RF058 - Add data drift detection
 */
const express = require('express');
const router = express.Router();

// Import API versioning middleware
const { apiVersionMiddleware, versionRoute } = require('../middleware/api-version.middleware');
const { API_VERSIONS, getDefaultVersion } = require('../config/apiVersions');

// Import API documentation service
const apiDocumentationService = require('../services/apiDocumentation.service');

// Import Swagger documentation middleware
const SwaggerDocsMiddleware = require('../middleware/swagger-docs.middleware');
const swaggerDocs = new SwaggerDocsMiddleware();

// Import versioned route modules
const v1Routes = require('./v1');
const v2Routes = require('./v2');

// Import API versioning routes
const apiVersioningRoutes = require('./api-versioning.routes');

// Import advanced permissions routes
const advancedPermissionsRoutes = require('./advancedPermissions.routes');

// Import feedback routes
const feedbackRoutes = require('./feedback.routes');

// Import route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const supplierRoutes = require('./supplier.routes');
const customerRoutes = require('./customer.routes');
const inspectionRoutes = require('./inspection.routes');
const notificationRoutes = require('./notification.routes');
const documentRoutes = require('./document.routes');
const reportRoutes = require('./report.routes');
const adminRoutes = require('./admin.routes');
const monitoringRoutes = require('./monitoring.routes');
const riskAssessmentRoutes = require('./risk-assessment.routes');
const supplierAuditRoutes = require('./supplierAudit.routes');
const dimensionalAccuracyRoutes = require('./dimensionalAccuracy.routes');
const cacheRoutes = require('./cache.routes');
const privacyRoutes = require('./privacy.routes');
const featureFlagsRoutes = require('./featureFlags.routes');
const exportRoutes = require('./export.routes');
const exampleRoutes = require('./example.routes'); // Import example routes
const mlRoutes = require('./ml.routes'); // Import ML routes
const featureEngineeringRoutes = require('./feature-engineering.routes'); // Import feature engineering routes
const modelRegistryRoutes = require('./model-registry.routes'); // Import model registry routes
const trainingEnvironmentsRoutes = require('./training-environments.routes'); // Import training environments routes
const experimentTrackingRoutes = require('./experiment-tracking.routes'); // Import experiment tracking routes
const modelEvaluationRoutes = require('./model-evaluation.routes'); // Import model evaluation routes
const modelPerformanceRoutes = require('./model-performance.routes'); // Import model performance routes
const dataDriftRoutes = require('./data-drift.routes');
// Other route imports...

// Apply API versioning middleware
router.use(apiVersionMiddleware);

// Mount API version documentation endpoint
router.use('/', (req, res, next) => {
  if (req.path === '/') {
    const versions = Object.entries(API_VERSIONS).map(([version, config]) => {
      return {
        version,
        url: config.basePath,
        isDefault: config.isDefault,
        releaseDate: config.releaseDate,
        deprecationDate: config.deprecationDate,
        sunsetDate: config.sunsetDate,
        status: config.isActive
          ? config.deprecationDate && new Date() > config.deprecationDate
            ? 'deprecated'
            : 'active'
          : 'inactive'
      };
    });

    return res.json({
      success: true,
      message: 'AeroSuite API',
      currentVersion: req.apiVersion || getDefaultVersion(),
      supportedVersions: versions,
      documentation: '/api/docs',
      versionsEndpoint: '/api/versions'
    });
  }
  next();
});

// Mount API documentation
router.use('/docs', swaggerDocs.getRouter());

// Mount API versioning routes
router.use('/versions', apiVersioningRoutes);

// Mount advanced permissions routes
router.use('/permissions/advanced', advancedPermissionsRoutes);

// Mount feedback routes
router.use('/feedback', feedbackRoutes);

// Mount versioned routes
router.use('/v1', versionRoute(['v1']), v1Routes);
router.use('/v2', versionRoute(['v2']), v2Routes);

// Mount versioned routes
router.use('/v1', versionRoute(['v1']), authRoutes);
router.use('/v1', versionRoute(['v1']), userRoutes);
router.use('/v1', versionRoute(['v1']), supplierRoutes);
router.use('/v1', versionRoute(['v1']), customerRoutes);
router.use('/v1', versionRoute(['v1']), inspectionRoutes);
router.use('/v1', versionRoute(['v1']), notificationRoutes);
router.use('/v1', versionRoute(['v1']), documentRoutes);
router.use('/v1', versionRoute(['v1']), reportRoutes);
router.use('/v1', versionRoute(['v1']), adminRoutes);
router.use('/v1', versionRoute(['v1']), monitoringRoutes);
router.use('/v1', versionRoute(['v1']), riskAssessmentRoutes);
router.use('/v1', versionRoute(['v1']), supplierAuditRoutes);
router.use('/v1', versionRoute(['v1']), dimensionalAccuracyRoutes);
router.use('/v1', versionRoute(['v1']), cacheRoutes);
router.use('/v1', versionRoute(['v1']), privacyRoutes);
router.use('/v1', versionRoute(['v1']), featureFlagsRoutes);
router.use('/v1', versionRoute(['v1']), exportRoutes);
router.use('/v1', versionRoute(['v1']), feedbackRoutes);
router.use('/v1', versionRoute(['v1']), exampleRoutes); // Mount example routes for v1
router.use('/v1', versionRoute(['v1']), mlRoutes); // Mount ML routes for v1
router.use('/v1', versionRoute(['v1']), featureEngineeringRoutes); // Mount feature engineering routes for v1
router.use('/v1', versionRoute(['v1']), modelRegistryRoutes); // Mount model registry routes for v1
router.use('/v1', versionRoute(['v1']), trainingEnvironmentsRoutes); // Mount training environments routes for v1
router.use('/v1', versionRoute(['v1']), experimentTrackingRoutes); // Mount experiment tracking routes for v1
router.use('/v1', versionRoute(['v1']), modelEvaluationRoutes); // Mount model evaluation routes for v1
router.use('/v1', versionRoute(['v1']), modelPerformanceRoutes); // Mount model performance routes for v1
router.use('/v1', versionRoute(['v1']), dataDriftRoutes);

// Mount versioned routes
router.use('/v2', versionRoute(['v2']), authRoutes);
router.use('/v2', versionRoute(['v2']), userRoutes);
router.use('/v2', versionRoute(['v2']), supplierRoutes);
router.use('/v2', versionRoute(['v2']), customerRoutes);
router.use('/v2', versionRoute(['v2']), inspectionRoutes);
router.use('/v2', versionRoute(['v2']), notificationRoutes);
router.use('/v2', versionRoute(['v2']), documentRoutes);
router.use('/v2', versionRoute(['v2']), reportRoutes);
router.use('/v2', versionRoute(['v2']), adminRoutes);
router.use('/v2', versionRoute(['v2']), monitoringRoutes);
router.use('/v2', versionRoute(['v2']), riskAssessmentRoutes);
router.use('/v2', versionRoute(['v2']), supplierAuditRoutes);
router.use('/v2', versionRoute(['v2']), dimensionalAccuracyRoutes);
router.use('/v2', versionRoute(['v2']), cacheRoutes);
router.use('/v2', versionRoute(['v2']), privacyRoutes);
router.use('/v2', versionRoute(['v2']), featureFlagsRoutes);
router.use('/v2', versionRoute(['v2']), exportRoutes);
router.use('/v2', versionRoute(['v2']), feedbackRoutes);
router.use('/v2', versionRoute(['v2']), exampleRoutes); // Mount example routes for v2
router.use('/v2', versionRoute(['v2']), mlRoutes); // Mount ML routes for v2
router.use('/v2', versionRoute(['v2']), featureEngineeringRoutes); // Mount feature engineering routes for v2
router.use('/v2', versionRoute(['v2']), modelRegistryRoutes); // Mount model registry routes for v2
router.use('/v2', versionRoute(['v2']), trainingEnvironmentsRoutes); // Mount training environments routes for v2
router.use('/v2', versionRoute(['v2']), experimentTrackingRoutes); // Mount experiment tracking routes for v2
router.use('/v2', versionRoute(['v2']), modelEvaluationRoutes); // Mount model evaluation routes for v2
router.use('/v2', versionRoute(['v2']), modelPerformanceRoutes); // Mount model performance routes for v2
router.use('/v2', versionRoute(['v2']), dataDriftRoutes);

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/customers', customerRoutes);
router.use('/inspections', inspectionRoutes);
router.use('/notifications', notificationRoutes);
router.use('/documents', documentRoutes);
router.use('/reports', reportRoutes);
router.use('/admin', adminRoutes);
router.use('/monitoring', monitoringRoutes);
router.use('/risk-assessment', riskAssessmentRoutes);
router.use('/supplier-audit', supplierAuditRoutes);
router.use('/dimensional-accuracy', dimensionalAccuracyRoutes);
router.use('/cache', cacheRoutes);
router.use('/privacy', privacyRoutes);
router.use('/feature-flags', featureFlagsRoutes);
router.use('/export', exportRoutes);
router.use('/examples', exampleRoutes); // Mount example routes for default version
router.use('/ml', mlRoutes); // Mount ML routes for default version
router.use('/feature-engineering', featureEngineeringRoutes); // Mount feature engineering routes for default version
router.use('/registry', modelRegistryRoutes); // Mount model registry routes for default version
router.use('/training-environments', trainingEnvironmentsRoutes); // Mount training environments routes for default version
router.use('/experiments', experimentTrackingRoutes); // Mount experiment tracking routes for default version
router.use('/evaluations', modelEvaluationRoutes); // Mount model evaluation routes for default version
router.use('/performance', modelPerformanceRoutes); // Mount model performance routes for default version
router.use('/drift', dataDriftRoutes);

// Support for base URL without version (uses default version)
router.use('/', (req, res, next) => {
  // Skip if the path already has a version prefix
  if (/^\/v\d+\//i.test(req.path)) {
    return next();
  }
  
  // Skip for special endpoints
  if (req.path.startsWith('/versions') || req.path.startsWith('/docs')) {
    return next();
  }
  
  // Otherwise, route to the default version
  const defaultVersion = getDefaultVersion();
  
  if (defaultVersion === 'v1') {
    return v1Routes(req, res, next);
  } else if (defaultVersion === 'v2') {
    return v2Routes(req, res, next);
  }
  
  // Fallback if no default version is configured
  next();
});

// Global documentation endpoint
router.get('/docs', (req, res) => {
  res.redirect('/api/docs/home');
});

// API documentation regeneration endpoint
router.post('/docs/regenerate', (req, res) => {
  try {
    // Regenerate API documentation
    apiDocumentationService.generateAllSpecs();
    
    res.json({
      success: true,
      message: 'API documentation regenerated successfully'
    });
  } catch (error) {
    console.error('Error regenerating API documentation', error);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate API documentation'
    });
  }
});

module.exports = router; 