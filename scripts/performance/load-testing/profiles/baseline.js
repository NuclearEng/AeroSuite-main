/**
 * Baseline Test Profile
 * 
 * This profile defines the default configuration for load testing.
 * It provides sensible defaults for most parameters.
 * 
 * Task: TS354 - Load testing implementation
 */

module.exports = {
  // Basic configuration
  concurrentUsers: 10,
  testDurationSec: 30,
  targetUrl: 'http://localhost:5000',
  
  // Workers configuration
  workers: 2,
  
  // Endpoints to test (random selection during test)
  endpoints: [
    '/health',
    '/api/customers',
    '/api/suppliers',
    '/api/inspections',
    '/api/dashboard'
  ],
  
  // Request configuration
  timeout: 10000, // 10 seconds
  headers: {
    'Accept': 'application/json',
    'X-Test-Profile': 'baseline'
  },
  
  // Test behavior
  warmupPeriodSec: 5,
  rampUpPeriodSec: 0,
  
  // Debugging
  debug: false
}; 