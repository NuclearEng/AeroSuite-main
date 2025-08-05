#!/usr/bin/env node

/**
 * Security Testing Script
 * 
 * This script performs automated security tests on the AeroSuite application.
 * It checks for common vulnerabilities and security misconfigurations.
 * 
 * Usage: node scripts/security-test.js [options]
 * Options:
 *   --full         Run a comprehensive security scan (slower)
 *   --quick        Run a quick security scan (default)
 *   --api-only     Only test API endpoints
 *   --report-file  Output report to specified file
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const axios = require('axios');
const commander = require('commander');

// Parse command line arguments
const program = new commander.Command();
program
  .option('--full', 'Run a comprehensive security scan')
  .option('--quick', 'Run a quick security scan (default)')
  .option('--api-only', 'Only test API endpoints')
  .option('--report-file <file>', 'Output report to specified file')
  .parse(process.argv);

const options = program.opts();
const isFullScan = options.full || false;
const isApiOnly = options.apiOnly || false;
const reportFile = options.reportFile || 'security-report.json';

console.log('Starting AeroSuite security tests...');
console.log(`Scan type: ${isFullScan ? 'Comprehensive' : 'Quick'}`);
console.log(`Scope: ${isApiOnly ? 'API Only' : 'Full Application'}`);

// Results storage
const results = {
  timestamp: new Date().toISOString(),
  summary: {
    criticalVulnerabilities: 0,
    highVulnerabilities: 0,
    mediumVulnerabilities: 0,
    lowVulnerabilities: 0,
    infoFindings: 0
  },
  findings: []
};

/**
 * Add a finding to the results
 */
function addFinding(severity, title, description, location, remediation) {
  const finding = {
    id: `SEC-${results.findings.length + 1}`,
    severity,
    title,
    description,
    location,
    remediation
  };
  
  results.findings.push(finding);
  
  switch (severity) {
    case 'critical':
      results.summary.criticalVulnerabilities++;
      break;
    case 'high':
      results.summary.highVulnerabilities++;
      break;
    case 'medium':
      results.summary.mediumVulnerabilities++;
      break;
    case 'low':
      results.summary.lowVulnerabilities++;
      break;
    case 'info':
      results.summary.infoFindings++;
      break;
  }
  
  console.log(`[${severity.toUpperCase()}] ${title}`);
}

/**
 * Check for dependency vulnerabilities
 */
async function checkDependencies() {
  console.log('\nChecking for vulnerable dependencies...');
  
  try {
    // Use npm audit for dependency checking
    const output = execSync('npm audit --json').toString();
    const auditResult = JSON.parse(output);
    
    if (auditResult.vulnerabilities) {
      const { critical, high, moderate, low } = auditResult.metadata.vulnerabilities;
      
      if (critical > 0) {
        addFinding(
          'critical',
          'Critical vulnerabilities in dependencies',
          `Found ${critical} critical vulnerabilities in project dependencies`,
          'package.json',
          'Run npm audit fix to automatically fix vulnerabilities, or update the affected packages manually'
        );
      }
      
      if (high > 0) {
        addFinding(
          'high',
          'High severity vulnerabilities in dependencies',
          `Found ${high} high severity vulnerabilities in project dependencies`,
          'package.json',
          'Run npm audit fix to automatically fix vulnerabilities, or update the affected packages manually'
        );
      }
      
      if (moderate > 0) {
        addFinding(
          'medium',
          'Medium severity vulnerabilities in dependencies',
          `Found ${moderate} medium severity vulnerabilities in project dependencies`,
          'package.json',
          'Run npm audit fix to automatically fix vulnerabilities, or update the affected packages manually'
        );
      }
      
      if (low > 0) {
        addFinding(
          'low',
          'Low severity vulnerabilities in dependencies',
          `Found ${low} low severity vulnerabilities in project dependencies`,
          'package.json',
          'Consider running npm audit fix to address these issues'
        );
      }
    }
  } catch (error) {
    console.error('Error checking dependencies:', error.message);
  }
}

/**
 * Check for sensitive information in code
 */
async function checkSensitiveInfo() {
  console.log('\nChecking for sensitive information in code...');
  
  const patterns = [
    { regex: /password\s*=\s*['"][^'"]+['"]/, severity: 'high', title: 'Hardcoded password' },
    { regex: /secret\s*=\s*['"][^'"]+['"]/, severity: 'high', title: 'Hardcoded secret' },
    { regex: /api[_-]?key\s*=\s*['"][^'"]+['"]/, severity: 'high', title: 'Hardcoded API key' },
    { regex: /authorization\s*:\s*['"]Bearer\s+[^'"]+['"]/, severity: 'high', title: 'Hardcoded authorization token' },
    { regex: /mongodb(\+srv)?:\/\/[^:]+:[^@]+@/, severity: 'high', title: 'Hardcoded database credentials' },
  ];
  
  try {
    const exclude = ['node_modules', '.git', 'dist', 'build', 'security-reports'];
    const command = `find . -type f -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" -o -name "*.json" ${exclude.map(dir => `-not -path "./${dir}/*"`).join(' ')}`;
    
    const files = execSync(command).toString().split('\n').filter(Boolean);
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      
      for (const pattern of patterns) {
        const matches = content.match(new RegExp(pattern.regex, 'g'));
        
        if (matches) {
          addFinding(
            pattern.severity,
            pattern.title,
            `Found possible ${pattern.title.toLowerCase()} in code`,
            file,
            'Remove sensitive information from code and use environment variables or a secure secret management solution instead'
          );
          break; // Only report one finding per file for each pattern
        }
      }
    }
  } catch (error) {
    console.error('Error checking for sensitive information:', error.message);
  }
}

/**
 * Check security headers
 */
async function checkSecurityHeaders() {
  if (isApiOnly) {
    console.log('\nChecking API security headers...');
    
    try {
      const baseUrl = process.env.API_URL || 'http://localhost:5000';
      const response = await axios.get(`${baseUrl}/api/health`, { validateStatus: () => true });
      const headers = response.headers;
      
      const securityHeaders = {
        'strict-transport-security': { required: true, severity: 'high' },
        'content-security-policy': { required: true, severity: 'high' },
        'x-content-type-options': { required: true, severity: 'medium' },
        'x-frame-options': { required: true, severity: 'medium' },
        'x-xss-protection': { required: false, severity: 'low' }
      };
      
      for (const [header, config] of Object.entries(securityHeaders)) {
        if (config.required && !headers[header]) {
          addFinding(
            config.severity,
            `Missing ${header} header`,
            `The ${header} security header is not set in API responses`,
            'server/src/app.js',
            `Add the ${header} header to API responses`
          );
        }
      }
    } catch (error) {
      console.error('Error checking security headers:', error.message);
    }
  }
}

/**
 * Check for secure configurations
 */
async function checkSecureConfigs() {
  console.log('\nChecking for secure configurations...');
  
  // Check for proper CORS configuration
  try {
    const corsFiles = [
      'server/src/app.js',
      'server/src/middleware/cors.js'
    ];
    
    for (const file of corsFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf-8');
        
        if (content.includes('origin: "*"') || content.includes('origin: true')) {
          addFinding(
            'medium',
            'Overly permissive CORS configuration',
            'CORS is configured to allow all origins (*)',
            file,
            'Restrict CORS to specific trusted origins'
          );
        }
      }
    }
  } catch (error) {
    console.error('Error checking CORS configuration:', error.message);
  }
  
  // Check JWT configuration
  try {
    const jwtFiles = [
      'server/src/middleware/auth.middleware.js',
      'server/src/utils/jwt.js',
      'server/src/config/jwt.js'
    ];
    
    for (const file of jwtFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf-8');
        
        if (!content.includes('expiresIn') && content.includes('jwt.sign')) {
          addFinding(
            'medium',
            'JWT tokens without expiration',
            'JWT tokens are created without an expiration time',
            file,
            'Add an appropriate expiration time to all JWT tokens'
          );
        }
      }
    }
  } catch (error) {
    console.error('Error checking JWT configuration:', error.message);
  }
}

/**
 * Generate security report
 */
async function generateReport() {
  console.log('\nGenerating security report...');
  
  // Calculate risk score (0-100, lower is better)
  const riskScore = 
    (results.summary.criticalVulnerabilities * 25) +
    (results.summary.highVulnerabilities * 10) +
    (results.summary.mediumVulnerabilities * 5) +
    (results.summary.lowVulnerabilities * 1);
  
  const cappedScore = Math.min(100, riskScore);
  
  results.riskScore = cappedScore;
  results.riskLevel = 
    cappedScore >= 75 ? 'Critical' :
    cappedScore >= 50 ? 'High' :
    cappedScore >= 25 ? 'Medium' :
    cappedScore > 0 ? 'Low' : 'None';
  
  // Save report to file
  const reportDir = path.dirname(reportFile);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
  
  console.log(`\nSecurity scan complete. Report saved to ${reportFile}`);
  console.log(`\nSummary:`);
  console.log(`- Critical vulnerabilities: ${results.summary.criticalVulnerabilities}`);
  console.log(`- High vulnerabilities: ${results.summary.highVulnerabilities}`);
  console.log(`- Medium vulnerabilities: ${results.summary.mediumVulnerabilities}`);
  console.log(`- Low vulnerabilities: ${results.summary.lowVulnerabilities}`);
  console.log(`- Informational findings: ${results.summary.infoFindings}`);
  console.log(`\nOverall risk score: ${results.riskScore}/100 (${results.riskLevel} risk)`);
}

/**
 * Run all security tests
 */
async function runTests() {
  await checkDependencies();
  await checkSensitiveInfo();
  await checkSecurityHeaders();
  await checkSecureConfigs();
  
  if (isFullScan) {
    // Add additional tests for full scan
    // ...
  }
  
  await generateReport();
}

// Run the tests
runTests().catch(error => {
  console.error('Error running security tests:', error);
  process.exit(1);
}); 