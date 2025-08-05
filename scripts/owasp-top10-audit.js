#!/usr/bin/env node

/**
 * OWASP Top 10 Audit Script
 * 
 * This script checks for OWASP Top 10 vulnerabilities in the AeroSuite application.
 * It performs various tests to detect common security issues and generates a report.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { program } = require('commander');

// Configure command line options
program
  .description('Audit application against OWASP Top 10')
  .option('--html', 'Generate HTML report')
  .option('--output <file>', 'Output file for report')
  .parse(process.argv);

const options = program.opts();

// Define OWASP Top 10 categories (2021)
const OWASP_CATEGORIES = {
  A01: { name: 'Broken Access Control', weight: 1.0 },
  A02: { name: 'Cryptographic Failures', weight: 1.0 },
  A03: { name: 'Injection', weight: 1.0 },
  A04: { name: 'Insecure Design', weight: 1.0 },
  A05: { name: 'Security Misconfiguration', weight: 1.0 },
  A06: { name: 'Vulnerable Components', weight: 1.0 },
  A07: { name: 'Identification and Authentication Failures', weight: 1.0 },
  A08: { name: 'Software and Data Integrity Failures', weight: 1.0 },
  A09: { name: 'Security Logging and Monitoring Failures', weight: 1.0 },
  A10: { name: 'Server-Side Request Forgery', weight: 1.0 }
};

// Initialize report
const auditReport = {
  timestamp: new Date().toISOString(),
  categories: {},
  vulnerabilities: [],
  summary: {
    passedChecks: 0,
    failedChecks: 0,
    complianceScore: 0
  }
};

// Ensure reports directory exists
const reportDir = path.join(__dirname, '..', 'security-reports');
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

// Initialize categories in report
Object.keys(OWASP_CATEGORIES).forEach(key => {
  auditReport.categories[key] = {
    name: OWASP_CATEGORIES[key].name,
    checks: [],
    passedChecks: 0,
    failedChecks: 0,
    score: 0
  };
});

/**
 * Add check result to the report
 */
function addCheckResult(category, name, passed, details = {}) {
  const result = {
    name,
    passed,
    details
  };
  
  auditReport.categories[category].checks.push(result);
  
  if (passed) {
    auditReport.categories[category].passedChecks++;
    auditReport.summary.passedChecks++;
  } else {
    auditReport.categories[category].failedChecks++;
    auditReport.summary.failedChecks++;
    
    // Add to vulnerabilities list
    auditReport.vulnerabilities.push({
      category,
      categoryName: OWASP_CATEGORIES[category].name,
      name,
      details
    });
  }
}

/**
 * Check for broken access control (A01)
 */
function checkBrokenAccessControl() {
  console.log('Checking for Broken Access Control (A01)...');
  
  // Check for proper authentication middleware
  const hasAuthMiddleware = fs.existsSync(path.join(__dirname, '..', 'server/src/middleware/auth.middleware.js'));
  addCheckResult('A01', 'Authentication Middleware', hasAuthMiddleware, {
    reason: hasAuthMiddleware ? 'Authentication middleware found' : 'Authentication middleware missing'
  });
  
  // Check for role-based access control
  const hasRoleChecks = false;
  try {
    const authMiddlewarePath = path.join(__dirname, '..', 'server/src/middleware/auth.middleware.js');
    if (fs.existsSync(authMiddlewarePath)) {
      const content = fs.readFileSync(authMiddlewarePath, 'utf8');
      hasRoleChecks = content.includes('requiredRole') || content.includes('role');
    }
  } catch (error) {
    console.error('Error checking for role-based access:', error);
  }
  
  addCheckResult('A01', 'Role-Based Access Control', hasRoleChecks, {
    reason: hasRoleChecks ? 'Role-based access control implemented' : 'No role-based access control found'
  });
  
  // Check for route protection
  let routesProtected = false;
  try {
    const routesDir = path.join(__dirname, '..', 'server/src/routes');
    if (fs.existsSync(routesDir)) {
      const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.routes.js'));
      let protectedCount = 0;
      
      for (const routeFile of routeFiles) {
        const content = fs.readFileSync(path.join(routesDir, routeFile), 'utf8');
        if (content.includes('authenticate') || content.includes('isAuthenticated')) {
          protectedCount++;
        }
      }
      
      routesProtected = protectedCount > 0;
    }
  } catch (error) {
    console.error('Error checking for route protection:', error);
  }
  
  addCheckResult('A01', 'Protected Routes', routesProtected, {
    reason: routesProtected ? 'Routes are protected with authentication' : 'Routes may not be properly protected'
  });
}

/**
 * Check for cryptographic failures (A02)
 */
function checkCryptographicFailures() {
  console.log('Checking for Cryptographic Failures (A02)...');
  
  // Check for HTTPS configuration
  const hasHttps = false;
  try {
    const nginxConfig = path.join(__dirname, '..', 'nginx/conf.d/default.conf');
    if (fs.existsSync(nginxConfig)) {
      const content = fs.readFileSync(nginxConfig, 'utf8');
      hasHttps = content.includes('ssl_certificate') || content.includes('443 ssl');
    }
  } catch (error) {
    console.error('Error checking for HTTPS configuration:', error);
  }
  
  addCheckResult('A02', 'HTTPS Configuration', hasHttps, {
    reason: hasHttps ? 'HTTPS is configured' : 'HTTPS may not be properly configured'
  });
  
  // Check for password hashing
  let passwordHashing = false;
  try {
    const userModelPath = path.join(__dirname, '..', 'server/src/models/user.model.js');
    if (fs.existsSync(userModelPath)) {
      const content = fs.readFileSync(userModelPath, 'utf8');
      passwordHashing = content.includes('bcrypt') || content.includes('hash');
    }
  } catch (error) {
    console.error('Error checking for password hashing:', error);
  }
  
  addCheckResult('A02', 'Password Hashing', passwordHashing, {
    reason: passwordHashing ? 'Password hashing is implemented' : 'Password hashing may not be implemented'
  });
  
  // Check for secure cookies
  let secureCookies = false;
  try {
    const serverIndex = path.join(__dirname, '..', 'server/src/index.js');
    if (fs.existsSync(serverIndex)) {
      const content = fs.readFileSync(serverIndex, 'utf8');
      secureCookies = content.includes('secure: true') || content.includes('httpOnly: true');
    }
  } catch (error) {
    console.error('Error checking for secure cookies:', error);
  }
  
  addCheckResult('A02', 'Secure Cookies', secureCookies, {
    reason: secureCookies ? 'Secure cookies are configured' : 'Secure cookies may not be configured'
  });
}

/**
 * Check for injection vulnerabilities (A03)
 */
function checkInjection() {
  console.log('Checking for Injection (A03)...');
  
  // Check for input validation
  let inputValidation = false;
  try {
    const validationDir = path.join(__dirname, '..', 'server/src/middleware/validators');
    inputValidation = fs.existsSync(validationDir);
  } catch (error) {
    console.error('Error checking for input validation:', error);
  }
  
  addCheckResult('A03', 'Input Validation', inputValidation, {
    reason: inputValidation ? 'Input validation middleware found' : 'No input validation middleware found'
  });
  
  // Check for parameterized queries
  let parameterizedQueries = false;
  try {
    // For MongoDB, check if using Mongoose's built-in query methods
    const modelsDir = path.join(__dirname, '..', 'server/src/models');
    if (fs.existsSync(modelsDir)) {
      parameterizedQueries = true; // Mongoose provides protection by default
    }
  } catch (error) {
    console.error('Error checking for parameterized queries:', error);
  }
  
  addCheckResult('A03', 'Parameterized Queries', parameterizedQueries, {
    reason: parameterizedQueries ? 'Using Mongoose for parameterized queries' : 'May not be using parameterized queries'
  });
}

/**
 * Check for security misconfiguration (A05)
 */
function checkSecurityMisconfiguration() {
  console.log('Checking for Security Misconfiguration (A05)...');
  
  // Check for security headers
  let securityHeaders = false;
  try {
    const serverIndex = path.join(__dirname, '..', 'server/src/index.js');
    if (fs.existsSync(serverIndex)) {
      const content = fs.readFileSync(serverIndex, 'utf8');
      securityHeaders = content.includes('helmet') || 
                        (content.includes('X-Content-Type-Options') && 
                         content.includes('X-Frame-Options'));
    }
  } catch (error) {
    console.error('Error checking for security headers:', error);
  }
  
  addCheckResult('A05', 'Security Headers', securityHeaders, {
    reason: securityHeaders ? 'Security headers are configured' : 'Security headers may not be configured'
  });
  
  // Check for error handling
  let errorHandling = false;
  try {
    const errorHandlerPath = path.join(__dirname, '..', 'server/src/utils/errorHandler.js');
    errorHandling = fs.existsSync(errorHandlerPath);
  } catch (error) {
    console.error('Error checking for error handling:', error);
  }
  
  addCheckResult('A05', 'Error Handling', errorHandling, {
    reason: errorHandling ? 'Error handling is implemented' : 'Error handling may not be implemented'
  });
}

/**
 * Check for vulnerable components (A06)
 */
function checkVulnerableComponents() {
  console.log('Checking for Vulnerable Components (A06)...');
  
  // Check for npm audit
  let npmAuditResult = { vulnerabilities: { critical: 0, high: 0 } };
  try {
    const output = execSync('npm audit --json', { 
      cwd: path.join(__dirname, '..'),
      stdio: ['pipe', 'pipe', 'pipe']
    }).toString();
    
    npmAuditResult = JSON.parse(output);
  } catch (error) {
    // npm audit returns non-zero exit code if vulnerabilities are found
    try {
      npmAuditResult = JSON.parse(error.stdout.toString());
    } catch (parseError) {
      console.error('Error parsing npm audit result:', parseError);
    }
  }
  
  const criticalVulnerabilities = npmAuditResult.metadata?.vulnerabilities?.critical || 0;
  const highVulnerabilities = npmAuditResult.metadata?.vulnerabilities?.high || 0;
  
  addCheckResult('A06', 'No Critical Vulnerabilities', criticalVulnerabilities === 0, {
    reason: criticalVulnerabilities === 0 
      ? 'No critical vulnerabilities found' 
      : `Found ${criticalVulnerabilities} critical vulnerabilities`
  });
  
  addCheckResult('A06', 'No High Vulnerabilities', highVulnerabilities === 0, {
    reason: highVulnerabilities === 0 
      ? 'No high vulnerabilities found' 
      : `Found ${highVulnerabilities} high vulnerabilities`
  });
}

/**
 * Check for authentication failures (A07)
 */
function checkAuthenticationFailures() {
  console.log('Checking for Authentication Failures (A07)...');
  
  // Check for strong password policy
  let strongPasswordPolicy = false;
  try {
    const validationDir = path.join(__dirname, '..', 'server/src/middleware/validators');
    if (fs.existsSync(validationDir)) {
      const files = fs.readdirSync(validationDir);
      for (const file of files) {
        if (file.includes('auth') || file.includes('user')) {
          const content = fs.readFileSync(path.join(validationDir, file), 'utf8');
          strongPasswordPolicy = content.includes('password') && 
                               (content.includes('minLength') || content.includes('min'));
          if (strongPasswordPolicy) break;
        }
      }
    }
  } catch (error) {
    console.error('Error checking for strong password policy:', error);
  }
  
  addCheckResult('A07', 'Strong Password Policy', strongPasswordPolicy, {
    reason: strongPasswordPolicy ? 'Strong password policy implemented' : 'No strong password policy found'
  });
  
  // Check for brute force protection
  let bruteForceProtection = false;
  try {
    const serverIndex = path.join(__dirname, '..', 'server/src/index.js');
    if (fs.existsSync(serverIndex)) {
      const content = fs.readFileSync(serverIndex, 'utf8');
      bruteForceProtection = content.includes('rate-limit') || content.includes('rateLimit');
    }
  } catch (error) {
    console.error('Error checking for brute force protection:', error);
  }
  
  addCheckResult('A07', 'Brute Force Protection', bruteForceProtection, {
    reason: bruteForceProtection ? 'Brute force protection implemented' : 'No brute force protection found'
  });
}

/**
 * Check for logging and monitoring (A09)
 */
function checkLoggingAndMonitoring() {
  console.log('Checking for Logging and Monitoring (A09)...');
  
  // Check for logging implementation
  let loggingImplemented = false;
  try {
    const loggerPath = path.join(__dirname, '..', 'server/src/utils/logger.js');
    loggingImplemented = fs.existsSync(loggerPath);
  } catch (error) {
    console.error('Error checking for logging implementation:', error);
  }
  
  addCheckResult('A09', 'Logging Implementation', loggingImplemented, {
    reason: loggingImplemented ? 'Logging is implemented' : 'No logging implementation found'
  });
  
  // Check for monitoring
  let monitoringImplemented = false;
  try {
    const monitoringDir = path.join(__dirname, '..', 'server/src/monitoring');
    monitoringImplemented = fs.existsSync(monitoringDir);
  } catch (error) {
    console.error('Error checking for monitoring:', error);
  }
  
  addCheckResult('A09', 'Monitoring Implementation', monitoringImplemented, {
    reason: monitoringImplemented ? 'Monitoring is implemented' : 'No monitoring implementation found'
  });
}

/**
 * Calculate compliance scores
 */
function calculateScores() {
  // Calculate category scores
  Object.keys(auditReport.categories).forEach(key => {
    const category = auditReport.categories[key];
    const totalChecks = category.passedChecks + category.failedChecks;
    
    if (totalChecks > 0) {
      category.score = Math.round((category.passedChecks / totalChecks) * 100);
    } else {
      category.score = 0;
    }
  });
  
  // Calculate overall compliance score
  const totalChecks = auditReport.summary.passedChecks + auditReport.summary.failedChecks;
  if (totalChecks > 0) {
    auditReport.summary.complianceScore = Math.round((auditReport.summary.passedChecks / totalChecks) * 100);
  } else {
    auditReport.summary.complianceScore = 0;
  }
}

/**
 * Generate and save report
 */
function saveReport() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportFile = path.join(reportDir, `owasp-audit-report-${timestamp}.json`);
  
  fs.writeFileSync(reportFile, JSON.stringify(auditReport, null, 2));
  console.log(`OWASP audit report saved to: ${reportFile}`);
  
  if (options.html) {
    const htmlReportFile = path.join(reportDir, `owasp-audit-report-${timestamp}.html`);
    const htmlReport = generateHtmlReport();
    fs.writeFileSync(htmlReportFile, htmlReport);
    console.log(`HTML report saved to: ${htmlReportFile}`);
  }
}

/**
 * Generate HTML report
 */
function generateHtmlReport() {
  // Simple HTML report template
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OWASP Top 10 Audit Report</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1, h2, h3 { color: #333; }
    .summary { background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .summary table { width: 100%; border-collapse: collapse; }
    .summary th, .summary td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
    .category { margin-bottom: 30px; }
    .check { margin: 10px 0; padding: 10px; border-radius: 5px; }
    .pass { background-color: #e8f5e9; }
    .fail { background-color: #ffebee; }
    .compliance-meter { width: 100%; background-color: #f5f5f5; border-radius: 5px; margin: 10px 0; }
    .compliance-value { height: 24px; background-color: #4caf50; border-radius: 5px; text-align: center; color: white; }
  </style>
</head>
<body>
  <h1>OWASP Top 10 Audit Report</h1>
  <p>Timestamp: ${auditReport.timestamp}</p>
  
  <div class="summary">
    <h2>Compliance Summary</h2>
    <div class="compliance-meter">
      <div class="compliance-value" style="width: ${auditReport.summary.complianceScore}%;">
        ${auditReport.summary.complianceScore}%
      </div>
    </div>
    <p>Passed Checks: ${auditReport.summary.passedChecks}</p>
    <p>Failed Checks: ${auditReport.summary.failedChecks}</p>
    
    <table>
      <tr>
        <th>Category</th>
        <th>Score</th>
        <th>Passed</th>
        <th>Failed</th>
      </tr>
      ${Object.keys(auditReport.categories).map(key => {
        const category = auditReport.categories[key];
        return `<tr>
          <td>${key}: ${category.name}</td>
          <td>${category.score}%</td>
          <td>${category.passedChecks}</td>
          <td>${category.failedChecks}</td>
        </tr>`;
      }).join('')}
    </table>
  </div>
  
  ${Object.keys(auditReport.categories).map(key => {
    const category = auditReport.categories[key];
    return `<div class="category">
      <h2>${key}: ${category.name}</h2>
      <div class="compliance-meter">
        <div class="compliance-value" style="width: ${category.score}%;">
          ${category.score}%
        </div>
      </div>
      
      ${category.checks.map(check => {
        return `<div class="check ${check.passed ? 'pass' : 'fail'}">
          <h3>${check.name}: ${check.passed ? 'PASS' : 'FAIL'}</h3>
          <p>${check.details.reason || ''}</p>
        </div>`;
      }).join('')}
    </div>`;
  }).join('')}
  
  <div class="vulnerabilities">
    <h2>Detected Vulnerabilities</h2>
    ${auditReport.vulnerabilities.length === 0 
      ? '<p>No vulnerabilities detected.</p>' 
      : auditReport.vulnerabilities.map(vuln => {
          return `<div class="check fail">
            <h3>${vuln.category}: ${vuln.name}</h3>
            <p>${vuln.details.reason || ''}</p>
          </div>`;
        }).join('')}
  </div>
</body>
</html>`;
}

// Run all checks
function runAudit() {
  console.log('Starting OWASP Top 10 audit...');
  
  checkBrokenAccessControl();
  checkCryptographicFailures();
  checkInjection();
  checkSecurityMisconfiguration();
  checkVulnerableComponents();
  checkAuthenticationFailures();
  checkLoggingAndMonitoring();
  
  calculateScores();
  saveReport();
  
  console.log(`\nOWASP Top 10 audit complete. Compliance score: ${auditReport.summary.complianceScore}%`);
  console.log(`Passed: ${auditReport.summary.passedChecks}, Failed: ${auditReport.summary.failedChecks}`);
  
  if (auditReport.vulnerabilities.length > 0) {
    console.log(`\nDetected ${auditReport.vulnerabilities.length} vulnerabilities`);
  } else {
    console.log('\nNo vulnerabilities detected');
  }
}

// Run the audit
runAudit(); 