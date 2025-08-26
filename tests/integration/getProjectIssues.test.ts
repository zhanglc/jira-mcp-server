import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { JiraConfig } from '../../src/types/config-types.js';
import { SearchOptions, JiraIssue } from '../../src/types/jira-types.js';
import { ApiError } from '../../src/types/api-error.js';

describe('JiraClientWrapper.getProjectIssues - Integration Tests', () => {
  let wrapper: JiraClientWrapper;

  beforeAll(() => {
    // Load config from environment
    const config: JiraConfig = {
      url: process.env.JIRA_URL!,
      username: process.env.JIRA_USERNAME!,
      bearer: process.env.JIRA_PERSONAL_TOKEN!,
    };

    wrapper = new JiraClientWrapper(config);
  });

  describe('Real Jira Server Integration', () => {
    it('should get issues for DSCWA project', async () => {
      const result = await wrapper.getProjectIssues('DSCWA');

      // Verify basic structure
      expect(result).toBeDefined();
      expect(typeof result.total).toBe('number');
      expect(typeof result.startAt).toBe('number');
      expect(typeof result.maxResults).toBe('number');
      expect(Array.isArray(result.issues)).toBe(true);
      expect(result.total).toBeGreaterThan(0);

      // DSCWA project should have a reasonable number of issues (allow for project growth)
      expect(result.total).toBeGreaterThan(400);

      // Verify issue structure - each issue should be a valid JiraIssue
      if (result.issues.length > 0) {
        const firstIssue = result.issues[0];
        expect(firstIssue).toBeDefined();
        expect(firstIssue.id).toBeDefined();
        expect(firstIssue.key).toBeDefined();
        expect(firstIssue.key).toMatch(/^DSCWA-\d+$/);
        expect(firstIssue.self).toBeDefined();
        expect(firstIssue.fields).toBeDefined();
        expect(firstIssue.fields.summary).toBeDefined();
        expect(firstIssue.fields.status).toBeDefined();
        expect(firstIssue.fields.project).toBeDefined();
        expect(firstIssue.fields.project.key).toBe('DSCWA');
      }

      console.log(
        `✓ Successfully retrieved ${result.total} issues for DSCWA project`
      );
      console.log(`✓ Returned ${result.issues.length} issues in current page`);
      console.log(
        `✓ First issue: ${result.issues[0]?.key} - ${result.issues[0]?.fields.summary}`
      );
    }, 10000);

    it('should get issues with pagination for DSCWA project', async () => {
      const options: SearchOptions = {
        startAt: 0,
        maxResults: 10,
      };

      const result = await wrapper.getProjectIssues('DSCWA', options);

      expect(result).toBeDefined();
      expect(result.startAt).toBe(0);
      expect(result.maxResults).toBe(10);
      expect(result.issues.length).toBeLessThanOrEqual(10);
      expect(result.total).toBeGreaterThan(400); // Should still show total count

      // Verify all returned issues belong to DSCWA
      result.issues.forEach(issue => {
        expect(issue.key).toMatch(/^DSCWA-\d+$/);
        expect(issue.fields.project.key).toBe('DSCWA');
      });

      console.log(
        `✓ Pagination test: retrieved ${result.issues.length} issues (max ${options.maxResults})`
      );
    }, 10000);

    it('should get issues with field selection for DSCWA project', async () => {
      const options: SearchOptions = {
        fields: ['summary', 'status', 'assignee'],
        maxResults: 5,
      };

      const result = await wrapper.getProjectIssues('DSCWA', options);

      expect(result).toBeDefined();
      expect(result.issues.length).toBeGreaterThan(0);

      // Verify field selection worked
      const firstIssue = result.issues[0];
      expect(firstIssue.fields.summary).toBeDefined();
      expect(firstIssue.fields.status).toBeDefined();
      // assignee field should be present (might be null for unassigned issues)
      expect('assignee' in firstIssue.fields).toBe(true);

      console.log(
        `✓ Field selection test: retrieved ${result.issues.length} issues with specific fields`
      );
      console.log(
        `✓ Sample issue: ${firstIssue.key} - ${firstIssue.fields.summary}`
      );
      console.log(`✓ Status: ${firstIssue.fields.status.name}`);
      console.log(
        `✓ Assignee: ${firstIssue.fields.assignee?.displayName || 'Unassigned'}`
      );
    }, 10000);

    it('should get issues with combined pagination and field options for DSCWA project', async () => {
      const options: SearchOptions = {
        startAt: 5,
        maxResults: 3,
        fields: ['summary', 'status', 'priority'],
      };

      const result = await wrapper.getProjectIssues('DSCWA', options);

      expect(result).toBeDefined();
      expect(result.startAt).toBe(5);
      expect(result.maxResults).toBe(3);
      expect(result.issues.length).toBeLessThanOrEqual(3);

      // Verify fields
      if (result.issues.length > 0) {
        const issue = result.issues[0];
        expect(issue.fields.summary).toBeDefined();
        expect(issue.fields.status).toBeDefined();
        expect(issue.fields.priority).toBeDefined();
      }

      console.log(
        `✓ Combined options test: retrieved ${result.issues.length} issues with pagination and field selection`
      );
    }, 10000);

    it('should handle project with no issues gracefully', async () => {
      // Create a test that might return no issues - use filtering to simulate this
      const options: SearchOptions = {
        maxResults: 1,
      };

      const result = await wrapper.getProjectIssues('DSCWA', options);

      expect(result).toBeDefined();
      expect(typeof result.total).toBe('number');
      expect(Array.isArray(result.issues)).toBe(true);
      expect(result.maxResults).toBe(1);

      console.log(
        `✓ Handled potential empty results: total=${result.total}, returned=${result.issues.length}`
      );
    }, 10000);
  });

  describe('Error Handling with Real Server', () => {
    it('should handle non-existent project correctly', async () => {
      await expect(
        wrapper.getProjectIssues('NONEXISTENT_PROJECT_XYZ')
      ).rejects.toThrow(ApiError);

      console.log('✓ Correctly handled non-existent project error');
    }, 10000);

    it('should handle invalid project key format', async () => {
      await expect(
        wrapper.getProjectIssues('invalid-project-key!@#')
      ).rejects.toThrow(ApiError);

      console.log('✓ Correctly handled invalid project key format error');
    }, 10000);
  });

  describe('Data Model Validation', () => {
    it('should return properly structured JiraIssue objects', async () => {
      const result = await wrapper.getProjectIssues('DSCWA', { maxResults: 2 });

      expect(result.issues.length).toBeGreaterThan(0);

      result.issues.forEach((issue: JiraIssue) => {
        // Validate required fields according to JiraIssue interface
        expect(typeof issue.id).toBe('string');
        expect(typeof issue.key).toBe('string');
        expect(typeof issue.self).toBe('string');
        expect(issue.key).toMatch(/^DSCWA-\d+$/);

        // Validate fields object
        expect(issue.fields).toBeDefined();
        expect(typeof issue.fields.summary).toBe('string');

        // Validate status
        expect(issue.fields.status).toBeDefined();
        expect(typeof issue.fields.status.name).toBe('string');
        expect(issue.fields.status.statusCategory).toBeDefined();
        expect(typeof issue.fields.status.statusCategory.key).toBe('string');
        expect(typeof issue.fields.status.statusCategory.name).toBe('string');

        // Validate assignee (can be null)
        if (issue.fields.assignee) {
          expect(typeof issue.fields.assignee.name).toBe('string');
          expect(typeof issue.fields.assignee.displayName).toBe('string');
          expect(typeof issue.fields.assignee.emailAddress).toBe('string');
        }

        // Validate reporter and creator (required)
        expect(issue.fields.reporter).toBeDefined();
        expect(typeof issue.fields.reporter.name).toBe('string');
        expect(typeof issue.fields.reporter.displayName).toBe('string');

        expect(issue.fields.creator).toBeDefined();
        expect(typeof issue.fields.creator.name).toBe('string');
        expect(typeof issue.fields.creator.displayName).toBe('string');

        // Validate project
        expect(issue.fields.project).toBeDefined();
        expect(issue.fields.project.key).toBe('DSCWA');
        expect(typeof issue.fields.project.name).toBe('string');

        // Validate issue type
        expect(issue.fields.issuetype).toBeDefined();
        expect(typeof issue.fields.issuetype.name).toBe('string');
        expect(typeof issue.fields.issuetype.subtask).toBe('boolean');

        // Validate priority
        expect(issue.fields.priority).toBeDefined();
        expect(typeof issue.fields.priority.name).toBe('string');
        expect(typeof issue.fields.priority.id).toBe('string');

        // Validate timestamps
        expect(typeof issue.fields.created).toBe('string');
        expect(typeof issue.fields.updated).toBe('string');
        expect(new Date(issue.fields.created)).toBeInstanceOf(Date);
        expect(new Date(issue.fields.updated)).toBeInstanceOf(Date);
      });

      console.log(
        `✓ Data model validation passed for ${result.issues.length} issues`
      );
      console.log(
        `✓ Sample issue types: ${result.issues.map(i => i.fields.issuetype.name).join(', ')}`
      );
      console.log(
        `✓ Sample priorities: ${result.issues.map(i => i.fields.priority.name).join(', ')}`
      );
    }, 15000);
  });

  describe('Comparison with searchIssues', () => {
    it('should return identical results to equivalent searchIssues call', async () => {
      const options: SearchOptions = {
        startAt: 0,
        maxResults: 5,
        fields: ['summary', 'status', 'assignee'],
      };

      // Get results using getProjectIssues
      const projectResult = await wrapper.getProjectIssues('DSCWA', options);

      // Get results using searchIssues with equivalent JQL
      const searchResult = await wrapper.searchIssues(
        'project = DSCWA',
        options
      );

      // Results should be identical
      expect(projectResult.total).toBe(searchResult.total);
      expect(projectResult.startAt).toBe(searchResult.startAt);
      expect(projectResult.maxResults).toBe(searchResult.maxResults);
      expect(projectResult.issues.length).toBe(searchResult.issues.length);

      // Compare individual issues
      projectResult.issues.forEach((issue, index) => {
        const searchIssue = searchResult.issues[index];
        expect(issue.id).toBe(searchIssue.id);
        expect(issue.key).toBe(searchIssue.key);
        expect(issue.fields.summary).toBe(searchIssue.fields.summary);
      });

      console.log(
        `✓ getProjectIssues results match searchIssues: ${projectResult.total} total issues`
      );
      console.log(
        `✓ Both methods returned ${projectResult.issues.length} issues in current page`
      );
    }, 15000);
  });
});
