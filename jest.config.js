export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.spec.ts',
  ],
  
  // Module resolution
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^@/(.*)\\.(js|ts)$': '<rootDir>/src/$1',
    '^@/config/(.*)\\.(js|ts)$': '<rootDir>/src/config/$1',
    '^@/lib/(.*)\\.(js|ts)$': '<rootDir>/src/lib/$1',
    '^@/tools/(.*)\\.(js|ts)$': '<rootDir>/src/tools/$1',
    '^@/server/resources/(.*)\\.(js|ts)$': '<rootDir>/src/server/resources/$1',
    '^@/types/(.*)\\.(js|ts)$': '<rootDir>/src/types/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/config/(.*)$': '<rootDir>/src/config/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/tools/(.*)$': '<rootDir>/src/tools/$1',
    '^@/server/resources/(.*)$': '<rootDir>/src/server/resources/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    '^(.*)\\.js$': '$1',
    // Force uuid to use Node.js version instead of browser ESM
    '^uuid$': '<rootDir>/node_modules/uuid/dist/index.js',
    '^uuid/(.*)$': '<rootDir>/node_modules/uuid/dist/$1',
  },
  
  // TypeScript configuration
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: 'tsconfig.json',
    }],
  },
  
  // Transform CommonJS modules
  transformIgnorePatterns: [
    'node_modules/(?!(jira-client|postman-request)/)',
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // Test environment for MSW
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  
  // Coverage configuration
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // Test environment setup
  testTimeout: 10000,
  verbose: true,
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
  ],
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Performance
  maxWorkers: '50%',
};