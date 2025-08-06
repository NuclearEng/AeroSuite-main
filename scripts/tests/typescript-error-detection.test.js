const TypeScriptErrorParser = require('../typescript-error-parser');
const TypeScriptAutoFixer = require('../typescript-auto-fix');
const TypeScriptErrorTester = require('../test-typescript-errors');
const fs = require('fs');
const path = require('path');

describe('TypeScript Error Detection and Auto-Fix', () => {
  let parser;
  let fixer;
  let tester;

  beforeEach(() => {
    parser = new TypeScriptErrorParser();
    fixer = new TypeScriptAutoFixer();
    tester = new TypeScriptErrorTester({ autoFix: false });
  });

  describe('Error Parser', () => {
    test('should parse JSX component errors', () => {
      const errorText = `
ERROR in src/App.tsx:26:12
TS2786: 'HelmetProvider' cannot be used as a JSX component.
  Its instance type 'HelmetProvider' is not a valid JSX element.
    24 |       <ThemeProvider>
    25 |         <LocalizationProvider dateAdapter={AdapterDateFns}>
  > 26 |           <HelmetProvider>
       |            ^^^^^^^^^^^^^^
    27 |             <SnackbarProvider`;

      const errors = parser.parseError(errorText);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        file: 'src/App.tsx',
        line: 26,
        column: 12,
        code: 'TS2786',
        type: 'cannotBeUsedAsJSX'
      });
      expect(errors[0].suggestedFix).toMatchObject({
        type: 'jsxComponent',
        autoFixable: true
      });
    });

    test('should parse property does not exist errors', () => {
      const errorText = `
ERROR in src/components/common/ApiVersionWarningBanner.tsx:43:44
TS2339: Property 'checkApiVersion' does not exist on type '{ get: <T>(...) }'.
    41 |     try {
    42 |       // Get the latest version
  > 43 |       const versionInfo = await apiService.checkApiVersion();
       |                                            ^^^^^^^^^^^^^^^`;

      const errors = parser.parseError(errorText);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        file: 'src/components/common/ApiVersionWarningBanner.tsx',
        line: 43,
        column: 44,
        code: 'TS2339',
        type: 'propertyDoesNotExist'
      });
      expect(errors[0].suggestedFix).toMatchObject({
        type: 'missingProperty',
        property: 'checkApiVersion',
        autoFixable: true
      });
    });

    test('should parse type assignment errors', () => {
      const errorText = `
ERROR in src/components/auth/TwoFactorSetup.tsx:73:19
TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'SetStateAction<string | null>'.
  Type 'undefined' is not assignable to type 'SetStateAction<string | null>'.
    71 |       
    72 |       if (method === 'app') {
  > 73 |         setQrCode(response.qrCode);
       |                   ^^^^^^^^^^^^^^^`;

      const errors = parser.parseError(errorText);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        file: 'src/components/auth/TwoFactorSetup.tsx',
        line: 73,
        column: 19,
        code: 'TS2345',
        type: 'argumentNotAssignable'
      });
    });

    test('should parse cannot find name errors', () => {
      const errorText = `
ERROR in src/components/common/ThemeSettings.tsx:174:14
TS2304: Cannot find name 'ColorLens'.
    172 |         >
    173 |           <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
  > 174 |             <ColorLens sx={{ color: theme.palette.primary.main, mr: 1.5 }} />
       |              ^^^^^^^^^`;

      const errors = parser.parseError(errorText);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        file: 'src/components/common/ThemeSettings.tsx',
        line: 174,
        column: 14,
        code: 'TS2304',
        type: 'cannotFindName'
      });
      expect(errors[0].suggestedFix).toMatchObject({
        type: 'undefinedVariable',
        variable: 'ColorLens',
        autoFixable: true
      });
    });

    test('should generate error report with summary', () => {
      const errors = [
        {
          file: 'src/App.tsx',
          line: 26,
          column: 12,
          code: 'TS2786',
          type: 'cannotBeUsedAsJSX',
          message: "'HelmetProvider' cannot be used as a JSX component",
          suggestedFix: { autoFixable: true }
        },
        {
          file: 'src/App.tsx',
          line: 27,
          column: 14,
          code: 'TS2786',
          type: 'cannotBeUsedAsJSX',
          message: "'SnackbarProvider' cannot be used as a JSX component",
          suggestedFix: { autoFixable: true }
        },
        {
          file: 'src/utils/auth.ts',
          line: 134,
          column: 12,
          code: 'TS18046',
          type: 'typeIsNotFunction',
          message: "'response' is of type 'unknown'",
          suggestedFix: { autoFixable: false }
        }
      ];

      const report = parser.generateReport(errors);
      expect(report.summary).toMatchObject({
        total: 3,
        byType: {
          cannotBeUsedAsJSX: 2,
          typeIsNotFunction: 1
        },
        byFile: {
          'src/App.tsx': 2,
          'src/utils/auth.ts': 1
        },
        autoFixable: 2
      });
    });
  });

  describe('Auto Fixer', () => {
    test('should fix JSX component errors', async () => {
      const content = `import React from 'react';
import { HelmetProvider } from 'react-helmet-async';

export default function App() {
  return (
    <HelmetProvider>
      <div>Content</div>
    </HelmetProvider>
  );
}`;

      const error = {
        file: 'src/App.tsx',
        line: 6,
        column: 5,
        code: 'TS2786',
        type: 'cannotBeUsedAsJSX',
        message: "'HelmetProvider' cannot be used as a JSX component",
        suggestedFix: {
          type: 'jsxComponent',
          autoFixable: true
        }
      };

      const fixed = await fixer.fixJSXComponent(content, error, 'src/App.tsx');
      expect(fixed).toContain('<HelmetProvider as any>');
    });

    test('should fix missing property errors with optional chaining', async () => {
      const content = `const apiService = getApiService();
const versionInfo = await apiService.checkApiVersion();`;

      const error = {
        file: 'src/test.ts',
        line: 2,
        column: 38,
        code: 'TS2339',
        type: 'propertyDoesNotExist',
        message: "Property 'checkApiVersion' does not exist",
        suggestedFix: {
          type: 'missingProperty',
          property: 'checkApiVersion',
          autoFixable: true
        }
      };

      const fixed = await fixer.fixMissingProperty(content, error, 'src/test.ts');
      expect(fixed).toContain('apiService?.checkApiVersion()');
    });

    test('should fix undefined variable errors', async () => {
      const content = `import React from 'react';
import { Box } from '@mui/material';

export default function Component() {
  return (
    <Box>
      <ColorLens />
    </Box>
  );
}`;

      const error = {
        file: 'src/Component.tsx',
        line: 7,
        column: 7,
        code: 'TS2304',
        type: 'cannotFindName',
        message: "Cannot find name 'ColorLens'",
        suggestedFix: {
          type: 'undefinedVariable',
          variable: 'ColorLens',
          autoFixable: true
        }
      };

      const fixed = await fixer.fixUndefinedVariable(content, error, 'src/Component.tsx');
      expect(fixed).toContain("import ColorLens from '@mui/icons-material/ColorLens'");
    });

    test('should fix implicit any errors', async () => {
      const content = `function processItem(item, index) {
  return item.value * index;
}`;

      const error = {
        file: 'src/utils.ts',
        line: 1,
        column: 22,
        code: 'TS7006',
        type: 'implicitAny',
        message: "Parameter 'item' implicitly has an 'any' type",
        suggestedFix: {
          type: 'implicitAny',
          parameter: 'item',
          autoFixable: true
        }
      };

      const fixed = await fixer.fixImplicitAny(content, error, 'src/utils.ts');
      expect(fixed).toContain('function processItem(item: any, index)');
    });

    test('should generate fix report', async () => {
      const fixedErrors = [
        { file: 'src/App.tsx', line: 26, code: 'TS2786', type: 'jsxComponent' },
        { file: 'src/App.tsx', line: 27, code: 'TS2786', type: 'jsxComponent' }
      ];
      const failedErrors = [
        { 
          file: 'src/utils/auth.ts', 
          line: 134, 
          code: 'TS18046', 
          type: 'unknown',
          suggestedFix: { description: 'Manual fix required' }
        }
      ];

      const report = fixer.generateFixReport(fixedErrors, failedErrors);
      expect(report.summary).toMatchObject({
        total: 3,
        fixed: 2,
        failed: 1,
        successRate: '66.67%'
      });
    });
  });

  describe('Error Tester Integration', () => {
    test('should detect and report TypeScript errors', async () => {
      // Mock the compile function to return known errors
      tester.compileAndCaptureErrors = jest.fn().mockResolvedValue([
        {
          file: 'src/App.tsx',
          line: 26,
          column: 12,
          code: 'TS2786',
          type: 'cannotBeUsedAsJSX',
          message: "'HelmetProvider' cannot be used as a JSX component",
          suggestedFix: { type: 'jsxComponent', autoFixable: true }
        }
      ]);

      const result = await tester.run();
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('TS2786');
    });

    test('should auto-fix errors when enabled', async () => {
      const testerWithFix = new TypeScriptErrorTester({ autoFix: true });
      
      // Mock functions
      testerWithFix.compileAndCaptureErrors = jest.fn()
        .mockResolvedValueOnce([
          {
            file: 'src/App.tsx',
            line: 26,
            column: 12,
            code: 'TS2786',
            type: 'cannotBeUsedAsJSX',
            message: "'HelmetProvider' cannot be used as a JSX component",
            suggestedFix: { type: 'jsxComponent', autoFixable: true }
          }
        ])
        .mockResolvedValueOnce([]); // After fix

      // Mock file operations
      const mockReadFile = jest.spyOn(fs, 'readFileSync').mockReturnValue('file content');
      const mockWriteFile = jest.spyOn(fs, 'writeFileSync').mockImplementation();

      const result = await testerWithFix.run();
      expect(result.success).toBe(true);
      expect(result.fixedErrors).toHaveLength(1);
      expect(result.remainingErrors).toHaveLength(0);

      mockReadFile.mockRestore();
      mockWriteFile.mockRestore();
    });
  });
});

// Export test utilities
module.exports = {
  createMockError: (overrides = {}) => ({
    file: 'src/test.ts',
    line: 1,
    column: 1,
    code: 'TS0000',
    type: 'unknown',
    message: 'Test error',
    context: [],
    suggestedFix: null,
    ...overrides
  }),
  
  createMockErrorText: (errors) => {
    return errors.map(error => `
ERROR in ${error.file}:${error.line}:${error.column}
${error.code}: ${error.message}
${error.context.join('\n')}
`).join('\n');
  }
};