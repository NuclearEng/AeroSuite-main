/**
 * Combined Infrastructure Tests
 * 
 * This test suite combines:
 * - Docker health and container tests
 * - NGINX unit tests
 * - Redis performance and integration tests
 * - Node.js performance tests
 */

describe('Docker Container Health', () => {
  it('should verify Docker health status', () => {
    cy.task('checkDockerHealth').then((result) => {
      expect(result.healthy).to.be.true;
      cy.log(`Docker health status: ${result.status}`);
    });
  });

  it('should check container status', () => {
    cy.task('getContainerStatus').then((containers) => {
      expect(containers).to.be.an('array');
      expect(containers.length).to.be.greaterThan(0);
      
      containers.forEach(container => {
        expect(container.status).to.be.oneOf(['running', 'exited', 'created']);
        cy.log(`Container ${container.name}: ${container.status}`);
      });
    });
  });

  it('should monitor container resources', () => {
    cy.task('getContainerResources').then((resources) => {
      expect(resources).to.be.an('array');
      
      resources.forEach(container => {
        expect(container.cpu).to.be.a('number');
        expect(container.memory).to.be.a('number');
        expect(container.name).to.be.a('string');
        
        cy.log(`Container ${container.name}: CPU ${container.cpu}%, Memory ${container.memory}MB`);
      });
    });
  });

  it('should verify container ports', () => {
    cy.task('getContainerPorts').then((ports) => {
      expect(ports).to.be.an('array');
      
      const requiredPorts = [3000, 5000, 5002, 27017, 6379];
      requiredPorts.forEach(port => {
        const found = ports.some(p => p.containerPort === port || p.hostPort === port);
        expect(found).to.be.true;
        cy.log(`Port ${port} is properly mapped`);
      });
    });
  });

  it('should check image versions', () => {
    cy.task('getImageVersions').then((images) => {
      expect(images).to.be.an('array');
      
      const requiredImages = ['node', 'mongodb', 'redis', 'nginx'];
      requiredImages.forEach(image => {
        const found = images.some(i => i.name.includes(image));
        expect(found).to.be.true;
        cy.log(`Image ${image} is present`);
      });
    });
  });
});

describe('NGINX Unit Tests', () => {
  it('should check NGINX health', () => {
    cy.task('checkNginxUnitHealth').then((result) => {
      expect(result.healthy).to.be.true;
      cy.log(`NGINX health status: ${result.status}`);
    });
  });

  it('should verify NGINX configuration', () => {
    cy.task('getUnitConfiguration').then((config) => {
      expect(config).to.be.an('object');
      expect(config.listeners).to.be.an('object');
      expect(config.applications).to.be.an('object');
      cy.log('NGINX configuration is valid');
    });
  });

  it('should test HTTP requests through NGINX', () => {
    cy.task('testUnitHttpLoader').then((result) => {
      expect(result.success).to.be.true;
      expect(result.responseTime).to.be.lessThan(1000); // 1 second
      cy.log(`HTTP request through NGINX: ${result.success ? 'Success' : 'Failed'}`);
    });
  });

  it('should verify SSL configuration', () => {
    cy.task('getUnitSSLConfig').then((sslConfig) => {
      expect(sslConfig.enabled).to.be.true;
      expect(sslConfig.certificate).to.be.a('string');
      expect(sslConfig.protocols).to.include('TLSv1.2');
      cy.log('SSL configuration is valid');
    });
  });

  it('should test HTTPS connection', () => {
    cy.task('testHTTPSConnection').then((result) => {
      expect(result.success).to.be.true;
      expect(result.statusCode).to.equal(200);
      cy.log('HTTPS connection is working');
    });
  });
});

describe('Redis Performance & Integration', () => {
  it('should check Redis health', () => {
    cy.task('checkRedisHealth').then((result) => {
      expect(result.healthy).to.be.true;
      cy.log(`Redis health status: ${result.status}`);
    });
  });

  it('should test Redis connection', () => {
    cy.task('testRedisConnection').then((result) => {
      expect(result.connected).to.be.true;
      expect(result.connectionTime).to.be.lessThan(1000); // 1 second
      cy.log(`Redis connection time: ${result.connectionTime}ms`);
    });
  });

  it('should test Redis ping', () => {
    cy.task('testRedisPing').then((result) => {
      expect(result.success).to.be.true;
      expect(result.responseTime).to.be.lessThan(100); // 100ms
      cy.log(`Redis ping response time: ${result.responseTime}ms`);
    });
  });

  it('should test Redis set/get operations', () => {
    cy.task('testRedisSetGet').then((result) => {
      expect(result.success).to.be.true;
      expect(result.setTime).to.be.lessThan(100); // 100ms
      expect(result.getTime).to.be.lessThan(100); // 100ms
      cy.log(`Redis set time: ${result.setTime}ms, get time: ${result.getTime}ms`);
    });
  });

  it('should test Redis cache hit rate', () => {
    cy.task('testRedisCacheHitRate').then((result) => {
      expect(result.hitRate).to.be.greaterThan(0.8); // 80%
      cy.log(`Redis cache hit rate: ${result.hitRate * 100}%`);
    });
  });

  it('should test Redis memory usage', () => {
    cy.task('getRedisMemoryUsage').then((result) => {
      expect(result.usedMemory).to.be.a('number');
      expect(result.maxMemory).to.be.a('number');
      expect(result.usedMemory).to.be.lessThan(result.maxMemory);
      cy.log(`Redis memory usage: ${result.usedMemory}MB / ${result.maxMemory}MB`);
    });
  });
});

describe('Node.js Performance', () => {
  it('should check Node.js health', () => {
    cy.task('checkNodejsHealth').then((result) => {
      expect(result.healthy).to.be.true;
      cy.log(`Node.js health status: ${result.status}`);
    });
  });

  it('should test worker threads performance', () => {
    cy.task('testWorkerThreadPerformance').then((result) => {
      expect(result.success).to.be.true;
      expect(result.executionTime).to.be.lessThan(5000); // 5 seconds
      cy.log(`Worker threads execution time: ${result.executionTime}ms`);
    });
  });

  it('should check cluster status', () => {
    cy.task('getClusterStatus').then((result) => {
      expect(result.workers).to.be.an('array');
      expect(result.workers.length).to.be.greaterThan(0);
      cy.log(`Node.js cluster workers: ${result.workers.length}`);
    });
  });

  it('should test load balancing', () => {
    cy.task('testLoadBalancing').then((result) => {
      expect(result.success).to.be.true;
      expect(result.distribution).to.be.an('object');
      cy.log('Load balancing is working properly');
    });
  });

  it('should get memory usage', () => {
    cy.task('getMemoryUsage').then((result) => {
      expect(result.heapUsed).to.be.a('number');
      expect(result.heapTotal).to.be.a('number');
      expect(result.rss).to.be.a('number');
      expect(result.heapUsed).to.be.lessThan(result.heapTotal);
      cy.log(`Node.js memory usage: ${result.heapUsed}MB / ${result.heapTotal}MB`);
    });
  });

  it('should test event loop metrics', () => {
    cy.task('getEventLoopMetrics').then((result) => {
      expect(result.latency).to.be.a('number');
      expect(result.latency).to.be.lessThan(100); // 100ms
      cy.log(`Event loop latency: ${result.latency}ms`);
    });
  });
});
