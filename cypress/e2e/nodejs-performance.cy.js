describe('Node.js Performance Tests', () => {
  beforeEach(() => {
    // Check Node.js environment before running tests
    cy.task('checkNodejsHealth').then((isHealthy) => {
      if (!isHealthy) {
        cy.log('⚠️ Node.js environment is not healthy. Some tests may fail.');
      }
    });
  });

  describe('Worker Threads Performance', () => {
    it('should verify worker threads are available and functioning', () => {
      cy.task('getWorkerThreadsStatus').then((status) => {
        expect(status).to.be.an('object');
        expect(status.available).to.be.true;
        expect(status.threadPoolSize).to.be.a('number');
        expect(status.activeThreads).to.be.a('number');
      });
    });

    it('should test CPU-intensive operations with worker threads', () => {
      cy.task('testWorkerThreadPerformance').then((results) => {
        expect(results).to.be.an('object');
        expect(results.duration).to.be.a('number');
        expect(results.threadCount).to.be.a('number');
        expect(results.memoryUsage).to.be.an('object');
        
        // Performance assertions
        expect(results.duration).to.be.lessThan(5000); // Should complete within 5 seconds
        expect(results.memoryUsage.heapUsed).to.be.lessThan(100 * 1024 * 1024); // Less than 100MB
      });
    });

    it('should verify SharedArrayBuffer functionality', () => {
      cy.task('testSharedArrayBuffer').then((results) => {
        expect(results).to.be.an('object');
        expect(results.supported).to.be.true;
        expect(results.transferTime).to.be.a('number');
        expect(results.transferTime).to.be.lessThan(100); // Should be fast
      });
    });
  });

  describe('Cluster Module Performance', () => {
    it('should verify cluster configuration and health', () => {
      cy.task('getClusterStatus').then((status) => {
        expect(status).to.be.an('object');
        expect(status.workerCount).to.be.a('number');
        expect(status.activeWorkers).to.be.a('number');
        expect(status.workerHealth).to.be.an('array');
        
        // All workers should be healthy
        status.workerHealth.forEach(worker => {
          expect(worker.healthy).to.be.true;
          expect(worker.memoryUsage).to.be.lessThan(200 * 1024 * 1024); // Less than 200MB
        });
      });
    });

    it('should test load balancing across workers', () => {
      cy.task('testLoadBalancing').then((results) => {
        expect(results).to.be.an('object');
        expect(results.requestDistribution).to.be.an('object');
        expect(results.averageResponseTime).to.be.a('number');
        expect(results.averageResponseTime).to.be.lessThan(100); // Less than 100ms
        
        // Requests should be distributed across workers
        const distribution = results.requestDistribution;
        Object.values(distribution).forEach(count => {
          expect(count).to.be.greaterThan(0);
        });
      });
    });

    it('should verify worker restart functionality', () => {
      cy.task('testWorkerRestart').then((results) => {
        expect(results).to.be.an('object');
        expect(results.restartTime).to.be.a('number');
        expect(results.restartTime).to.be.lessThan(5000); // Should restart within 5 seconds
        expect(results.workerRecovered).to.be.true;
      });
    });
  });

  describe('Async Hooks and Performance Monitoring', () => {
    it('should verify async hooks are tracking operations correctly', () => {
      cy.task('getAsyncHooksStatus').then((status) => {
        expect(status).to.be.an('object');
        expect(status.activeAsyncOperations).to.be.a('number');
        expect(status.asyncOperationTypes).to.be.an('array');
        expect(status.memoryLeakDetected).to.be.false;
      });
    });

    it('should test AsyncLocalStorage for request context', () => {
      cy.task('testAsyncLocalStorage').then((results) => {
        expect(results).to.be.an('object');
        expect(results.contextPreserved).to.be.true;
        expect(results.contextIsolation).to.be.true;
        expect(results.performanceImpact).to.be.lessThan(10); // Less than 10ms overhead
      });
    });

    it('should verify performance hooks are working', () => {
      cy.task('getPerformanceHooksStatus').then((status) => {
        expect(status).to.be.an('object');
        expect(status.httpRequestDuration).to.be.an('object');
        expect(status.eventLoopLag).to.be.a('number');
        expect(status.eventLoopLag).to.be.lessThan(100); // Less than 100ms lag
        expect(status.garbageCollection).to.be.an('object');
      });
    });
  });

  describe('Memory and Resource Management', () => {
    it('should verify memory usage is within acceptable limits', () => {
      cy.task('getMemoryUsage').then((usage) => {
        expect(usage).to.be.an('object');
        expect(usage.heapUsed).to.be.lessThan(500 * 1024 * 1024); // Less than 500MB
        expect(usage.heapTotal).to.be.lessThan(1000 * 1024 * 1024); // Less than 1GB
        expect(usage.external).to.be.lessThan(100 * 1024 * 1024); // Less than 100MB
        expect(usage.arrayBuffers).to.be.lessThan(50 * 1024 * 1024); // Less than 50MB
      });
    });

    it('should test garbage collection performance', () => {
      cy.task('testGarbageCollection').then((results) => {
        expect(results).to.be.an('object');
        expect(results.gcDuration).to.be.a('number');
        expect(results.gcDuration).to.be.lessThan(100); // Less than 100ms
        expect(results.memoryFreed).to.be.a('number');
        expect(results.gcFrequency).to.be.a('number');
      });
    });

    it('should verify event loop performance', () => {
      cy.task('getEventLoopMetrics').then((metrics) => {
        expect(metrics).to.be.an('object');
        expect(metrics.lag).to.be.a('number');
        expect(metrics.lag).to.be.lessThan(50); // Less than 50ms lag
        expect(metrics.activeHandles).to.be.a('number');
        expect(metrics.activeRequests).to.be.a('number');
      });
    });
  });

  describe('Stream Performance', () => {
    it('should test stream processing performance', () => {
      cy.task('testStreamPerformance').then((results) => {
        expect(results).to.be.an('object');
        expect(results.readStreamSpeed).to.be.a('number');
        expect(results.writeStreamSpeed).to.be.a('number');
        expect(results.transformSpeed).to.be.a('number');
        expect(results.memoryUsage).to.be.lessThan(50 * 1024 * 1024); // Less than 50MB
      });
    });

    it('should verify backpressure handling', () => {
      cy.task('testBackpressureHandling').then((results) => {
        expect(results).to.be.an('object');
        expect(results.backpressureDetected).to.be.true;
        expect(results.handlingTime).to.be.a('number');
        expect(results.handlingTime).to.be.lessThan(1000); // Less than 1 second
        expect(results.dataLoss).to.be.false;
      });
    });
  });

  describe('Crypto Performance', () => {
    it('should test Web Crypto API performance', () => {
      cy.task('testWebCryptoPerformance').then((results) => {
        expect(results).to.be.an('object');
        expect(results.keyGenerationTime).to.be.a('number');
        expect(results.encryptionTime).to.be.a('number');
        expect(results.decryptionTime).to.be.a('number');
        expect(results.keyGenerationTime).to.be.lessThan(1000); // Less than 1 second
        expect(results.encryptionTime).to.be.lessThan(100); // Less than 100ms
        expect(results.decryptionTime).to.be.lessThan(100); // Less than 100ms
      });
    });

    it('should verify secure random number generation', () => {
      cy.task('testSecureRandomGeneration').then((results) => {
        expect(results).to.be.an('object');
        expect(results.generationTime).to.be.a('number');
        expect(results.generationTime).to.be.lessThan(50); // Less than 50ms
        expect(results.entropy).to.be.a('number');
        expect(results.entropy).to.be.greaterThan(7.5); // High entropy
      });
    });
  });

  describe('File System Performance', () => {
    it('should test file system operations performance', () => {
      cy.task('testFileSystemPerformance').then((results) => {
        expect(results).to.be.an('object');
        expect(results.readSpeed).to.be.a('number');
        expect(results.writeSpeed).to.be.a('number');
        expect(results.readSpeed).to.be.greaterThan(10 * 1024 * 1024); // More than 10MB/s
        expect(results.writeSpeed).to.be.greaterThan(5 * 1024 * 1024); // More than 5MB/s
      });
    });

    it('should verify async file operations', () => {
      cy.task('testAsyncFileOperations').then((results) => {
        expect(results).to.be.an('object');
        expect(results.concurrentOperations).to.be.a('number');
        expect(results.averageOperationTime).to.be.a('number');
        expect(results.averageOperationTime).to.be.lessThan(100); // Less than 100ms
        expect(results.errorRate).to.equal(0); // No errors
      });
    });
  });

  describe('Network Performance', () => {
    it('should test HTTP/HTTPS performance', () => {
      cy.task('testHttpPerformance').then((results) => {
        expect(results).to.be.an('object');
        expect(results.connectionTime).to.be.a('number');
        expect(results.requestTime).to.be.a('number');
        expect(results.connectionTime).to.be.lessThan(1000); // Less than 1 second
        expect(results.requestTime).to.be.lessThan(500); // Less than 500ms
      });
    });

    it('should verify TLS connection performance', () => {
      cy.task('testTlsPerformance').then((results) => {
        expect(results).to.be.an('object');
        expect(results.handshakeTime).to.be.a('number');
        expect(results.cipherStrength).to.be.a('number');
        expect(results.handshakeTime).to.be.lessThan(2000); // Less than 2 seconds
        expect(results.cipherStrength).to.be.greaterThan(128); // At least 128-bit
      });
    });
  });

  describe('Process and Child Process Performance', () => {
    it('should test child process spawning performance', () => {
      cy.task('testChildProcessPerformance').then((results) => {
        expect(results).to.be.an('object');
        expect(results.spawnTime).to.be.a('number');
        expect(results.communicationTime).to.be.a('number');
        expect(results.spawnTime).to.be.lessThan(1000); // Less than 1 second
        expect(results.communicationTime).to.be.lessThan(100); // Less than 100ms
      });
    });

    it('should verify process monitoring', () => {
      cy.task('getProcessMetrics').then((metrics) => {
        expect(metrics).to.be.an('object');
        expect(metrics.cpuUsage).to.be.an('object');
        expect(metrics.memoryUsage).to.be.an('object');
        expect(metrics.uptime).to.be.a('number');
        expect(metrics.cpuUsage.user).to.be.lessThan(100); // Less than 100% CPU
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should test error handling performance', () => {
      cy.task('testErrorHandling').then((results) => {
        expect(results).to.be.an('object');
        expect(results.errorHandlingTime).to.be.a('number');
        expect(results.recoveryTime).to.be.a('number');
        expect(results.errorHandlingTime).to.be.lessThan(100); // Less than 100ms
        expect(results.recoveryTime).to.be.lessThan(1000); // Less than 1 second
      });
    });

    it('should verify uncaught exception handling', () => {
      cy.task('testUncaughtExceptionHandling').then((results) => {
        expect(results).to.be.an('object');
        expect(results.exceptionCaught).to.be.true;
        expect(results.gracefulShutdown).to.be.true;
        expect(results.cleanupTime).to.be.a('number');
        expect(results.cleanupTime).to.be.lessThan(5000); // Less than 5 seconds
      });
    });
  });
}); 