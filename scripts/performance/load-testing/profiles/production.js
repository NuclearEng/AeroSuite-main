/**
 * Production Test Profile
 * 
 * This profile defines a more intensive load test configuration
 * suitable for production-like environments.
 * 
 * Task: TS354 - Load testing implementation
 */

module.exports = {
  // Basic configuration
  concurrentUsers: 100,
  testDurationSec: 120,
  targetUrl: 'http://localhost:5000',
  
  // Workers configuration
  workers: 4,
  
  // Endpoints to test (random selection during test)
  endpoints: [
    '/health',
    '/api/customers',
    '/api/suppliers',
    '/api/inspections',
    '/api/dashboard',
    '/api/reports',
    '/api/users',
    '/api/notifications'
  ],
  
  // Request configuration
  timeout: 15000, // 15 seconds
  headers: {
    'Accept': 'application/json',
    'X-Test-Profile': 'production'
  },
  
  // Test behavior
  warmupPeriodSec: 15,
  rampUpPeriodSec: 30,
  
  // Debugging
  debug: false
}; 