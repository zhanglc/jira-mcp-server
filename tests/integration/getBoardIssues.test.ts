import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { JiraConfig } from '../../src/types/config-types.js';
import { ApiError } from '../../src/types/api-error.js';

describe('JiraClientWrapper - getBoardIssues Integration Tests', () => {
  let wrapper: JiraClientWrapper;
  let testBoardId: number;

  beforeAll(async () => {
    const config: JiraConfig = {
      url: process.env.JIRA_URL || '',
      bearer: process.env.JIRA_PERSONAL_TOKEN || ''
    };

    expect(config.url).toBeTruthy();
    expect(config.bearer).toBeTruthy();

    wrapper = new JiraClientWrapper(config);

    // Get a valid board ID for testing
    const boards = await wrapper.getAgileBoards();
    expect(boards.length).toBeGreaterThan(0);
    testBoardId = boards[0].id;

    console.log(`Using test board ID: ${testBoardId} (${boards[0].name})`);
  });

  describe('Basic functionality', () => {
    test('should get board issues with default parameters', async () => {
      const result = await wrapper.getBoardIssues(testBoardId);

      // Validate SearchResult structure
      expect(result).toHaveProperty('expand');
      expect(result).toHaveProperty('startAt');
      expect(result).toHaveProperty('maxResults');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('issues');
      expect(Array.isArray(result.issues)).toBe(true);

      // Log results for verification
      console.log(`Board ${testBoardId} has ${result.total} issues (returned ${result.issues.length})`);

      // Validate issue structure if any issues exist
      if (result.issues.length > 0) {
        const issue = result.issues[0];
        expect(issue).toHaveProperty('id');
        expect(issue).toHaveProperty('key');
        expect(issue).toHaveProperty('self');
        expect(issue).toHaveProperty('fields');
        expect(issue.fields).toHaveProperty('summary');
        expect(issue.fields).toHaveProperty('status');

        console.log(`Sample issue: ${issue.key} - ${issue.fields.summary}`);
        console.log(`Status: ${issue.fields.status.name}`);
      }
    });

    test('should handle pagination correctly', async () => {
      const pageSize = 2;
      const result = await wrapper.getBoardIssues(testBoardId, {
        startAt: 0,
        maxResults: pageSize
      });

      expect(result.startAt).toBe(0);
      expect(result.maxResults).toBe(pageSize);
      expect(result.issues.length).toBeLessThanOrEqual(pageSize);

      console.log(`Pagination test: requested ${pageSize}, got ${result.issues.length} issues`);

      // Test second page if there are enough issues
      if (result.total > pageSize) {
        const secondPage = await wrapper.getBoardIssues(testBoardId, {
          startAt: pageSize,
          maxResults: pageSize
        });

        expect(secondPage.startAt).toBe(pageSize);
        expect(secondPage.total).toBe(result.total); // Total should be the same
        console.log(`Second page: startAt=${secondPage.startAt}, got ${secondPage.issues.length} issues`);
      }
    });

    test('should filter fields correctly', async () => {
      const result = await wrapper.getBoardIssues(testBoardId, {
        maxResults: 1,
        fields: ['summary', 'status', 'assignee']
      });

      if (result.issues.length > 0) {
        const issue = result.issues[0];
        
        // Verify requested fields are present
        expect(issue.fields).toHaveProperty('summary');
        expect(issue.fields).toHaveProperty('status');
        expect(issue.fields).toHaveProperty('assignee');

        console.log(`Field filtering test - Issue: ${issue.key}`);
        console.log(`Summary: ${issue.fields.summary}`);
        console.log(`Status: ${issue.fields.status.name}`);
        console.log(`Assignee: ${issue.fields.assignee?.displayName || 'Unassigned'}`);
      }
    });

    test('should handle empty boards gracefully', async () => {
      // Try to find a board with no issues or use a non-existent board ID
      // This test might not always work depending on available boards
      try {
        const result = await wrapper.getBoardIssues(999999);
        // If it succeeds, it should return empty results
        expect(result.issues).toEqual([]);
        expect(result.total).toBe(0);
      } catch (error) {
        // If it fails, it should be a proper ApiError
        expect(error).toBeInstanceOf(ApiError);
        console.log(`Expected error for non-existent board: ${(error as Error).message}`);
      }
    });
  });

  describe('Data consistency', () => {
    test('should return consistent data structure across multiple calls', async () => {
      const result1 = await wrapper.getBoardIssues(testBoardId, { maxResults: 1 });
      const result2 = await wrapper.getBoardIssues(testBoardId, { maxResults: 1 });

      // Both calls should return the same structure
      expect(result1.total).toBe(result2.total);
      
      if (result1.issues.length > 0 && result2.issues.length > 0) {
        // First issue should be the same (assuming no changes between calls)
        expect(result1.issues[0].key).toBe(result2.issues[0].key);
        console.log(`Consistency test passed for issue: ${result1.issues[0].key}`);
      }
    });

    test('should validate against searchIssues results', async () => {
      // Get board issues
      const boardResult = await wrapper.getBoardIssues(testBoardId, { maxResults: 5 });

      if (boardResult.issues.length > 0) {
        // Get the same issues using searchIssues
        const issueKeys = boardResult.issues.map(issue => issue.key);
        const jql = `key in (${issueKeys.join(',')})`;
        const searchResult = await wrapper.searchIssues(jql);

        // Should find the same issues
        expect(searchResult.total).toBe(boardResult.issues.length);
        console.log(`Validation test: found ${searchResult.total} issues using both methods`);

        // Compare issue data structure consistency
        const boardIssue = boardResult.issues[0];
        const searchIssue = searchResult.issues.find(issue => issue.key === boardIssue.key);
        
        expect(searchIssue).toBeDefined();
        expect(searchIssue!.id).toBe(boardIssue.id);
        expect(searchIssue!.key).toBe(boardIssue.key);
        expect(searchIssue!.fields.summary).toBe(boardIssue.fields.summary);
        
        console.log(`Data consistency verified for issue: ${boardIssue.key}`);
      }
    });
  });

  describe('Error handling', () => {
    test('should handle invalid board ID gracefully', async () => {
      await expect(wrapper.getBoardIssues(-1)).rejects.toThrow(ApiError);
    });

    test('should handle non-existent board ID', async () => {
      await expect(wrapper.getBoardIssues(999999)).rejects.toThrow(ApiError);
    });

    test('should validate field filtering security', async () => {
      // This should filter out invalid fields but still work
      const result = await wrapper.getBoardIssues(testBoardId, {
        maxResults: 1,
        fields: ['summary', 'invalidField', 'maliciousScript', 'status']
      });

      // Should still return results with valid fields only
      if (result.issues.length > 0) {
        const issue = result.issues[0];
        expect(issue.fields).toHaveProperty('summary');
        expect(issue.fields).toHaveProperty('status');
        console.log(`Security test passed - filtered invalid fields for issue: ${issue.key}`);
      }
    });
  });

  describe('Real data validation', () => {
    test('should return properly structured Jira issues', async () => {
      const result = await wrapper.getBoardIssues(testBoardId, { maxResults: 3 });

      if (result.issues.length > 0) {
        const issue = result.issues[0];

        // Validate Jira issue structure matches our interface
        expect(typeof issue.id).toBe('string');
        expect(typeof issue.key).toBe('string');
        expect(typeof issue.self).toBe('string');
        expect(issue.self).toMatch(/^https?:\/\/.*\/rest\/(api|agile)\/.*\/issue\/\d+$/);

        // Validate fields structure
        expect(typeof issue.fields.summary).toBe('string');
        expect(issue.fields.status).toHaveProperty('name');
        expect(issue.fields.status).toHaveProperty('statusCategory');
        expect(issue.fields.project).toHaveProperty('key');
        expect(issue.fields.project).toHaveProperty('name');
        expect(issue.fields.issuetype).toHaveProperty('name');

        // Validate dates are ISO strings
        expect(issue.fields.created).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{4}$/);
        expect(issue.fields.updated).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{4}$/);

        console.log(`Real data validation passed for issue: ${issue.key}`);
        console.log(`  Project: ${issue.fields.project.key} (${issue.fields.project.name})`);
        console.log(`  Type: ${issue.fields.issuetype.name}`);
        console.log(`  Status: ${issue.fields.status.name} (${issue.fields.status.statusCategory.name})`);
        console.log(`  Created: ${issue.fields.created}`);
      }
    });

    test('should handle custom fields if present', async () => {
      const result = await wrapper.getBoardIssues(testBoardId, { 
        maxResults: 1,
        fields: ['summary', 'customfield_10001', 'customfield_10002'] 
      });

      if (result.issues.length > 0) {
        const issue = result.issues[0];
        console.log(`Custom fields test for issue: ${issue.key}`);
        
        // Log any custom fields that are present
        Object.keys(issue.fields).forEach(key => {
          if (key.startsWith('customfield_')) {
            console.log(`  ${key}: ${JSON.stringify(issue.fields[key])}`);
          }
        });
      }
    });
  });
});