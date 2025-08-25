import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { loadConfig } from '../../src/utils/config.js';
import { SearchOptions } from '../../src/types/jira-types.js';
import { ApiError } from '../../src/types/api-error.js';

describe('SearchIssues Integration Tests', () => {
  let jiraClient: JiraClientWrapper;

  beforeAll(() => {
    const config = loadConfig();
    jiraClient = new JiraClientWrapper(config);
  });

  describe('Basic JQL Search', () => {
    it('should search DSCWA project issues', async () => {
      const result = await jiraClient.searchIssues('project = DSCWA');

      expect(result).toBeDefined();
      expect(result.expand).toBeDefined();
      expect(typeof result.startAt).toBe('number');
      expect(typeof result.maxResults).toBe('number');
      expect(typeof result.total).toBe('number');
      expect(Array.isArray(result.issues)).toBe(true);

      if (result.issues.length > 0) {
        const issue = result.issues[0];
        expect(issue.id).toBeDefined();
        expect(issue.key).toMatch(/^DSCWA-\d+$/);
        expect(issue.self).toBeDefined();
        expect(issue.fields).toBeDefined();
        expect(issue.fields.summary).toBeDefined();
        expect(issue.fields.status).toBeDefined();
        expect(issue.fields.project.key).toBe('DSCWA');
      }
    }, 30000);

    it('should handle invalid project name with error', async () => {
      // Real Jira server throws error for non-existent project instead of empty results
      await expect(jiraClient.searchIssues('project = NONEXISTENT12345')).rejects.toThrow(ApiError);
    }, 30000);
  });

  describe('Search with Pagination', () => {
    it('should respect startAt and maxResults parameters', async () => {
      const options: SearchOptions = {
        startAt: 0,
        maxResults: 2
      };

      const result = await jiraClient.searchIssues('project = DSCWA', options);

      expect(result.startAt).toBe(0);
      expect(result.maxResults).toBe(2);
      if (result.total > 0) {
        expect(result.issues.length).toBeLessThanOrEqual(2);
      }
    }, 30000);

    it('should handle pagination with startAt offset', async () => {
      // First, get total count
      const firstResult = await jiraClient.searchIssues('project = DSCWA', { maxResults: 1 });
      
      if (firstResult.total > 1) {
        const options: SearchOptions = {
          startAt: 1,
          maxResults: 1
        };

        const result = await jiraClient.searchIssues('project = DSCWA', options);

        expect(result.startAt).toBe(1);
        expect(result.maxResults).toBe(1);
        if (result.issues.length > 0) {
          // Should be different from first issue
          expect(result.issues[0].key).not.toBe(firstResult.issues[0].key);
        }
      }
    }, 30000);
  });

  describe('Search with Field Selection', () => {
    it('should return only requested fields', async () => {
      const options: SearchOptions = {
        fields: ['summary', 'status'],
        maxResults: 1
      };

      const result = await jiraClient.searchIssues('project = DSCWA', options);

      if (result.issues.length > 0) {
        const issue = result.issues[0];
        expect(issue.fields.summary).toBeDefined();
        expect(issue.fields.status).toBeDefined();
        // Other fields should still exist but may be limited
        expect(issue.id).toBeDefined();
        expect(issue.key).toBeDefined();
      }
    }, 30000);

    it('should handle custom fields in field selection', async () => {
      const options: SearchOptions = {
        fields: ['summary', 'customfield_10001'],
        maxResults: 1
      };

      const result = await jiraClient.searchIssues('project = DSCWA', options);

      expect(result).toBeDefined();
      // Should not throw error even if custom field doesn't exist
      expect(Array.isArray(result.issues)).toBe(true);
    }, 30000);
  });

  describe('Complex JQL Queries', () => {
    it('should handle complex JQL with multiple conditions', async () => {
      const jql = 'project = DSCWA AND created >= -30d ORDER BY created DESC';
      const options: SearchOptions = {
        maxResults: 5
      };

      const result = await jiraClient.searchIssues(jql, options);

      expect(result).toBeDefined();
      expect(Array.isArray(result.issues)).toBe(true);
      
      if (result.issues.length > 1) {
        // Check if results are ordered by created date (descending)
        const firstCreated = new Date(result.issues[0].fields.created);
        const secondCreated = new Date(result.issues[1].fields.created);
        expect(firstCreated.getTime()).toBeGreaterThanOrEqual(secondCreated.getTime());
      }
    }, 30000);
  });

  describe('Error Handling', () => {
    it('should throw ApiError for invalid JQL syntax', async () => {
      await expect(jiraClient.searchIssues('INVALID JQL SYNTAX HERE')).rejects.toThrow(ApiError);
    }, 30000);

    it('should throw ApiError for invalid field reference', async () => {
      await expect(jiraClient.searchIssues('invalidField = "test"')).rejects.toThrow(ApiError);
    }, 30000);
  });

  describe('Real Data Model Validation', () => {
    it('should validate returned issue structure matches JiraIssue interface', async () => {
      const result = await jiraClient.searchIssues('project = DSCWA', { maxResults: 1 });

      if (result.issues.length > 0) {
        const issue = result.issues[0];

        // Validate required fields exist and have correct types
        expect(typeof issue.id).toBe('string');
        expect(typeof issue.key).toBe('string');
        expect(typeof issue.self).toBe('string');
        expect(typeof issue.fields).toBe('object');
        expect(typeof issue.fields.summary).toBe('string');
        expect(typeof issue.fields.status).toBe('object');
        expect(typeof issue.fields.status.name).toBe('string');
        expect(typeof issue.fields.project).toBe('object');
        expect(typeof issue.fields.project.key).toBe('string');
        expect(typeof issue.fields.project.name).toBe('string');
        expect(typeof issue.fields.issuetype).toBe('object');
        expect(typeof issue.fields.issuetype.name).toBe('string');
        expect(typeof issue.fields.issuetype.subtask).toBe('boolean');
        expect(typeof issue.fields.priority).toBe('object');
        expect(typeof issue.fields.priority.name).toBe('string');
        expect(typeof issue.fields.priority.id).toBe('string');
        expect(typeof issue.fields.created).toBe('string');
        expect(typeof issue.fields.updated).toBe('string');

        // Validate user objects structure
        expect(typeof issue.fields.reporter).toBe('object');
        expect(typeof issue.fields.reporter.name).toBe('string');
        expect(typeof issue.fields.reporter.displayName).toBe('string');
        expect(typeof issue.fields.reporter.emailAddress).toBe('string');
        expect(typeof issue.fields.reporter.active).toBe('boolean');

        expect(typeof issue.fields.creator).toBe('object');
        expect(typeof issue.fields.creator.name).toBe('string');
        expect(typeof issue.fields.creator.displayName).toBe('string');

        // Assignee can be null
        if (issue.fields.assignee) {
          expect(typeof issue.fields.assignee.name).toBe('string');
          expect(typeof issue.fields.assignee.displayName).toBe('string');
        }
      }
    }, 30000);

    it('should validate SearchResult structure matches interface', async () => {
      const result = await jiraClient.searchIssues('project = DSCWA', { maxResults: 1 });

      // Validate SearchResult interface
      expect(typeof result.expand).toBe('string');
      expect(typeof result.startAt).toBe('number');
      expect(typeof result.maxResults).toBe('number');
      expect(typeof result.total).toBe('number');
      expect(Array.isArray(result.issues)).toBe(true);

      // Validate numeric values are non-negative
      expect(result.startAt).toBeGreaterThanOrEqual(0);
      expect(result.maxResults).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.issues.length).toBeGreaterThanOrEqual(0);
      expect(result.issues.length).toBeLessThanOrEqual(result.maxResults);
    }, 30000);
  });
});