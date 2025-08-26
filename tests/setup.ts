import * as dotenv from 'dotenv';

dotenv.config();

global.beforeEach(() => {
  jest.clearAllMocks();
});

/**
 * Test environment utilities
 */
export const testUtils = {
  /**
   * Check if Jira integration tests can run
   */
  canRunIntegrationTests(): boolean {
    const hasUrl = Boolean(process.env.JIRA_URL);
    const hasToken = Boolean(process.env.JIRA_PERSONAL_TOKEN);
    return hasUrl && hasToken;
  },

  /**
   * Get test configuration for integration tests
   */
  getTestConfig() {
    return {
      url: process.env.JIRA_URL || '',
      bearer: process.env.JIRA_PERSONAL_TOKEN || '',
    };
  },

  /**
   * Skip test if integration tests cannot run
   */
  skipIfNoIntegration(): void {
    if (!this.canRunIntegrationTests()) {
      console.warn(
        'Skipping integration test: JIRA_URL or JIRA_PERSONAL_TOKEN not configured'
      );
      // This will be caught by the test framework
      throw new Error('SKIP_INTEGRATION_TEST');
    }
  },
};

// Make testUtils available globally
(global as any).testUtils = testUtils;
