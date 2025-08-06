#!/usr/bin/env node

/**
 * TypeScript Error Pattern Checker
 * Checks for common error patterns and suggests fixes
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ERROR_PATTERNS = [
  {
    "name": "textFieldOnChange",
    "description": "Fix TextField onChange handler types",
    "pattern": "textFieldOnChange"
  },
  {
    "name": "responseMissingData",
    "description": "Fix missing .data property on API responses",
    "pattern": "responseMissingData"
  },
  {
    "name": "catchBlockErrors",
    "description": "Fix missing error variables in catch blocks",
    "pattern": "catchBlockErrors"
  },
  {
    "name": "chipKeyProps",
    "description": "Fix duplicate key props in Chip components",
    "pattern": "chipKeyProps"
  },
  {
    "name": "serviceReturnTypes",
    "description": "Fix service method return types",
    "pattern": "serviceReturnTypes"
  },
  {
    "name": "importExportFixes",
    "description": "Fix import/export naming issues",
    "pattern": "importExportFixes"
  },
  {
    "name": "jsxComponentTypes",
    "description": "Fix JSX component type definitions",
    "pattern": "jsxComponentTypes"
  },
  {
    "name": "implicitAnyParams",
    "description": "Fix implicit any type parameters",
    "pattern": "implicitAnyParams"
  },
  {
    "name": "typeExports",
    "description": "Fix missing type exports",
    "pattern": "typeExports"
  },
  {
    "name": "selectOnChange",
    "description": "Fix Select component onChange handlers",
    "pattern": "selectOnChange"
  }
];

function checkTypeScriptErrors() {
  console.log('🔍 Checking for TypeScript error patterns...');
  
  try {
    // Run TypeScript compiler and capture errors
    execSync('cd client && npm run type-check', { stdio: 'pipe' });
    console.log('✅ No TypeScript errors found!');
    return [];
  } catch (error) {
    const output = error.stdout ? error.stdout.toString() : '';
    const errors = parseTypeScriptErrors(output);
    
    console.log(`⚠️  Found ${errors.length} TypeScript errors`);
    
    // Match errors to patterns
    const recommendations = [];
    for (const err of errors) {
      for (const pattern of ERROR_PATTERNS) {
        if (matchesPattern(err, pattern)) {
          recommendations.push({
            error: err,
            pattern: pattern.name,
            fix: pattern.description
          });
        }
      }
    }
    
    return recommendations;
  }
}

function parseTypeScriptErrors(output) {
  const lines = output.split('\n');
  const errors = [];
  let currentError = null;
  
  for (const line of lines) {
    const match = line.match(/^(.+):(\d+):(\d+) - error (TS\d+): (.+)/);
    if (match) {
      if (currentError) errors.push(currentError);
      currentError = {
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        code: match[4],
        message: match[5]
      };
    }
  }
  
  if (currentError) errors.push(currentError);
  return errors;
}

function matchesPattern(error, pattern) {
  // Simple pattern matching based on error code and message
  const patterns = {
    textFieldOnChange: error.code === 'TS2322' && error.message.includes('onChange'),
    responseMissingData: error.code === 'TS2339' && error.message.includes("'data'"),
    catchBlockErrors: error.code === 'TS2304' && error.message.includes("'err'"),
    chipKeyProps: error.code === 'TS2783' && error.message.includes("'key'"),
    serviceReturnTypes: error.code === 'TS2322' && error.message.includes('not assignable to type'),
    jsxComponentTypes: error.code === 'TS2786' && error.message.includes('JSX component'),
    implicitAnyParams: error.code === 'TS7006' && error.message.includes('implicitly has'),
    selectOnChange: error.code === 'TS2322' && error.message.includes('SelectChangeEvent')
  };
  
  return patterns[pattern.pattern];
}

// Auto-fix function
async function autoFix() {
  const recommendations = checkTypeScriptErrors();
  
  if (recommendations.length > 0) {
    console.log('\n🔧 Attempting auto-fix...');
    execSync('node ' + path.join(__dirname, 'typescript-comprehensive-fixer.js'));
    
    // Check again
    const remainingErrors = checkTypeScriptErrors();
    
    if (remainingErrors.length < recommendations.length) {
      console.log(`✅ Fixed ${recommendations.length - remainingErrors.length} errors`);
    }
    
    if (remainingErrors.length > 0) {
      console.log(`⚠️  ${remainingErrors.length} errors remain - manual intervention required`);
    }
  }
}

if (require.main === module) {
  autoFix();
}

module.exports = { checkTypeScriptErrors, autoFix };
