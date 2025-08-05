module.exports = {
  // Transform ESM modules in node_modules
  transformIgnorePatterns: [
    "/node_modules/(?!axios|react-router|react-router-dom|@mui/material|@mui/icons-material|@mui/system|@mui/utils|@mui/styles|@emotion|@testing-library)/"
  ],
  
  // Setup test environment
  testEnvironment: "jsdom",
  
  // Mock static assets
  moduleNameMapper: {
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/__mocks__/fileMock.js",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy"
  },
  
  // Setup files
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  
  // Coverage settings
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/index.tsx",
    "!src/reportWebVitals.ts",
    "!src/serviceWorker.ts"
  ],
  
  // Test timeouts
  testTimeout: 30000,
  
  // Add transform for ESM modules
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest"
  }
}; 