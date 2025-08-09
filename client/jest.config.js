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
  
  // Module name mapping - CORRECTED VERSION
  moduleNameMapper: {
    // Handle CSS imports (ignore them in tests)
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    
    // Handle absolute imports from src directory only
    '^@/(.*)$': '<rootDir>/src/$1',
    
    // Handle specific relative imports for utils only
    '^../utils/dateUtils$': '<rootDir>/src/utils/dateUtils.js',
    '^../utils/studentPricingUtils$': '<rootDir>/src/utils/studentPricingUtils.js',
    
    // Handle relative imports starting with ../utils/ specifically
    '^../utils/(.*)$': '<rootDir>/src/utils/$1',
  },
  
  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  
  // Test file patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(js|jsx)',
    '<rootDir>/src/**/?(*.)(test|spec).(js|jsx)',
  ],
  
  // Ignore patterns - IMPORTANT: Exclude node_modules properly
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
  ],
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(some-esm-package)/)',
  ],
  
  // Coverage configuration
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.(js|jsx)',
    '!src/**/*.test.(js|jsx)',
    '!src/**/__tests__/**',
    '!src/main.jsx',
    '!src/index.js',
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
  
  // Root directory
  rootDir: '.',
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },
};