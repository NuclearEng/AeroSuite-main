#!/usr/bin/env node

/**
 * API Security Check Script
 * 
 * This script performs automated checks for API security best practices
 * and generates a report of findings.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const axios = require('axios');
const chalk = require('chalk');
const ora = require('ora');
const { program } = require('commander');

// Configure CLI options
program
  .option('-u, --url <url>', 'Base URL of the API to test', 'http://localhost:5000')
  .option('-t, --token <token>', 'JWT token for authenticated endpoints')
  .option('-o, --output <file>', 'Output file for the report', 'api-security-report.json')
  .option('-v, --verbose', 'Enable verbose output', false)
  .option('-f, --full', 'Run full security scan (takes longer)', false)
  .parse(process.argv);

const options = program.opts();

// Initialize results object
const results = {
  timestamp: new Date().toISOString(),
  url: options.url,
  summary: {
    pass: 0,
    fail: 0,
    warn: 0,
    total: 0
  },
  tests: []
};

/**
 * Add a test result to the results object
 * @param {String} category - Test category
 * @param {String} name - Test name
 * @param {String} status - 'pass', 'fail', or 'warn'
 * @param {String} message - Test message
 * @param {Object} details - Additional test details
 */
function addResult(category, name, status, message, details = {}) {
  results.tests.push({
    category,
    name,
    status,
    message,
    details
  });
  
  results.summary[status]++;
  results.summary.total++;
  
  if (options.verbose) {
    const statusColor = status === 'pass' ? chalk.green : 
                        status === 'warn' ? chalk.yellow : chalk.red;
    console.log(`${statusColor(status.toUpperCase())}: ${category} - ${name}`);
    console.log(`  ${message}`);
    if (Object.keys(details).length > 0) {
      console.log('  Details:', details);
    }
    console.log();
  }
}

/**
 * Test security headers
 */
async function testSecurityHeaders() {
  const spinner = ora('Testing security headers').start();
  
  try {
    const response = await axios.get(options.url);
    const headers = response.headers;
    
    // Check Content-Security-Policy
    if (headers['content-security-policy']) {
      addResult('Headers', 'Content-Security-Policy', 'pass', 'Content-Security-Policy header is set', {
        value: headers['content-security-policy']
      });
    } else {
      addResult('Headers', 'Content-Security-Policy', 'fail', 'Content-Security-Policy header is missing');
    }
    
    // Check X-XSS-Protection
    if (headers['x-xss-protection']) {
      addResult('Headers', 'X-XSS-Protection', 'pass', 'X-XSS-Protection header is set', {
        value: headers['x-xss-protection']
      });
    } else {
      addResult('Headers', 'X-XSS-Protection', 'warn', 'X-XSS-Protection header is missing');
    }
    
    // Check X-Content-Type-Options
    if (headers['x-content-type-options']) {
      addResult('Headers', 'X-Content-Type-Options', 'pass', 'X-Content-Type-Options header is set', {
        value: headers['x-content-type-options']
      });
    } else {
      addResult('Headers', 'X-Content-Type-Options', 'fail', 'X-Content-Type-Options header is missing');
    }
    
    // Check Strict-Transport-Security
    if (headers['strict-transport-security']) {
      addResult('Headers', 'Strict-Transport-Security', 'pass', 'HSTS header is set', {
        value: headers['strict-transport-security']
      });
    } else {
      addResult('Headers', 'Strict-Transport-Security', 'fail', 'HSTS header is missing');
    }
    
    // Check X-Frame-Options
    if (headers['x-frame-options']) {
      addResult('Headers', 'X-Frame-Options', 'pass', 'X-Frame-Options header is set', {
        value: headers['x-frame-options']
      });
    } else {
      addResult('Headers', 'X-Frame-Options', 'fail', 'X-Frame-Options header is missing');
    }
    
    // Check Referrer-Policy
    if (headers['referrer-policy']) {
      addResult('Headers', 'Referrer-Policy', 'pass', 'Referrer-Policy header is set', {
        value: headers['referrer-policy']
      });
    } else {
      addResult('Headers', 'Referrer-Policy', 'warn', 'Referrer-Policy header is missing');
    }
    
    spinner.succeed('Security headers tested');
  } catch (error) {
    spinner.fail('Error testing security headers');
    addResult('Headers', 'Request Error', 'fail', 'Failed to test security headers', {
      error: error.message
    });
  }
}

/**
 * Test rate limiting
 */
async function testRateLimiting() {
  const spinner = ora('Testing rate limiting').start();
  
  try {
    // Make 10 rapid requests to test rate limiting
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(axios.get(`${options.url}/api/auth/login`, { validateStatus: () => true }));
    }
    
    const responses = await Promise.all(requests);
    const rateLimit = responses.some(r => r.status === 429);
    
    if (rateLimit) {
      addResult('Rate Limiting', 'API Rate Limiting', 'pass', 'Rate limiting is properly implemented');
    } else {
      addResult('Rate Limiting', 'API Rate Limiting', 'warn', 'Rate limiting may not be properly implemented');
    }
    
    spinner.succeed('Rate limiting tested');
  } catch (error) {
    spinner.fail('Error testing rate limiting');
    addResult('Rate Limiting', 'Request Error', 'fail', 'Failed to test rate limiting', {
      error: error.message
    });
  }
}

/**
 * Test authentication
 */
async function testAuthentication() {
  const spinner = ora('Testing authentication').start();
  
  try {
    // Test with missing token
    const noTokenResponse = await axios.get(`${options.url}/api/auth/me`, { validateStatus: () => true });
    
    if (noTokenResponse.status === 401) {
      addResult('Authentication', 'Missing Token', 'pass', 'Properly rejects requests with missing token');
    } else {
      addResult('Authentication', 'Missing Token', 'fail', 'Allows requests with missing token', {
        status: noTokenResponse.status
      });
    }
    
    // Test with invalid token
    const invalidTokenResponse = await axios.get(`${options.url}/api/auth/me`, { 
      headers: { Authorization: 'Bearer invalid.token.here' },
      validateStatus: () => true
    });
    
    if (invalidTokenResponse.status === 401) {
      addResult('Authentication', 'Invalid Token', 'pass', 'Properly rejects requests with invalid token');
    } else {
      addResult('Authentication', 'Invalid Token', 'fail', 'Allows requests with invalid token', {
        status: invalidTokenResponse.status
      });
    }
    
    // Test with expired token
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj3UFYzPUVaVF43FmMab6RlaQD8A9V8wFzzht-KQ';
    const expiredTokenResponse = await axios.get(`${options.url}/api/auth/me`, { 
      headers: { Authorization: `Bearer ${expiredToken}` },
      validateStatus: () => true
    });
    
    if (expiredTokenResponse.status === 401) {
      addResult('Authentication', 'Expired Token', 'pass', 'Properly rejects requests with expired token');
    } else {
      addResult('Authentication', 'Expired Token', 'fail', 'Allows requests with expired token', {
        status: expiredTokenResponse.status
      });
    }
    
    spinner.succeed('Authentication tested');
  } catch (error) {
    spinner.fail('Error testing authentication');
    addResult('Authentication', 'Request Error', 'fail', 'Failed to test authentication', {
      error: error.message
    });
  }
}

/**
 * Test input validation
 */
async function testInputValidation() {
  const spinner = ora('Testing input validation').start();
  
  try {
    // Test SQL injection
    const sqlInjectionResponse = await axios.get(`${options.url}/api/users?search=1'%20OR%20'1'='1`, { 
      validateStatus: () => true
    });
    
    if (sqlInjectionResponse.status === 403 || sqlInjectionResponse.status === 400) {
      addResult('Input Validation', 'SQL Injection', 'pass', 'API properly blocks SQL injection attempts');
    } else {
      addResult('Input Validation', 'SQL Injection', 'warn', 'API may be vulnerable to SQL injection', {
        status: sqlInjectionResponse.status
      });
    }
    
    // Test XSS
    const xssPayload = '<script>alert(1)</script>';
    const xssResponse = await axios.post(`${options.url}/api/auth/login`, { 
      email: xssPayload,
      password: 'password123'
    }, { validateStatus: () => true });
    
    if (xssResponse.status === 400 || xssResponse.status === 403) {
      addResult('Input Validation', 'XSS Protection', 'pass', 'API properly validates input against XSS');
    } else {
      addResult('Input Validation', 'XSS Protection', 'warn', 'API may be vulnerable to XSS', {
        status: xssResponse.status
      });
    }
    
    // Test invalid input
    const invalidInputResponse = await axios.post(`${options.url}/api/auth/login`, { 
      email: 'not-an-email',
      password: 'short'
    }, { validateStatus: () => true });
    
    if (invalidInputResponse.status === 400) {
      addResult('Input Validation', 'Invalid Input', 'pass', 'API properly validates input format');
    } else {
      addResult('Input Validation', 'Invalid Input', 'fail', 'API does not properly validate input format', {
        status: invalidInputResponse.status
      });
    }
    
    spinner.succeed('Input validation tested');
  } catch (error) {
    spinner.fail('Error testing input validation');
    addResult('Input Validation', 'Request Error', 'fail', 'Failed to test input validation', {
      error: error.message
    });
  }
}

/**
 * Test CORS configuration
 */
async function testCors() {
  const spinner = ora('Testing CORS configuration').start();
  
  try {
    const corsResponse = await axios.get(options.url, { 
      headers: { Origin: 'https://evil.com' },
      validateStatus: () => true
    });
    
    const corsHeaders = corsResponse.headers;
    
    if (corsHeaders['access-control-allow-origin'] === '*') {
      addResult('CORS', 'Access-Control-Allow-Origin', 'warn', 'CORS allows requests from any origin');
    } else if (corsHeaders['access-control-allow-origin']) {
      addResult('CORS', 'Access-Control-Allow-Origin', 'pass', 'CORS is properly restricted', {
        value: corsHeaders['access-control-allow-origin']
      });
    } else {
      addResult('CORS', 'Access-Control-Allow-Origin', 'warn', 'CORS headers are missing');
    }
    
    spinner.succeed('CORS configuration tested');
  } catch (error) {
    spinner.fail('Error testing CORS configuration');
    addResult('CORS', 'Request Error', 'fail', 'Failed to test CORS configuration', {
      error: error.message
    });
  }
}

/**
 * Full security scan using OWASP ZAP (if installed)
 */
async function fullSecurityScan() {
  const spinner = ora('Running full security scan with OWASP ZAP').start();
  
  try {
    // Check if ZAP is installed
    try {
      execSync('zap-cli --version', { stdio: 'ignore' });
    } catch (e) {
      spinner.warn('OWASP ZAP CLI not found, skipping full security scan');
      addResult('Full Scan', 'OWASP ZAP', 'warn', 'OWASP ZAP CLI not found, skipping full security scan');
      return;
    }
    
    // Run ZAP scan
    const reportFile = 'zap-scan-report.json';
    execSync(`zap-cli quick-scan -s all --ajax-spider -r ${reportFile} ${options.url}`, { stdio: 'ignore' });
    
    // Parse ZAP report
    const zapReport = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
    
    // Add ZAP results
    const alerts = zapReport.alerts || [];
    
    if (alerts.length === 0) {
      addResult('Full Scan', 'OWASP ZAP', 'pass', 'No vulnerabilities found in full security scan');
    } else {
      // Group alerts by risk
      const highRisks = alerts.filter(a => a.risk === 'High');
      const mediumRisks = alerts.filter(a => a.risk === 'Medium');
      const lowRisks = alerts.filter(a => a.risk === 'Low');
      
      if (highRisks.length > 0) {
        addResult('Full Scan', 'High Risk Vulnerabilities', 'fail', `Found ${highRisks.length} high risk vulnerabilities`, {
          vulnerabilities: highRisks.map(a => a.name)
        });
      }
      
      if (mediumRisks.length > 0) {
        addResult('Full Scan', 'Medium Risk Vulnerabilities', 'warn', `Found ${mediumRisks.length} medium risk vulnerabilities`, {
          vulnerabilities: mediumRisks.map(a => a.name)
        });
      }
      
      if (lowRisks.length > 0) {
        addResult('Full Scan', 'Low Risk Vulnerabilities', 'warn', `Found ${lowRisks.length} low risk vulnerabilities`, {
          vulnerabilities: lowRisks.map(a => a.name)
        });
      }
    }
    
    // Clean up
    fs.unlinkSync(reportFile);
    
    spinner.succeed('Full security scan completed');
  } catch (error) {
    spinner.fail('Error during full security scan');
    addResult('Full Scan', 'Error', 'fail', 'Failed to run full security scan', {
      error: error.message
    });
  }
}

/**
 * Run all security tests
 */
async function runTests() {
  console.log(chalk.blue.bold('\n🔒 API Security Check\n'));
  console.log(`Testing API at ${chalk.cyan(options.url)}\n`);
  
  await testSecurityHeaders();
  await testRateLimiting();
  await testAuthentication();
  await testInputValidation();
  await testCors();
  
  if (options.full) {
    await fullSecurityScan();
  }
  
  // Save results to file
  fs.writeFileSync(options.output, JSON.stringify(results, null, 2));
  
  // Print summary
  console.log(chalk.blue.bold('\nTest Results Summary:'));
  console.log(`✅ Passed: ${chalk.green(results.summary.pass)}`);
  console.log(`⚠️  Warnings: ${chalk.yellow(results.summary.warn)}`);
  console.log(`❌ Failed: ${chalk.red(results.summary.fail)}`);
  console.log(`📊 Total: ${results.summary.total}`);
  console.log(`\nFull report saved to: ${chalk.cyan(options.output)}`);
  
  if (results.summary.fail > 0) {
    console.log(chalk.red.bold('\n⚠️  Security issues found! Please review the report for details.'));
    process.exit(1);
  } else if (results.summary.warn > 0) {
    console.log(chalk.yellow.bold('\n⚠️  Security warnings found. Review the report for potential improvements.'));
    process.exit(0);
  } else {
    console.log(chalk.green.bold('\n✅ All security checks passed!'));
    process.exit(0);
  }
}

// Run all tests
runTests(); 