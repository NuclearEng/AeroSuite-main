#!/usr/bin/env node

/**
 * Script to help developers apply React Router testing utilities to component tests
 * 
 * This script analyzes test files and suggests changes to use the new testing utilities.
 * It can also apply the changes automatically if requested.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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
async function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    const needsRouter = needsRouterContext(content);
    const needsTheme = needsThemeContext(content);
    
    if (!needsRouter && !needsTheme) {
      return { filePath, needsChanges: false };
    }
    
    const modified = replaceRenderCalls(content, needsRouter, needsTheme);
    
    if (modified !== content) {
      return { 
        filePath, 
        needsChanges: true, 
        original: content, 
        modified,
        needsRouter,
        needsTheme
      };
    }
    
    return { filePath, needsChanges: false };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return { filePath, needsChanges: false, error };
  }
}

// Find all test files
function findTestFiles() {
  return glob.sync(TEST_PATTERN);
}

// Apply changes to a file
function applyChanges(filePath, modified) {
  try {
    fs.writeFileSync(filePath, modified, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
    return false;
  }
}

// Main function
async function main() {
  console.log('Analyzing test files...');
  
  const testFiles = findTestFiles();
  console.log(`Found ${testFiles.length} test files.`);
  
  const results = [];
  
  for (const filePath of testFiles) {
    const result = await processFile(filePath);
    results.push(result);
    
    if (result.needsChanges) {
      console.log(`\n${filePath} needs changes:`);
      
      if (result.needsRouter && result.needsTheme) {
        console.log('- Needs both Router and Theme context');
      } else if (result.needsRouter) {
        console.log('- Needs Router context');
      } else if (result.needsTheme) {
        console.log('- Needs Theme context');
      }
      
      rl.question('Apply changes? (y/n): ', (answer) => {
        if (answer.toLowerCase() === 'y') {
          const success = applyChanges(result.filePath, result.modified);
          if (success) {
            console.log(`✅ Changes applied to ${result.filePath}`);
          } else {
            console.log(`❌ Failed to apply changes to ${result.filePath}`);
          }
        } else {
          console.log(`Skipped ${result.filePath}`);
        }
      });
    }
  }
  
  const needsChanges = results.filter(r => r.needsChanges);
  console.log(`\n${needsChanges.length} files need changes.`);
  
  rl.close();
}

main().catch(console.error); 