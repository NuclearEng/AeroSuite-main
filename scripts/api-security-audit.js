#!/usr/bin/env node

/**
 * API Security Audit Script
 * 
 * This script performs automated security checks on API endpoints to identify common
 * vulnerabilities and security misconfigurations.
 * 
 * It checks for:
 * 1. Missing authentication
 * 2. Improper authorization
 * 3. Injection vulnerabilities
 * 4. Missing security headers
 * 5. Rate limiting bypasses
 * 6. CORS misconfigurations
 * 7. Input validation weaknesses
 * 8. Data exposure risks
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { program } = require('commander');

// Define the program and options
program
  .name('api-security-audit')
  .description('Performs security audits on API endpoints')
  .version('1.0.0')
  .option('-t, --target <url>', 'Target API base URL', 'http://localhost:3000')
  .option('-o, --output <file>', 'Output file for the report', 'api-security-audit-report.json')
  .option('-a, --auth <token>', 'Authorization token for authenticated requests')
  .option('-e, --endpoints <file>', 'JSON file containing endpoint definitions')
  .option('-v, --verbose', 'Enable verbose output')
  .option('-s, --severity <level>', 'Minimum severity level to report (low, medium, high, critical)', 'low')
  .parse(process.argv);

const options = program.opts();
const API_BASE_URL = options.target;
const OUTPUT_FILE = options.output;
const AUTH_TOKEN = options.auth;
const VERBOSE = options.verbose;
const MIN_SEVERITY = options.severity;
const SEVERITY_LEVELS = ['low', 'medium', 'high', 'critical'];
const MIN_SEVERITY_INDEX = Math.max(0, SEVERITY_LEVELS.indexOf(MIN_SEVERITY));

// Create axios instance with defaults
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}
});

// Define security test categories
const testCategories = [
  'authentication',
  'authorization',
  'injection',
  'security-headers',
  'rate-limiting',
  'cors',
  'input-validation',
  'data-exposure'
];

// Load or create test endpoints
let endpoints = [];

if (options.endpoints && fs.existsSync(options.endpoints)) {
  try {
    endpoints = JSON.parse(fs.readFileSync(options.endpoints, 'utf8'));
    console.log(`Loaded ${endpoints.length} endpoints from ${options.endpoints}`);
  } catch (error) {
    console.error(`Error loading endpoints file: ${error.message}`);
    process.exit(1);
  }
} else {
  // Default test endpoints if not provided
  endpoints = [
    { method: 'GET', path: '/', auth: false, name: 'Root' },
    { method: 'GET', path: '/api/health', auth: false, name: 'Health Check' },
    { method: 'GET', path: '/api/users', auth: true, name: 'Get Users' },
    { method: 'POST', path: '/api/login', auth: false, name: 'Login', payload: { username: 'test', password: 'test' } },
    { method: 'GET', path: '/api/suppliers', auth: true, name: 'Get Suppliers' },
    { method: 'GET', path: '/api/customers', auth: true, name: 'Get Customers' },
    { method: 'GET', path: '/api/inspections', auth: true, name: 'Get Inspections' }
  ];
}

// Initialize results object
const results = {
  summary: {
    timestamp: new Date().toISOString(),
    target: API_BASE_URL,
    endpointsTested: endpoints.length,
    vulnerabilitiesFound: 0,
    severityCounts: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    },
    passedTests: 0,
    failedTests: 0
  },
  vulnerabilities: [],
  detailedResults: {}
};

/**
 * Test authentication security
 */
async function testAuthentication(endpoint) {
  const issues = [];
  
  if (endpoint.auth) {
    try {
      // Try accessing an authenticated endpoint without authentication
      const response = await api.request({
        method: endpoint.method,
        url: endpoint.path,
        headers: { Authorization: '' },
        validateStatus: () => true
      });
      
      if (response.status !== 401 && response.status !== 403) {
        issues.push({
          title: 'Missing Authentication Check',
          description: `Endpoint ${endpoint.method} ${endpoint.path} does not properly require authentication`,
          severity: 'critical',
          evidence: `Status code: ${response.status}`,
          remediation: 'Ensure all protected endpoints verify authentication tokens'
        });
      }
    } catch (error) {
      console.error(`Error testing authentication for ${endpoint.path}: ${error.message}`);
    }
  }
  
  return issues;
}

/**
 * Test authorization security
 */
async function testAuthorization(endpoint) {
  const issues = [];
  
  if (endpoint.auth && AUTH_TOKEN) {
    try {
      // Test for horizontal privilege escalation by adding user ID parameters
      const params = new URLSearchParams({ userId: '999999', admin: 'true' });
      const testUrl = endpoint.path.includes('?') 
        ? `${endpoint.path}&${params}`
        : `${endpoint.path}?${params}`;
      
      const response = await api.request({
        method: endpoint.method,
        url: testUrl,
        validateStatus: () => true
      });
      
      // If successful, check if the response contains data for the requested userId
      if (response.status === 200 && response.data && 
          (JSON.stringify(response.data).includes('999999') || 
           JSON.stringify(response.data).includes('admin'))) {
        issues.push({
          title: 'Potential Privilege Escalation',
          description: `Endpoint ${endpoint.method} ${endpoint.path} may allow parameter manipulation for privilege escalation`,
          severity: 'high',
          evidence: `Status code: ${response.status}, Response contains manipulated parameters`,
          remediation: 'Implement proper authorization checks on user context and role permissions'
        });
      }
    } catch (error) {
      console.error(`Error testing authorization for ${endpoint.path}: ${error.message}`);
    }
  }
  
  return issues;
}

/**
 * Test for injection vulnerabilities
 */
async function testInjection(endpoint) {
  const issues = [];
  
  if (endpoint.method === 'POST' || endpoint.method === 'PUT' || endpoint.method === 'PATCH') {
    try {
      // Test payloads
      const injectionPayloads = [
        { sql: "' OR 1=1; --" },
        { javascript: "<script>alert('XSS')</script>" },
        { nosql: { $gt: "" } }
      ];
      
      for (const payload of injectionPayloads) {
        const testPayload = { ...(endpoint.payload || {}), ...payload };
        const response = await api.request({
          method: endpoint.method,
          url: endpoint.path,
          data: testPayload,
          validateStatus: () => true
        });
        
        // Check if the injection was successful (this is simplified detection)
        if (response.status === 200 || response.status === 500) {
          const payloadType = Object.keys(payload)[0];
          issues.push({
            title: `Potential ${payloadType.toUpperCase()} Injection`,
            description: `Endpoint ${endpoint.method} ${endpoint.path} may be vulnerable to ${payloadType} injection`,
            severity: 'high',
            evidence: `Status code: ${response.status}, Payload: ${JSON.stringify(payload)}`,
            remediation: 'Implement proper input validation and parameterized queries'
          });
        }
      }
    } catch (error) {
      console.error(`Error testing injection for ${endpoint.path}: ${error.message}`);
    }
  }
  
  return issues;
}

/**
 * Test for security headers
 */
async function testSecurityHeaders(endpoint) {
  const issues = [];
  
  try {
    const response = await api.request({
      method: endpoint.method,
      url: endpoint.path,
      data: endpoint.payload,
      validateStatus: () => true
    });
    
    // Check for missing security headers
    const requiredHeaders = {
      'Strict-Transport-Security': 'medium',
      'X-Content-Type-Options': 'medium',
      'X-Frame-Options': 'medium',
      'X-XSS-Protection': 'low',
      'Content-Security-Policy': 'high',
      'Referrer-Policy': 'low'
    };
    
    for (const [header, severity] of Object.entries(requiredHeaders)) {
      if (!response.headers[header.toLowerCase()]) {
        issues.push({
          title: `Missing Security Header: ${header}`,
          description: `Endpoint ${endpoint.method} ${endpoint.path} is missing the ${header} security header`,
          severity: severity,
          evidence: `Headers: ${JSON.stringify(response.headers)}`,
          remediation: `Add the ${header} header to API responses`
        });
      }
    }
  } catch (error) {
    console.error(`Error testing security headers for ${endpoint.path}: ${error.message}`);
  }
  
  return issues;
}

/**
 * Test for rate limiting
 */
async function testRateLimiting(endpoint) {
  const issues = [];
  
  try {
    // Send multiple requests in quick succession
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(api.request({
        method: endpoint.method,
        url: endpoint.path,
        data: endpoint.payload,
        validateStatus: () => true
      }));
    }
    
    const responses = await Promise.all(requests);
    
    // Check if rate limiting headers are present
    const hasRateLimitHeaders = responses.some(response => 
      response.headers['x-ratelimit-limit'] || 
      response.headers['x-ratelimit-remaining'] || 
      response.headers['retry-after']
    );
    
    // Check if all requests succeeded without rate limiting
    const allSucceeded = responses.every(response => response.status < 400);
    
    if (!hasRateLimitHeaders && allSucceeded) {
      issues.push({
        title: 'Potential Missing Rate Limiting',
        description: `Endpoint ${endpoint.method} ${endpoint.path} may not implement rate limiting`,
        severity: 'medium',
        evidence: 'Multiple successive requests succeeded without rate limit headers',
        remediation: 'Implement rate limiting with appropriate headers'
      });
    }
  } catch (error) {
    console.error(`Error testing rate limiting for ${endpoint.path}: ${error.message}`);
  }
  
  return issues;
}

/**
 * Test CORS configuration
 */
async function testCORS(endpoint) {
  const issues = [];
  
  try {
    // Test preflight request
    const preflightResponse = await api.request({
      method: 'OPTIONS',
      url: endpoint.path,
      headers: {
        'Origin': 'https://malicious-site.com',
        'Access-Control-Request-Method': endpoint.method
      },
      validateStatus: () => true
    });
    
    // Check for overly permissive CORS
    const allowOrigin = preflightResponse.headers['access-control-allow-origin'];
    const allowCredentials = preflightResponse.headers['access-control-allow-credentials'];
    
    if (allowOrigin === '*' || allowOrigin === 'https://malicious-site.com') {
      const severity = allowCredentials === 'true' ? 'critical' : 'medium';
      issues.push({
        title: 'Permissive CORS Policy',
        description: `Endpoint ${endpoint.method} ${endpoint.path} has a permissive CORS policy`,
        severity: severity,
        evidence: `Allow-Origin: ${allowOrigin}, Allow-Credentials: ${allowCredentials}`,
        remediation: 'Restrict CORS to specific trusted origins and avoid using credentials with wildcard origins'
      });
    }
  } catch (error) {
    console.error(`Error testing CORS for ${endpoint.path}: ${error.message}`);
  }
  
  return issues;
}

/**
 * Test input validation
 */
async function testInputValidation(endpoint) {
  const issues = [];
  
  if (endpoint.method === 'POST' || endpoint.method === 'PUT' || endpoint.method === 'PATCH') {
    try {
      // Test with malformed data
      const testCases = [
        { type: 'Empty object', payload: {}, severity: 'low' },
        { type: 'Very long string', payload: { param: 'A'.repeat(10000) }, severity: 'medium' },
        { type: 'Unexpected types', payload: { id: { $ne: 1 } }, severity: 'high' }
      ];
      
      for (const testCase of testCases) {
        const response = await api.request({
          method: endpoint.method,
          url: endpoint.path,
          data: testCase.payload,
          validateStatus: () => true
        });
        
        // Check for 500 errors, which suggest poor validation
        if (response.status === 500) {
          issues.push({
            title: 'Insufficient Input Validation',
            description: `Endpoint ${endpoint.method} ${endpoint.path} may have insufficient input validation`,
            severity: testCase.severity,
            evidence: `Test: ${testCase.type}, Status code: ${response.status}`,
            remediation: 'Implement comprehensive input validation and sanitization'
          });
        }
      }
    } catch (error) {
      console.error(`Error testing input validation for ${endpoint.path}: ${error.message}`);
    }
  }
  
  return issues;
}

/**
 * Test for excessive data exposure
 */
async function testDataExposure(endpoint) {
  const issues = [];
  
  if (endpoint.method === 'GET' && endpoint.auth && AUTH_TOKEN) {
    try {
      const response = await api.request({
        method: endpoint.method,
        url: endpoint.path,
        validateStatus: () => true
      });
      
      if (response.status === 200 && response.data) {
        // Check for sensitive data patterns in the response
        const responseStr = JSON.stringify(response.data);
        const sensitivePatterns = [
          { pattern: /password/i, name: 'Passwords', severity: 'critical' },
          { pattern: /token|jwt|apikey/i, name: 'Authentication tokens', severity: 'critical' },
          { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, name: 'Email addresses', severity: 'medium' },
          { pattern: /\b\d{3}-\d{2}-\d{4}\b/, name: 'SSN', severity: 'critical' },
          { pattern: /\b(?:\d[ -]*?){13,16}\b/, name: 'Credit card numbers', severity: 'critical' }
        ];
        
        for (const { pattern, name, severity } of sensitivePatterns) {
          if (pattern.test(responseStr)) {
            issues.push({
              title: 'Sensitive Data Exposure',
              description: `Endpoint ${endpoint.method} ${endpoint.path} may expose sensitive ${name}`,
              severity: severity,
              evidence: `Response contains patterns matching ${name}`,
              remediation: 'Filter sensitive data from API responses'
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error testing data exposure for ${endpoint.path}: ${error.message}`);
    }
  }
  
  return issues;
}

/**
 * Run all security tests for an endpoint
 */
async function runSecurityTests(endpoint) {
  console.log(`\nTesting endpoint: ${endpoint.method} ${endpoint.path}`);
  
  const testFunctions = {
    'authentication': testAuthentication,
    'authorization': testAuthorization,
    'injection': testInjection,
    'security-headers': testSecurityHeaders,
    'rate-limiting': testRateLimiting,
    'cors': testCORS,
    'input-validation': testInputValidation,
    'data-exposure': testDataExposure
  };
  
  const endpointResults = {
    issues: [],
    passedTests: 0,
    failedTests: 0
  };
  
  for (const category of testCategories) {
    console.log(`  Running ${category} tests...`);
    
    try {
      const issues = await testFunctions[category](endpoint);
      
      if (issues.length > 0) {
        // Filter issues by minimum severity
        const relevantIssues = issues.filter(issue => 
          SEVERITY_LEVELS.indexOf(issue.severity) >= MIN_SEVERITY_INDEX
        );
        
        if (relevantIssues.length > 0) {
          endpointResults.issues.push(...relevantIssues);
          endpointResults.failedTests++;
          
          for (const issue of relevantIssues) {
            results.summary.vulnerabilitiesFound++;
            results.summary.severityCounts[issue.severity]++;
            
            if (VERBOSE) {
              console.log(`    ❌ Found ${issue.severity} issue: ${issue.title}`);
            }
          }
        } else {
          endpointResults.passedTests++;
          if (VERBOSE) {
            console.log(`    ✅ No ${MIN_SEVERITY} or higher issues found`);
          }
        }
      } else {
        endpointResults.passedTests++;
        if (VERBOSE) {
          console.log(`    ✅ No issues found`);
        }
      }
    } catch (error) {
      console.error(`  Error running ${category} tests: ${error.message}`);
    }
  }
  
  // Add this endpoint's results to the overall results
  results.detailedResults[`${endpoint.method} ${endpoint.path}`] = endpointResults;
  results.summary.passedTests += endpointResults.passedTests;
  results.summary.failedTests += endpointResults.failedTests;
  
  // Add vulnerabilities to the main list
  for (const issue of endpointResults.issues) {
    results.vulnerabilities.push({
      endpoint: `${endpoint.method} ${endpoint.path}`,
      ...issue
    });
  }
  
  console.log(`  Completed testing with ${endpointResults.issues.length} issues found`);
}

/**
 * Run the security audit
 */
async function runSecurityAudit() {
  console.log(`\n🔒 Starting API Security Audit on ${API_BASE_URL}`);
  console.log(`🔍 Testing ${endpoints.length} endpoints with minimum severity: ${MIN_SEVERITY}\n`);
  
  // Test each endpoint
  for (const endpoint of endpoints) {
    await runSecurityTests(endpoint);
  }
  
  // Write results to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
  
  // Print summary
  console.log('\n📊 Audit Summary:');
  console.log(`  Endpoints tested: ${results.summary.endpointsTested}`);
  console.log(`  Tests passed: ${results.summary.passedTests}`);
  console.log(`  Tests failed: ${results.summary.failedTests}`);
  console.log(`  Vulnerabilities found: ${results.summary.vulnerabilitiesFound}`);
  console.log('  Severity breakdown:');
  for (const severity of SEVERITY_LEVELS) {
    if (SEVERITY_LEVELS.indexOf(severity) >= MIN_SEVERITY_INDEX) {
      console.log(`    - ${severity}: ${results.summary.severityCounts[severity]}`);
    }
  }
  
  console.log(`\n📝 Full report saved to: ${OUTPUT_FILE}`);
  
  // Return non-zero exit code if vulnerabilities were found
  if (results.summary.vulnerabilitiesFound > 0) {
    console.log('\n❌ Security audit found vulnerabilities');
    return 1;
  } else {
    console.log('\n✅ Security audit passed');
    return 0;
  }
}

// Run the audit and exit with the appropriate code
runSecurityAudit()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  }); 