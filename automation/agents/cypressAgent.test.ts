import { runCypressAgent } from './cypressAgent';
import { runCursorCommand } from '../utils/cursorApi';
import { saveMemory, loadMemory } from './memoryAgent';

// Mock dependencies
jest.mock('../utils/cursorApi');
jest.mock('./memoryAgent');

describe('Cypress Agent', () => {
  beforeEach(() => {
    // Reset mocks
    jest.resetAllMocks();
    
    // Default mock implementations
    (runCursorCommand as jest.Mock).mockResolvedValue({
      success: true,
      output: '✓ 10 of 10 passed (100%)',
      error: ''
    });
    
    (loadMemory as jest.Mock).mockResolvedValue('Previous test results');
    (saveMemory as jest.Mock).mockResolvedValue(undefined);
  });
  
  it('should run Cypress tests for a module', async () => {
    const result = await runCypressAgent('login');
    
    // Verify correct test was run
    expect(runCursorCommand).toHaveBeenCalledWith(
      expect.stringContaining('auth-security-tests.cy.js')
    );
    
    // Verify memory was loaded and saved
    expect(loadMemory).toHaveBeenCalledWith('cypress', 'login');
    expect(saveMemory).toHaveBeenCalledWith('cypress', 'login', expect.any(String));
    
    // Verify result structure
    expect(result).toHaveProperty('passed', true);
    expect(result).toHaveProperty('details');
    expect(result.details).toContain('Previous test results');
    expect(result.details).toContain('Cypress Test Results for login');
  });
  
  it('should handle failed tests', async () => {
    (runCursorCommand as jest.Mock).mockResolvedValue({
      success: false,
      output: '✘ 3 of 10 failed (70%)',
      error: 'Some tests failed'
    });
    
    const result = await runCypressAgent('api');
    
    // Verify correct test was run
    expect(runCursorCommand).toHaveBeenCalledWith(
      expect.stringContaining('api-tests.cy.js')
    );
    
    // Verify result structure
    expect(result).toHaveProperty('passed', false);
    expect(result.details).toContain('❌ Some tests failed!');
  });
  
  it('should handle unknown modules', async () => {
    await runCypressAgent('unknown-module');
    
    // Verify it tries to run tests with a wildcard pattern
    expect(runCursorCommand).toHaveBeenCalledWith(
      expect.stringContaining('*unknown-module*.cy.js')
    );
  });
});
