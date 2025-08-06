#!/usr/bin/env node

/**
 * Enhanced Security Testing Script
 * Performs comprehensive security checks on the AeroSuite application
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SECURITY_CHECKS = {
  // Check for vulnerable dependencies
  dependencyAudit: {
    name: 'Dependency Vulnerability Audit',
    run: () => {
      console.log('🔍 Checking npm dependencies...');
      const results = [];
      
      try {
        // Check client dependencies
        execSync('cd client && npm audit --json > ../npm-audit-client.json', { stdio: 'pipe' });
        const clientAudit = JSON.parse(fs.readFileSync('npm-audit-client.json', 'utf8'));
        results.push({
          location: 'client',
          vulnerabilities: clientAudit.metadata.vulnerabilities,
          total: clientAudit.metadata.totalDependencies
        });
        
        // Check server dependencies
        execSync('cd server && npm audit --json > ../npm-audit-server.json', { stdio: 'pipe' });
        const serverAudit = JSON.parse(fs.readFileSync('npm-audit-server.json', 'utf8'));
        results.push({
          location: 'server',
          vulnerabilities: serverAudit.metadata.vulnerabilities,
          total: serverAudit.metadata.totalDependencies
        });
        
        return { passed: true, results };
      } catch (error) {
        return { passed: false, error: 'Dependency audit failed', details: error.message };
      }
    }
  },

  // Check for hardcoded secrets
  secretScanning: {
    name: 'Secret/API Key Scanning',
    run: () => {
      console.log('🔍 Scanning for hardcoded secrets...');
      const secretPatterns = [
        /api[_-]?key\s*[:=]\s*["'][^"']+["']/gi,
        /secret[_-]?key\s*[:=]\s*["'][^"']+["']/gi,
        /password\s*[:=]\s*["'][^"']+["']/gi,
        /private[_-]?key\s*[:=]\s*["'][^"']+["']/gi,
        /aws[_-]?access[_-]?key[_-]?id\s*[:=]\s*["'][^"']+["']/gi,
        /aws[_-]?secret[_-]?access[_-]?key\s*[:=]\s*["'][^"']+["']/gi
      ];
      
      const findings = [];
      const scanDir = (dir) => {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            scanDir(fullPath);
          } else if (stat.isFile() && /\.(js|ts|jsx|tsx|json)$/.test(file)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            
            for (const pattern of secretPatterns) {
              const matches = content.match(pattern);
              if (matches) {
                findings.push({
                  file: path.relative(process.cwd(), fullPath),
                  matches: matches.length,
                  pattern: pattern.source
                });
              }
            }
          }
        }
      };
      
      scanDir('client/src');
      scanDir('server/src');
      
      return {
        passed: findings.length === 0,
        findings
      };
    }
  },

  // Check for insecure configurations
  configurationAudit: {
    name: 'Configuration Security Audit',
    run: () => {
      console.log('🔍 Auditing security configurations...');
      const issues = [];
      
      // Check for HTTPS enforcement
      const serverConfig = path.join('server/src/config');
      if (fs.existsSync(serverConfig)) {
        const files = fs.readdirSync(serverConfig);
        for (const file of files) {
          if (file.endsWith('.js') || file.endsWith('.ts')) {
            const content = fs.readFileSync(path.join(serverConfig, file), 'utf8');
            
            if (content.includes('http://') && !content.includes('localhost')) {
              issues.push({
                file,
                issue: 'Non-HTTPS URL found in production configuration'
              });
            }
            
            if (content.includes('cors:') && content.includes('origin: true')) {
              issues.push({
                file,
                issue: 'CORS allows all origins - potential security risk'
              });
            }
          }
        }
      }
      
      return {
        passed: issues.length === 0,
        issues
      };
    }
  },

  // Check for SQL injection vulnerabilities
  sqlInjectionCheck: {
    name: 'SQL Injection Vulnerability Check',
    run: () => {
      console.log('🔍 Checking for SQL injection vulnerabilities...');
      const vulnerablePatterns = [
        /query\s*\(\s*["'`].*\$\{[^}]+\}.*["'`]/g,
        /query\s*\(\s*["'`].*\+.*["'`]/g,
        /exec\s*\(\s*["'`].*\$\{[^}]+\}.*["'`]/g
      ];
      
      const findings = [];
      const scanFile = (filePath) => {
        const content = fs.readFileSync(filePath, 'utf8');
        
        for (const pattern of vulnerablePatterns) {
          const matches = content.match(pattern);
          if (matches) {
            findings.push({
              file: path.relative(process.cwd(), filePath),
              vulnerability: 'Potential SQL injection',
              matches: matches.length
            });
          }
        }
      };
      
      // Scan server files
      const scanDir = (dir) => {
        if (!fs.existsSync(dir)) return;
        
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            scanDir(fullPath);
          } else if (stat.isFile() && /\.(js|ts)$/.test(file)) {
            scanFile(fullPath);
          }
        }
      };
      
      scanDir('server/src');
      
      return {
        passed: findings.length === 0,
        findings
      };
    }
  },

  // Check authentication implementation
  authenticationCheck: {
    name: 'Authentication Security Check',
    run: () => {
      console.log('🔍 Checking authentication implementation...');
      const issues = [];
      
      // Check for JWT secret configuration
      const authFiles = [
        'server/src/middleware/auth.js',
        'server/src/config/auth.js',
        'server/src/utils/auth.js'
      ];
      
      for (const file of authFiles) {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          
          if (content.includes('jwt.sign') && !content.includes('expiresIn')) {
            issues.push({
              file,
              issue: 'JWT tokens may not have expiration set'
            });
          }
          
          if (content.includes('secret:') && content.includes('"secret"')) {
            issues.push({
              file,
              issue: 'Weak JWT secret detected'
            });
          }
        }
      }
      
      return {
        passed: issues.length === 0,
        issues
      };
    }
  }
};

async function runSecurityTests() {
  console.log('🔒 AeroSuite Security Testing Suite\n');
  console.log('Running comprehensive security checks...\n');
  
  const results = {
    timestamp: new Date().toISOString(),
    passed: 0,
    failed: 0,
    tests: []
  };
  
  for (const [key, check] of Object.entries(SECURITY_CHECKS)) {
    console.log(`\n━━━ ${check.name} ━━━`);
    
    try {
      const result = check.run();
      
      if (result.passed) {
        console.log('✅ PASSED');
        results.passed++;
      } else {
        console.log('❌ FAILED');
        results.failed++;
      }
      
      results.tests.push({
        name: check.name,
        key,
        ...result
      });
    } catch (error) {
      console.log('❌ ERROR:', error.message);
      results.failed++;
      results.tests.push({
        name: check.name,
        key,
        passed: false,
        error: error.message
      });
    }
  }
  
  // Generate security report
  console.log('\n\n📊 Security Test Summary');
  console.log('━'.repeat(50));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  
  // Save detailed report
  fs.writeFileSync('security-test-report.json', JSON.stringify(results, null, 2));
  console.log('\n📄 Detailed report saved to: security-test-report.json');
  
  // Create remediation script
  if (results.failed > 0) {
    createRemediationScript(results);
  }
  
  return results;
}

function createRemediationScript(results) {
  const remediations = [];
  
  for (const test of results.tests) {
    if (!test.passed) {
      switch (test.key) {
        case 'dependencyAudit':
          remediations.push({
            issue: 'Vulnerable dependencies',
            fix: 'npm audit fix --force'
          });
          break;
        case 'secretScanning':
          remediations.push({
            issue: 'Hardcoded secrets found',
            fix: 'Move secrets to environment variables'
          });
          break;
        case 'configurationAudit':
          remediations.push({
            issue: 'Insecure configurations',
            fix: 'Update configurations to use HTTPS and restrict CORS'
          });
          break;
        case 'sqlInjectionCheck':
          remediations.push({
            issue: 'SQL injection vulnerabilities',
            fix: 'Use parameterized queries'
          });
          break;
        case 'authenticationCheck':
          remediations.push({
            issue: 'Authentication security issues',
            fix: 'Set JWT expiration and use strong secrets'
          });
          break;
      }
    }
  }
  
  const script = `#!/bin/bash
# Security Remediation Script
# Generated: ${new Date().toISOString()}

echo "🔧 Starting security remediation..."

${remediations.map(r => `
# Fix: ${r.issue}
echo "Fixing: ${r.issue}"
${r.fix}
`).join('\n')}

echo "✅ Security remediation complete!"
`;
  
  fs.writeFileSync('security-remediation.sh', script);
  fs.chmodSync('security-remediation.sh', '755');
  console.log('🔧 Remediation script created: security-remediation.sh');
}

// Run the tests
if (require.main === module) {
  runSecurityTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runSecurityTests, SECURITY_CHECKS };