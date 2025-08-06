# Redis Best Practices for AeroSuite

This document outlines Redis best practices implemented in AeroSuite, based on the [Redis
documentation](https://redis.io/docs/latest/) and industry standards.

## Table of Contents

1. [Redis Overview](#redis-overview)
2. [Performance Optimization](#performance-optimization)
3. [Security Best Practices](#security-best-practices)
4. [Monitoring and Diagnostics](#monitoring-and-diagnostics)
5. [Data Management](#data-management)
6. [Integration Patterns](#integration-patterns)
7. [Testing and Validation](#testing-and-validation)
8. [Automation and CI/CD](#automation-and-cicd)
9. [Troubleshooting Guide](#troubleshooting-guide)

## Redis Overview

Redis is an in-memory data structure store that can be used as a database, cache, and message
broker. It provides:

- __In-Memory Storage__: Fast data access with persistence options
- __Data Structures__: Strings, Hashes, Lists, Sets, Sorted Sets, and more
- __Pub/Sub Messaging__: Real-time messaging capabilities
- __Lua Scripting__: Custom logic execution
- __Replication__: Master-slave replication for high availability
- __Clustering__: Horizontal scaling with Redis Cluster

### Key Benefits for AeroSuite

1. __Performance__: Sub-millisecond response times for caching
2. __Flexibility__: Multiple data structures for different use cases
3. __Reliability__: Persistence and replication options
4. __Scalability__: Horizontal scaling with clustering
5. __Real-time__: Pub/Sub for real-time features

## Performance Optimization

### Caching Strategies

Implement Redis caching for frequently accessed data:

```javascript
const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Cache frequently accessed data
async function cacheUserData(userId, userData) {
  await client.set(`user:${userId}`, JSON.stringify(userData), 'EX', 3600);
}

// Retrieve cached data
async function getUserData(userId) {
  const cached = await client.get(`user:${userId}`);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from database if not cached
  const userData = await fetchUserFromDatabase(userId);
  await cacheUserData(userId, userData);
  return userData;
}
```bash

### Memory Management

Configure Redis memory limits and eviction policies:

```bash
# Redis configuration for memory optimization
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```bash

### Connection Pooling

Use Redis connection pooling for better performance:

```javascript
const redis = require('redis');

// Create connection pool
const pool = redis.createPool({
  host: 'localhost',
  port: 6379,
  maxConnections: 10,
  minConnections: 2
});

// Use connection from pool
async function performRedisOperation() {
  const client = await pool.acquire();
  try {
    await client.set('key', 'value');
    const value = await client.get('key');
    return value;
  } finally {
    await pool.release(client);
  }
}
```bash

### Data Structure Optimization

Choose appropriate Redis data structures:

```javascript
// Use Hashes for object-like data
await client.hSet('user:123', {
  name: 'John Doe',
  email: 'john@example.com',
  lastLogin: new Date().toISOString()
});

// Use Lists for queues
await client.lPush('queue:emails', 'email1', 'email2', 'email3');
const email = await client.rPop('queue:emails');

// Use Sets for unique collections
await client.sAdd('user:123:roles', 'admin', 'user', 'moderator');
const roles = await client.sMembers('user:123:roles');

// Use Sorted Sets for ranked data
await client.zAdd('leaderboard', [
  { score: 100, value: 'player1' },
  { score: 200, value: 'player2' },
  { score: 150, value: 'player3' }
]);
const topPlayers = await client.zRange('leaderboard', 0, 2, { REV: true });
```bash

## Security Best Practices

### Authentication

Implement Redis authentication with strong passwords:

```bash
# Redis configuration for authentication
requirepass your-strong-password-here
```bash

```javascript
// Connect with authentication
const client = redis.createClient({
  url: 'redis://:password@localhost:6379'
});
```bash

### SSL/TLS Encryption

Use Redis SSL/TLS for encrypted connections:

```javascript
const client = redis.createClient({
  url: 'rediss://localhost:6379', // Note: rediss for SSL
  socket: {
    tls: true,
    rejectUnauthorized: false // For self-signed certificates
  }
});
```bash

### Access Control Lists (ACLs)

Configure Redis ACLs for fine-grained access control:

```bash
# Create ACL user
ACL SETUSER appuser on >apppassword ~app:* +@read +@write +@admin

# Use ACL in application
const client = redis.createClient({
  url: 'redis://appuser:apppassword@localhost:6379'
});
```bash

### Network Security

Configure Redis to bind to specific interfaces:

```bash
# Redis configuration for network security
bind 127.0.0.1
protected-mode yes
port 6379
```bash

## Monitoring and Diagnostics

### Health Checks

Implement Redis health check endpoints:

```javascript
// Express health check endpoint
app.get('/api/health/redis', async (req, res) => {
  try {
    const client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    await client.connect();
    const ping = await client.ping();
    const info = await client.info('server');

    await client.quit();

    res.json({
      status: 'healthy',
      ping: ping,
      version: info.match(/redis_version:(.+)/)?.[1],
      uptime: info.match(/uptime_in_seconds:(.+)/)?.[1]
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```bash

### Metrics Collection

Use Redis INFO command for comprehensive metrics:

```javascript
async function getRedisMetrics() {
  const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  await client.connect();

  const info = await client.info();
  const lines = info.split('\n');

  const metrics = {
    memory: {},
    stats: {},
    clients: {},
    replication: {}
  };

  lines.forEach(line => {
    if (line.startsWith('used_memory:')) {
      metrics.memory.used = parseInt(line.split(':')[1]);
    } else if (line.startsWith('total_commands_processed:')) {
      metrics.stats.totalCommands = parseInt(line.split(':')[1]);
    } else if (line.startsWith('connected_clients:')) {
      metrics.clients.connected = parseInt(line.split(':')[1]);
    } else if (line.startsWith('role:')) {
      metrics.replication.role = line.split(':')[1];
    }
  });

  await client.quit();
  return metrics;
}
```bash

### Logging

Configure Redis logging for debugging:

```bash
# Redis logging configuration
loglevel notice
logfile /var/log/redis/redis-server.log
```bash

```javascript
// Application-level Redis logging
const logger = require('./logger');

client.on('connect', () => {
  logger.info('Redis client connected');
});

client.on('error', (err) => {
  logger.error('Redis client error:', err);
});

client.on('ready', () => {
  logger.info('Redis client ready');
});
```bash

## Data Management

### Persistence Configuration

Configure Redis RDB and AOF persistence:

```bash
# Redis persistence configuration
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec
```bash

### Backup Strategies

Implement automated Redis backup procedures:

```bash
#!/bin/bash
# Redis backup script

BACKUP_DIR="/backup/redis"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Perform background save
redis-cli bgsave

# Wait for save to complete
while redis-cli info persistence | grep -q "rdb_bgsave_in_progress:1"; do
  sleep 1
done

# Copy RDB file
cp /var/lib/redis/dump.rdb "$BACKUP_DIR/redis_backup_$DATE.rdb"

# Compress backup
gzip "$BACKUP_DIR/redis_backup_$DATE.rdb"

echo "Redis backup completed: $BACKUP_DIR/redis_backup_$DATE.rdb.gz"
```bash

### Replication Setup

Configure Redis master-slave replication:

```bash
# Master Redis configuration
bind 0.0.0.0
port 6379

# Slave Redis configuration
bind 0.0.0.0
port 6380
slaveof 127.0.0.1 6379
```bash

### Clustering

Implement Redis Cluster for horizontal scaling:

```bash
# Redis Cluster configuration
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 5000
```bash

## Integration Patterns

### Session Management

Use Redis for session storage:

```javascript
const session = require('express-session');
const RedisStore = require('connect-redis').default;

const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 _ 60 _ 60 * 1000 // 24 hours
  }
}));
```bash

### Caching Layer

Implement application-level caching:

```javascript
// Cache middleware
async function cacheMiddleware(req, res, next) {
  const key = `cache:${req.originalUrl}`;

  try {
    const cached = await client.get(key);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Store original send method
    const originalSend = res.json;

    // Override send method to cache response
    res.json = function(data) {
      client.setex(key, 300, JSON.stringify(data)); // Cache for 5 minutes
      return originalSend.call(this, data);
    };

    next();
  } catch (error) {
    next();
  }
}
```bash

### Rate Limiting

Implement API rate limiting with Redis:

```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

const limiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => client.call(...args)
  }),
  windowMs: 15 _ 60 _ 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```bash

### Feature Flags

Use Redis for feature flag management:

```javascript
class FeatureFlags {
  constructor() {
    this.client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
  }

  async isEnabled(featureName, userId = null) {
    const key = `feature:${featureName}`;
    const flag = await this.client.get(key);

    if (!flag) return false;

    const flagData = JSON.parse(flag);

    // Check if feature is enabled globally
    if (!flagData.enabled) return false;

    // Check user-specific rules
    if (userId && flagData.users) {
      return flagData.users.includes(userId);
    }

    return flagData.enabled;
  }

  async setFlag(featureName, enabled, options = {}) {
    const key = `feature:${featureName}`;
    const flagData = {
      enabled,
      ...options,
      updatedAt: new Date().toISOString()
    };

    await this.client.set(key, JSON.stringify(flagData));
  }
}
```bash

### Job Queues

Implement job queues with Redis:

```javascript
class JobQueue {
  constructor(queueName) {
    this.client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    this.queueName = queueName;
  }

  async addJob(jobData) {
    const job = {
      id: Date.now().toString(),
      data: jobData,
      createdAt: new Date().toISOString()
    };

    await this.client.lPush(this.queueName, JSON.stringify(job));
    return job.id;
  }

  async processJob(handler) {
    const jobData = await this.client.rPop(this.queueName);
    if (jobData) {
      const job = JSON.parse(jobData);
      await handler(job);
    }
  }
}

// Usage
const emailQueue = new JobQueue('email-queue');

// Add job
await emailQueue.addJob({
  to: 'user@example.com',
  subject: 'Welcome!',
  body: 'Welcome to our platform!'
});

// Process jobs
setInterval(async () => {
  await emailQueue.processJob(async (job) => {
    await sendEmail(job.data);
  });
}, 1000);
```bash

## Testing and Validation

### Unit Testing

Test Redis operations with proper mocking:

```javascript
const { jest } = require('@jest/globals');
const redis = require('redis');

// Mock Redis client
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    quit: jest.fn()
  }))
}));

describe('Redis Operations', () => {
  let client;

  beforeEach(() => {
    client = redis.createClient();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should cache user data', async () => {
    const userData = { id: 1, name: 'John' };

    client.set.mockResolvedValue('OK');
    client.get.mockResolvedValue(JSON.stringify(userData));

    await cacheUserData(1, userData);
    const cached = await getUserData(1);

    expect(client.set).toHaveBeenCalledWith(
      'user:1',
      JSON.stringify(userData),
      'EX',
      3600
    );
    expect(cached).toEqual(userData);
  });
});
```bash

### Performance Testing

Test Redis performance under load:

```javascript
const { performance } = require('perf_hooks');

async function testRedisPerformance() {
  const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  await client.connect();

  const startTime = performance.now();
  const operationsCount = 1000;
  let successfulOperations = 0;
  let failedOperations = 0;

  // Perform operations
  for (let i = 0; i < operationsCount; i++) {
    try {
      await client.set(`perf:${i}`, `value-${i}`);
      await client.get(`perf:${i}`);
      successfulOperations++;
    } catch (error) {
      failedOperations++;
    }
  }

  const endTime = performance.now();
  const duration = (endTime - startTime) / 1000; // seconds
  const operationsPerSecond = successfulOperations / duration;
  const averageLatency = duration / successfulOperations * 1000; // ms
  const errorRate = (failedOperations / operationsCount) * 100;

  // Clean up
  for (let i = 0; i < operationsCount; i++) {
    await client.del(`perf:${i}`);
  }

  await client.quit();

  return {
    operationsPerSecond,
    averageLatency,
    errorRate,
    totalOperations: operationsCount,
    successfulOperations,
    failedOperations,
    duration
  };
}
```bash

### Integration Testing

Test Redis integration with the application:

```javascript
describe('Redis Integration', () => {
  it('should handle session management', async () => {
    const sessionData = {
      userId: '123',
      username: 'testuser',
      lastAccess: new Date().toISOString()
    };

    // Test session creation
    await client.set('session:123', JSON.stringify(sessionData), 'EX', 3600);

    // Test session retrieval
    const retrieved = await client.get('session:123');
    const parsed = JSON.parse(retrieved);

    expect(parsed.userId).toBe('123');
    expect(parsed.username).toBe('testuser');
  });

  it('should handle caching', async () => {
    const testData = { id: 1, name: 'Test' };

    // Test cache set
    await client.set('cache:test', JSON.stringify(testData), 'EX', 300);

    // Test cache get
    const cached = await client.get('cache:test');
    const parsed = JSON.parse(cached);

    expect(parsed).toEqual(testData);
  });
});
```bash

## Automation and CI/CD

### Automation Agents

Our automation framework includes a dedicated Redis agent:

```typescript
// automation/agents/redisAgent.ts
export async function runRedisAgent(module: string) {
  // Provides Redis-specific testing strategies
  // Implements Redis best practices
  // Generates Redis testing recommendations
}
```bash

### CI/CD Integration

```yaml
# Example CI/CD pipeline
- name: Redis Test
  run: ./scripts/redis-testing-workflow.sh tests

- name: Redis Caching Test
  run: ./scripts/redis-testing-workflow.sh caching

- name: Redis Session Test
  run: ./scripts/redis-testing-workflow.sh sessions

- name: Redis Performance Test
  run: ./scripts/redis-testing-workflow.sh performance
```bash

### Automated Workflows

1. __Redis Installation__: Automated Redis installation and setup
2. __Configuration Management__: Dynamic configuration updates
3. __Performance Testing__: Automated performance validation
4. __Security Testing__: Authentication and encryption validation
5. __Integration Testing__: End-to-end Redis functionality testing

## Troubleshooting Guide

### Common Issues

#### Redis Connection Issues

```bash
# Check if Redis is running
redis-cli ping

# Check Redis logs
sudo tail -f /var/log/redis/redis-server.log

# Check Redis configuration
redis-cli config get bind
redis-cli config get port
```bash

#### Memory Issues

```bash
# Check Redis memory usage
redis-cli info memory

# Check memory policy
redis-cli config get maxmemory-policy

# Monitor memory usage
redis-cli --latency
```bash

#### Performance Issues

```bash
# Check Redis performance
redis-cli info stats

# Monitor commands
redis-cli monitor

# Check slow queries
redis-cli slowlog get 10
```bash

### Debugging Tools

#### Redis CLI

```bash
# Connect to Redis
redis-cli

# Get Redis info
INFO

# Monitor commands
MONITOR

# Check memory usage
INFO memory

# Check replication status
INFO replication
```bash

#### Redis Insight

Use Redis Insight for GUI-based monitoring:

```bash
# Install Redis Insight
docker run -d --name redisinsight -p 8001:8001 redislabs/redisinsight:latest
```bash

#### Performance Monitoring

```bash
# Monitor Redis performance
redis-cli --latency

# Check memory usage
redis-cli info memory | grep used_memory

# Monitor commands per second
redis-cli info stats | grep ops_per_sec
```bash

## Best Practices Summary

### Performance

1. __Use Appropriate Data Structures__: Choose the right Redis data structure for your use case
2. __Implement Caching__: Use Redis for frequently accessed data
3. __Configure Memory Limits__: Set proper memory limits and eviction policies
4. __Use Connection Pooling__: Implement connection pooling for better performance
5. __Monitor Performance__: Track Redis performance metrics

### Security

1. __Enable Authentication__: Use strong passwords for Redis authentication
2. __Implement SSL/TLS__: Use encrypted connections for sensitive data
3. __Configure ACLs__: Use Redis ACLs for fine-grained access control
4. __Network Security__: Bind Redis to specific interfaces
5. __Monitor Access__: Track Redis access patterns and security events

### Monitoring

1. __Health Checks__: Implement Redis health check endpoints
2. __Metrics Collection__: Use Redis INFO command for comprehensive metrics
3. __Logging__: Configure proper logging and log rotation
4. __Alerts__: Set up alerts for Redis performance and security issues
5. __Backup Monitoring__: Monitor backup and recovery procedures

### Data Management

1. __Configure Persistence__: Set up RDB and AOF persistence
2. __Implement Replication__: Use Redis replication for high availability
3. __Use Clustering__: Implement Redis Cluster for horizontal scaling
4. __Backup Strategy__: Implement automated backup procedures
5. __Recovery Testing__: Test backup and recovery procedures regularly

## Integration with AeroSuite

### Module-Specific Testing

Each AeroSuite module has specific Redis testing requirements:

- __Login Module__: Redis session management and authentication caching
- __Reports Module__: Redis caching for report data and generation queues
- __Settings Module__: Redis for user preferences and feature flags
- __Suppliers Module__: Redis for supplier data caching and search indexing

### Automation Integration

Our Redis testing integrates with:

- __Cypress E2E Tests__: Redis performance and integration validation
- __Automation Agents__: Redis-specific strategies and recommendations
- __CI/CD Pipeline__: Automated Redis testing workflows
- __Monitoring Systems__: Redis performance and health monitoring

### Reporting

Comprehensive reports are generated including:

- __Performance Metrics__: Redis caching and session management performance
- __Security Scan Results__: Authentication and encryption validation
- __Integration Test Results__: Application integration with Redis
- __Memory Usage Reports__: Redis memory optimization and monitoring

## Conclusion

This Redis best practices implementation ensures:

1. __Superior Performance__: Fast caching and session management with sub-millisecond response times
2. __Enhanced Security__: Authentication, encryption, and access control
3. __Comprehensive Monitoring__: Built-in metrics and health checks
4. __Flexible Data Management__: Multiple data structures and persistence options
5. __Robust Integration__: Seamless application integration with Redis

The integration with Redis provides a powerful caching and data management environment with:

- __Performance Optimization__: Fast in-memory data access and caching
- __Security Features__: Authentication, encryption, and access control
- __Monitoring Capabilities__: Built-in metrics and health checks
- __Data Management__: Persistence, replication, and clustering
- __Real-time Features__: Pub/Sub messaging and real-time data

For more information, refer to the [Redis documentation](https://redis.io/docs/latest/).
