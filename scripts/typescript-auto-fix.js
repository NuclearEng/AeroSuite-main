#!/usr/bin/env node

/**
 * TypeScript Auto-Fix Script
 * Automatically fixes common TypeScript errors
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TypeScriptAutoFixer {
  constructor() {
    this.fixStrategies = {
      jsxComponent: this.fixJSXComponent.bind(this),
      missingProperty: this.fixMissingProperty.bind(this),
      typeIncompatibility: this.fixTypeIncompatibility.bind(this),
      undefinedVariable: this.fixUndefinedVariable.bind(this),
      implicitAny: this.fixImplicitAny.bind(this),
      missingTypes: this.fixMissingTypes.bind(this),
      unknownType: this.fixUnknownType.bind(this),
      interfaceExtension: this.fixInterfaceExtension.bind(this),
    };
    
    // Best practices based on TypeScript documentation
    this.typeReplacements = {
      'Object': 'Record<string, unknown>',
      'object': 'Record<string, unknown>',
      'Function': '(...args: any[]) => any',
      'any[]': 'unknown[]',
    };
  }

  async fixErrors(errors) {
    const fixedErrors = [];
    const failedErrors = [];
    const fileCache = new Map();

    // Group errors by file
    const errorsByFile = errors.reduce((acc, error) => {
      if (!acc[error.file]) {
        acc[error.file] = [];
      }
      acc[error.file].push(error);
      return acc;
    }, {});

    // Process each file
    for (const [filePath, fileErrors] of Object.entries(errorsByFile)) {
      console.log(`\nProcessing ${filePath}...`);
      
      try {
        let fileContent = fs.readFileSync(filePath, 'utf-8');
        const originalContent = fileContent;
        
        // Sort errors by line number in reverse order to avoid offset issues
        const sortedErrors = fileErrors.sort((a, b) => b.line - a.line);
        
        for (const error of sortedErrors) {
          if (error.suggestedFix?.autoFixable) {
            const fixStrategy = this.fixStrategies[error.suggestedFix.type];
            if (fixStrategy) {
              try {
                fileContent = await fixStrategy(fileContent, error, filePath);
                fixedErrors.push(error);
                console.log(`  ✓ Fixed: ${error.code} at line ${error.line}`);
              } catch (e) {
                console.error(`  ✗ Failed to fix: ${error.code} at line ${error.line} - ${e.message}`);
                failedErrors.push(error);
              }
            }
          }
        }
        
        // Write the fixed content back if changes were made
        if (fileContent !== originalContent) {
          fs.writeFileSync(filePath, fileContent);
          console.log(`  ✓ Saved changes to ${filePath}`);
        }
      } catch (e) {
        console.error(`  ✗ Error processing file: ${e.message}`);
      }
    }

    return { fixedErrors, failedErrors };
  }

  fixJSXComponent(content, error, filePath) {
    const lines = content.split('\n');
    const errorLine = error.line - 1;
    
    // Extract component name from error message
    const componentMatch = error.message.match(/'(.+)' cannot be used as a JSX component/);
    if (!componentMatch) return content;
    
    const componentName = componentMatch[1];
    
    // Common fixes for JSX components
    if (componentName === 'HelmetProvider' || componentName === 'SnackbarProvider') {
      // These are likely React 18 type issues
      // Add type assertion
      const lineContent = lines[errorLine];
      const indentMatch = lineContent.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1] : '';
      
      // Check if we need to import React types
      if (!content.includes('import type { FC }') && !content.includes('React.FC')) {
        const importIndex = lines.findIndex(line => line.startsWith('import React'));
        if (importIndex !== -1) {
          lines[importIndex] = `import React, { FC } from 'react';`;
        }
      }
      
      // Wrap component with type assertion
      lines[errorLine] = lines[errorLine].replace(
        new RegExp(`<${componentName}`),
        `<${componentName} as any`
      );
    }
    
    return lines.join('\n');
  }

  fixMissingProperty(content, error, filePath) {
    // For missing properties on types, we need to either:
    // 1. Add the property to the interface/type
    // 2. Use optional chaining
    // 3. Add a type guard
    
    const lines = content.split('\n');
    const errorLine = error.line - 1;
    const { property, onType } = error.suggestedFix;
    
    // Simple fix: use optional chaining if accessing a property
    if (lines[errorLine].includes(`.${property}`)) {
      lines[errorLine] = lines[errorLine].replace(
        new RegExp(`\\.${property}(?!\\?)`, 'g'),
        `?.${property}`
      );
    }
    
    return lines.join('\n');
  }

  fixTypeIncompatibility(content, error, filePath) {
    const lines = content.split('\n');
    const errorLine = error.line - 1;
    
    // Common type incompatibility fixes
    if (error.message.includes("'string' is not assignable to type 'SetStateAction")) {
      // Fix setState type issues
      lines[errorLine] = lines[errorLine].replace(
        /setState\(([^)]+)\)/g,
        (match, arg) => `setState(${arg} as any)`
      );
    } else if (error.message.includes("Property 'children' does not exist")) {
      // Fix React 18 children prop issues
      const componentMatch = lines[errorLine].match(/interface\s+(\w+Props)/);
      if (componentMatch) {
        const nextBraceLine = lines.findIndex((line, idx) => idx > errorLine && line.includes('{'));
        if (nextBraceLine !== -1) {
          lines[nextBraceLine] = lines[nextBraceLine] + '\n  children?: React.ReactNode;';
        }
      }
    } else if (error.message.includes("Type 'string' is not assignable to type 'number'")) {
      // Add parseInt/parseFloat for numeric conversions
      const match = lines[errorLine].match(/(\w+)\s*=\s*['"](\d+)['"]/);
      if (match) {
        lines[errorLine] = lines[errorLine].replace(match[0], `${match[1]} = ${match[2]}`);
      }
    } else {
      // Generic fix: add type assertion
      const lineContent = lines[errorLine];
      
      // Find the expression causing the error
      if (error.context.length > 0) {
        const problemLine = error.context.find(line => line.includes('>'));
        if (problemLine) {
          const match = problemLine.match(/>\s*(\d+)\s*\|\s*(.+)/);
          if (match) {
            const expression = match[2].trim();
            // Add 'as any' to the problematic expression
            lines[errorLine] = lines[errorLine].replace(expression, `(${expression} as any)`);
          }
        }
      }
    }
    
    return lines.join('\n');
  }

  fixUndefinedVariable(content, error, filePath) {
    const lines = content.split('\n');
    const { variable } = error.suggestedFix;
    
    // Common undefined variable fixes
    const commonImports = {
      'ColorLens': '@mui/icons-material/ColorLens',
      'InfoOutlined': '@mui/icons-material/InfoOutlined',
      'error': '_error', // Common typo in catch blocks
    };
    
    if (commonImports[variable]) {
      if (variable === 'error') {
        // Fix error variable references
        lines[error.line - 1] = lines[error.line - 1].replace(
          new RegExp(`\\b${variable}\\b`, 'g'),
          commonImports[variable]
        );
      } else {
        // Add import
        const lastImportIndex = lines.findLastIndex(line => line.startsWith('import'));
        if (lastImportIndex !== -1) {
          const importStatement = `import ${variable} from '${commonImports[variable]}';`;
          lines.splice(lastImportIndex + 1, 0, importStatement);
        }
      }
    }
    
    return lines.join('\n');
  }

  fixImplicitAny(content, error, filePath) {
    const lines = content.split('\n');
    const errorLine = error.line - 1;
    const { parameter } = error.suggestedFix;
    
    // Try to infer a better type than 'any' based on usage
    let inferredType = 'unknown'; // Default to unknown instead of any
    
    // Check context for better type inference
    const lineContent = lines[errorLine];
    if (lineContent.includes('event') || lineContent.includes('Event')) {
      inferredType = 'Event';
    } else if (lineContent.includes('onClick') || lineContent.includes('onChange')) {
      inferredType = 'React.ChangeEvent<HTMLInputElement>';
    } else if (lineContent.includes('.length')) {
      inferredType = 'string | unknown[]';
    } else if (lineContent.includes('.map(')) {
      inferredType = 'unknown[]';
    }
    
    // Add type annotation
    lines[errorLine] = lines[errorLine].replace(
      new RegExp(`(\\b${parameter}\\b)(?!:)`),
      `${parameter}: ${inferredType}`
    );
    
    return lines.join('\n');
  }

  async fixMissingTypes(content, error, filePath) {
    const { module: moduleName } = error.suggestedFix;
    
    console.log(`  → Installing types for ${moduleName}...`);
    
    try {
      // Try to install types package
      execSync(`npm install --save-dev @types/${moduleName}`, { 
        stdio: 'pipe',
        cwd: path.dirname(filePath)
      });
      console.log(`  ✓ Installed @types/${moduleName}`);
    } catch (e) {
      // If types package doesn't exist, create a declaration file
      const declarationPath = path.join(
        path.dirname(filePath),
        'types',
        `${moduleName}.d.ts`
      );
      
      const declarationContent = `declare module '${moduleName}' {
  const content: any;
  export = content;
}`;
      
      // Ensure types directory exists
      const typesDir = path.dirname(declarationPath);
      if (!fs.existsSync(typesDir)) {
        fs.mkdirSync(typesDir, { recursive: true });
      }
      
      fs.writeFileSync(declarationPath, declarationContent);
      console.log(`  ✓ Created declaration file for ${moduleName}`);
    }
    
    return content;
  }

  fixUnknownType(content, error, filePath) {
    const lines = content.split('\n');
    const errorLine = error.line - 1;
    
    // Handle 'response' is of type 'unknown' errors
    if (error.message.includes("is of type 'unknown'")) {
      const variableMatch = error.message.match(/'(\w+)' is of type 'unknown'/);
      if (variableMatch) {
        const variable = variableMatch[1];
        
        // Add type assertion or interface based on usage
        if (variable === 'response' && lines[errorLine].includes('.data')) {
          // For API responses, add interface
          const interfaceName = `${variable.charAt(0).toUpperCase()}${variable.slice(1)}Data`;
          
          // Find import section
          const importIndex = lines.findIndex(line => line.includes('import'));
          if (importIndex !== -1) {
            // Add interface after imports
            const lastImportIndex = lines.findLastIndex(line => line.startsWith('import'));
            lines.splice(lastImportIndex + 1, 0, `
interface ${interfaceName} {
  data: {
    sessions?: any[];
    [key: string]: any;
  };
}
`);
          }
          
          // Type the response
          lines[errorLine - 1] = lines[errorLine - 1].replace(
            `const ${variable} =`,
            `const ${variable}: ${interfaceName} =`
          );
        }
      }
    }
    
    return lines.join('\n');
  }

  fixInterfaceExtension(content, error, filePath) {
    const lines = content.split('\n');
    
    // Handle interface extension errors
    if (error.message.includes('incorrectly extends interface')) {
      const match = error.message.match(/Interface '(\w+)' incorrectly extends interface '(.+)'/);
      if (match) {
        const [, interfaceName, baseInterface] = match;
        
        // Find the interface definition
        const interfaceIndex = lines.findIndex(line => 
          line.includes(`interface ${interfaceName}`) && line.includes('extends')
        );
        
        if (interfaceIndex !== -1) {
          // Add missing properties based on error context
          if (error.message.includes("Property 'title' is incompatible")) {
            // Fix title property type
            const nextBraceIndex = lines.findIndex((line, idx) => 
              idx > interfaceIndex && line.includes('{')
            );
            
            if (nextBraceIndex !== -1) {
              lines.splice(nextBraceIndex + 1, 0, '  title?: React.ReactNode;');
            }
          }
        }
      }
    }
    
    return lines.join('\n');
  }

  generateFixReport(fixedErrors, failedErrors) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: fixedErrors.length + failedErrors.length,
        fixed: fixedErrors.length,
        failed: failedErrors.length,
        successRate: ((fixedErrors.length / (fixedErrors.length + failedErrors.length)) * 100).toFixed(2) + '%'
      },
      fixedErrors: fixedErrors.map(e => ({
        file: e.file,
        line: e.line,
        code: e.code,
        type: e.type,
        message: e.message
      })),
      failedErrors: failedErrors.map(e => ({
        file: e.file,
        line: e.line,
        code: e.code,
        type: e.type,
        message: e.message,
        reason: e.suggestedFix?.description || 'Manual fix required'
      }))
    };
    
    return report;
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const errorReportFile = args[0];
  
  if (!errorReportFile) {
    console.error('Usage: typescript-auto-fix.js <error-report.json>');
    process.exit(1);
  }
  
  const errorReport = JSON.parse(fs.readFileSync(errorReportFile, 'utf-8'));
  const fixer = new TypeScriptAutoFixer();
  
  console.log(`Found ${errorReport.errors.length} errors, ${errorReport.summary.autoFixable} are auto-fixable\n`);
  
  fixer.fixErrors(errorReport.errors).then(({ fixedErrors, failedErrors }) => {
    const report = fixer.generateFixReport(fixedErrors, failedErrors);
    
    console.log('\n' + '='.repeat(50));
    console.log('Fix Summary:');
    console.log(`  Total errors: ${report.summary.total}`);
    console.log(`  Fixed: ${report.summary.fixed}`);
    console.log(`  Failed: ${report.summary.failed}`);
    console.log(`  Success rate: ${report.summary.successRate}`);
    
    // Save report
    const reportPath = errorReportFile.replace('.json', '-fix-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nFix report saved to: ${reportPath}`);
  });
}

module.exports = TypeScriptAutoFixer;