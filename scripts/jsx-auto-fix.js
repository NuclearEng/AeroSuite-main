#!/usr/bin/env node

/**
 * JSX Auto-Fix Script
 * Automatically fixes common JSX issues based on React best practices
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

class JSXAutoFixer {
  constructor() {
    this.reservedPropsMap = {
      'class': 'className',
      'for': 'htmlFor'
    };

    this.htmlAttributesMap = {
      'tabindex': 'tabIndex',
      'readonly': 'readOnly',
      'maxlength': 'maxLength',
      'cellpadding': 'cellPadding',
      'cellspacing': 'cellSpacing',
      'rowspan': 'rowSpan',
      'colspan': 'colSpan',
      'usemap': 'useMap',
      'frameborder': 'frameBorder',
      'contenteditable': 'contentEditable',
      'crossorigin': 'crossOrigin',
      'datetime': 'dateTime',
      'enctype': 'encType',
      'formaction': 'formAction',
      'formenctype': 'formEncType',
      'formmethod': 'formMethod',
      'formnovalidate': 'formNoValidate',
      'formtarget': 'formTarget',
      'hreflang': 'hrefLang',
      'inputmode': 'inputMode',
      'keyparams': 'keyParams',
      'keytype': 'keyType',
      'marginheight': 'marginHeight',
      'marginwidth': 'marginWidth',
      'maxlength': 'maxLength',
      'mediagroup': 'mediaGroup',
      'minlength': 'minLength',
      'novalidate': 'noValidate',
      'radiogroup': 'radioGroup',
      'spellcheck': 'spellCheck',
      'srcdoc': 'srcDoc',
      'srclang': 'srcLang',
      'srcset': 'srcSet',
      'targetid': 'targetId',
      'usemap': 'useMap'
    };

    this.voidElements = ['img', 'input', 'br', 'hr', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
    
    this.fixes = {
      // Fix reserved props
      fixReservedProps: this.fixReservedProps.bind(this),
      // Fix HTML attributes to camelCase
      fixCamelCaseAttributes: this.fixCamelCaseAttributes.bind(this),
      // Fix self-closing tags
      fixSelfClosingTags: this.fixSelfClosingTags.bind(this),
      // Fix component naming
      fixComponentNaming: this.fixComponentNaming.bind(this),
      // Remove empty expressions
      fixEmptyExpressions: this.fixEmptyExpressions.bind(this),
      // Add missing keys
      fixMissingKeys: this.fixMissingKeys.bind(this)
    };
  }

  async fixFile(filePath) {
    if (!filePath.endsWith('.jsx') && !filePath.endsWith('.tsx')) {
      return { file: filePath, fixed: false, changes: [] };
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const changes = [];

    try {
      const ast = parse(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
        tokens: true
      });

      let modified = false;

      // Apply all fixes
      for (const [fixName, fixFn] of Object.entries(this.fixes)) {
        try {
          const result = fixFn.call(this, ast, filePath);
          if (result && result.modified) {
            modified = true;
            changes.push(...result.changes);
          }
        } catch (err) {
          console.error(`Error in ${fixName}:`, err.message);
        }
      }

      if (modified) {
        // Generate fixed code
        const { code } = generate(ast, {
          retainLines: true,
          retainFunctionParens: true,
          comments: true
        });

        fs.writeFileSync(filePath, code);

        return {
          file: filePath,
          fixed: true,
          changes
        };
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error.message);
    }

    return { file: filePath, fixed: false, changes: [] };
  }

  fixReservedProps(ast) {
    const changes = [];
    let modified = false;

    traverse(ast, {
      JSXAttribute(path) {
        const attrName = path.node.name.name;
        if (this.reservedPropsMap[attrName]) {
          const correctName = this.reservedPropsMap[attrName];
          path.node.name.name = correctName;
          modified = true;
          changes.push({
            type: 'reserved-prop',
            line: path.node.loc?.start.line,
            from: attrName,
            to: correctName
          });
        }
      }
    });

    return { modified, changes };
  }

  fixCamelCaseAttributes(ast) {
    const changes = [];
    let modified = false;

    traverse(ast, {
      JSXAttribute(path) {
        const attrName = path.node.name.name;
        const lowerAttr = attrName.toLowerCase();
        
        if (this.htmlAttributesMap[lowerAttr] && attrName !== this.htmlAttributesMap[lowerAttr]) {
          const correctName = this.htmlAttributesMap[lowerAttr];
          path.node.name.name = correctName;
          modified = true;
          changes.push({
            type: 'camelCase-attribute',
            line: path.node.loc?.start.line,
            from: attrName,
            to: correctName
          });
        }
      }
    });

    return { modified, changes };
  }

  fixSelfClosingTags(ast) {
    const changes = [];
    let modified = false;

    traverse(ast, {
      JSXElement(path) {
        const element = path.node;
        const tagName = element.openingElement.name.name;
        
        if (typeof tagName === 'string' && 
            this.voidElements.includes(tagName.toLowerCase()) &&
            !element.openingElement.selfClosing &&
            element.children.length === 0) {
          
          element.openingElement.selfClosing = true;
          element.closingElement = null;
          modified = true;
          
          changes.push({
            type: 'self-closing-tag',
            line: element.loc?.start.line,
            tag: tagName
          });
        }
      }
    });

    return { modified, changes };
  }

  fixComponentNaming(ast, filePath) {
    const changes = [];
    let modified = false;

    traverse(ast, {
      FunctionDeclaration(path) {
        const node = path.node;
        const name = node.id?.name;
        
        if (name && name[0] !== name[0].toUpperCase()) {
          // Check if it's a React component (returns JSX)
          let returnsJSX = false;
          
          path.traverse({
            ReturnStatement(returnPath) {
              const arg = returnPath.node.argument;
              if (arg && (arg.type === 'JSXElement' || arg.type === 'JSXFragment')) {
                returnsJSX = true;
              }
            }
          });

          if (returnsJSX) {
            const newName = name[0].toUpperCase() + name.slice(1);
            node.id.name = newName;
            modified = true;
            
            changes.push({
              type: 'component-naming',
              line: node.loc?.start.line,
              from: name,
              to: newName
            });

            // Update all references
            path.scope.rename(name, newName);
          }
        }
      },

      VariableDeclarator(path) {
        const id = path.node.id;
        const init = path.node.init;
        
        if (id?.type === 'Identifier' && id.name[0] !== id.name[0].toUpperCase()) {
          let isComponent = false;

          // Check if it's an arrow function that returns JSX
          if (init?.type === 'ArrowFunctionExpression') {
            if (init.body.type === 'JSXElement' || init.body.type === 'JSXFragment') {
              isComponent = true;
            } else if (init.body.type === 'BlockStatement') {
              traverse(init, {
                ReturnStatement(returnPath) {
                  const arg = returnPath.node.argument;
                  if (arg && (arg.type === 'JSXElement' || arg.type === 'JSXFragment')) {
                    isComponent = true;
                  }
                }
              }, path.scope, path);
            }
          }

          if (isComponent) {
            const oldName = id.name;
            const newName = oldName[0].toUpperCase() + oldName.slice(1);
            id.name = newName;
            modified = true;

            changes.push({
              type: 'component-naming',
              line: id.loc?.start.line,
              from: oldName,
              to: newName
            });

            // Update references
            const binding = path.scope.getBinding(oldName);
            if (binding) {
              binding.identifier.name = newName;
              binding.referencePaths.forEach(ref => {
                if (ref.node.type === 'Identifier') {
                  ref.node.name = newName;
                }
              });
            }
          }
        }
      }
    });

    return { modified, changes };
  }

  fixEmptyExpressions(ast) {
    const changes = [];
    let modified = false;

    traverse(ast, {
      JSXExpressionContainer(path) {
        if (!path.node.expression || path.node.expression.type === 'JSXEmptyExpression') {
          // Remove empty expression by replacing parent if possible
          const parent = path.parent;
          
          if (parent.type === 'JSXElement' || parent.type === 'JSXFragment') {
            const index = parent.children.indexOf(path.node);
            if (index !== -1) {
              parent.children.splice(index, 1);
              modified = true;
              changes.push({
                type: 'empty-expression',
                line: path.node.loc?.start.line,
                action: 'removed'
              });
            }
          }
        }
      }
    });

    return { modified, changes };
  }

  fixMissingKeys(ast) {
    const changes = [];
    let modified = false;

    traverse(ast, {
      CallExpression(path) {
        // Look for .map() calls
        if (path.node.callee?.property?.name === 'map') {
          const callback = path.node.arguments[0];
          
          if (callback && (callback.type === 'ArrowFunctionExpression' || callback.type === 'FunctionExpression')) {
            const params = callback.params;
            const indexParam = params[1];
            
            // Check if the callback returns JSX
            let jsxReturn = null;
            
            if (callback.body.type === 'JSXElement') {
              jsxReturn = callback.body;
            } else if (callback.body.type === 'BlockStatement') {
              callback.body.body.forEach(statement => {
                if (statement.type === 'ReturnStatement' && 
                    statement.argument?.type === 'JSXElement') {
                  jsxReturn = statement.argument;
                }
              });
            } else if (callback.body.type === 'ParenthesizedExpression' &&
                       callback.body.expression?.type === 'JSXElement') {
              jsxReturn = callback.body.expression;
            }

            if (jsxReturn) {
              // Check if key prop exists
              const hasKey = jsxReturn.openingElement.attributes.some(
                attr => attr.type === 'JSXAttribute' && attr.name.name === 'key'
              );

              if (!hasKey) {
                // Add key prop using index if available
                const keyValue = indexParam 
                  ? t.identifier(indexParam.name)
                  : t.identifier('index');

                const keyAttr = t.jsxAttribute(
                  t.jsxIdentifier('key'),
                  t.jsxExpressionContainer(keyValue)
                );

                jsxReturn.openingElement.attributes.unshift(keyAttr);
                modified = true;

                changes.push({
                  type: 'missing-key',
                  line: jsxReturn.loc?.start.line,
                  action: 'added key prop'
                });

                // If no index parameter, add it
                if (!indexParam && params.length < 2) {
                  params.push(t.identifier('index'));
                }
              }
            }
          }
        }
      }
    });

    return { modified, changes };
  }

  async fixProject(projectPath) {
    const files = this.getJSXFiles(projectPath);
    const results = [];

    console.log(`Found ${files.length} JSX/TSX files to check...\n`);

    for (const file of files) {
      const result = await this.fixFile(file);
      if (result.fixed) {
        results.push(result);
        console.log(`✓ Fixed ${result.file}`);
        result.changes.forEach(change => {
          console.log(`  - ${change.type}: ${change.from || change.action} ${change.to ? `→ ${change.to}` : ''}`);
        });
      }
    }

    return results;
  }

  getJSXFiles(dir, files = []) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      
      if (item === 'node_modules' || item === 'build' || item === 'dist' || item === '.git') {
        continue;
      }
      
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          this.getJSXFiles(fullPath, files);
        } else if (item.endsWith('.jsx') || item.endsWith('.tsx')) {
          files.push(fullPath);
        }
      } catch (e) {
        // Skip files we can't access
      }
    }
    
    return files;
  }

  generateReport(results) {
    const report = {
      timestamp: new Date().toISOString(),
      filesFixed: results.length,
      totalChanges: results.reduce((sum, r) => sum + r.changes.length, 0),
      changesByType: {},
      files: results
    };

    results.forEach(result => {
      result.changes.forEach(change => {
        report.changesByType[change.type] = (report.changesByType[change.type] || 0) + 1;
      });
    });

    return report;
  }
}

// CLI usage
if (require.main === module) {
  const fixer = new JSXAutoFixer();
  const projectPath = process.argv[2] || process.cwd();
  
  console.log('🔧 JSX Auto-Fix Tool');
  console.log('====================\n');

  // Install dependencies if needed
  try {
    require('@babel/parser');
    require('@babel/traverse');
    require('@babel/generator');
    require('@babel/types');
  } catch (e) {
    console.log('Installing required dependencies...');
    require('child_process').execSync('npm install --save-dev @babel/parser @babel/traverse @babel/generator @babel/types', {
      stdio: 'inherit'
    });
  }

  fixer.fixProject(projectPath).then(results => {
    const report = fixer.generateReport(results);
    
    console.log('\n' + '='.repeat(50));
    console.log('Summary:');
    console.log(`  Files fixed: ${report.filesFixed}`);
    console.log(`  Total changes: ${report.totalChanges}`);
    
    if (report.totalChanges > 0) {
      console.log('\nChanges by type:');
      Object.entries(report.changesByType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
    }

    // Save report
    const reportPath = 'jsx-auto-fix-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nReport saved to: ${reportPath}`);

  }).catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

module.exports = JSXAutoFixer;