/**
 * Enhanced health check utilities
 */

const mongoose = require('mongoose');

async function checkDatabase() {
  try {
    if (mongoose.connection.readyState !== 1) {
      return { status: 'unhealthy', message: 'Database not connected' };
    }
    
    // Ping the database
    await mongoose.connection.db.admin().ping();
    
    return { status: 'healthy', message: 'Database connection is healthy' };
  } catch (error) {
    return { status: 'unhealthy', message: error.message };
  }
}

async function checkRedis() {
  try {
    const redis = require('redis');
    const client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    await client.connect();
    await client.ping();
    await client.disconnect();
    
    return { status: 'healthy', message: 'Redis connection is healthy' };
  } catch (error) {
    // Redis is optional, so we return degraded instead of unhealthy
    return { status: 'degraded', message: 'Redis not available: ' + error.message };
  }
}

async function getHealthStatus() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    memory: {
      status: 'healthy',
      usage: process.memoryUsage()
    },
    uptime: process.uptime()
  };
  
  // Determine overall status
  const statuses = Object.values(checks)
    .filter(check => typeof check === 'object' && check.status)
    .map(check => check.status);
  
  let overallStatus = 'healthy';
  if (statuses.includes('unhealthy')) {
    overallStatus = 'unhealthy';
  } else if (statuses.includes('degraded')) {
    overallStatus = 'degraded';
  }
  
  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
    version: process.env.npm_package_version || '1.0.0'
  };
}

module.exports = {
  checkDatabase,
  checkRedis,
  getHealthStatus
};
