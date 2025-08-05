#!/usr/bin/env node

/**
 * Security Headers Verification Script
 * 
 * This script verifies that the application is correctly implementing security headers
 * by making requests to the application endpoints and checking the response headers.
 */

const https = require('https');
const http = require('http');
const chalk = require('chalk');
const { URL } = require('url');

// Configuration
const config = {
  // Target URL to test (default: localhost)
  targetUrl: process.env.TARGET_URL || 'http://localhost:3000',
  
  // Endpoints to test
  endpoints: [
    '/',
    '/api/health',
    '/api/docs',
  ],
  
  // Expected headers and their values (null means any non-empty value is acceptable)
  expectedHeaders: {
    'content-security-policy': null,
    'strict-transport-security': null,
    'x-content-type-options': 'nosniff',
    'x-frame-options': /^(DENY|SAMEORIGIN)$/i,
    'x-xss-protection': /^1(; mode=block)?$/i,
    'referrer-policy': /^(no-referrer|strict-origin-when-cross-origin)$/i,
    'permissions-policy': null,
  }
};

// Results tracking
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

/**
 * Make HTTP request and check headers
 */
async function checkEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = new URL(endpoint, config.targetUrl);
    const client = url.protocol === 'https:' ? https : http;
    
    console.log(chalk.blue(`\nChecking ${url.toString()}`));
    
    const req = client.get(url, (res) => {
      const headers = res.headers;
      const endpointResult = {
        endpoint: url.toString(),
        statusCode: res.statusCode,
        headers: headers,
        issues: []
      };
      
      // Check if status code is successful
      if (res.statusCode < 200 || res.statusCode >= 400) {
        endpointResult.issues.push({
          type: 'error',
          message: `Unexpected status code: ${res.statusCode}`
        });
        results.failed++;
      }
      
      // Check for expected headers
      for (const [header, expectedValue] of Object.entries(config.expectedHeaders)) {
        const headerValue = headers[header];
        
        if (!headerValue) {
          endpointResult.issues.push({
            type: 'error',
            message: `Missing header: ${header}`
          });
          results.failed++;
          continue;
        }
        
        // Validate header value if expected value is specified
        if (expectedValue !== null) {
          const isValid = expectedValue instanceof RegExp 
            ? expectedValue.test(headerValue) 
            : headerValue === expectedValue;
            
          if (!isValid) {
            endpointResult.issues.push({
              type: 'error',
              message: `Invalid value for ${header}: ${headerValue}. Expected: ${expectedValue}`
            });
            results.failed++;
          }
        } else {
          results.passed++;
        }
      }
      
      // Check for recommended headers that are not required
      const recommendedHeaders = {
        'cache-control': null,
        'clear-site-data': null,
        'cross-origin-embedder-policy': null,
        'cross-origin-opener-policy': null,
        'cross-origin-resource-policy': null,
      };
      
      for (const [header, _] of Object.entries(recommendedHeaders)) {
        if (!headers[header]) {
          endpointResult.issues.push({
            type: 'warning',
            message: `Recommended header not found: ${header}`
          });
          results.warnings++;
        }
      }
      
      // Add result to details
      results.details.push(endpointResult);
      resolve();
      
      // Print issues for this endpoint
      endpointResult.issues.forEach(issue => {
        if (issue.type === 'error') {
          console.log(chalk.red(`  ✖ ${issue.message}`));
        } else {
          console.log(chalk.yellow(`  ⚠ ${issue.message}`));
        }
      });
      
      if (endpointResult.issues.length === 0) {
        console.log(chalk.green('  ✓ All security headers are properly configured'));
      }
    });
    
    req.on('error', (error) => {
      console.log(chalk.red(`Error checking ${url.toString()}: ${error.message}`));
      results.failed++;
      results.details.push({
        endpoint: url.toString(),
        error: error.message,
        issues: [{
          type: 'error',
          message: `Connection error: ${error.message}`
        }]
      });
      resolve();
    });
    
    // Set timeout
    req.setTimeout(5000, () => {
      req.destroy();
      console.log(chalk.red(`Timeout checking ${url.toString()}`));
      results.failed++;
      results.details.push({
        endpoint: url.toString(),
        error: 'Request timed out',
        issues: [{
          type: 'error',
          message: 'Request timed out after 5 seconds'
        }]
      });
      resolve();
    });
  });
}

/**
 * Main function
 */
async function main() {
  console.log(chalk.bold.blue('Security Headers Verification'));
  console.log(chalk.blue('=========================='));
  console.log(chalk.blue(`Target: ${config.targetUrl}`));
  
  // Check each endpoint
  for (const endpoint of config.endpoints) {
    await checkEndpoint(endpoint);
  }
  
  // Print summary
  console.log(chalk.bold.blue('\nSummary'));
  console.log(chalk.blue('======='));
  console.log(chalk.green(`✓ Passed: ${results.passed}`));
  console.log(chalk.red(`✖ Failed: ${results.failed}`));
  console.log(chalk.yellow(`⚠ Warnings: ${results.warnings}`));
  
  // Exit with appropriate code
  if (results.failed > 0) {
    console.log(chalk.red('\nVerification failed. Please fix the issues above.'));
    process.exit(1);
  } else {
    console.log(chalk.green('\nVerification successful!'));
    if (results.warnings > 0) {
      console.log(chalk.yellow('Consider addressing the warnings for better security.'));
    }
    process.exit(0);
  }
}

// Run the script
main().catch(error => {
  console.error(chalk.red(`Unexpected error: ${error.message}`));
  process.exit(1);
}); 