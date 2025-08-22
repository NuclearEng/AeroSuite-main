#!/usr/bin/env node

/**
 * Common Error Fixes Script
 * 
 * Provides automated fixes for common TypeScript and React errors
 * detected by the compilation error feeder.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CommonErrorFixer {
  constructor(options = {}) {
    this.options = {
      projectRoot: options.projectRoot || process.cwd(),
      dryRun: options.dryRun || false,
      verbose: options.verbose || false,
      ...options
    };

    this.fixes = [];
  }

  /**
   * Fix common JSX parameter type errors
   */
  async fixJSXParameterErrors() {
    console.log('🔧 Fixing JSX parameter type errors...');
    
    const filesWithErrors = [
      'src/components/dashboard/widgets/AnomalyDetectionWidget.tsx',
      'src/components/dashboard/widgets/CustomWidgetBuilder.tsx', 
      'src/pages/inspections/InspectionDetail.tsx',
      'src/pages/suppliers/components/SupplierAnalytics.tsx'
    ];

    let fixedCount = 0;

    for (const relativePath of filesWithErrors) {
      const filePath = path.join(this.options.projectRoot, relativePath);
      
      if (!fs.existsSync(filePath)) {
        if (this.options.verbose) {
          console.log(`⚠️ File not found: ${relativePath}`);
        }
        continue;
      }

      let content = fs.readFileSync(filePath, 'utf-8');
      let modified = false;

      // Fix: (param: type: any) => should be (param: type) =>
      const regex1 = /\(([^:]+):\s*([^:]+):\s*any\)\s*=>/g;
      if (regex1.test(content)) {
        content = content.replace(regex1, '($1: $2) =>');
        modified = true;
        if (this.options.verbose) {
          console.log(`  Fixed parameter type error in ${relativePath}`);
        }
      }

      // Fix: ([key, value]: [string, any]: any) => should be ([key, value]: [string, any]) =>
      const regex2 = /\(\[([^,]+),\s*([^\]]+)\]:\s*\[([^\]]+)\]:\s*any\)\s*=>/g;
      if (regex2.test(content)) {
        content = content.replace(regex2, '([$1, $2]: [$3]) =>');
        modified = true;
        if (this.options.verbose) {
          console.log(`  Fixed destructured parameter type error in ${relativePath}`);
        }
      }

      if (modified) {
        if (!this.options.dryRun) {
          fs.writeFileSync(filePath, content);
          fixedCount++;
          this.fixes.push({
            file: relativePath,
            type: 'jsx-parameter-types',
            description: 'Fixed JSX parameter type declarations'
          });
        } else {
          console.log(`  Would fix: ${relativePath}`);
        }
      }
    }

    console.log(`✅ Fixed ${fixedCount} files with JSX parameter type errors`);
    return fixedCount;
  }

  /**
   * Fix React Router context issues
   */
  async fixReactRouterErrors() {
    console.log('🔧 Checking React Router setup...');
    
    const appFiles = [
      'src/App.js',
      'src/App.tsx'
    ];

    for (const relativePath of appFiles) {
      const filePath = path.join(this.options.projectRoot, relativePath);
      
      if (!fs.existsSync(filePath)) {
        continue;
      }

      let content = fs.readFileSync(filePath, 'utf-8');
      let modified = false;

      // Check if BrowserRouter is imported
      if (!content.includes('BrowserRouter') && content.includes('Routes')) {
        // Add BrowserRouter to imports
        content = content.replace(
          /import\s*{\s*([^}]*)\s*}\s*from\s*['"]react-router-dom['"];?/,
          (match, imports) => {
            if (!imports.includes('BrowserRouter')) {
              return `import { BrowserRouter, ${imports} } from 'react-router-dom';`;
            }
            return match;
          }
        );

        // Wrap Routes in BrowserRouter
        if (!content.includes('<BrowserRouter>')) {
          content = content.replace(
            /<Routes>/,
            '<BrowserRouter>\n        <Routes>'
          );
          content = content.replace(
            /<\/Routes>/,
            '</Routes>\n      </BrowserRouter>'
          );
          modified = true;
        }
      }

      if (modified) {
        if (!this.options.dryRun) {
          fs.writeFileSync(filePath, content);
          this.fixes.push({
            file: relativePath,
            type: 'react-router',
            description: 'Fixed React Router context by adding BrowserRouter wrapper'
          });
          console.log(`✅ Fixed React Router setup in ${relativePath}`);
        } else {
          console.log(`  Would fix React Router setup in: ${relativePath}`);
        }
      } else {
        console.log(`✅ React Router setup looks correct in ${relativePath}`);
      }
    }
  }

  /**
   * Generate a fix report
   */
  generateFixReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalFixes: this.fixes.length,
      fixes: this.fixes,
      summary: {
        byType: {},
        byFile: {}
      }
    };

    // Generate summary
    this.fixes.forEach(fix => {
      report.summary.byType[fix.type] = (report.summary.byType[fix.type] || 0) + 1;
      report.summary.byFile[fix.file] = (report.summary.byFile[fix.file] || 0) + 1;
    });

    const reportPath = path.join(this.options.projectRoot, 'error-fix-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📋 Fix Report:`);
    console.log(`  Total fixes applied: ${report.totalFixes}`);
    console.log(`  Report saved to: ${reportPath}`);

    if (report.totalFixes > 0) {
      console.log(`\n  Fixes by type:`);
      Object.entries(report.summary.byType).forEach(([type, count]) => {
        console.log(`    ${type}: ${count}`);
      });
    }

    return report;
  }

  /**
   * Run all fixes
   */
  async runAllFixes() {
    console.log('🛠️ Running Common Error Fixes\n');
    
    if (this.options.dryRun) {
      console.log('🔍 DRY RUN MODE - No files will be modified\n');
    }

    // Fix 1: JSX parameter type errors
    await this.fixJSXParameterErrors();
    
    // Fix 2: React Router errors
    await this.fixReactRouterErrors();

    // Generate report
    const report = this.generateFixReport();

    if (!this.options.dryRun && this.fixes.length > 0) {
      console.log('\n🔍 Running TypeScript check to verify fixes...');
      try {
        execSync('npx tsc --noEmit --skipLibCheck', {
          cwd: path.join(this.options.projectRoot, 'client'),
          stdio: 'pipe'
        });
        console.log('✅ TypeScript check passed after fixes!');
      } catch (error) {
        console.log('⚠️ Some TypeScript errors remain after fixes');
        if (this.options.verbose) {
          console.log(error.stdout?.toString() || error.message);
        }
      }
    }

    return report;
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  const options = {
    dryRun: args.includes('--dry-run') || args.includes('-d'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    projectRoot: process.cwd()
  };

  const fixer = new CommonErrorFixer(options);
  
  fixer.runAllFixes().then(report => {
    process.exit(report.totalFixes > 0 ? 0 : 1);
  }).catch(error => {
    console.error('Error fixer failed:', error);
    process.exit(1);
  });
}

module.exports = CommonErrorFixer;
