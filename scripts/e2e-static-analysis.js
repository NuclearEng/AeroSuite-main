#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 E2E Test Static Analysis Report\n');

const issues = {
  errors: [],
  warnings: [],
  suggestions: []
};

// Analyze each test file
const analyzeTestFile = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  
  console.log(`\n📄 Analyzing ${fileName}...`);
  
  // Check for test structure
  const describeMatches = content.match(/describe\(/g);
  const itMatches = content.match(/it\(/g);
  const testCount = itMatches ? itMatches.length : 0;
  
  console.log(`  - Found ${describeMatches ? describeMatches.length : 0} test suites`);
  console.log(`  - Found ${testCount} test cases`);
  
  // Check for common patterns and issues
  const checks = [
    {
      pattern: /cy\.wait\(\d+\)/g,
      type: 'warning',
      message: 'Uses hardcoded waits - consider using cy.intercept() for better reliability'
    },
    {
      pattern: /\[data-testid=["\'][^"\']+["\']\]/g,
      type: 'good',
      message: 'Uses data-testid selectors (best practice)'
    },
    {
      pattern: /cy\.get\(['"]\.[\w-]+['"]\)/g,
      type: 'warning',
      message: 'Uses class selectors - consider data-testid for stability'
    },
    {
      pattern: /cy\.get\(['"]\#[\w-]+['"]\)/g,
      type: 'warning',
      message: 'Uses ID selectors - consider data-testid for consistency'
    },
    {
      pattern: /beforeEach\(/g,
      type: 'good',
      message: 'Uses beforeEach hooks for setup'
    },
    {
      pattern: /afterEach\(/g,
      type: 'good',
      message: 'Uses afterEach hooks for cleanup'
    },
    {
      pattern: /cy\.intercept\(/g,
      type: 'good',
      message: 'Uses cy.intercept for network stubbing'
    },
    {
      pattern: /should\(/g,
      type: 'good',
      message: 'Has assertions'
    },
    {
      pattern: /console\.(log|error|warn)/g,
      type: 'warning',
      message: 'Contains console statements - remove for production'
    },
    {
      pattern: /\.(only|skip)\(/g,
      type: 'error',
      message: 'Contains .only() or .skip() - remove before committing'
    }
  ];
  
  const results = {
    good: [],
    warnings: [],
    errors: []
  };
  
  checks.forEach(check => {
    const matches = content.match(check.pattern);
    if (matches && matches.length > 0) {
      const result = `${check.message} (${matches.length} occurrences)`;
      if (check.type === 'good') {
        results.good.push(result);
      } else if (check.type === 'warning') {
        results.warnings.push(result);
        issues.warnings.push(`${fileName}: ${result}`);
      } else if (check.type === 'error') {
        results.errors.push(result);
        issues.errors.push(`${fileName}: ${result}`);
      }
    }
  });
  
  // Print results for this file
  if (results.good.length > 0) {
    console.log('  ✅ Good practices:');
    results.good.forEach(r => console.log(`     - ${r}`));
  }
  
  if (results.warnings.length > 0) {
    console.log('  ⚠️  Warnings:');
    results.warnings.forEach(r => console.log(`     - ${r}`));
  }
  
  if (results.errors.length > 0) {
    console.log('  ❌ Errors:');
    results.errors.forEach(r => console.log(`     - ${r}`));
  }
  
  // Check test coverage
  const testCoverage = analyzeTestCoverage(fileName, content);
  if (testCoverage.missing.length > 0) {
    console.log('  📋 Missing test coverage:');
    testCoverage.missing.forEach(m => {
      console.log(`     - ${m}`);
      issues.suggestions.push(`${fileName}: Add tests for ${m}`);
    });
  }
  
  return { testCount, ...results };
};

// Analyze test coverage based on file
const analyzeTestCoverage = (fileName, content) => {
  const coverage = {
    missing: []
  };
  
  switch(fileName) {
    case 'auth.cy.js':
      if (!content.includes('password reset')) coverage.missing.push('password reset flow');
      if (!content.includes('remember me')) coverage.missing.push('remember me functionality');
      if (!content.includes('SSO')) coverage.missing.push('SSO login');
      break;
      
    case 'dashboard.cy.js':
      if (!content.includes('export')) coverage.missing.push('data export functionality');
      if (!content.includes('filter')) coverage.missing.push('advanced filtering');
      if (!content.includes('real-time')) coverage.missing.push('real-time updates');
      break;
      
    case 'suppliers.cy.js':
      if (!content.includes('bulk')) coverage.missing.push('bulk operations');
      if (!content.includes('import')) coverage.missing.push('import functionality');
      if (!content.includes('archive')) coverage.missing.push('archive/restore');
      break;
      
    case 'customers.cy.js':
      if (!content.includes('merge')) coverage.missing.push('customer merge');
      if (!content.includes('duplicate')) coverage.missing.push('duplicate detection');
      if (!content.includes('tags')) coverage.missing.push('customer tagging');
      break;
      
    case 'inspections.cy.js':
      if (!content.includes('schedule')) coverage.missing.push('inspection scheduling');
      if (!content.includes('template')) coverage.missing.push('inspection templates');
      if (!content.includes('mobile')) coverage.missing.push('mobile view testing');
      break;
  }
  
  return coverage;
};

// Check for accessibility testing
const checkAccessibility = () => {
  console.log('\n♿ Accessibility Testing:');
  
  let hasA11yTesting = false;
  const testFiles = fs.readdirSync('cypress/e2e');
  
  testFiles.forEach(file => {
    const content = fs.readFileSync(path.join('cypress/e2e', file), 'utf8');
    if (content.includes('injectAxe') || content.includes('checkA11y')) {
      hasA11yTesting = true;
    }
  });
  
  if (!hasA11yTesting) {
    console.log('  ⚠️  No accessibility testing found');
    issues.suggestions.push('Consider adding cypress-axe for accessibility testing');
  } else {
    console.log('  ✅ Accessibility testing detected');
  }
};

// Check for visual regression testing
const checkVisualTesting = () => {
  console.log('\n📸 Visual Regression Testing:');
  
  let hasVisualTesting = false;
  const testFiles = fs.readdirSync('cypress/e2e');
  
  testFiles.forEach(file => {
    const content = fs.readFileSync(path.join('cypress/e2e', file), 'utf8');
    if (content.includes('matchImageSnapshot') || content.includes('screenshot')) {
      hasVisualTesting = true;
    }
  });
  
  if (!hasVisualTesting) {
    console.log('  ⚠️  No visual regression testing found');
    issues.suggestions.push('Consider adding visual regression tests with cypress-image-snapshot');
  } else {
    console.log('  ✅ Visual testing detected');
  }
};

// Generate summary report
const generateSummary = (testStats) => {
  console.log('\n' + '='.repeat(60));
  console.log('📊 E2E TEST QUALITY SUMMARY');
  console.log('='.repeat(60));
  
  const totalTests = Object.values(testStats).reduce((sum, stat) => sum + stat.testCount, 0);
  
  console.log(`\n📈 Test Statistics:`);
  console.log(`  Total test files: ${Object.keys(testStats).length}`);
  console.log(`  Total test cases: ${totalTests}`);
  console.log(`  Average tests per file: ${Math.round(totalTests / Object.keys(testStats).length)}`);
  
  if (issues.errors.length > 0) {
    console.log('\n❌ Critical Issues:');
    issues.errors.forEach(e => console.log(`  - ${e}`));
  }
  
  if (issues.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    issues.warnings.slice(0, 5).forEach(w => console.log(`  - ${w}`));
    if (issues.warnings.length > 5) {
      console.log(`  ... and ${issues.warnings.length - 5} more`);
    }
  }
  
  if (issues.suggestions.length > 0) {
    console.log('\n💡 Suggestions:');
    issues.suggestions.slice(0, 5).forEach(s => console.log(`  - ${s}`));
    if (issues.suggestions.length > 5) {
      console.log(`  ... and ${issues.suggestions.length - 5} more`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  
  const score = calculateQualityScore(totalTests, issues);
  console.log(`\n🏆 E2E Test Quality Score: ${score}/100`);
  
  if (score >= 80) {
    console.log('✅ Excellent test quality!');
  } else if (score >= 60) {
    console.log('⚠️  Good test quality, but there\'s room for improvement');
  } else {
    console.log('❌ Test quality needs significant improvement');
  }
};

// Calculate quality score
const calculateQualityScore = (totalTests, issues) => {
  let score = 100;
  
  // Deduct points for issues
  score -= issues.errors.length * 10;
  score -= issues.warnings.length * 2;
  score -= issues.suggestions.length * 1;
  
  // Bonus points for good coverage
  if (totalTests > 50) score += 10;
  if (totalTests > 100) score += 10;
  
  return Math.max(0, Math.min(100, score));
};

// Main execution
const main = () => {
  const testFiles = fs.readdirSync('cypress/e2e').filter(f => f.endsWith('.cy.js'));
  const testStats = {};
  
  testFiles.forEach(file => {
    const stats = analyzeTestFile(path.join('cypress/e2e', file));
    testStats[file] = stats;
  });
  
  checkAccessibility();
  checkVisualTesting();
  
  generateSummary(testStats);
  
  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    stats: testStats,
    issues: issues,
    score: calculateQualityScore(
      Object.values(testStats).reduce((sum, stat) => sum + stat.testCount, 0),
      issues
    )
  };
  
  fs.writeFileSync(
    'cypress/e2e-analysis-report.json',
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n💾 Full report saved to: cypress/e2e-analysis-report.json');
};

main();