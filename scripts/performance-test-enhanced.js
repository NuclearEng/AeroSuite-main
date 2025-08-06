#!/usr/bin/env node

/**
 * Enhanced Performance Testing Script
 * Performs comprehensive performance analysis on the AeroSuite application
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PERFORMANCE_CHECKS = {
  // Bundle size analysis
  bundleSizeAnalysis: {
    name: 'Bundle Size Analysis',
    run: () => {
      console.log('📦 Analyzing bundle sizes...');
      
      try {
        // Build production bundle
        console.log('Building production bundle...');
        execSync('cd client && npm run build', { stdio: 'pipe' });
        
        // Analyze build directory
        const buildDir = path.join('client', 'build');
        const staticDir = path.join(buildDir, 'static');
        
        const results = {
          js: [],
          css: [],
          total: 0
        };
        
        if (fs.existsSync(staticDir)) {
          // Analyze JS files
          const jsDir = path.join(staticDir, 'js');
          if (fs.existsSync(jsDir)) {
            const jsFiles = fs.readdirSync(jsDir);
            for (const file of jsFiles) {
              if (file.endsWith('.js')) {
                const stats = fs.statSync(path.join(jsDir, file));
                const sizeKB = Math.round(stats.size / 1024);
                results.js.push({ file, sizeKB });
                results.total += sizeKB;
              }
            }
          }
          
          // Analyze CSS files
          const cssDir = path.join(staticDir, 'css');
          if (fs.existsSync(cssDir)) {
            const cssFiles = fs.readdirSync(cssDir);
            for (const file of cssFiles) {
              if (file.endsWith('.css')) {
                const stats = fs.statSync(path.join(cssDir, file));
                const sizeKB = Math.round(stats.size / 1024);
                results.css.push({ file, sizeKB });
                results.total += sizeKB;
              }
            }
          }
        }
        
        // Performance thresholds
        const thresholds = {
          mainBundle: 250, // KB
          totalSize: 1000  // KB
        };
        
        const mainBundle = results.js.find(f => f.file.includes('main'));
        const passed = (!mainBundle || mainBundle.sizeKB < thresholds.mainBundle) && 
                      results.total < thresholds.totalSize;
        
        return {
          passed,
          results,
          thresholds
        };
      } catch (error) {
        return {
          passed: false,
          error: 'Bundle analysis failed',
          details: error.message
        };
      }
    }
  },

  // Code splitting effectiveness
  codeSplittingCheck: {
    name: 'Code Splitting Analysis',
    run: () => {
      console.log('🔍 Analyzing code splitting...');
      
      const routeFiles = [];
      const lazyImports = [];
      
      // Scan for route-based code splitting
      const scanFile = (filePath) => {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for React.lazy usage
        const lazyMatches = content.match(/React\.lazy\s*\(/g);
        if (lazyMatches) {
          lazyImports.push({
            file: path.relative(process.cwd(), filePath),
            count: lazyMatches.length
          });
        }
        
        // Check for dynamic imports
        const dynamicImports = content.match(/import\s*\(/g);
        if (dynamicImports) {
          routeFiles.push({
            file: path.relative(process.cwd(), filePath),
            dynamicImports: dynamicImports.length
          });
        }
      };
      
      // Scan client source files
      const scanDir = (dir) => {
        if (!fs.existsSync(dir)) return;
        
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            scanDir(fullPath);
          } else if (stat.isFile() && /\.(tsx?|jsx?)$/.test(file)) {
            scanFile(fullPath);
          }
        }
      };
      
      scanDir('client/src');
      
      const totalLazyComponents = lazyImports.reduce((sum, f) => sum + f.count, 0);
      const totalDynamicImports = routeFiles.reduce((sum, f) => sum + f.dynamicImports, 0);
      
      return {
        passed: totalLazyComponents > 5, // Should have at least 5 lazy-loaded components
        lazyComponents: totalLazyComponents,
        dynamicImports: totalDynamicImports,
        files: {
          lazy: lazyImports,
          dynamic: routeFiles
        }
      };
    }
  },

  // Performance budget check
  performanceBudget: {
    name: 'Performance Budget Check',
    run: () => {
      console.log('🎯 Checking performance budgets...');
      
      const budgets = {
        images: {
          maxSize: 100, // KB per image
          totalSize: 2000 // KB total
        },
        scripts: {
          maxRequests: 10,
          totalSize: 500 // KB
        },
        styles: {
          maxRequests: 5,
          totalSize: 100 // KB
        }
      };
      
      const results = {
        images: { files: [], totalSize: 0 },
        scripts: { files: [], totalSize: 0 },
        styles: { files: [], totalSize: 0 }
      };
      
      // Check public directory
      const publicDir = 'client/public';
      if (fs.existsSync(publicDir)) {
        const scanPublicDir = (dir) => {
          const files = fs.readdirSync(dir);
          
          for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            
            if (stat.isFile()) {
              const sizeKB = Math.round(stat.size / 1024);
              
              if (/\.(png|jpg|jpeg|gif|svg)$/i.test(file)) {
                results.images.files.push({ file, sizeKB });
                results.images.totalSize += sizeKB;
              } else if (/\.js$/i.test(file)) {
                results.scripts.files.push({ file, sizeKB });
                results.scripts.totalSize += sizeKB;
              } else if (/\.css$/i.test(file)) {
                results.styles.files.push({ file, sizeKB });
                results.styles.totalSize += sizeKB;
              }
            }
          }
        };
        
        scanPublicDir(publicDir);
      }
      
      const violations = [];
      
      // Check image budgets
      results.images.files.forEach(img => {
        if (img.sizeKB > budgets.images.maxSize) {
          violations.push(`Image ${img.file} exceeds size limit (${img.sizeKB}KB > ${budgets.images.maxSize}KB)`);
        }
      });
      
      if (results.images.totalSize > budgets.images.totalSize) {
        violations.push(`Total image size exceeds budget (${results.images.totalSize}KB > ${budgets.images.totalSize}KB)`);
      }
      
      return {
        passed: violations.length === 0,
        results,
        budgets,
        violations
      };
    }
  },

  // Memory leak detection
  memoryLeakDetection: {
    name: 'Memory Leak Detection',
    run: () => {
      console.log('🔍 Checking for potential memory leaks...');
      
      const potentialLeaks = [];
      
      const scanFile = (filePath) => {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for common memory leak patterns
        const patterns = [
          {
            pattern: /addEventListener[^}]*(?!removeEventListener)/g,
            issue: 'Event listener without cleanup'
          },
          {
            pattern: /setInterval[^}]*(?!clearInterval)/g,
            issue: 'setInterval without cleanup'
          },
          {
            pattern: /setTimeout[^}]*(?!clearTimeout)/g,
            issue: 'setTimeout without cleanup (in useEffect)'
          },
          {
            pattern: /new WebSocket[^}]*(?!close\(\))/g,
            issue: 'WebSocket without cleanup'
          }
        ];
        
        patterns.forEach(({ pattern, issue }) => {
          const matches = content.match(pattern);
          if (matches) {
            // Additional check for React components
            if (content.includes('useEffect')) {
              potentialLeaks.push({
                file: path.relative(process.cwd(), filePath),
                issue,
                count: matches.length
              });
            }
          }
        });
      };
      
      // Scan React components
      const scanDir = (dir) => {
        if (!fs.existsSync(dir)) return;
        
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            scanDir(fullPath);
          } else if (stat.isFile() && /\.(tsx?|jsx?)$/.test(file)) {
            scanFile(fullPath);
          }
        }
      };
      
      scanDir('client/src/components');
      scanDir('client/src/pages');
      
      return {
        passed: potentialLeaks.length === 0,
        potentialLeaks
      };
    }
  },

  // Render performance check
  renderPerformance: {
    name: 'React Render Performance',
    run: () => {
      console.log('🔍 Checking React render performance...');
      
      const issues = [];
      
      const scanFile = (filePath) => {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for performance anti-patterns
        if (content.includes('React.Component')) {
          // Check for missing PureComponent or memo
          if (!content.includes('PureComponent') && !content.includes('React.memo')) {
            issues.push({
              file: path.relative(process.cwd(), filePath),
              issue: 'Component not optimized with PureComponent or React.memo'
            });
          }
        }
        
        // Check for inline function definitions in render
        if (content.match(/onClick=\{(?!\w+\))/)) {
          issues.push({
            file: path.relative(process.cwd(), filePath),
            issue: 'Inline function in render method'
          });
        }
        
        // Check for array index as key
        if (content.match(/key=\{index\}/)) {
          issues.push({
            file: path.relative(process.cwd(), filePath),
            issue: 'Using array index as React key'
          });
        }
      };
      
      // Scan components
      const scanDir = (dir) => {
        if (!fs.existsSync(dir)) return;
        
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            scanDir(fullPath);
          } else if (stat.isFile() && /\.(tsx?|jsx?)$/.test(file)) {
            scanFile(fullPath);
          }
        }
      };
      
      scanDir('client/src/components');
      
      return {
        passed: issues.length < 10, // Allow some issues
        issues,
        count: issues.length
      };
    }
  }
};

async function runPerformanceTests() {
  console.log('⚡ AeroSuite Performance Testing Suite\n');
  console.log('Running comprehensive performance checks...\n');
  
  const results = {
    timestamp: new Date().toISOString(),
    passed: 0,
    failed: 0,
    tests: []
  };
  
  for (const [key, check] of Object.entries(PERFORMANCE_CHECKS)) {
    console.log(`\n━━━ ${check.name} ━━━`);
    
    try {
      const result = await check.run();
      
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
  
  // Generate performance report
  console.log('\n\n📊 Performance Test Summary');
  console.log('━'.repeat(50));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  
  // Save detailed report
  fs.writeFileSync('performance-test-report.json', JSON.stringify(results, null, 2));
  console.log('\n📄 Detailed report saved to: performance-test-report.json');
  
  // Create optimization script
  if (results.failed > 0) {
    createOptimizationScript(results);
  }
  
  return results;
}

function createOptimizationScript(results) {
  const optimizations = [];
  
  for (const test of results.tests) {
    if (!test.passed) {
      switch (test.key) {
        case 'bundleSizeAnalysis':
          optimizations.push(`
# Optimize bundle size
echo "Optimizing bundle size..."
npm run analyze
npm run optimize:bundle
`);
          break;
        case 'codeSplittingCheck':
          optimizations.push(`
# Improve code splitting
echo "Adding code splitting..."
node scripts/add-code-splitting.js
`);
          break;
        case 'memoryLeakDetection':
          optimizations.push(`
# Fix memory leaks
echo "Fixing potential memory leaks..."
node scripts/fix-memory-leaks.js
`);
          break;
      }
    }
  }
  
  const script = `#!/bin/bash
# Performance Optimization Script
# Generated: ${new Date().toISOString()}

echo "🚀 Starting performance optimization..."

${optimizations.join('\n')}

echo "✅ Performance optimization complete!"
`;
  
  fs.writeFileSync('performance-optimization.sh', script);
  fs.chmodSync('performance-optimization.sh', '755');
  console.log('🔧 Optimization script created: performance-optimization.sh');
}

// Run the tests
if (require.main === module) {
  runPerformanceTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runPerformanceTests, PERFORMANCE_CHECKS };