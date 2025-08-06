// client/jest.config.js
export default {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'json'],
  
  // Transform files with Babel
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  
  // Module name mapping for absolute imports
  moduleNameMapper: {
    // Handle CSS imports (ignore them in tests)
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    
    // Handle absolute imports from src
    '^@/(.*)$': '<rootDir>/src/$1',
    
    // Handle relative imports
    '^../utils/(.*)$': '<rootDir>/src/utils/$1',
    '^./(.*)$': '<rootDir>/src/$1',
  },
  
  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  
  // Test file patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(js|jsx)',
    '<rootDir>/src/**/?(*.)(test|spec).(js|jsx)',
  ],
  
  // Coverage configuration
  collectCoverage: false, // Set to true when you want coverage reports
  collectCoverageFrom: [
    'src/**/*.(js|jsx)',
    '!src/**/*.test.(js|jsx)',
    '!src/**/__tests__/**',
    '!src/main.jsx', // Exclude entry file
    '!src/index.js', // Exclude index files
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
};