#!/usr/bin/env node

/**
 * TypeScript Error Feeder
 * Feeds TypeScript errors from various sources into the testing pipeline
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const TypeScriptErrorParser = require('./typescript-error-parser');
const TypeScriptAutoFixer = require('./typescript-auto-fix');

class TypeScriptErrorFeeder {
  constructor(options = {}) {
    this.options = {
      inputFile: options.inputFile,
      outputFile: options.outputFile || 'typescript-errors.json',
      autoFix: options.autoFix || false,
      dryRun: options.dryRun || false,
      ...options
    };
    
    this.parser = new TypeScriptErrorParser();
    this.fixer = new TypeScriptAutoFixer();
  }

  async feedErrors(errorText) {
    console.log('📥 TypeScript Error Feeder\n');
    
    // Parse errors
    console.log('Parsing errors...');
    const errors = this.parser.parseError(errorText);
    const report = this.parser.generateReport(errors);
    
    console.log(`Found ${errors.length} errors:`);
    console.log(`  - Auto-fixable: ${report.summary.autoFixable}`);
    console.log(`  - Manual fix required: ${errors.length - report.summary.autoFixable}`);
    
    // Save error report
    fs.writeFileSync(this.options.outputFile, JSON.stringify(report, null, 2));
    console.log(`\n📝 Error report saved to: ${this.options.outputFile}`);
    
    // Display errors by file
    console.log('\nErrors by file:');
    Object.entries(report.summary.byFile).forEach(([file, count]) => {
      console.log(`  ${file}: ${count} errors`);
    });
    
    // If auto-fix is enabled
    if (this.options.autoFix && !this.options.dryRun) {
      console.log('\n🔧 Attempting auto-fixes...\n');
      
      const { fixedErrors, failedErrors } = await this.fixer.fixErrors(report.errors);
      
      console.log(`\nFix Results:`);
      console.log(`  ✅ Fixed: ${fixedErrors.length}`);
      console.log(`  ❌ Failed: ${failedErrors.length}`);
      
      // Generate fix report
      const fixReport = this.fixer.generateFixReport(fixedErrors, failedErrors);
      const fixReportPath = this.options.outputFile.replace('.json', '-fix-report.json');
      fs.writeFileSync(fixReportPath, JSON.stringify(fixReport, null, 2));
      console.log(`\n📝 Fix report saved to: ${fixReportPath}`);
      
      // Show which files were modified
      if (fixedErrors.length > 0) {
        const modifiedFiles = [...new Set(fixedErrors.map(e => e.file))];
        console.log('\nModified files:');
        modifiedFiles.forEach(file => {
          console.log(`  ✏️  ${file}`);
        });
      }
      
      return { report, fixReport };
    } else if (this.options.dryRun) {
      console.log('\n🔍 Dry run mode - no fixes applied');
      
      // Show what would be fixed
      const autoFixable = report.errors.filter(e => e.suggestedFix?.autoFixable);
      if (autoFixable.length > 0) {
        console.log('\nWould fix:');
        autoFixable.forEach(error => {
          console.log(`  - ${error.file}:${error.line} - ${error.code}: ${error.suggestedFix.description}`);
        });
      }
    }
    
    return { report };
  }

  async feedFromBuildOutput() {
    console.log('🏗️  Capturing build errors...\n');
    
    try {
      // Try to build and capture errors
      execSync('cd client && npm run build', {
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      
      console.log('✅ Build successful - no errors found');
      return { report: { errors: [] } };
    } catch (error) {
      // Build failed, feed the errors
      const errorText = error.stdout + '\n' + error.stderr;
      return await this.feedErrors(errorText);
    }
  }

  async feedFromTypeCheck() {
    console.log('🔍 Running type check...\n');
    
    try {
      // Run TypeScript compiler in check mode
      execSync('cd client && npx tsc --noEmit', {
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      
      console.log('✅ Type check passed - no errors found');
      return { report: { errors: [] } };
    } catch (error) {
      // Type check failed, feed the errors
      const errorText = error.stdout + '\n' + error.stderr;
      return await this.feedErrors(errorText);
    }
  }

  async feedFromFile(filePath) {
    console.log(`📄 Reading errors from ${filePath}...\n`);
    
    const errorText = fs.readFileSync(filePath, 'utf-8');
    return await this.feedErrors(errorText);
  }

  async feedFromStdin() {
    console.log('⌨️  Reading errors from stdin...\n');
    
    const errorText = fs.readFileSync(0, 'utf-8');
    return await this.feedErrors(errorText);
  }

  async generateTestReport(results) {
    const testReport = {
      timestamp: new Date().toISOString(),
      source: this.options.source || 'unknown',
      summary: {
        totalErrors: results.report.summary.total,
        autoFixable: results.report.summary.autoFixable,
        fixed: results.fixReport?.summary.fixed || 0,
        remaining: results.fixReport?.summary.failed || results.report.summary.total
      },
      errorTypes: results.report.summary.byType,
      filesAffected: Object.keys(results.report.summary.byFile).length,
      topIssues: Object.entries(results.report.summary.byType)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([type, count]) => ({ type, count }))
    };
    
    const testReportPath = 'typescript-test-report.json';
    fs.writeFileSync(testReportPath, JSON.stringify(testReport, null, 2));
    
    console.log('\n📊 Test Report Summary:');
    console.log(`  Total errors: ${testReport.summary.totalErrors}`);
    console.log(`  Auto-fixable: ${testReport.summary.autoFixable}`);
    if (results.fixReport) {
      console.log(`  Fixed: ${testReport.summary.fixed}`);
      console.log(`  Remaining: ${testReport.summary.remaining}`);
    }
    console.log(`  Files affected: ${testReport.filesAffected}`);
    
    console.log('\n  Top issues:');
    testReport.topIssues.forEach(({ type, count }) => {
      console.log(`    ${type}: ${count}`);
    });
    
    console.log(`\n📝 Test report saved to: ${testReportPath}`);
    
    return testReport;
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  const options = {
    autoFix: args.includes('--auto-fix') || args.includes('-f'),
    dryRun: args.includes('--dry-run') || args.includes('-d'),
  };
  
  // Determine input source
  if (args.includes('--build')) {
    options.source = 'build';
  } else if (args.includes('--type-check')) {
    options.source = 'type-check';
  } else if (args[0] && !args[0].startsWith('-')) {
    options.source = 'file';
    options.inputFile = args[0];
  } else {
    options.source = 'stdin';
  }
  
  const feeder = new TypeScriptErrorFeeder(options);
  
  // Process based on source
  let processPromise;
  switch (options.source) {
    case 'build':
      processPromise = feeder.feedFromBuildOutput();
      break;
    case 'type-check':
      processPromise = feeder.feedFromTypeCheck();
      break;
    case 'file':
      processPromise = feeder.feedFromFile(options.inputFile);
      break;
    default:
      processPromise = feeder.feedFromStdin();
  }
  
  processPromise
    .then(results => feeder.generateTestReport(results))
    .then(report => {
      // Exit with error if there are remaining errors
      const exitCode = report.summary.remaining > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = TypeScriptErrorFeeder;