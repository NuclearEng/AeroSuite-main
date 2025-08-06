#!/usr/bin/env node

/**
 * Comprehensive Test Runner with Auto-Fix Capabilities
 * Runs all tests and applies automatic fixes where possible
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// Test configurations
const TEST_SUITES = {
  typescript: {
    name: 'TypeScript Compilation',
    command: 'cd client && npm run type-check',
    autoFix: () => execSync('node scripts/typescript-comprehensive-fixer.js', { stdio: 'inherit' }),
    critical: true
  },
  jsx: {
    name: 'JSX Best Practices',
    command: 'node scripts/jsx-best-practices-test.js',
    autoFix: () => execSync('node scripts/jsx-auto-fix.js', { stdio: 'inherit' }),
    critical: false
  },
  security: {
    name: 'Security Tests',
    command: 'node scripts/security-test-enhanced.js',
    autoFix: () => {
      if (fs.existsSync('security-remediation.sh')) {
        execSync('./security-remediation.sh', { stdio: 'inherit' });
      }
    },
    critical: true
  },
  performance: {
    name: 'Performance Tests',
    command: 'node scripts/performance-test-enhanced.js',
    autoFix: () => {
      if (fs.existsSync('performance-optimization.sh')) {
        execSync('./performance-optimization.sh', { stdio: 'inherit' });
      }
    },
    critical: false
  },
  e2e: {
    name: 'End-to-End Tests',
    command: 'npm run test:e2e:check',
    autoFix: null,
    critical: false,
    preCheck: () => {
      // Check if servers are running
      try {
        execSync('curl -f http://localhost:3000 > /dev/null 2>&1');
        execSync('curl -f http://localhost:5000/api/health > /dev/null 2>&1');
        return true;
      } catch {
        console.log('⚠️  Servers not running, skipping E2E tests');
        return false;
      }
    }
  }
};

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// Test runner class
class ComprehensiveTestRunner {
  constructor(options = {}) {
    this.options = {
      autoFix: options.autoFix !== false,
      maxRetries: options.maxRetries || 2,
      parallel: options.parallel || false,
      ...options
    };
    
    this.results = {
      timestamp: new Date().toISOString(),
      passed: [],
      failed: [],
      skipped: [],
      fixed: []
    };
  }
  
  async runTest(key, config) {
    console.log(`\n${colorize('━'.repeat(60), 'cyan')}`);
    console.log(`${colorize('🧪 ' + config.name, 'cyan')}`);
    console.log(colorize('━'.repeat(60), 'cyan'));
    
    // Pre-check if needed
    if (config.preCheck && !config.preCheck()) {
      this.results.skipped.push({
        name: config.name,
        reason: 'Pre-check failed'
      });
      return;
    }
    
    let attempts = 0;
    let lastError = null;
    
    while (attempts < this.options.maxRetries) {
      attempts++;
      
      try {
        console.log(`\nAttempt ${attempts}/${this.options.maxRetries}...`);
        execSync(config.command, { stdio: 'inherit' });
        
        console.log(colorize('\n✅ PASSED', 'green'));
        this.results.passed.push({
          name: config.name,
          attempts
        });
        return;
        
      } catch (error) {
        lastError = error;
        console.log(colorize('\n❌ FAILED', 'red'));
        
        if (this.options.autoFix && config.autoFix && attempts < this.options.maxRetries) {
          console.log(colorize('\n🔧 Attempting auto-fix...', 'yellow'));
          
          try {
            config.autoFix();
            this.results.fixed.push({
              name: config.name,
              attempt: attempts
            });
            console.log(colorize('Auto-fix completed, retrying...', 'green'));
          } catch (fixError) {
            console.log(colorize('Auto-fix failed: ' + fixError.message, 'red'));
            break;
          }
        } else {
          break;
        }
      }
    }
    
    // Test failed after all attempts
    this.results.failed.push({
      name: config.name,
      attempts,
      critical: config.critical,
      error: lastError?.message
    });
  }
  
  async runAllTests() {
    console.log(colorize('\n🚀 COMPREHENSIVE TEST RUNNER', 'magenta'));
    console.log(colorize('═'.repeat(60), 'magenta'));
    console.log(`Started at: ${new Date().toLocaleString()}`);
    console.log(`Auto-fix: ${this.options.autoFix ? 'Enabled' : 'Disabled'}`);
    console.log(`Max retries: ${this.options.maxRetries}`);
    
    // Run tests
    for (const [key, config] of Object.entries(TEST_SUITES)) {
      if (this.options.only && !this.options.only.includes(key)) {
        continue;
      }
      
      await this.runTest(key, config);
    }
    
    // Generate summary
    this.generateSummary();
    
    // Save results
    this.saveResults();
    
    // Exit with appropriate code
    const criticalFailures = this.results.failed.filter(f => f.critical);
    if (criticalFailures.length > 0) {
      process.exit(1);
    }
  }
  
  generateSummary() {
    console.log(colorize('\n\n📊 TEST SUMMARY', 'magenta'));
    console.log(colorize('═'.repeat(60), 'magenta'));
    
    console.log(colorize(`\n✅ Passed: ${this.results.passed.length}`, 'green'));
    this.results.passed.forEach(test => {
      console.log(`   • ${test.name}${test.attempts > 1 ? ` (${test.attempts} attempts)` : ''}`);
    });
    
    if (this.results.failed.length > 0) {
      console.log(colorize(`\n❌ Failed: ${this.results.failed.length}`, 'red'));
      this.results.failed.forEach(test => {
        console.log(`   • ${test.name}${test.critical ? ' [CRITICAL]' : ''}`);
      });
    }
    
    if (this.results.skipped.length > 0) {
      console.log(colorize(`\n⏭️  Skipped: ${this.results.skipped.length}`, 'yellow'));
      this.results.skipped.forEach(test => {
        console.log(`   • ${test.name}: ${test.reason}`);
      });
    }
    
    if (this.results.fixed.length > 0) {
      console.log(colorize(`\n🔧 Auto-fixed: ${this.results.fixed.length}`, 'green'));
      this.results.fixed.forEach(fix => {
        console.log(`   • ${fix.name} (attempt ${fix.attempt})`);
      });
    }
    
    // Overall status
    const totalTests = this.results.passed.length + this.results.failed.length + this.results.skipped.length;
    const successRate = Math.round((this.results.passed.length / (totalTests - this.results.skipped.length)) * 100);
    
    console.log(colorize('\n📈 Overall Status', 'blue'));
    console.log(`   Total tests: ${totalTests}`);
    console.log(`   Success rate: ${successRate}%`);
    console.log(`   Duration: ${this.calculateDuration()}`);
  }
  
  calculateDuration() {
    const start = new Date(this.results.timestamp);
    const end = new Date();
    const duration = Math.round((end - start) / 1000);
    
    if (duration < 60) {
      return `${duration}s`;
    } else {
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      return `${minutes}m ${seconds}s`;
    }
  }
  
  saveResults() {
    const reportPath = path.join(process.cwd(), 'comprehensive-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Report saved to: ${reportPath}`);
    
    // Create action items if there are failures
    if (this.results.failed.length > 0) {
      this.createActionItems();
    }
  }
  
  createActionItems() {
    const actionItems = [];
    
    for (const failure of this.results.failed) {
      switch (failure.name) {
        case 'TypeScript Compilation':
          actionItems.push({
            priority: 'HIGH',
            action: 'Fix remaining TypeScript errors',
            command: 'cd client && npm run type-check',
            autoFix: 'node scripts/typescript-comprehensive-fixer.js'
          });
          break;
        case 'Security Tests':
          actionItems.push({
            priority: 'CRITICAL',
            action: 'Address security vulnerabilities',
            command: 'node scripts/security-test-enhanced.js',
            report: 'security-test-report.json'
          });
          break;
        case 'Performance Tests':
          actionItems.push({
            priority: 'MEDIUM',
            action: 'Optimize performance issues',
            command: 'node scripts/performance-test-enhanced.js',
            report: 'performance-test-report.json'
          });
          break;
      }
    }
    
    const actionReport = {
      generated: new Date().toISOString(),
      items: actionItems
    };
    
    fs.writeFileSync('action-items.json', JSON.stringify(actionReport, null, 2));
    console.log('📋 Action items saved to: action-items.json');
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    autoFix: !args.includes('--no-fix'),
    maxRetries: args.includes('--max-retries') ? 
      parseInt(args[args.indexOf('--max-retries') + 1]) : 2,
    only: args.includes('--only') ? 
      args[args.indexOf('--only') + 1].split(',') : null
  };
  
  const runner = new ComprehensiveTestRunner(options);
  runner.runAllTests().catch(error => {
    console.error(colorize('\n💥 Fatal error: ' + error.message, 'red'));
    process.exit(1);
  });
}

module.exports = ComprehensiveTestRunner;