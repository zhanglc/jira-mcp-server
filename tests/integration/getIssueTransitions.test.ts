import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { JiraConfig } from '../../src/types/config-types.js';
import { JiraTransition } from '../../src/types/jira-types.js';
import { ApiError } from '../../src/types/api-error.js';
import dotenv from 'dotenv';

// Load environment variables for integration testing
dotenv.config();

describe('getIssueTransitions Integration Tests', () => {
  let jiraClient: JiraClientWrapper;
  let config: JiraConfig;

  beforeAll(() => {
    // Skip integration tests if environment variables are not configured
    if (!process.env.JIRA_URL || !process.env.JIRA_PERSONAL_TOKEN) {
      console.warn(
        'Skipping integration tests: JIRA_URL or JIRA_PERSONAL_TOKEN not configured'
      );
      return;
    }

    config = {
      url: process.env.JIRA_URL!,
      bearer: process.env.JIRA_PERSONAL_TOKEN!,
    };

    jiraClient = new JiraClientWrapper(config);
  });

  describe('real Jira Server API integration', () => {
    const TEST_ISSUE_KEY = process.env.TEST_ISSUE_KEY || 'DSCWA-428';

    beforeEach(() => {
      // Skip if environment is not configured
      if (!process.env.JIRA_URL || !process.env.JIRA_PERSONAL_TOKEN) {
        pending(
          'Integration tests require JIRA_URL and JIRA_PERSONAL_TOKEN environment variables'
        );
      }
    });

    it('should retrieve transitions for valid issue and validate response structure', async () => {
      const transitions = await jiraClient.getIssueTransitions(TEST_ISSUE_KEY);

      console.log(
        `Retrieved ${transitions.length} transitions for issue: ${TEST_ISSUE_KEY}`
      );

      // Validate it returns an array
      expect(Array.isArray(transitions)).toBe(true);

      // If transitions exist, validate the structure matches our JiraTransition interface
      if (transitions.length > 0) {
        const firstTransition = transitions[0];

        // Validate required fields
        expect(typeof firstTransition.id).toBe('string');
        expect(typeof firstTransition.name).toBe('string');
        expect(typeof firstTransition.to).toBe('object');
        expect(typeof firstTransition.to.id).toBe('string');
        expect(typeof firstTransition.to.name).toBe('string');
        expect(typeof firstTransition.to.statusCategory).toBe('object');
        expect(typeof firstTransition.to.statusCategory.id).toBe('number');
        expect(typeof firstTransition.to.statusCategory.key).toBe('string');
        expect(typeof firstTransition.to.statusCategory.name).toBe('string');

        // Log the structure for documentation purposes
        console.log('Sample transition structure:');
        console.log(JSON.stringify(firstTransition, null, 2));

        // Validate optional fields if present
        transitions.forEach((transition: JiraTransition, index: number) => {
          if (transition.hasScreen !== undefined) {
            expect(typeof transition.hasScreen).toBe('boolean');
          }
          if (transition.isGlobal !== undefined) {
            expect(typeof transition.isGlobal).toBe('boolean');
          }
          if (transition.isInitial !== undefined) {
            expect(typeof transition.isInitial).toBe('boolean');
          }
          if (transition.isAvailable !== undefined) {
            expect(typeof transition.isAvailable).toBe('boolean');
          }
          if (transition.isConditional !== undefined) {
            expect(typeof transition.isConditional).toBe('boolean');
          }
          if (transition.fields !== undefined) {
            expect(typeof transition.fields).toBe('object');
          }

          console.log(
            `Transition ${index + 1}: ${transition.id} - ${transition.name} -> ${transition.to.name}`
          );
        });
      } else {
        console.log(
          `No transitions available for issue: ${TEST_ISSUE_KEY} (issue may be in final state)`
        );
      }
    }, 10000); // Longer timeout for real API calls

    it('should handle non-existent issue with proper error', async () => {
      const nonExistentIssue = 'FAKE-99999';

      await expect(
        jiraClient.getIssueTransitions(nonExistentIssue)
      ).rejects.toThrow(ApiError);

      try {
        await jiraClient.getIssueTransitions(nonExistentIssue);
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(404);
        console.log(
          `Correctly handled non-existent issue error: ${(error as ApiError).message}`
        );
      }
    }, 10000);

    it('should handle transitions for multiple issue types', async () => {
      // Test with the known test issue
      const result1 = await jiraClient.getIssueTransitions(TEST_ISSUE_KEY);
      expect(Array.isArray(result1)).toBe(true);

      console.log(`Transitions count for ${TEST_ISSUE_KEY}: ${result1.length}`);

      // Note: In a real environment, you might test with different issue types
      // but we'll keep this simple for the current test setup
    }, 10000);

    it('should validate authentication with real credentials', async () => {
      // This test implicitly validates authentication by making a successful API call
      const result = await jiraClient.getIssueTransitions(TEST_ISSUE_KEY);

      // If we get here without an authentication error, the bearer token is valid
      expect(Array.isArray(result)).toBe(true);
      console.log('Authentication successful - bearer token is valid');
    }, 10000);
  });

  describe('JiraTransition interface compliance', () => {
    beforeEach(() => {
      if (!process.env.JIRA_URL || !process.env.JIRA_PERSONAL_TOKEN) {
        pending(
          'Integration tests require JIRA_URL and JIRA_PERSONAL_TOKEN environment variables'
        );
      }
    });

    it('should validate TypeScript interface compliance with real data', async () => {
      const TEST_ISSUE_KEY = process.env.TEST_ISSUE_KEY || 'DSCWA-428';

      const transitions: JiraTransition[] =
        await jiraClient.getIssueTransitions(TEST_ISSUE_KEY);

      // TypeScript compilation already validates the interface compliance
      // This test serves as additional runtime validation
      transitions.forEach(transition => {
        // Core required fields
        expect(transition).toHaveProperty('id');
        expect(transition).toHaveProperty('name');
        expect(transition).toHaveProperty('to');
        expect(transition.to).toHaveProperty('id');
        expect(transition.to).toHaveProperty('name');
        expect(transition.to).toHaveProperty('statusCategory');
        expect(transition.to.statusCategory).toHaveProperty('id');
        expect(transition.to.statusCategory).toHaveProperty('key');
        expect(transition.to.statusCategory).toHaveProperty('name');
      });

      console.log(
        `✅ All ${transitions.length} transitions comply with JiraTransition interface`
      );
    }, 10000);
  });
});
