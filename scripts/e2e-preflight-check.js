#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

console.log('🚀 AeroSuite E2E Pre-flight Check\n');

const errors = [];
const warnings = [];
const info = [];

// Check if required directories exist
const checkDirectories = () => {
  console.log('📁 Checking directory structure...');
  
  const requiredDirs = [
    'cypress/e2e',
    'cypress/support',
    'cypress/fixtures',
    'client/src',
    'server/src'
  ];
  
  requiredDirs.forEach(dir => {
    if (fs.existsSync(path.join(process.cwd(), dir))) {
      info.push(`✅ ${dir} exists`);
    } else {
      errors.push(`❌ Missing directory: ${dir}`);
    }
  });
};

// Check if required test files exist
const checkTestFiles = () => {
  console.log('\n📄 Checking E2E test files...');
  
  const testFiles = [
    'cypress/e2e/auth.cy.js',
    'cypress/e2e/dashboard.cy.js',
    'cypress/e2e/suppliers.cy.js',
    'cypress/e2e/customers.cy.js',
    'cypress/e2e/inspections.cy.js'
  ];
  
  testFiles.forEach(file => {
    if (fs.existsSync(path.join(process.cwd(), file))) {
      info.push(`✅ ${file} exists`);
    } else {
      warnings.push(`⚠️  Missing test file: ${file}`);
    }
  });
};

// Check configuration files
const checkConfiguration = () => {
  console.log('\n⚙️  Checking configuration files...');
  
  // Check cypress.config.js
  if (fs.existsSync('cypress.config.js')) {
    try {
      const config = require(path.join(process.cwd(), 'cypress.config.js'));
      info.push('✅ cypress.config.js is valid');
      
      // Check critical config values
      if (config.e2e?.baseUrl) {
        info.push(`✅ Base URL configured: ${config.e2e.baseUrl}`);
      } else {
        warnings.push('⚠️  No baseUrl configured in cypress.config.js');
      }
    } catch (err) {
      errors.push(`❌ Error in cypress.config.js: ${err.message}`);
    }
  } else {
    errors.push('❌ Missing cypress.config.js');
  }
  
  // Check package.json for scripts
  if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const e2eScripts = Object.keys(packageJson.scripts || {}).filter(script => 
      script.includes('e2e') || script.includes('cy:')
    );
    
    if (e2eScripts.length > 0) {
      info.push(`✅ Found E2E scripts: ${e2eScripts.join(', ')}`);
    } else {
      warnings.push('⚠️  No E2E scripts found in package.json');
    }
  }
};

// Check server connectivity
const checkServerConnectivity = async () => {
  console.log('\n🌐 Checking server connectivity...');
  
  const servers = [
    { name: 'Frontend', url: 'http://localhost:3000', required: true },
    { name: 'Backend API', url: 'http://localhost:5000/api/health', required: true }
  ];
  
  for (const server of servers) {
    try {
      // Simple check using curl
      await execPromise(`curl -s -o /dev/null -w "%{http_code}" ${server.url} | grep -E "^[23]"`);
      info.push(`✅ ${server.name} is reachable at ${server.url}`);
    } catch (err) {
      if (server.required) {
        errors.push(`❌ ${server.name} is not running at ${server.url}`);
      } else {
        warnings.push(`⚠️  ${server.name} is not running at ${server.url}`);
      }
    }
  }
};

// Check dependencies
const checkDependencies = async () => {
  console.log('\n📦 Checking dependencies...');
  
  const requiredDeps = ['cypress'];
  const optionalDeps = ['start-server-and-test', 'mochawesome', 'cypress-image-snapshot'];
  
  try {
    const { stdout } = await execPromise('npm ls --depth=0 --json');
    const deps = JSON.parse(stdout);
    const installedDeps = Object.keys(deps.dependencies || {});
    
    requiredDeps.forEach(dep => {
      if (installedDeps.includes(dep)) {
        info.push(`✅ ${dep} is installed`);
      } else {
        errors.push(`❌ Missing required dependency: ${dep}`);
      }
    });
    
    optionalDeps.forEach(dep => {
      if (!installedDeps.includes(dep)) {
        warnings.push(`⚠️  Missing optional dependency: ${dep}`);
      }
    });
  } catch (err) {
    warnings.push('⚠️  Could not check npm dependencies');
  }
};

// Analyze test code for potential issues
const analyzeTestCode = () => {
  console.log('\n🔍 Analyzing test code...');
  
  const testFiles = fs.readdirSync('cypress/e2e').filter(f => f.endsWith('.cy.js'));
  
  testFiles.forEach(file => {
    const content = fs.readFileSync(path.join('cypress/e2e', file), 'utf8');
    
    // Check for common issues
    if (!content.includes('describe(')) {
      warnings.push(`⚠️  ${file}: No test suites found (missing describe blocks)`);
    }
    
    if (!content.includes('it(')) {
      warnings.push(`⚠️  ${file}: No test cases found (missing it blocks)`);
    }
    
    // Check for hardcoded waits (anti-pattern)
    if (content.includes('cy.wait(') && content.match(/cy\.wait\(\d+\)/)) {
      warnings.push(`⚠️  ${file}: Contains hardcoded waits (consider using cy.intercept instead)`);
    }
    
    // Check for proper selectors
    if (!content.includes('data-testid') && !content.includes('data-cy')) {
      warnings.push(`⚠️  ${file}: No data-testid selectors found (using data attributes is recommended)`);
    }
  });
};

// Generate report
const generateReport = () => {
  console.log('\n' + '='.repeat(60));
  console.log('📊 E2E TEST READINESS REPORT');
  console.log('='.repeat(60) + '\n');
  
  if (info.length > 0) {
    console.log('✅ PASSED CHECKS:');
    info.forEach(i => console.log(`  ${i}`));
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    warnings.forEach(w => console.log(`  ${w}`));
  }
  
  if (errors.length > 0) {
    console.log('\n❌ ERRORS:');
    errors.forEach(e => console.log(`  ${e}`));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 SUMMARY:');
  console.log(`  Total Checks: ${info.length + warnings.length + errors.length}`);
  console.log(`  Passed: ${info.length}`);
  console.log(`  Warnings: ${warnings.length}`);
  console.log(`  Errors: ${errors.length}`);
  console.log('='.repeat(60) + '\n');
  
  if (errors.length === 0) {
    console.log('✅ E2E tests are ready to run!');
    console.log('\nTo start testing:');
    console.log('  1. Start the backend: npm run server:dev');
    console.log('  2. Start the frontend: npm start');
    console.log('  3. Run E2E tests: npm run test:e2e');
  } else {
    console.log('❌ E2E tests are NOT ready. Please fix the errors above.');
    console.log('\nRequired actions:');
    if (errors.some(e => e.includes('not running'))) {
      console.log('  - Start the application servers');
    }
    if (errors.some(e => e.includes('Missing required dependency'))) {
      console.log('  - Install missing dependencies: npm install');
    }
  }
  
  return errors.length === 0 ? 0 : 1;
};

// Main execution
const main = async () => {
  try {
    checkDirectories();
    checkTestFiles();
    checkConfiguration();
    await checkDependencies();
    await checkServerConnectivity();
    
    if (fs.existsSync('cypress/e2e')) {
      analyzeTestCode();
    }
    
    const exitCode = generateReport();
    process.exit(exitCode);
  } catch (err) {
    console.error('❌ Pre-flight check failed:', err.message);
    process.exit(1);
  }
};

main();