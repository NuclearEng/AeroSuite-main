/**
 * Script to help identify and fix tests that need React Router context
 * 
 * This script searches for test files that might be using React Router hooks
 * without proper context and suggests fixes.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all test files
const findTestFiles = () => {
  return glob.sync('src/**/*.test.{js,jsx,ts,tsx}', { cwd: process.cwd() });
};

// Check if a file might need Router context
const mightNeedRouterContext = (content) => {
  // Check for render calls without router context
  const hasRender = content.includes('render(<') && !content.includes('renderWithRouter');
  
  // Check for potential React Router hooks
  const routerHookPatterns = [
    'useNavigate',
    'useParams',
    'useLocation',
    'useRouteMatch',
    'useHistory',
    'Link',
    'NavLink',
    'Route',
    '<Router',
    'withRouter'
  ];
  
  const hasRouterHooks = routerHookPatterns.some(pattern => content.includes(pattern));
  
  return hasRender && hasRouterHooks;
};

// Generate suggested fix
const generateFix = (filePath, content) => {
  const componentName = path.basename(filePath, path.extname(filePath)).replace('.test', '');
  const relativePath = path.relative(path.dirname(filePath), 'src/test-utils').replace(/\\/g, '/');
  
  let importStatement = `import { renderWithRouter } from '${relativePath}/router-wrapper';\n`;
  
  // Replace render with renderWithRouter
  const updatedContent = content
    .replace(/import {([^}]*)} from ['"]@testing-library\/react['"];/g, 
             (match, imports) => {
               if (!imports.includes('render')) return match;
               return `import {${imports}} from '${relativePath}/test-setup';`;
             })
    .replace(/render\(<([^>]*)\/>\)/g, 
             (match, component) => {
               return `renderWithRouter(<${component}/>, {
  path: '/${componentName.toLowerCase()}',
  route: '/${componentName.toLowerCase()}',
  initialEntries: ['/${componentName.toLowerCase()}']
})`;
             });
  
  return updatedContent;
};

// Main function
const main = () => {
  const testFiles = findTestFiles();
  console.log(`Found ${testFiles.length} test files`);
  
  let needsFixes = [];
  
  testFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    if (mightNeedRouterContext(content)) {
      needsFixes.push(file);
      console.log(`${file} might need Router context`);
      
      // Generate fix
      const fixedContent = generateFix(file, content);
      
      // Write to a temporary file for review
      const tempFile = `${file}.fixed`;
      fs.writeFileSync(tempFile, fixedContent);
      console.log(`Generated suggested fix in ${tempFile}`);
    }
  });
  
  console.log(`\nTotal files that might need fixes: ${needsFixes.length}`);
  if (needsFixes.length > 0) {
    console.log('\nTo apply a fix, review the .fixed file and then rename it to replace the original.');
  }
};

main(); 