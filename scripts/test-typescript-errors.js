#!/usr/bin/env node

/**
 * TypeScript Error Testing Script
 * Detects and reports TypeScript errors in the codebase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const TypeScriptErrorParser = require('./typescript-error-parser');
const TypeScriptAutoFixer = require('./typescript-auto-fix');

class TypeScriptErrorTester {
  constructor(options = {}) {
    this.options = {
      autoFix: options.autoFix || false,
      reportPath: options.reportPath || 'typescript-errors.json',
      fixReportPath: options.fixReportPath || 'typescript-fix-report.json',
      projectPath: options.projectPath || process.cwd(),
      ...options
    };
    
    this.parser = new TypeScriptErrorParser();
    this.fixer = new TypeScriptAutoFixer();
  }

  async run() {
    console.log('🔍 TypeScript Error Detection Test\n');
    
    // Step 1: Compile TypeScript and capture errors
    console.log('Step 1: Compiling TypeScript...');
    const errors = await this.compileAndCaptureErrors();
    
    if (errors.length === 0) {
      console.log('✅ No TypeScript errors found!');
      return { success: true, errors: [] };
    }
    
    // Step 2: Parse and analyze errors
    console.log(`\nStep 2: Parsing ${errors.length} errors...`);
    const errorReport = this.parser.generateReport(errors);
    
    // Save error report
    fs.writeFileSync(this.options.reportPath, JSON.stringify(errorReport, null, 2));
    console.log(`📝 Error report saved to: ${this.options.reportPath}`);
    
    // Display summary
    this.displayErrorSummary(errorReport);
    
    // Step 3: Auto-fix if requested
    if (this.options.autoFix) {
      console.log('\nStep 3: Attempting auto-fixes...');
      const fixResult = await this.fixer.fixErrors(errorReport.errors);
      const fixReport = this.fixer.generateFixReport(fixResult.fixedErrors, fixResult.failedErrors);
      
      // Save fix report
      fs.writeFileSync(this.options.fixReportPath, JSON.stringify(fixReport, null, 2));
      console.log(`📝 Fix report saved to: ${this.options.fixReportPath}`);
      
      // Re-compile to check remaining errors
      if (fixResult.fixedErrors.length > 0) {
        console.log('\nStep 4: Re-checking after fixes...');
        const remainingErrors = await this.compileAndCaptureErrors();
        
        if (remainingErrors.length === 0) {
          console.log('✅ All auto-fixable errors resolved!');
        } else {
          console.log(`⚠️  ${remainingErrors.length} errors remain after auto-fix`);
        }
      }
      
      return {
        success: fixResult.failedErrors.length === 0,
        originalErrors: errorReport.errors,
        fixedErrors: fixResult.fixedErrors,
        remainingErrors: fixResult.failedErrors
      };
    }
    
    return {
      success: false,
      errors: errorReport.errors
    };
  }

  async compileAndCaptureErrors() {
    const errors = [];
    
    try {
      // Try to compile the TypeScript project
      const tscPath = path.join(this.options.projectPath, 'node_modules', '.bin', 'tsc');
      const configPath = path.join(this.options.projectPath, 'tsconfig.json');
      
      if (!fs.existsSync(configPath)) {
        // Try client directory
        const clientConfigPath = path.join(this.options.projectPath, 'client', 'tsconfig.json');
        if (fs.existsSync(clientConfigPath)) {
          const output = execSync(`cd client && ${tscPath} --noEmit`, {
            encoding: 'utf-8',
            stdio: 'pipe'
          });
        }
      } else {
        execSync(`${tscPath} --noEmit`, {
          encoding: 'utf-8',
          stdio: 'pipe'
        });
      }
    } catch (error) {
      // TypeScript compilation failed, parse the errors
      if (error.stdout) {
        const errorOutput = error.stdout + '\n' + error.stderr;
        errors.push(...this.parser.parseError(errorOutput));
      }
    }
    
    return errors;
  }

  displayErrorSummary(report) {
    console.log('\n📊 Error Summary:');
    console.log(`  Total errors: ${report.summary.total}`);
    console.log(`  Auto-fixable: ${report.summary.autoFixable} (${((report.summary.autoFixable / report.summary.total) * 100).toFixed(1)}%)`);
    
    console.log('\n  Errors by type:');
    Object.entries(report.summary.byType)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`    ${type}: ${count}`);
      });
    
    console.log('\n  Top files with errors:');
    Object.entries(report.summary.byFile)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([file, count]) => {
        console.log(`    ${path.basename(file)}: ${count} errors`);
      });
  }

  async runContinuousMode() {
    console.log('🔄 Running in continuous mode...\n');
    
    const runTest = async () => {
      const startTime = Date.now();
      const result = await this.run();
      const duration = Date.now() - startTime;
      
      console.log(`\n⏱️  Test completed in ${(duration / 1000).toFixed(2)}s`);
      
      if (result.success) {
        console.log('✅ All tests passed!');
      } else {
        console.log(`❌ ${result.errors?.length || result.remainingErrors?.length} errors found`);
      }
      
      return result;
    };
    
    // Run initial test
    await runTest();
    
    // Watch for changes
    console.log('\n👁️  Watching for file changes...');
    const srcPath = path.join(this.options.projectPath, 'src');
    const clientSrcPath = path.join(this.options.projectPath, 'client', 'src');
    
    const watchPaths = [];
    if (fs.existsSync(srcPath)) watchPaths.push(srcPath);
    if (fs.existsSync(clientSrcPath)) watchPaths.push(clientSrcPath);
    
    if (watchPaths.length > 0) {
      const chokidar = require('chokidar');
      const watcher = chokidar.watch(watchPaths, {
        ignored: /node_modules/,
        persistent: true
      });
      
      let timeout;
      watcher.on('change', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          console.log('\n🔄 Changes detected, re-running tests...');
          runTest();
        }, 1000);
      });
    }
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    autoFix: args.includes('--auto-fix'),
    continuous: args.includes('--watch') || args.includes('-w'),
    projectPath: process.cwd()
  };
  
  const tester = new TypeScriptErrorTester(options);
  
  if (options.continuous) {
    tester.runContinuousMode().catch(console.error);
  } else {
    tester.run().then(result => {
      process.exit(result.success ? 0 : 1);
    }).catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
  }
}

module.exports = TypeScriptErrorTester;