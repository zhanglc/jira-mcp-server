/**
 * Jest Test Setup
 *
 * Global test configuration and setup including MSW mock server.
 */

import { setupMockServer } from './utils/mcp-mock-server';

// Setup MSW mock server for API testing
setupMockServer();

// Global test setup
beforeAll(() => {
  // Additional global setup
});

afterAll(() => {
  // Additional global cleanup
});

beforeEach(() => {
  // Reset any test state before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
  jest.resetAllMocks();
});

// Increase timeout for integration tests
jest.setTimeout(10000);

// Global test environment variables
process.env.NODE_ENV = 'test';
process.env.JIRA_URL = 'https://test.atlassian.net';
process.env.JIRA_PERSONAL_TOKEN = 'test-token';
