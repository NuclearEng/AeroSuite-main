#!/usr/bin/env node

/**
 * TypeScript Error Parser
 * Parses TypeScript compilation errors and provides structured output
 */

const fs = require('fs');
const path = require('path');

class TypeScriptErrorParser {
  constructor() {
    this.errors = [];
    this.errorPatterns = {
      // JSX component errors
      cannotBeUsedAsJSX: /TS2786: '(.+)' cannot be used as a JSX component/,
      
      // Type assignment errors
      notAssignableToType: /TS2322: Type '(.+)' is not assignable to type '(.+)'/,
      argumentNotAssignable: /TS2345: Argument of type '(.+)' is not assignable to parameter of type '(.+)'/,
      
      // Property errors
      propertyDoesNotExist: /TS2339: Property '(.+)' does not exist on type '(.+)'/,
      
      // Module/import errors
      cannotFindModule: /TS2305: Module '(.+)' has no exported member '(.+)'/,
      noExportedMember: /TS2614: Module '(.+)' has no exported member '(.+)'/,
      cannotFindName: /TS2304: Cannot find name '(.+)'/,
      implicitAny: /TS7006: Parameter '(.+)' implicitly has an 'any' type/,
      noDeclarationFile: /TS7016: Could not find a declaration file for module '(.+)'/,
      
      // Interface errors
      interfaceIncorrectlyExtends: /TS2430: Interface '(.+)' incorrectly extends interface '(.+)'/,
      
      // Type conversion errors
      conversionMayBeMistake: /TS2352: Conversion of type '(.+)' to type '(.+)' may be a mistake/,
      
      // Arithmetic operation errors
      leftHandSideArithmetic: /TS2362: The left-hand side of an arithmetic operation must be of type/,
      rightHandSideArithmetic: /TS2363: The right-hand side of an arithmetic operation must be of type/,
      
      // Other errors
      noOverloadMatches: /TS2769: No overload matches this call/,
      typeIsNotFunction: /TS18046: '(.+)' is of type 'unknown'/,
      duplicateDeclaration: /TS2717: Subsequent property declarations must have the same type/,
      cannotFindVariable: /TS2552: Cannot find name '(.+)'. Did you mean '(.+)'/,
    };
  }

  parseError(errorText) {
    const lines = errorText.split('\n');
    const errors = [];
    let currentError = null;

    for (const line of lines) {
      // Match error location
      const locationMatch = line.match(/^ERROR in (.+):(\d+):(\d+)$/);
      if (locationMatch) {
        if (currentError) {
          errors.push(currentError);
        }
        currentError = {
          file: locationMatch[1],
          line: parseInt(locationMatch[2]),
          column: parseInt(locationMatch[3]),
          code: null,
          message: '',
          type: null,
          context: [],
          suggestedFix: null
        };
        continue;
      }

      // Match TypeScript error code and message
      const errorMatch = line.match(/^(TS\d+): (.+)$/);
      if (errorMatch && currentError) {
        currentError.code = errorMatch[1];
        currentError.message = errorMatch[2];
        currentError.type = this.categorizeError(currentError.code, currentError.message);
        currentError.suggestedFix = this.suggestFix(currentError);
        continue;
      }

      // Collect context lines
      if (currentError && line.match(/^\s*\d+\s*\|/)) {
        currentError.context.push(line);
      }
    }

    if (currentError) {
      errors.push(currentError);
    }

    return errors;
  }

  categorizeError(code, message) {
    for (const [type, pattern] of Object.entries(this.errorPatterns)) {
      if (pattern.test(`${code}: ${message}`)) {
        return type;
      }
    }
    return 'unknown';
  }

  suggestFix(error) {
    const { type, code, message, file } = error;

    switch (type) {
      case 'cannotBeUsedAsJSX':
        return {
          type: 'jsxComponent',
          description: 'Add proper type definitions or fix component implementation',
          autoFixable: true
        };

      case 'propertyDoesNotExist':
        const propMatch = message.match(/Property '(.+)' does not exist on type '(.+)'/);
        if (propMatch) {
          return {
            type: 'missingProperty',
            property: propMatch[1],
            onType: propMatch[2],
            description: `Add property '${propMatch[1]}' to type or interface`,
            autoFixable: true
          };
        }
        break;

      case 'notAssignableToType':
      case 'argumentNotAssignable':
        return {
          type: 'typeIncompatibility',
          description: 'Fix type mismatch or add type assertion',
          autoFixable: true
        };

      case 'cannotFindName':
      case 'cannotFindVariable':
        const nameMatch = message.match(/Cannot find name '(.+)'/);
        if (nameMatch) {
          return {
            type: 'undefinedVariable',
            variable: nameMatch[1],
            description: `Import or define '${nameMatch[1]}'`,
            autoFixable: true
          };
        }
        break;

      case 'implicitAny':
        const paramMatch = message.match(/Parameter '(.+)' implicitly has an 'any' type/);
        if (paramMatch) {
          return {
            type: 'implicitAny',
            parameter: paramMatch[1],
            description: `Add explicit type annotation for parameter '${paramMatch[1]}'`,
            autoFixable: true
          };
        }
        break;

      case 'noDeclarationFile':
        const moduleMatch = message.match(/Could not find a declaration file for module '(.+)'/);
        if (moduleMatch) {
          return {
            type: 'missingTypes',
            module: moduleMatch[1],
            description: `Install @types/${moduleMatch[1]} or create declaration file`,
            autoFixable: true
          };
        }
        break;

      default:
        return {
          type: 'manual',
          description: 'Manual fix required',
          autoFixable: false
        };
    }
  }

  generateReport(errors) {
    const summary = {
      total: errors.length,
      byType: {},
      byFile: {},
      autoFixable: 0
    };

    errors.forEach(error => {
      // Count by type
      summary.byType[error.type] = (summary.byType[error.type] || 0) + 1;
      
      // Count by file
      summary.byFile[error.file] = (summary.byFile[error.file] || 0) + 1;
      
      // Count auto-fixable
      if (error.suggestedFix?.autoFixable) {
        summary.autoFixable++;
      }
    });

    return {
      summary,
      errors: errors.sort((a, b) => {
        // Sort by file, then by line number
        if (a.file !== b.file) {
          return a.file.localeCompare(b.file);
        }
        return a.line - b.line;
      })
    };
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const inputFile = args[0] || '-';
  const outputFile = args[1];

  let errorText;
  if (inputFile === '-') {
    // Read from stdin
    errorText = fs.readFileSync(0, 'utf-8');
  } else {
    errorText = fs.readFileSync(inputFile, 'utf-8');
  }

  const parser = new TypeScriptErrorParser();
  const errors = parser.parseError(errorText);
  const report = parser.generateReport(errors);

  const output = JSON.stringify(report, null, 2);

  if (outputFile) {
    fs.writeFileSync(outputFile, output);
    console.log(`Report written to ${outputFile}`);
  } else {
    console.log(output);
  }
}

module.exports = TypeScriptErrorParser;