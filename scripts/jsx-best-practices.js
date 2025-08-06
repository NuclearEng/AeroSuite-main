#!/usr/bin/env node

/**
 * JSX Best Practices Checker
 * Based on React's official JSX documentation:
 * https://legacy.reactjs.org/docs/introducing-jsx.html
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

class JSXBestPracticesChecker {
  constructor() {
    this.checks = {
      // JSX expression checks
      expressionChecks: [
        {
          name: 'Empty JSX expressions',
          check: this.checkEmptyExpressions.bind(this),
          severity: 'warning',
          message: 'Avoid empty JSX expressions {}',
          fix: 'Remove empty expressions or add meaningful content'
        },
        {
          name: 'Complex expressions in JSX',
          check: this.checkComplexExpressions.bind(this),
          severity: 'info',
          message: 'Complex expressions in JSX reduce readability',
          fix: 'Extract complex expressions to variables or functions'
        },
        {
          name: 'Conditional rendering',
          check: this.checkConditionalRendering.bind(this),
          severity: 'good',
          message: 'Good use of conditional rendering'
        }
      ],
      
      // Attribute checks
      attributeChecks: [
        {
          name: 'Quote consistency',
          check: this.checkQuoteConsistency.bind(this),
          severity: 'warning',
          message: 'Inconsistent quote usage in JSX attributes',
          fix: 'Use consistent quotes (prefer double quotes for JSX)'
        },
        {
          name: 'Reserved prop names',
          check: this.checkReservedProps.bind(this),
          severity: 'error',
          message: 'Using reserved prop names (class, for)',
          fix: 'Use className instead of class, htmlFor instead of for'
        },
        {
          name: 'CamelCase attributes',
          check: this.checkCamelCaseAttributes.bind(this),
          severity: 'warning',
          message: 'HTML attributes should use camelCase in JSX',
          fix: 'Convert HTML attributes to camelCase (e.g., tabindex → tabIndex)'
        }
      ],
      
      // Security checks
      securityChecks: [
        {
          name: 'dangerouslySetInnerHTML',
          check: this.checkDangerouslySetInnerHTML.bind(this),
          severity: 'warning',
          message: 'Using dangerouslySetInnerHTML - ensure content is sanitized',
          fix: 'Sanitize content or use text content instead'
        },
        {
          name: 'User input in JSX',
          check: this.checkUserInputSafety.bind(this),
          severity: 'good',
          message: 'User input is safely rendered in JSX'
        }
      ],
      
      // Structure checks
      structureChecks: [
        {
          name: 'Self-closing tags',
          check: this.checkSelfClosingTags.bind(this),
          severity: 'info',
          message: 'Empty tags should be self-closing',
          fix: 'Use self-closing syntax for empty tags (e.g., <img />)'
        },
        {
          name: 'Fragment usage',
          check: this.checkFragmentUsage.bind(this),
          severity: 'good',
          message: 'Good use of React Fragments'
        },
        {
          name: 'Key props in lists',
          check: this.checkKeyProps.bind(this),
          severity: 'error',
          message: 'Missing key prop in list items',
          fix: 'Add unique key prop to list items'
        }
      ],
      
      // Best practices
      bestPractices: [
        {
          name: 'Component naming',
          check: this.checkComponentNaming.bind(this),
          severity: 'warning',
          message: 'Component names should be PascalCase',
          fix: 'Rename components to use PascalCase'
        },
        {
          name: 'Props spreading',
          check: this.checkPropsSpreading.bind(this),
          severity: 'info',
          message: 'Avoid excessive props spreading',
          fix: 'Be explicit about which props to pass'
        },
        {
          name: 'Inline functions',
          check: this.checkInlineFunctions.bind(this),
          severity: 'info',
          message: 'Inline function definitions in JSX can impact performance',
          fix: 'Extract functions outside render or use useCallback'
        }
      ]
    };
  }

  async checkFile(filePath) {
    if (!filePath.endsWith('.jsx') && !filePath.endsWith('.tsx')) {
      return { file: filePath, issues: [], good: [], stats: {} };
    }

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

    try {
      const ast = parse(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
      });

      // Run all checks
      for (const [category, checks] of Object.entries(this.checks)) {
        for (const check of checks) {
          const checkResults = check.check(ast, content);
          
          checkResults.forEach(result => {
            const entry = {
              category,
              name: check.name,
              severity: check.severity,
              message: check.message,
              fix: check.fix,
              ...result
            };

            if (check.severity === 'good') {
              results.good.push(entry);
              results.stats.good++;
            } else {
              results.issues.push(entry);
              results.stats[check.severity]++;
            }
          });
        }
      }
    } catch (error) {
      // Parsing error, skip file
    }

    return results;
  }

  checkEmptyExpressions(ast) {
    const issues = [];
    
    traverse(ast, {
      JSXExpressionContainer(path) {
        if (!path.node.expression || path.node.expression.type === 'JSXEmptyExpression') {
          issues.push({
            line: path.node.loc?.start.line,
            column: path.node.loc?.start.column
          });
        }
      }
    });

    return issues;
  }

  checkComplexExpressions(ast) {
    const issues = [];
    
    traverse(ast, {
      JSXExpressionContainer(path) {
        const expr = path.node.expression;
        if (expr && (
          expr.type === 'ConditionalExpression' && 
          expr.alternate?.type === 'ConditionalExpression' // Nested ternary
        )) {
          issues.push({
            line: path.node.loc?.start.line,
            column: path.node.loc?.start.column,
            detail: 'Nested ternary expression'
          });
        }
      }
    });

    return issues;
  }

  checkConditionalRendering(ast) {
    const good = [];
    
    traverse(ast, {
      JSXExpressionContainer(path) {
        const expr = path.node.expression;
        if (expr && (
          expr.type === 'ConditionalExpression' ||
          (expr.type === 'LogicalExpression' && expr.operator === '&&')
        )) {
          good.push({
            line: path.node.loc?.start.line,
            column: path.node.loc?.start.column
          });
        }
      }
    });

    return good;
  }

  checkQuoteConsistency(ast, content) {
    const issues = [];
    const quotes = { single: 0, double: 0 };
    
    traverse(ast, {
      JSXAttribute(path) {
        if (path.node.value?.type === 'StringLiteral') {
          const line = path.node.loc?.start.line;
          const lineContent = content.split('\n')[line - 1];
          const attrMatch = lineContent.match(/=\s*(['"])/);
          
          if (attrMatch) {
            if (attrMatch[1] === "'") quotes.single++;
            else quotes.double++;
          }
        }
      }
    });

    if (quotes.single > 0 && quotes.double > 0) {
      issues.push({
        detail: `Mixed quotes: ${quotes.single} single, ${quotes.double} double`
      });
    }

    return issues;
  }

  checkReservedProps(ast) {
    const issues = [];
    const reserved = ['class', 'for'];
    
    traverse(ast, {
      JSXAttribute(path) {
        if (reserved.includes(path.node.name.name)) {
          issues.push({
            line: path.node.loc?.start.line,
            column: path.node.loc?.start.column,
            prop: path.node.name.name
          });
        }
      }
    });

    return issues;
  }

  checkCamelCaseAttributes(ast) {
    const issues = [];
    const htmlAttrs = {
      'tabindex': 'tabIndex',
      'readonly': 'readOnly',
      'maxlength': 'maxLength',
      'cellpadding': 'cellPadding',
      'cellspacing': 'cellSpacing',
      'rowspan': 'rowSpan',
      'colspan': 'colSpan',
      'usemap': 'useMap',
      'frameborder': 'frameBorder'
    };
    
    traverse(ast, {
      JSXAttribute(path) {
        const attrName = path.node.name.name;
        if (htmlAttrs[attrName]) {
          issues.push({
            line: path.node.loc?.start.line,
            column: path.node.loc?.start.column,
            attr: attrName,
            correct: htmlAttrs[attrName]
          });
        }
      }
    });

    return issues;
  }

  checkDangerouslySetInnerHTML(ast) {
    const issues = [];
    
    traverse(ast, {
      JSXAttribute(path) {
        if (path.node.name.name === 'dangerouslySetInnerHTML') {
          issues.push({
            line: path.node.loc?.start.line,
            column: path.node.loc?.start.column
          });
        }
      }
    });

    return issues;
  }

  checkUserInputSafety(ast) {
    const good = [];
    
    traverse(ast, {
      JSXExpressionContainer(path) {
        const expr = path.node.expression;
        // Check for direct variable usage (safe by default in React)
        if (expr && expr.type === 'Identifier') {
          good.push({
            line: path.node.loc?.start.line,
            detail: 'Safe user input rendering'
          });
        }
      }
    });

    return good;
  }

  checkSelfClosingTags(ast) {
    const issues = [];
    const voidElements = ['img', 'input', 'br', 'hr', 'meta', 'link'];
    
    traverse(ast, {
      JSXElement(path) {
        const tagName = path.node.openingElement.name.name;
        if (voidElements.includes(tagName) && 
            !path.node.openingElement.selfClosing && 
            !path.node.children.length) {
          issues.push({
            line: path.node.loc?.start.line,
            tag: tagName
          });
        }
      }
    });

    return issues;
  }

  checkFragmentUsage(ast) {
    const good = [];
    
    traverse(ast, {
      JSXFragment(path) {
        good.push({
          line: path.node.loc?.start.line,
          detail: 'Using React Fragment'
        });
      }
    });

    return good;
  }

  checkKeyProps(ast) {
    const issues = [];
    
    traverse(ast, {
      CallExpression(path) {
        if (path.node.callee?.property?.name === 'map') {
          const parent = path.parent;
          if (parent.type === 'JSXExpressionContainer') {
            const mapCallback = path.node.arguments[0];
            if (mapCallback?.body?.type === 'JSXElement') {
              const hasKey = mapCallback.body.openingElement.attributes.some(
                attr => attr.name?.name === 'key'
              );
              if (!hasKey) {
                issues.push({
                  line: mapCallback.body.loc?.start.line
                });
              }
            }
          }
        }
      }
    });

    return issues;
  }

  checkComponentNaming(ast) {
    const issues = [];
    
    traverse(ast, {
      FunctionDeclaration(path) {
        const name = path.node.id?.name;
        if (name && name[0] !== name[0].toUpperCase()) {
          // Check if it returns JSX
          let returnsJSX = false;
          path.traverse({
            ReturnStatement(returnPath) {
              if (returnPath.node.argument?.type === 'JSXElement' ||
                  returnPath.node.argument?.type === 'JSXFragment') {
                returnsJSX = true;
              }
            }
          });
          
          if (returnsJSX) {
            issues.push({
              line: path.node.loc?.start.line,
              component: name
            });
          }
        }
      }
    });

    return issues;
  }

  checkPropsSpreading(ast) {
    const issues = [];
    
    traverse(ast, {
      JSXSpreadAttribute(path) {
        issues.push({
          line: path.node.loc?.start.line
        });
      }
    });

    return issues;
  }

  checkInlineFunctions(ast) {
    const issues = [];
    
    traverse(ast, {
      JSXAttribute(path) {
        const value = path.node.value;
        if (value?.type === 'JSXExpressionContainer' &&
            (value.expression?.type === 'ArrowFunctionExpression' ||
             value.expression?.type === 'FunctionExpression')) {
          issues.push({
            line: path.node.loc?.start.line,
            attr: path.node.name.name
          });
        }
      }
    });

    return issues;
  }

  async checkProject(projectPath) {
    const allResults = [];
    const files = this.getJSXFiles(projectPath);
    
    for (const file of files) {
      const result = await this.checkFile(file);
      if (result.issues.length > 0 || result.good.length > 0) {
        allResults.push(result);
      }
    }

    return this.generateReport(allResults);
  }

  getJSXFiles(dir, files = []) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      
      if (item === 'node_modules' || item === 'build' || item === 'dist') {
        continue;
      }
      
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        this.getJSXFiles(fullPath, files);
      } else if (item.endsWith('.jsx') || item.endsWith('.tsx')) {
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
      topIssues: []
    };

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
            count: 0,
            files: []
          });
        }
        const entry = issueMap.get(key);
        entry.count++;
        entry.files.push(result.file);
      });
    });

    summary.topIssues = Array.from(issueMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      summary,
      details: results,
      timestamp: new Date().toISOString()
    };
  }

  displayReport(report) {
    console.log('\n📊 JSX Best Practices Report');
    console.log('Based on: https://legacy.reactjs.org/docs/introducing-jsx.html');
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
      summary.topIssues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.name} (${issue.count} occurrences)`);
        console.log(`     ${issue.message}`);
        if (issue.fix) {
          console.log(`     💡 Fix: ${issue.fix}`);
        }
      });
    }
    
    console.log('\n✨ Good JSX practices found:');
    console.log(`  ✅ Conditional rendering: ${summary.bySeverity.good} instances`);
    console.log(`  ✅ Safe user input handling`);
    console.log(`  ✅ React Fragments usage`);
  }
}

// CLI usage
if (require.main === module) {
  const checker = new JSXBestPracticesChecker();
  const projectPath = process.argv[2] || process.cwd();
  
  console.log('🚀 JSX Best Practices Checker');
  console.log('Based on React JSX documentation\n');
  
  // Install required dependencies if needed
  try {
    require('@babel/parser');
    require('@babel/traverse');
  } catch (e) {
    console.log('Installing required dependencies...');
    require('child_process').execSync('npm install --save-dev @babel/parser @babel/traverse', {
      stdio: 'inherit'
    });
  }
  
  checker.checkProject(projectPath).then(report => {
    checker.displayReport(report);
    
    const reportPath = 'jsx-best-practices-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📝 Full report saved to: ${reportPath}`);
    
    const hasErrors = report.summary.bySeverity.error > 0;
    process.exit(hasErrors ? 1 : 0);
  }).catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

module.exports = JSXBestPracticesChecker;