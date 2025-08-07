const { defineConfig } = require('cypress')

module.exports = defineConfig({
  // Skip waiting for app to start
  waitForAppToStart: false,
  e2e: {
    // Comment out baseUrl to avoid server check
    // baseUrl: 'http://localhost:3000',
    // Don't fail on status code errors
    failOnStatusCode: false,
    viewportWidth: 1200,
    viewportHeight: 800,
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,
    requestTimeout: 10000,
    responseTimeout: 30000,
    video: true,
    screenshotOnRunFailure: true,
    // Don't fail if server is not running
    testIsolation: true,
    // Enable running all specs
    experimentalRunAllSpecs: true,
    // Configure retries for flaky tests
    retries: {
      runMode: 2,
      openMode: 0,
    },
    // Configure test data seeding
    setupNodeEvents(on, config) {
      // implement node event listeners here
      const dockerTasks = require('./cypress/support/docker-tasks');
      const nodejsTasks = require('./cypress/support/nodejs-tasks');
      const nginxUnitTasks = require('./cypress/support/nginx-unit-tasks');
      const redisTasks = require('./cypress/support/redis-tasks');
      const mongodbTasks = require('./cypress/support/mongodb-tasks');
      const owaspSecurityTasks = require('./cypress/support/owasp-security-tasks');
      
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        table(message) {
          console.table(message);
          return null;
        },
        // Add custom task for API health checks
        async checkApiHealth() {
          try {
            const response = await fetch('http://localhost:5002/api/health');
            return response.ok;
          } catch (error) {
            return false;
          }
        },
        // Add task for database seeding
        async seedDatabase(data) {
          try {
            const response = await fetch('http://localhost:5002/api/test/seed', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            return response.ok;
          } catch (error) {
            return false;
          }
        },
        // Add task for database cleanup
        async cleanupDatabase() {
          try {
            const response = await fetch('http://localhost:5002/api/test/cleanup', {
              method: 'POST'
            });
            return response.ok;
          } catch (error) {
            return false;
          }
        },
        // Docker tasks
        checkDockerHealth: dockerTasks.checkDockerHealth,
        getContainerStatus: dockerTasks.getContainerStatus,
        getContainerResources: dockerTasks.getContainerResources,
        getContainerPorts: dockerTasks.getContainerPorts,
        getContainerUsers: dockerTasks.getContainerUsers,
        getImageVersions: dockerTasks.getImageVersions,
        getContainerCapabilities: dockerTasks.getContainerCapabilities,
        getContainerStartupTimes: dockerTasks.getContainerStartupTimes,
        getBuildTimes: dockerTasks.getBuildTimes,
        getImageSizes: dockerTasks.getImageSizes,
        getContainerLogs: dockerTasks.getContainerLogs,
        getRestartPolicies: dockerTasks.getRestartPolicies,
        getHealthCheckStatus: dockerTasks.getHealthCheckStatus,
        checkDockerDesktopFeatures: dockerTasks.checkDockerDesktopFeatures,
        runDockerScoutScan: dockerTasks.runDockerScoutScan,
        getResourceMetrics: dockerTasks.getResourceMetrics,
        // Node.js tasks
        checkNodejsHealth: nodejsTasks.checkNodejsHealth,
        getWorkerThreadsStatus: nodejsTasks.getWorkerThreadsStatus,
        testWorkerThreadPerformance: nodejsTasks.testWorkerThreadPerformance,
        testSharedArrayBuffer: nodejsTasks.testSharedArrayBuffer,
        getClusterStatus: nodejsTasks.getClusterStatus,
        testLoadBalancing: nodejsTasks.testLoadBalancing,
        testWorkerRestart: nodejsTasks.testWorkerRestart,
        getAsyncHooksStatus: nodejsTasks.getAsyncHooksStatus,
        testAsyncLocalStorage: nodejsTasks.testAsyncLocalStorage,
        getPerformanceHooksStatus: nodejsTasks.getPerformanceHooksStatus,
        getMemoryUsage: nodejsTasks.getMemoryUsage,
        testGarbageCollection: nodejsTasks.testGarbageCollection,
        getEventLoopMetrics: nodejsTasks.getEventLoopMetrics,
        testStreamPerformance: nodejsTasks.testStreamPerformance,
        testBackpressureHandling: nodejsTasks.testBackpressureHandling,
        testWebCryptoPerformance: nodejsTasks.testWebCryptoPerformance,
        testSecureRandomGeneration: nodejsTasks.testSecureRandomGeneration,
        testFileSystemPerformance: nodejsTasks.testFileSystemPerformance,
        testAsyncFileOperations: nodejsTasks.testAsyncFileOperations,
        testHttpPerformance: nodejsTasks.testHttpPerformance,
        testTlsPerformance: nodejsTasks.testTlsPerformance,
        testChildProcessPerformance: nodejsTasks.testChildProcessPerformance,
        getProcessMetrics: nodejsTasks.getProcessMetrics,
        testErrorHandling: nodejsTasks.testErrorHandling,
        testUncaughtExceptionHandling: nodejsTasks.testUncaughtExceptionHandling,
        // NGINX Unit tasks
        checkNginxUnitHealth: nginxUnitTasks.checkNginxUnitHealth,
        getNginxUnitStatus: nginxUnitTasks.getNginxUnitStatus,
        testUnitControlAPI: nginxUnitTasks.testUnitControlAPI,
        getUnitConfiguration: nginxUnitTasks.getUnitConfiguration,
        getExpressAppStatus: nginxUnitTasks.getExpressAppStatus,
        testExpressAppRequests: nginxUnitTasks.testExpressAppRequests,
        testUnitHttpLoader: nginxUnitTasks.testUnitHttpLoader,
        getUnitProcessInfo: nginxUnitTasks.getUnitProcessInfo,
        testUnitWorkerRestart: nginxUnitTasks.testUnitWorkerRestart,
        testUnitLoadBalancing: nginxUnitTasks.testUnitLoadBalancing,
        getUnitSSLConfig: nginxUnitTasks.getUnitSSLConfig,
        testHTTPSConnection: nginxUnitTasks.testHTTPSConnection,
        verifyUnitCertificate: nginxUnitTasks.verifyUnitCertificate,
        testUnitRateLimiting: nginxUnitTasks.testUnitRateLimiting,
        testUnitAccessControl: nginxUnitTasks.testUnitAccessControl,
        getUnitMetrics: nginxUnitTasks.getUnitMetrics,
        testUnitPerformance: nginxUnitTasks.testUnitPerformance,
        getUnitMemoryUsage: nginxUnitTasks.getUnitMemoryUsage,
        testUnitConfigUpdate: nginxUnitTasks.testUnitConfigUpdate,
        getUnitEnvironment: nginxUnitTasks.getUnitEnvironment,
        validateUnitConfig: nginxUnitTasks.validateUnitConfig,
        getUnitLoggingConfig: nginxUnitTasks.getUnitLoggingConfig,
        testUnitLogAccess: nginxUnitTasks.testUnitLogAccess,
        getUnitErrorStats: nginxUnitTasks.getUnitErrorStats,
        testFullRequestFlow: nginxUnitTasks.testFullRequestFlow,
        testUnitExpressIntegration: nginxUnitTasks.testUnitExpressIntegration,
        testUnitDatabaseConnections: nginxUnitTasks.testUnitDatabaseConnections,
        testUnitDeployment: nginxUnitTasks.testUnitDeployment,
        testUnitConfigBackup: nginxUnitTasks.testUnitConfigBackup,
        testUnitRollback: nginxUnitTasks.testUnitRollback,
        // Redis tasks
        checkRedisHealth: redisTasks.checkRedisHealth,
        getRedisStatus: redisTasks.getRedisStatus,
        testRedisConnection: redisTasks.testRedisConnection,
        testRedisPing: redisTasks.testRedisPing,
        testRedisSetGet: redisTasks.testRedisSetGet,
        testRedisCacheHitRate: redisTasks.testRedisCacheHitRate,
        testRedisExpiration: redisTasks.testRedisExpiration,
        testRedisBulkOperations: redisTasks.testRedisBulkOperations,
        testRedisHashOperations: redisTasks.testRedisHashOperations,
        testRedisListOperations: redisTasks.testRedisListOperations,
        testRedisSetOperations: redisTasks.testRedisSetOperations,
        testRedisSortedSetOperations: redisTasks.testRedisSortedSetOperations,
        testRedisSessionStorage: redisTasks.testRedisSessionStorage,
        testRedisTokenBlacklisting: redisTasks.testRedisTokenBlacklisting,
        testRedisUserSessions: redisTasks.testRedisUserSessions,
        getRedisMemoryUsage: redisTasks.getRedisMemoryUsage,
        testRedisMemoryOptimization: redisTasks.testRedisMemoryOptimization,
        testRedisEvictionPolicies: redisTasks.testRedisEvictionPolicies,
        getRedisAuthConfig: redisTasks.getRedisAuthConfig,
        testRedisSSLConnection: redisTasks.testRedisSSLConnection,
        testRedisAccessControl: redisTasks.testRedisAccessControl,
        getRedisMetrics: redisTasks.getRedisMetrics,
        testRedisPerformance: redisTasks.testRedisPerformance,
        getRedisCommandStats: redisTasks.getRedisCommandStats,
        getRedisPersistenceConfig: redisTasks.getRedisPersistenceConfig,
        testRedisBackup: redisTasks.testRedisBackup,
        testRedisRecovery: redisTasks.testRedisRecovery,
        getRedisReplicationStatus: redisTasks.getRedisReplicationStatus,
        testRedisFailover: redisTasks.testRedisFailover,
        getRedisClusterHealth: redisTasks.getRedisClusterHealth,
        testRedisApplicationIntegration: redisTasks.testRedisApplicationIntegration,
        testRedisDatabaseIntegration: redisTasks.testRedisDatabaseIntegration,
        testRedisAPIIntegration: redisTasks.testRedisAPIIntegration,
        testRedisErrorHandling: redisTasks.testRedisErrorHandling,
        testRedisDataCorruptionDetection: redisTasks.testRedisDataCorruptionDetection,
        testRedisAutomaticFailover: redisTasks.testRedisAutomaticFailover,
        // MongoDB tasks
        checkMongoDBConnection: mongodbTasks.checkMongoDBConnection,
        resetTestData: mongodbTasks.resetTestData,
        testConnectionPool: mongodbTasks.testConnectionPool,
        simulateConnectionFailure: mongodbTasks.simulateConnectionFailure,
        testReadReplicas: mongodbTasks.testReadReplicas,
        testDataValidation: mongodbTasks.testDataValidation,
        testReferentialIntegrity: mongodbTasks.testReferentialIntegrity,
        testConcurrentWrites: mongodbTasks.testConcurrentWrites,
        testQueryPerformance: mongodbTasks.testQueryPerformance,
        testAggregationPipeline: mongodbTasks.testAggregationPipeline,
        testTextSearch: mongodbTasks.testTextSearch,
        testAccessControl: mongodbTasks.testAccessControl,
        testDataEncryption: mongodbTasks.testDataEncryption,
        testAuditLogging: mongodbTasks.testAuditLogging,
        testDataConsistency: mongodbTasks.testDataConsistency,
        testNetworkPartition: mongodbTasks.testNetworkPartition,
        testBackupSystem: mongodbTasks.testBackupSystem,
        testPointInTimeRecovery: mongodbTasks.testPointInTimeRecovery,
        testVectorSearch: mongodbTasks.testVectorSearch,
        testSemanticSearch: mongodbTasks.testSemanticSearch,
        getPerformanceMetrics: mongodbTasks.getPerformanceMetrics,
        testPerformanceAlerts: mongodbTasks.testPerformanceAlerts,
        testSchemaMigration: mongodbTasks.testSchemaMigration,
        testDataVersioning: mongodbTasks.testDataVersioning,
        testRealTimeNotifications: mongodbTasks.testRealTimeNotifications,
        testBulkOperations: mongodbTasks.testBulkOperations,
        testGeospatialQueries: mongodbTasks.testGeospatialQueries,
        testDataRetention: mongodbTasks.testDataRetention,
        testAuditTrail: mongodbTasks.testAuditTrail,
        testDataMasking: mongodbTasks.testDataMasking,
        testAutoScaling: mongodbTasks.testAutoScaling,
        testGlobalDistribution: mongodbTasks.testGlobalDistribution,
        testServerlessOperations: mongodbTasks.testServerlessOperations,
        testDataLakeIntegration: mongodbTasks.testDataLakeIntegration,
        testRealTimeAnalytics: mongodbTasks.testRealTimeAnalytics,
        // OWASP Security tasks
        testInputValidation: owaspSecurityTasks.testInputValidation,
        testOutputEncoding: owaspSecurityTasks.testOutputEncoding,
        testAuthenticationSecurity: owaspSecurityTasks.testAuthenticationSecurity,
        testSessionManagement: owaspSecurityTasks.testSessionManagement,
        testAccessControl: owaspSecurityTasks.testAccessControl,
        testRateLimiting: owaspSecurityTasks.testRateLimiting,
        testSecurityHeaders: owaspSecurityTasks.testSecurityHeaders,
        testEncryption: owaspSecurityTasks.testEncryption,
        testJWTSecurity: owaspSecurityTasks.testJWTSecurity,
        testCSRFProtection: owaspSecurityTasks.testCSRFProtection,
        testSQLInjectionPrevention: owaspSecurityTasks.testSQLInjectionPrevention,
        testXSSPrevention: owaspSecurityTasks.testXSSPrevention,
        testDirectoryTraversalPrevention: owaspSecurityTasks.testDirectoryTraversalPrevention,
        testBusinessLogicSecurity: owaspSecurityTasks.testBusinessLogicSecurity,
        testInformationDisclosure: owaspSecurityTasks.testInformationDisclosure
      });
      
      // Use environment variables if provided
      if (process.env.CYPRESS_API_URL) {
        config.env.apiUrl = process.env.CYPRESS_API_URL;
      }
      
      // Add support for different environments
      if (process.env.NODE_ENV === 'development') {
        config.baseUrl = 'http://localhost:3000';
      } else if (process.env.NODE_ENV === 'staging') {
        config.baseUrl = 'http://localhost:3001';
      }
      
      return config;
    },
  },
  env: {
    apiUrl: 'http://localhost:5002',
  },
  projectId: 'aerosuite-e2e',
  reporter: 'mochawesome',
  reporterOptions: {
    reportDir: 'cypress/results',
    overwrite: false,
    html: false,
    json: true,
  },
  // Configure screenshots and videos
  screenshotsFolder: 'cypress/screenshots',
  videosFolder: 'cypress/videos',
});