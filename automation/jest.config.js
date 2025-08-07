module.exports = {
  // Transform TypeScript files
  preset: 'ts-jest',
  
  // Setup test environment
  testEnvironment: 'node',
  
  // Transform settings
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  
  // File extensions to consider
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Coverage settings
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**'
  ],
  
  // Test timeouts
  testTimeout: 30000,
  
  // Verbose output
  verbose: true
};
