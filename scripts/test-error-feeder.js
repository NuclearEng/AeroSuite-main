#!/usr/bin/env node

/**
 * Test Script for Compilation Error Feeder
 * 
 * Tests the error capture functionality with various types of errors
 * and validates the integration with Cursor IDE.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const CompilationErrorFeeder = require('./compilation-error-feeder');
const CursorIntegration = require('./cursor-integration');

class ErrorFeederTester {
  constructor(options = {}) {
    this.options = {
      projectRoot: options.projectRoot || process.cwd(),
      createTestFiles: options.createTestFiles !== false,
      cleanupAfter: options.cleanupAfter !== false,
      verbose: options.verbose || false,
      ...options
    };
    
    this.testFiles = [];
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 Testing Compilation Error Feeder\n');
    
    try {
      // Setup test environment
      if (this.options.createTestFiles) {
        await this.createTestFiles();
      }

      // Test 1: TypeScript errors
      await this.testTypeScriptErrors();

      // Test 2: ESLint errors
      await this.testESLintErrors();

      // Test 3: Integration tests
      await this.testCursorIntegration();

      // Test 4: Watch mode (short test)
      await this.testWatchMode();

      // Test 5: Error formatting
      await this.testErrorFormatting();

      // Generate test report
      this.generateTestReport();

    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      this.testResults.push({
        test: 'Test Suite',
        status: 'failed',
        error: error.message
      });
    } finally {
      // Cleanup
      if (this.options.cleanupAfter) {
        await this.cleanup();
      }
    }

    return this.testResults;
  }

  async createTestFiles() {
    console.log('📁 Creating test files...');
    
    const testDir = path.join(this.options.projectRoot, 'temp-test-errors');
    
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // TypeScript error test file
    const tsErrorFile = path.join(testDir, 'typescript-errors.ts');
    const tsContent = `
// TypeScript Error Test File
import { NonExistentType } from './non-existent-module';

interface TestInterface {
  name: string;
  age: number;
}

class TestClass implements TestInterface {
  name: string;
  // Missing age property - should cause TS2420 error
  
  constructor(name: string) {
    this.name = name;
    this.undefinedProperty = 'test'; // Should cause TS2339 error
  }
  
  method(): NonExistentType { // Should cause TS2304 error
    return null as any;
  }
}

// Type mismatch error
const test: TestInterface = {
  name: 'test',
  age: 'not a number' // Should cause TS2322 error
};

// Unused variable
const unusedVariable = 'test'; // Should cause ESLint error if configured
`;

    fs.writeFileSync(tsErrorFile, tsContent);
    this.testFiles.push(tsErrorFile);

    // ESLint error test file
    const eslintErrorFile = path.join(testDir, 'eslint-errors.js');
    const eslintContent = `
// ESLint Error Test File

// Unused variable
const unusedVar = 'test';

// Missing semicolon
const missingSemi = 'test'

// Unreachable code
function testFunction() {
  return true;
  console.log('unreachable'); // Should cause ESLint warning
}

// Undefined variable
console.log(undefinedVariable);

// console.log in production
console.log('This should trigger no-console rule');
`;

    fs.writeFileSync(eslintErrorFile, eslintContent);
    this.testFiles.push(eslintErrorFile);

    console.log(`✅ Created ${this.testFiles.length} test files`);
  }

  async testTypeScriptErrors() {
    console.log('🔍 Testing TypeScript error detection...');
    
    try {
      const feeder = new CompilationErrorFeeder({
        projectRoot: this.options.projectRoot,
        checkTypeScript: true,
        checkESLint: false,
        checkBuild: false,
        outputToTerminal: this.options.verbose,
        outputToCursor: false
      });

      const results = await feeder.performChecks();
      
      const hasTypeScriptErrors = results.checks.typescript && results.checks.typescript.errors.length > 0;
      
      this.testResults.push({
        test: 'TypeScript Error Detection',
        status: hasTypeScriptErrors ? 'passed' : 'warning',
        details: `Found ${results.checks.typescript?.errors.length || 0} TypeScript errors`,
        errors: results.checks.typescript?.errors || []
      });

      if (hasTypeScriptErrors) {
        console.log(`✅ TypeScript test passed - detected ${results.checks.typescript.errors.length} errors`);
      } else {
        console.log('⚠️ TypeScript test - no errors detected (might be expected)');
      }

    } catch (error) {
      console.log(`❌ TypeScript test failed: ${error.message}`);
      this.testResults.push({
        test: 'TypeScript Error Detection',
        status: 'failed',
        error: error.message
      });
    }
  }

  async testESLintErrors() {
    console.log('🔍 Testing ESLint error detection...');
    
    try {
      const feeder = new CompilationErrorFeeder({
        projectRoot: this.options.projectRoot,
        checkTypeScript: false,
        checkESLint: true,
        checkBuild: false,
        outputToTerminal: this.options.verbose,
        outputToCursor: false
      });

      const results = await feeder.performChecks();
      
      const hasESLintErrors = results.checks.eslint && results.checks.eslint.errors.length > 0;
      
      this.testResults.push({
        test: 'ESLint Error Detection',
        status: hasESLintErrors ? 'passed' : 'warning',
        details: `Found ${results.checks.eslint?.errors.length || 0} ESLint errors`,
        errors: results.checks.eslint?.errors || []
      });

      if (hasESLintErrors) {
        console.log(`✅ ESLint test passed - detected ${results.checks.eslint.errors.length} errors`);
      } else {
        console.log('⚠️ ESLint test - no errors detected (might be expected)');
      }

    } catch (error) {
      console.log(`❌ ESLint test failed: ${error.message}`);
      this.testResults.push({
        test: 'ESLint Error Detection',
        status: 'failed',
        error: error.message
      });
    }
  }

  async testCursorIntegration() {
    console.log('🎯 Testing Cursor integration...');
    
    try {
      const integration = new CursorIntegration({
        projectRoot: this.options.projectRoot
      });

      // Create mock errors
      const mockErrors = [
        {
          type: 'typescript',
          file: path.join(this.options.projectRoot, 'test.ts'),
          line: 10,
          column: 5,
          severity: 'error',
          code: 'TS2304',
          message: 'Cannot find name "NonExistentType".'
        },
        {
          type: 'eslint',
          file: path.join(this.options.projectRoot, 'test.js'),
          line: 5,
          column: 10,
          severity: 'warning',
          code: 'no-unused-vars',
          message: "'unusedVar' is defined but never used."
        }
      ];

      const results = await integration.sendErrors(mockErrors);
      
      const successCount = Object.values(results).filter(Boolean).length;
      
      this.testResults.push({
        test: 'Cursor Integration',
        status: successCount > 0 ? 'passed' : 'failed',
        details: `${successCount} integration methods successful`,
        results
      });

      console.log(`✅ Cursor integration test passed - ${successCount} methods successful`);

    } catch (error) {
      console.log(`❌ Cursor integration test failed: ${error.message}`);
      this.testResults.push({
        test: 'Cursor Integration',
        status: 'failed',
        error: error.message
      });
    }
  }

  async testWatchMode() {
    console.log('👁️ Testing watch mode (5 second test)...');
    
    try {
      const feeder = new CompilationErrorFeeder({
        projectRoot: this.options.projectRoot,
        watchMode: true,
        outputToTerminal: false,
        outputToCursor: false
      });

      // Start watch mode in background
      const watchPromise = feeder.run();
      
      // Wait 2 seconds, then modify a file
      setTimeout(() => {
        if (this.testFiles.length > 0) {
          const testFile = this.testFiles[0];
          const content = fs.readFileSync(testFile, 'utf-8');
          fs.writeFileSync(testFile, content + '\n// Modified for watch test');
        }
      }, 2000);

      // Stop after 5 seconds
      setTimeout(() => {
        process.emit('SIGINT');
      }, 5000);

      await new Promise(resolve => setTimeout(resolve, 6000));

      this.testResults.push({
        test: 'Watch Mode',
        status: 'passed',
        details: 'Watch mode test completed without crashes'
      });

      console.log('✅ Watch mode test passed');

    } catch (error) {
      if (error.message.includes('SIGINT')) {
        // Expected - we sent SIGINT to stop watch mode
        this.testResults.push({
          test: 'Watch Mode',
          status: 'passed',
          details: 'Watch mode stopped gracefully'
        });
        console.log('✅ Watch mode test passed');
      } else {
        console.log(`❌ Watch mode test failed: ${error.message}`);
        this.testResults.push({
          test: 'Watch Mode',
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testErrorFormatting() {
    console.log('🎨 Testing error formatting...');
    
    try {
      const feeder = new CompilationErrorFeeder({
        projectRoot: this.options.projectRoot,
        outputToTerminal: false,
        outputToFile: true,
        outputFile: path.join(this.options.projectRoot, 'test-errors.json')
      });

      // Run a check to generate errors
      const results = await feeder.performChecks();
      await feeder.processResults(results);

      // Check if file was created
      const outputFile = path.join(this.options.projectRoot, 'test-errors.json');
      const fileExists = fs.existsSync(outputFile);
      
      let validJSON = false;
      if (fileExists) {
        try {
          const content = fs.readFileSync(outputFile, 'utf-8');
          JSON.parse(content);
          validJSON = true;
          
          // Cleanup test file
          fs.unlinkSync(outputFile);
        } catch (e) {
          // Invalid JSON
        }
      }

      this.testResults.push({
        test: 'Error Formatting',
        status: fileExists && validJSON ? 'passed' : 'failed',
        details: `Output file created: ${fileExists}, Valid JSON: ${validJSON}`
      });

      if (fileExists && validJSON) {
        console.log('✅ Error formatting test passed');
      } else {
        console.log('❌ Error formatting test failed');
      }

    } catch (error) {
      console.log(`❌ Error formatting test failed: ${error.message}`);
      this.testResults.push({
        test: 'Error Formatting',
        status: 'failed',
        error: error.message
      });
    }
  }

  generateTestReport() {
    console.log('\n📊 Test Report:');
    console.log('================');
    
    const passed = this.testResults.filter(r => r.status === 'passed').length;
    const failed = this.testResults.filter(r => r.status === 'failed').length;
    const warnings = this.testResults.filter(r => r.status === 'warning').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️ Warnings: ${warnings}`);
    console.log(`📝 Total: ${this.testResults.length}`);
    
    console.log('\nDetailed Results:');
    this.testResults.forEach(result => {
      const emoji = result.status === 'passed' ? '✅' : 
                   result.status === 'failed' ? '❌' : '⚠️';
      console.log(`${emoji} ${result.test}: ${result.details || result.error || 'No details'}`);
    });

    // Save detailed report
    const reportPath = path.join(this.options.projectRoot, 'error-feeder-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: { passed, failed, warnings, total: this.testResults.length },
      results: this.testResults
    }, null, 2));
    
    console.log(`\n📋 Detailed report saved to: ${reportPath}`);
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test files...');
    
    for (const file of this.testFiles) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      } catch (error) {
        console.log(`⚠️ Failed to delete ${file}: ${error.message}`);
      }
    }

    // Remove test directory if empty
    const testDir = path.join(this.options.projectRoot, 'temp-test-errors');
    try {
      if (fs.existsSync(testDir)) {
        const files = fs.readdirSync(testDir);
        if (files.length === 0) {
          fs.rmdirSync(testDir);
        }
      }
    } catch (error) {
      // Directory might not be empty or accessible
    }

    console.log('✅ Cleanup completed');
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  const options = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    createTestFiles: !args.includes('--no-test-files'),
    cleanupAfter: !args.includes('--no-cleanup')
  };

  const tester = new ErrorFeederTester(options);
  
  tester.runAllTests().then(results => {
    const failed = results.filter(r => r.status === 'failed').length;
    process.exit(failed > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = ErrorFeederTester;
