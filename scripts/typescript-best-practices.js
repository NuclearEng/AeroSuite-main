#!/usr/bin/env node

/**
 * TypeScript Best Practices Checker
 * Based on official TypeScript documentation and best practices
 * Reference: https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TypeScriptBestPracticesChecker {
  constructor() {
    this.checks = {
      // Type inference checks
      inferenceChecks: [
        {
          name: 'Explicit any usage',
          pattern: /:\s*any(?:\s|;|,|\)|>)/g,
          severity: 'warning',
          message: 'Avoid using "any" type. Use specific types or "unknown" instead.',
          fix: 'Replace "any" with specific type or "unknown"'
        },
        {
          name: 'Missing return types',
          pattern: /(?:function|=>)\s+\w+\s*\([^)]*\)\s*{/g,
          severity: 'warning',
          message: 'Functions should have explicit return types',
          fix: 'Add explicit return type annotation'
        }
      ],
      
      // Interface vs Type checks
      interfaceChecks: [
        {
          name: 'Type alias for object shapes',
          pattern: /type\s+\w+\s*=\s*{[^}]+}/g,
          severity: 'info',
          message: 'Prefer interface over type for object shapes',
          fix: 'Convert type alias to interface'
        }
      ],
      
      // Union type checks
      unionChecks: [
        {
          name: 'String literal unions',
          pattern: /type\s+\w+\s*=\s*["'][^"']+["']\s*\|/g,
          severity: 'good',
          message: 'Good use of string literal unions for type safety'
        }
      ],
      
      // Generic usage checks
      genericChecks: [
        {
          name: 'Array without generics',
          pattern: /:\s*Array(?!\s*<)/g,
          severity: 'warning',
          message: 'Use generics with Array type (Array<T>)',
          fix: 'Specify array element type: Array<Type>'
        },
        {
          name: 'Object type usage',
          pattern: /:\s*[Oo]bject(?:\s|;|,|\)|>)/g,
          severity: 'error',
          message: 'Avoid using "Object" or "object" type. Use specific interface or type',
          fix: 'Define specific interface for object shape'
        }
      ],
      
      // Structural typing checks
      structuralChecks: [
        {
          name: 'Duck typing usage',
          pattern: /interface\s+\w+\s*{[^}]+}/g,
          severity: 'good',
          message: 'Good use of interfaces for structural typing'
        }
      ],
      
      // Type assertion checks
      assertionChecks: [
        {
          name: 'Type assertions',
          pattern: /as\s+\w+/g,
          severity: 'info',
          message: 'Type assertion used - ensure this is necessary',
          fix: 'Consider using type guards instead of assertions'
        },
        {
          name: 'Non-null assertions',
          pattern: /\w+!/g,
          severity: 'warning',
          message: 'Non-null assertion used - ensure value cannot be null',
          fix: 'Add proper null checks or use optional chaining'
        }
      ]
    };
  }

  async checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const results = {
      file: filePath,
      issues: [],
      good: [],
      stats: {
        errors: 0,
        warnings: 0,
        info: 0,
        good: 0
      }
    };

    // Skip if not a TypeScript file
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) {
      return results;
    }

    // Run all checks
    Object.entries(this.checks).forEach(([category, checks]) => {
      checks.forEach(check => {
        const matches = content.match(check.pattern);
        if (matches) {
          const entry = {
            category,
            name: check.name,
            severity: check.severity,
            message: check.message,
            occurrences: matches.length,
            fix: check.fix
          };

          if (check.severity === 'good') {
            results.good.push(entry);
            results.stats.good += matches.length;
          } else {
            results.issues.push(entry);
            results.stats[check.severity] += matches.length;
          }
        }
      });
    });

    return results;
  }

  async checkProject(projectPath) {
    const allResults = [];
    const files = this.getTypeScriptFiles(projectPath);
    
    for (const file of files) {
      const result = await this.checkFile(file);
      if (result.issues.length > 0 || result.good.length > 0) {
        allResults.push(result);
      }
    }

    return this.generateReport(allResults);
  }

  getTypeScriptFiles(dir, files = []) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      
      // Skip node_modules and build directories
      if (item === 'node_modules' || item === 'build' || item === 'dist') {
        continue;
      }
      
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        this.getTypeScriptFiles(fullPath, files);
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  generateReport(results) {
    const summary = {
      totalFiles: results.length,
      totalIssues: 0,
      totalGood: 0,
      byCategory: {},
      bySeverity: {
        error: 0,
        warning: 0,
        info: 0,
        good: 0
      },
      topIssues: [],
      recommendations: []
    };

    // Aggregate results
    results.forEach(result => {
      summary.totalIssues += result.issues.length;
      summary.totalGood += result.good.length;
      
      Object.entries(result.stats).forEach(([severity, count]) => {
        summary.bySeverity[severity] += count;
      });
    });

    // Find top issues
    const issueMap = new Map();
    results.forEach(result => {
      result.issues.forEach(issue => {
        const key = `${issue.category}:${issue.name}`;
        if (!issueMap.has(key)) {
          issueMap.set(key, {
            ...issue,
            totalOccurrences: 0,
            files: []
          });
        }
        const entry = issueMap.get(key);
        entry.totalOccurrences += issue.occurrences;
        entry.files.push(result.file);
      });
    });

    summary.topIssues = Array.from(issueMap.values())
      .sort((a, b) => b.totalOccurrences - a.totalOccurrences)
      .slice(0, 10);

    // Generate recommendations
    summary.recommendations = this.generateRecommendations(summary);

    return {
      summary,
      details: results,
      timestamp: new Date().toISOString()
    };
  }

  generateRecommendations(summary) {
    const recommendations = [];

    if (summary.bySeverity.error > 0) {
      recommendations.push({
        priority: 'high',
        message: 'Fix all error-level issues immediately',
        action: 'Replace Object types with specific interfaces'
      });
    }

    if (summary.topIssues.some(issue => issue.name === 'Explicit any usage')) {
      recommendations.push({
        priority: 'medium',
        message: 'Reduce usage of "any" type',
        action: 'Use specific types, unknown, or generics instead of any'
      });
    }

    if (summary.topIssues.some(issue => issue.name === 'Missing return types')) {
      recommendations.push({
        priority: 'medium',
        message: 'Add explicit return types to functions',
        action: 'Enable noImplicitReturns in tsconfig.json'
      });
    }

    if (summary.bySeverity.good < summary.totalFiles * 2) {
      recommendations.push({
        priority: 'low',
        message: 'Increase usage of TypeScript best practices',
        action: 'Use more interfaces, string literal unions, and proper generics'
      });
    }

    return recommendations;
  }

  async runStrictModeCheck() {
    console.log('🔍 Checking TypeScript strict mode configuration...\n');
    
    const tsconfigPaths = [
      'tsconfig.json',
      'client/tsconfig.json',
      'server/tsconfig.json'
    ];

    const results = [];

    for (const configPath of tsconfigPaths) {
      if (fs.existsSync(configPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          const compilerOptions = config.compilerOptions || {};
          
          const strictChecks = {
            strict: compilerOptions.strict || false,
            noImplicitAny: compilerOptions.noImplicitAny || false,
            strictNullChecks: compilerOptions.strictNullChecks || false,
            strictFunctionTypes: compilerOptions.strictFunctionTypes || false,
            strictBindCallApply: compilerOptions.strictBindCallApply || false,
            strictPropertyInitialization: compilerOptions.strictPropertyInitialization || false,
            noImplicitThis: compilerOptions.noImplicitThis || false,
            alwaysStrict: compilerOptions.alwaysStrict || false
          };

          results.push({
            file: configPath,
            strictMode: strictChecks.strict,
            checks: strictChecks
          });
        } catch (error) {
          console.error(`Error reading ${configPath}:`, error.message);
        }
      }
    }

    return results;
  }

  displayReport(report) {
    console.log('\n📊 TypeScript Best Practices Report');
    console.log('=====================================\n');
    
    const { summary } = report;
    
    console.log(`📁 Files analyzed: ${summary.totalFiles}`);
    console.log(`⚠️  Total issues: ${summary.totalIssues}`);
    console.log(`✅ Good practices: ${summary.totalGood}`);
    
    console.log('\n📈 Issues by severity:');
    Object.entries(summary.bySeverity).forEach(([severity, count]) => {
      if (severity !== 'good' && count > 0) {
        const icon = severity === 'error' ? '❌' : severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`  ${icon} ${severity}: ${count}`);
      }
    });
    
    if (summary.topIssues.length > 0) {
      console.log('\n🔝 Top issues:');
      summary.topIssues.slice(0, 5).forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.name} (${issue.totalOccurrences} occurrences)`);
        console.log(`     ${issue.message}`);
        if (issue.fix) {
          console.log(`     💡 Fix: ${issue.fix}`);
        }
      });
    }
    
    if (summary.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      summary.recommendations.forEach(rec => {
        const icon = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
        console.log(`  ${icon} ${rec.message}`);
        console.log(`     Action: ${rec.action}`);
      });
    }
    
    console.log('\n✨ Good practices found:');
    const goodPractices = report.details.flatMap(r => r.good);
    const goodByType = {};
    goodPractices.forEach(good => {
      goodByType[good.name] = (goodByType[good.name] || 0) + good.occurrences;
    });
    Object.entries(goodByType).forEach(([name, count]) => {
      console.log(`  ✅ ${name}: ${count} instances`);
    });
  }
}

// CLI usage
if (require.main === module) {
  const checker = new TypeScriptBestPracticesChecker();
  const args = process.argv.slice(2);
  
  const projectPath = args[0] || process.cwd();
  
  console.log('🚀 TypeScript Best Practices Checker');
  console.log('Based on: https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html\n');
  
  Promise.all([
    checker.checkProject(projectPath),
    checker.runStrictModeCheck()
  ]).then(([report, strictModeResults]) => {
    // Display main report
    checker.displayReport(report);
    
    // Display strict mode results
    console.log('\n🔒 Strict Mode Configuration:');
    strictModeResults.forEach(result => {
      console.log(`\n  ${result.file}:`);
      console.log(`    Strict mode: ${result.strictMode ? '✅ Enabled' : '❌ Disabled'}`);
      if (!result.strictMode) {
        console.log('    Individual checks:');
        Object.entries(result.checks).forEach(([check, enabled]) => {
          console.log(`      ${check}: ${enabled ? '✅' : '❌'}`);
        });
      }
    });
    
    // Save report
    const reportPath = 'typescript-best-practices-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📝 Full report saved to: ${reportPath}`);
    
    // Exit with error if there are high-priority issues
    const hasErrors = report.summary.bySeverity.error > 0;
    process.exit(hasErrors ? 1 : 0);
  }).catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

module.exports = TypeScriptBestPracticesChecker;