#!/usr/bin/env node

/**
 * Batch script to fix multiple React Router test files at once
 * 
 * This script applies the React Router testing utilities to multiple test files
 * without requiring confirmation for each file.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const TEST_PATTERN = 'src/**/*.test.{js,jsx,ts,tsx}';
const ROUTER_HOOK_PATTERNS = [
  'useNavigate',
  'useParams',
  'useLocation',
  'useRouteMatch',
  'useHistory',
  'useSearchParams',
];
const THEME_HOOK_PATTERNS = [
  'useTheme',
  'makeStyles',
  'styled',
  'withStyles',
];

// Helper function to check if a file needs React Router context
function needsRouterContext(content) {
  return ROUTER_HOOK_PATTERNS.some(pattern => content.includes(pattern));
}

// Helper function to check if a file needs Theme context
function needsThemeContext(content) {
  return THEME_HOOK_PATTERNS.some(pattern => content.includes(pattern));
}

// Helper function to generate the import statement
function generateImport(needsRouter, needsTheme) {
  if (needsRouter && needsTheme) {
    return "import { renderWithRouterAndTheme } from '../../test-utils/combined-wrapper';";
  } else if (needsRouter) {
    return "import { renderWithRouter } from '../../test-utils/router-wrapper';";
  } else if (needsTheme) {
    return "import { renderWithTheme } from '../../test-utils/theme-wrapper';";
  }
  return null;
}

// Helper function to replace render calls
function replaceRenderCalls(content, needsRouter, needsTheme) {
  let modified = content;
  
  // Replace import statements
  const reactTestingLibraryImport = modified.match(/import [^;]* from ['"]@testing-library\/react['"];/);
  if (reactTestingLibraryImport) {
    // Keep the render in the import but add our custom import
    const importStatement = generateImport(needsRouter, needsTheme);
    if (importStatement) {
      modified = modified.replace(
        reactTestingLibraryImport[0], 
        `${reactTestingLibraryImport[0]}\n${importStatement}`
      );
    }
  }
  
  // Replace render calls
  if (needsRouter && needsTheme) {
    // Replace render(<Component />) with renderWithRouterAndTheme(<Component />, { options })
    modified = modified.replace(
      /render\(\s*<([^>]+)\/>\s*\)/g, 
      'renderWithRouterAndTheme(<$1/>, {\n      path: \'/path\',\n      route: \'/path\',\n      initialEntries: [\'/path\']\n    })'
    );
  } else if (needsRouter) {
    // Replace render(<Component />) with renderWithRouter(<Component />, { options })
    modified = modified.replace(
      /render\(\s*<([^>]+)\/>\s*\)/g, 
      'renderWithRouter(<$1/>, {\n      path: \'/path\',\n      route: \'/path\',\n      initialEntries: [\'/path\']\n    })'
    );
  } else if (needsTheme) {
    // Replace render(<Component />) with renderWithTheme(<Component />)
    modified = modified.replace(
      /render\(\s*<([^>]+)\/>\s*\)/g, 
      'renderWithTheme(<$1/>)'
    );
  }
  
  // Add task reference comment
  if (modified !== content && !modified.includes('Task: DEV004')) {
    modified = modified.replace(
      /(describe\(['"][^'"]+['"]\s*,\s*\(\)\s*=>\s*{)/,
      '// Task: DEV004 - Fix component tests for React Router\n$1'
    );
  }
  
  return modified;
}

// Process a single file
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    const needsRouter = needsRouterContext(content);
    const needsTheme = needsThemeContext(content);
    
    if (!needsRouter && !needsTheme) {
      return { filePath, needsChanges: false };
    }
    
    const modified = replaceRenderCalls(content, needsRouter, needsTheme);
    
    if (modified !== content) {
      // Create a backup
      fs.writeFileSync(`${filePath}.bak`, content, 'utf8');
      
      // Write the modified content
      fs.writeFileSync(filePath, modified, 'utf8');
      
      return { 
        filePath, 
        needsChanges: true, 
        needsRouter,
        needsTheme,
        success: true
      };
    }
    
    return { filePath, needsChanges: false };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return { filePath, needsChanges: false, error, success: false };
  }
}

// Find all test files
function findTestFiles(pattern = TEST_PATTERN) {
  return glob.sync(pattern);
}

// Main function
function main() {
  // Get the pattern from command line arguments if provided
  const pattern = process.argv[2] || TEST_PATTERN;
  
  console.log(`Analyzing test files matching pattern: ${pattern}`);
  
  const testFiles = findTestFiles(pattern);
  console.log(`Found ${testFiles.length} test files.`);
  
  const results = [];
  
  for (const filePath of testFiles) {
    const result = processFile(filePath);
    results.push(result);
    
    if (result.needsChanges) {
      if (result.success) {
        console.log(`✅ Fixed ${filePath}`);
        
        if (result.needsRouter && result.needsTheme) {
          console.log('  - Added Router and Theme context');
        } else if (result.needsRouter) {
          console.log('  - Added Router context');
        } else if (result.needsTheme) {
          console.log('  - Added Theme context');
        }
      } else {
        console.log(`❌ Failed to fix ${filePath}`);
      }
    }
  }
  
  const fixed = results.filter(r => r.needsChanges && r.success);
  const failed = results.filter(r => r.needsChanges && !r.success);
  
  console.log(`\nSummary:`);
  console.log(`- ${fixed.length} files fixed`);
  console.log(`- ${failed.length} files failed`);
  console.log(`- ${testFiles.length - fixed.length - failed.length} files did not need changes`);
}

main(); 