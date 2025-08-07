import { runCursorCommand } from '../utils/cursorApi';
import { saveMemory, loadMemory } from './memoryAgent';

/**
 * Cypress Agent - Runs Cypress E2E tests for the specified module
 * 
 * This agent is responsible for:
 * 1. Running Cypress tests related to the module
 * 2. Analyzing test results
 * 3. Storing test results in memory
 * 4. Providing detailed test reports
 */
export async function runCypressAgent(module: string) {
  // Load previous findings for context
  const previous = await loadMemory('cypress', module);
  
  // Map module name to appropriate test files
  let testSpec = '';
  switch(module.toLowerCase()) {
    case 'login':
    case 'auth':
      testSpec = 'auth-security-tests.cy.js';
      break;
    case 'api':
    case 'health':
      testSpec = 'api-tests.cy.js';
      break;
    case 'app':
    case 'dashboard':
      testSpec = 'app-tests.cy.js';
      break;
    case 'mongodb':
    case 'database':
      testSpec = 'mongodb-tests.cy.js';
      break;
    case 'infrastructure':
    case 'docker':
    case 'nginx':
    case 'redis':
      testSpec = 'infrastructure-tests.cy.js';
      break;
    case 'security':
    case 'owasp':
      testSpec = 'owasp-tests.cy.js';
      break;
    default:
      // For other modules, try to run tests that might be related
      testSpec = `*${module.toLowerCase()}*.cy.js`;
  }

  // Run Cypress tests
  const result = await runCursorCommand(`npm run cy:run -- --spec "cypress/e2e/${testSpec}"`);
  
  // Extract test results
  const passed = result.success;
  const failedTests = (result.output.match(/✘\s+(\d+)\s+of\s+(\d+)\s+failed/i) || [])[1] || '0';
  const totalTests = (result.output.match(/✘\s+(\d+)\s+of\s+(\d+)\s+failed/i) || [])[2] || 
                     (result.output.match(/✓\s+(\d+)\s+of\s+(\d+)\s+passed/i) || [])[2] || '0';
  
  // Create summary
  const summary = `
Cypress Test Results for ${module}:
- Tests Run: ${totalTests}
- Tests Failed: ${failedTests}
- Tests Passed: ${Number(totalTests) - Number(failedTests)}
- Success Rate: ${Math.round(((Number(totalTests) - Number(failedTests)) / Number(totalTests || 1)) * 100)}%

${passed ? '✅ All tests passed!' : '❌ Some tests failed!'}

Test Output:
${result.output.slice(0, 1000)}${result.output.length > 1000 ? '...(truncated)' : ''}
  `;
  
  // Save current findings to memory
  await saveMemory('cypress', module, summary);
  
  // Prepare detailed report
  const details = `${previous ? `Previous findings:\n${previous}\n---\n` : ''}${summary}\n(Memory updated)`;
  
  return { passed, details };
}
