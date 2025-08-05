/**
 * Stress Test Profile
 * 
 * This profile defines a high-load stress test configuration
 * designed to identify system breaking points.
 * 
 * Task: TS354 - Load testing implementation
 */

module.exports = {
  // Basic configuration
  concurrentUsers: 200,
  testDurationSec: 300,
  targetUrl: 'http://localhost:5000',
  
  // Workers configuration
  workers: 8,
  
  // Endpoints to test (random selection during test)
  endpoints: [
    '/health',
    '/api/customers',
    '/api/suppliers',
    '/api/inspections',
    '/api/dashboard',
    '/api/reports',
    '/api/users',
    '/api/notifications',
    '/api/risk-assessments',
    '/api/supplier-audits'
  ],
  
  // Request configuration
  timeout: 30000, // 30 seconds
  headers: {
    'Accept': 'application/json',
    'X-Test-Profile': 'stress'
  },
  
  // Test behavior
  warmupPeriodSec: 30,
  rampUpPeriodSec: 60,
  
  // Debugging
  debug: true
}; 