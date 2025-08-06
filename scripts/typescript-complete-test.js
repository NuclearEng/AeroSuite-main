#!/usr/bin/env node

/**
 * Complete TypeScript Testing Suite
 * Combines error detection, best practices, and auto-fixing
 * Based on: https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const TypeScriptErrorParser = require('./typescript-error-parser');
const TypeScriptAutoFixer = require('./typescript-auto-fix');
const TypeScriptBestPracticesChecker = require('./typescript-best-practices');

class TypeScriptCompleteTester {
  constructor(options = {}) {
    this.options = {
      autoFix: options.autoFix || false,
      checkBestPractices: options.checkBestPractices !== false,
      strictMode: options.strictMode || false,
      projectPath: options.projectPath || process.cwd(),
      ...options
    };
    
    this.errorParser = new TypeScriptErrorParser();
    this.autoFixer = new TypeScriptAutoFixer();
    this.bestPracticesChecker = new TypeScriptBestPracticesChecker();
  }

  async run() {
    console.log('🚀 TypeScript Complete Testing Suite');
    console.log('=====================================\n');
    
    const results = {
      errors: null,
      bestPractices: null,
      fixes: null,
      success: true
    };
    
    try {
      // Step 1: Check TypeScript configuration
      console.log('📋 Step 1: Checking TypeScript configuration...');
      await this.checkConfiguration();
      
      // Step 2: Run best practices check
      if (this.options.checkBestPractices) {
        console.log('\n📋 Step 2: Running best practices check...');
        results.bestPractices = await this.bestPracticesChecker.checkProject(this.options.projectPath);
        this.displayBestPracticesSummary(results.bestPractices);
      }
      
      // Step 3: Compile and check for errors
      console.log('\n📋 Step 3: Compiling TypeScript and checking for errors...');
      results.errors = await this.compileAndCheckErrors();
      
      if (results.errors.errors.length > 0) {
        results.success = false;
        console.log(`❌ Found ${results.errors.summary.total} TypeScript errors`);
        
        // Step 4: Auto-fix if enabled
        if (this.options.autoFix) {
          console.log('\n📋 Step 4: Attempting auto-fixes...');
          results.fixes = await this.autoFixer.fixErrors(results.errors.errors);
          
          // Re-check after fixes
          console.log('\n📋 Step 5: Re-checking after fixes...');
          const afterFixErrors = await this.compileAndCheckErrors();
          
          if (afterFixErrors.errors.length === 0) {
            console.log('✅ All auto-fixable errors resolved!');
            results.success = true;
          } else {
            console.log(`⚠️  ${afterFixErrors.errors.length} errors remain after auto-fix`);
          }
        }
      } else {
        console.log('✅ No TypeScript errors found!');
      }
      
      // Step 6: Generate comprehensive report
      console.log('\n📋 Step 6: Generating comprehensive report...');
      const report = this.generateComprehensiveReport(results);
      
      // Save report
      const reportPath = 'typescript-complete-test-report.json';
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`📝 Report saved to: ${reportPath}`);
      
      // Display summary
      this.displayFinalSummary(report);
      
      return results;
      
    } catch (error) {
      console.error('❌ Error during testing:', error.message);
      results.success = false;
      return results;
    }
  }

  async checkConfiguration() {
    const configPaths = ['tsconfig.json', 'client/tsconfig.json', 'server/tsconfig.json'];
    const recommendations = [];
    
    for (const configPath of configPaths) {
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        const compilerOptions = config.compilerOptions || {};
        
        console.log(`\n  Checking ${configPath}:`);
        
        // Check for strict mode
        if (!compilerOptions.strict) {
          console.log('    ⚠️  Strict mode is disabled');
          recommendations.push(`Enable strict mode in ${configPath}`);
        } else {
          console.log('    ✅ Strict mode is enabled');
        }
        
        // Check for important compiler options
        const importantOptions = {
          noImplicitAny: 'Prevents implicit any types',
          strictNullChecks: 'Enables strict null checking',
          noUnusedLocals: 'Reports errors on unused locals',
          noUnusedParameters: 'Reports errors on unused parameters',
          noImplicitReturns: 'Reports error when not all code paths return',
          esModuleInterop: 'Enables emit interoperability between CommonJS and ES Modules'
        };
        
        Object.entries(importantOptions).forEach(([option, description]) => {
          if (compilerOptions[option] === false) {
            console.log(`    ⚠️  ${option} is disabled - ${description}`);
            recommendations.push(`Enable ${option} in ${configPath}`);
          }
        });
      }
    }
    
    if (recommendations.length > 0) {
      console.log('\n  💡 Configuration recommendations:');
      recommendations.forEach(rec => console.log(`    - ${rec}`));
    }
  }

  async compileAndCheckErrors() {
    const errors = [];
    
    try {
      // Try to compile TypeScript
      if (fs.existsSync('client/tsconfig.json')) {
        execSync('cd client && npx tsc --noEmit', { encoding: 'utf-8', stdio: 'pipe' });
      }
      if (fs.existsSync('server/tsconfig.json')) {
        execSync('cd server && npx tsc --noEmit', { encoding: 'utf-8', stdio: 'pipe' });
      }
    } catch (error) {
      if (error.stdout || error.stderr) {
        const errorOutput = (error.stdout || '') + '\n' + (error.stderr || '');
        errors.push(...this.errorParser.parseError(errorOutput));
      }
    }
    
    return this.errorParser.generateReport(errors);
  }

  displayBestPracticesSummary(report) {
    const { summary } = report;
    console.log('\n  Best Practices Summary:');
    console.log(`    Files analyzed: ${summary.totalFiles}`);
    console.log(`    Issues found: ${summary.totalIssues}`);
    console.log(`    Good practices: ${summary.totalGood}`);
    
    if (summary.topIssues.length > 0) {
      console.log('\n    Top issues:');
      summary.topIssues.slice(0, 3).forEach(issue => {
        console.log(`      - ${issue.name}: ${issue.totalOccurrences} occurrences`);
      });
    }
  }

  generateComprehensiveReport(results) {
    const report = {
      timestamp: new Date().toISOString(),
      success: results.success,
      summary: {
        errors: {
          total: results.errors?.summary.total || 0,
          fixed: results.fixes?.fixedErrors.length || 0,
          remaining: results.errors?.summary.total - (results.fixes?.fixedErrors.length || 0)
        },
        bestPractices: {
          issues: results.bestPractices?.summary.totalIssues || 0,
          good: results.bestPractices?.summary.totalGood || 0,
          score: this.calculateScore(results)
        }
      },
      details: {
        errors: results.errors,
        bestPractices: results.bestPractices,
        fixes: results.fixes
      },
      recommendations: this.generateRecommendations(results)
    };
    
    return report;
  }

  calculateScore(results) {
    let score = 100;
    
    // Deduct points for errors
    if (results.errors) {
      score -= Math.min(results.errors.summary.total * 2, 30);
    }
    
    // Deduct points for best practice issues
    if (results.bestPractices) {
      const { bySeverity } = results.bestPractices.summary;
      score -= bySeverity.error * 5;
      score -= bySeverity.warning * 2;
      score -= bySeverity.info * 0.5;
    }
    
    // Bonus points for good practices
    if (results.bestPractices) {
      score += Math.min(results.bestPractices.summary.totalGood * 0.5, 10);
    }
    
    return Math.max(0, Math.round(score));
  }

  generateRecommendations(results) {
    const recommendations = [];
    
    // Error-based recommendations
    if (results.errors && results.errors.summary.total > 0) {
      if (results.errors.summary.byType.cannotBeUsedAsJSX > 0) {
        recommendations.push({
          category: 'React Types',
          priority: 'high',
          message: 'Update React and type definitions to latest versions',
          action: 'npm update react react-dom @types/react @types/react-dom'
        });
      }
      
      if (results.errors.summary.byType.implicitAny > 0) {
        recommendations.push({
          category: 'Type Safety',
          priority: 'medium',
          message: 'Enable noImplicitAny in tsconfig.json',
          action: 'Set "noImplicitAny": true in compilerOptions'
        });
      }
    }
    
    // Best practices recommendations
    if (results.bestPractices) {
      results.bestPractices.summary.recommendations.forEach(rec => {
        recommendations.push({
          category: 'Best Practices',
          ...rec
        });
      });
    }
    
    // General recommendations
    if (results.success && results.errors?.summary.total === 0) {
      recommendations.push({
        category: 'Next Steps',
        priority: 'low',
        message: 'Consider enabling stricter TypeScript checks',
        action: 'Enable strict mode and additional checks in tsconfig.json'
      });
    }
    
    return recommendations;
  }

  displayFinalSummary(report) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Final Summary');
    console.log('='.repeat(60));
    
    console.log(`\n🎯 TypeScript Health Score: ${report.summary.bestPractices.score}/100`);
    
    if (report.success) {
      console.log('\n✅ All checks passed!');
    } else {
      console.log('\n❌ Some issues need attention');
    }
    
    console.log('\n📈 Metrics:');
    console.log(`  Errors: ${report.summary.errors.total} (${report.summary.errors.fixed} fixed)`);
    console.log(`  Best Practice Issues: ${report.summary.bestPractices.issues}`);
    console.log(`  Good Practices Found: ${report.summary.bestPractices.good}`);
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 Top Recommendations:');
      report.recommendations
        .sort((a, b) => {
          const priority = { high: 0, medium: 1, low: 2 };
          return (priority[a.priority] || 2) - (priority[b.priority] || 2);
        })
        .slice(0, 5)
        .forEach(rec => {
          const icon = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
          console.log(`  ${icon} [${rec.category}] ${rec.message}`);
          if (rec.action) {
            console.log(`     → ${rec.action}`);
          }
        });
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  const options = {
    autoFix: args.includes('--fix') || args.includes('-f'),
    checkBestPractices: !args.includes('--no-best-practices'),
    strictMode: args.includes('--strict'),
    projectPath: process.cwd()
  };
  
  const tester = new TypeScriptCompleteTester(options);
  
  tester.run().then(results => {
    process.exit(results.success ? 0 : 1);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = TypeScriptCompleteTester;