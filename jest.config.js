/**
 * Jest Configuration
 * 
 * Configuration for the Jest testing framework.
 * 
 * @module jest.config
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'server/src/**/*.js',
    '!server/src/index.js', // Exclude entry point
    '!**/node_modules/**'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 45,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },

  // Coverage output directory
  coverageDirectory: 'coverage',

  // Setup files
  setupFilesAfterEnv: [],

  // Module paths
  moduleDirectories: ['node_modules'],

  // Test timeout
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true
};
