#!/usr/bin/env node

/**
 * Fix common TypeScript errors in test files
 */

const fs = require('fs');
const path = require('path');

class TestTypeScriptFixer {
  constructor() {
    this.fixes = {
      // Fix implicit any in test mock functions
      fixImplicitAny: (content, filePath) => {
        // Fix mock function parameters
        content = content.replace(/jest\.fn\(\((.*?)\) => /g, (match, params) => {
          if (!params.includes(':')) {
            const paramNames = params.split(',').map(p => p.trim()).filter(p => p);
            const typedParams = paramNames.map(p => `${p}: any`).join(', ');
            return `jest.fn((${typedParams}) => `;
          }
          return match;
        });

        // Fix React.forwardRef parameters
        content = content.replace(/React\.forwardRef\(\((props), (ref)\)/g, 
          'React.forwardRef((props: any, ref: any)');
        
        // Fix component mock parameters
        content = content.replace(/= \((props)\) => \{/g, '= (props: any) => {');
        
        return content;
      },

      // Fix Chart test props
      fixChartTestProps: (content, filePath) => {
        if (filePath.includes('Chart.test')) {
          // Add ChartProps interface if missing
          if (!content.includes('interface ChartProps')) {
            const importIndex = content.lastIndexOf('import');
            const importEnd = content.indexOf('\n', importIndex);
            
            const chartPropsInterface = `
interface ChartProps {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'radar' | 'polarArea' | 'bubble' | 'scatter';
  data: any;
  title?: string;
  height?: number;
  options?: any;
  loading?: boolean;
  error?: string | null;
  className?: string;
}
`;
            content = content.slice(0, importEnd + 1) + chartPropsInterface + content.slice(importEnd + 1);
          }

          // Remove 'sx' prop from Chart components in tests
          content = content.replace(/<Chart([^>]*?)sx=\{[^}]+\}([^>]*?)>/g, '<Chart$1$2>');
        }
        return content;
      },

      // Fix FiltersToolbar test props
      fixFiltersToolbarProps: (content, filePath) => {
        if (filePath.includes('FiltersToolbar.test')) {
          // Replace incorrect prop names
          content = content.replace(/showClearButton/g, 'showFilterButton');
          content = content.replace(/initialValues: \{[^}]+\},?\s*/g, '');
          content = content.replace(/compact: \w+,?\s*/g, '');
          
          // Remove 'placeholder' from FilterDefinition
          content = content.replace(/placeholder: ['"][^'"]+['"],?\s*/g, '');
          
          // Remove 'sx' prop
          content = content.replace(/sx: \{[^}]+\},?\s*/g, '');
        }
        return content;
      },

      // Fix FormBuilder test props  
      fixFormBuilderProps: (content, filePath) => {
        if (filePath.includes('FormBuilder.test')) {
          // Replace 'fields' prop with 'schema'
          content = content.replace(/fields: /g, 'schema: { fields: ');
          content = content.replace(/defaultValues: /g, '}, defaultValues: ');
        }
        return content;
      }
    };
  }

  fixFile(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) {
      return { file: filePath, fixed: false };
    }

    try {
      let content = fs.readFileSync(filePath, 'utf-8');
      const originalContent = content;

      // Apply all fixes
      for (const [fixName, fixFn] of Object.entries(this.fixes)) {
        content = fixFn(content, filePath);
      }

      if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        return { file: filePath, fixed: true };
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error.message);
    }

    return { file: filePath, fixed: false };
  }

  fixTestFiles(directory) {
    const testFiles = this.findTestFiles(directory);
    const results = [];

    console.log(`Found ${testFiles.length} test files to check...\n`);

    for (const file of testFiles) {
      const result = this.fixFile(file);
      if (result.fixed) {
        results.push(result);
        console.log(`✓ Fixed ${result.file}`);
      }
    }

    return results;
  }

  findTestFiles(dir, files = []) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      
      if (item === 'node_modules' || item === 'build' || item === 'dist') {
        continue;
      }
      
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          this.findTestFiles(fullPath, files);
        } else if (item.includes('.test.') || item.includes('.spec.')) {
          files.push(fullPath);
        }
      } catch (e) {
        // Skip inaccessible files
      }
    }
    
    return files;
  }
}

// CLI usage
if (require.main === module) {
  const fixer = new TestTypeScriptFixer();
  const directory = process.argv[2] || path.join(process.cwd(), 'client', 'src');
  
  console.log('🔧 Fixing TypeScript Errors in Test Files');
  console.log('=========================================\n');

  const results = fixer.fixTestFiles(directory);

  console.log('\n' + '='.repeat(50));
  console.log(`Summary: Fixed ${results.length} test files`);
}

module.exports = TestTypeScriptFixer;