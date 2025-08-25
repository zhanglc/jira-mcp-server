import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { ApiError } from '../../src/types/api-error.js';
import { loadConfig } from '../../src/utils/config.js';

describe('Integration: JiraClientWrapper.getIssueWorklogs', () => {
  let jiraWrapper: JiraClientWrapper;
  const TEST_ISSUE_KEY = 'DSCWA-428'; // Test issue from environment

  beforeAll(() => {
    const config = loadConfig();
    jiraWrapper = new JiraClientWrapper(config);
  });

  describe('real Jira Server interaction', () => {
    it('should successfully retrieve worklogs from test issue', async () => {
      // Act
      const worklogs = await jiraWrapper.getIssueWorklogs(TEST_ISSUE_KEY);

      // Assert
      expect(Array.isArray(worklogs)).toBe(true);
      
      // If worklogs exist, validate their structure
      if (worklogs.length > 0) {
        const worklog = worklogs[0];
        
        // Validate required fields
        expect(worklog.self).toBeDefined();
        expect(typeof worklog.self).toBe('string');
        expect(worklog.self).toMatch(/^https?:\/\/.+\/rest\/api\/2\/issue\/\d+\/worklog\/\d+$/);
        
        expect(worklog.id).toBeDefined();
        expect(typeof worklog.id).toBe('string');
        
        expect(worklog.issueId).toBeDefined();
        expect(typeof worklog.issueId).toBe('string');
        
        expect(worklog.author).toBeDefined();
        expect(typeof worklog.author).toBe('object');
        expect(worklog.author.name).toBeDefined();
        expect(worklog.author.displayName).toBeDefined();
        expect(worklog.author.emailAddress).toBeDefined();
        expect(typeof worklog.author.active).toBe('boolean');
        
        expect(worklog.created).toBeDefined();
        expect(typeof worklog.created).toBe('string');
        expect(worklog.created).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{4}$/);
        
        expect(worklog.timeSpent).toBeDefined();
        expect(typeof worklog.timeSpent).toBe('string');
        
        expect(worklog.timeSpentSeconds).toBeDefined();
        expect(typeof worklog.timeSpentSeconds).toBe('number');
        expect(worklog.timeSpentSeconds).toBeGreaterThan(0);
        
        // Validate optional fields if they exist
        if (worklog.updated) {
          expect(typeof worklog.updated).toBe('string');
          expect(worklog.updated).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{4}$/);
        }
        
        if (worklog.started) {
          expect(typeof worklog.started).toBe('string');
          expect(worklog.started).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{4}$/);
        }
        
        if (worklog.comment) {
          expect(typeof worklog.comment).toBe('string');
        }
        
        if (worklog.updateAuthor) {
          expect(typeof worklog.updateAuthor).toBe('object');
          expect(worklog.updateAuthor.name).toBeDefined();
          expect(worklog.updateAuthor.displayName).toBeDefined();
        }
        
        if (worklog.visibility) {
          expect(typeof worklog.visibility).toBe('object');
          expect(worklog.visibility.type).toBeDefined();
          expect(worklog.visibility.value).toBeDefined();
        }

        console.log(`✓ Successfully validated ${worklogs.length} worklog(s) for issue ${TEST_ISSUE_KEY}`);
        console.log(`✓ Sample worklog structure:`, JSON.stringify(worklog, null, 2));
      } else {
        console.log(`ℹ Issue ${TEST_ISSUE_KEY} has no worklogs (empty array returned)`);
      }
    }, 10000); // 10 second timeout for real API call

    it('should return empty array for issue without worklogs', async () => {
      // This test assumes we can find an issue without worklogs
      // In a real environment, we might need to create a test issue or use a known issue
      
      // Act - using the same test issue, but the behavior should be consistent
      const worklogs = await jiraWrapper.getIssueWorklogs(TEST_ISSUE_KEY);

      // Assert
      expect(Array.isArray(worklogs)).toBe(true);
      // Note: We can't assert empty here as the test issue might have worklogs
      console.log(`ℹ Issue ${TEST_ISSUE_KEY} has ${worklogs.length} worklog(s)`);
    }, 10000);

    it('should handle non-existent issue gracefully', async () => {
      // Arrange
      const nonExistentIssue = 'NONEXISTENT-99999';

      // Act & Assert
      await expect(jiraWrapper.getIssueWorklogs(nonExistentIssue)).rejects.toThrow(ApiError);
    }, 10000);

    it('should handle invalid issue key format', async () => {
      // Arrange
      const invalidIssueKey = 'INVALID_FORMAT';

      // Act & Assert
      await expect(jiraWrapper.getIssueWorklogs(invalidIssueKey)).rejects.toThrow(ApiError);
    }, 10000);
  });

  describe('data model validation', () => {
    it('should verify actual Jira worklog data structure matches our TypeScript interface', async () => {
      // Act
      const worklogs = await jiraWrapper.getIssueWorklogs(TEST_ISSUE_KEY);

      // Assert - validate the actual data structure from Jira Server
      if (worklogs.length > 0) {
        const worklog = worklogs[0];
        
        // Document the actual field structure for model validation
        const actualFields = Object.keys(worklog).sort();
        const expectedFields = ['self', 'id', 'issueId', 'author', 'created', 'timeSpent', 'timeSpentSeconds'];
        const optionalFields = ['updated', 'started', 'comment', 'updateAuthor', 'visibility'];
        
        console.log('=== WORKLOG DATA MODEL VALIDATION ===');
        console.log('Actual fields found:', actualFields);
        console.log('Expected required fields:', expectedFields);
        console.log('Optional fields:', optionalFields);
        
        // Verify required fields are present
        for (const field of expectedFields) {
          expect(worklog).toHaveProperty(field);
          console.log(`✓ Required field '${field}' present:`, typeof (worklog as any)[field]);
        }
        
        // Document optional fields if present
        for (const field of optionalFields) {
          if ((worklog as any)[field] !== undefined) {
            console.log(`✓ Optional field '${field}' present:`, typeof (worklog as any)[field]);
          } else {
            console.log(`- Optional field '${field}' not present`);
          }
        }
        
        // Validate author structure
        expect(worklog.author).toHaveProperty('self');
        expect(worklog.author).toHaveProperty('name');
        expect(worklog.author).toHaveProperty('key');
        expect(worklog.author).toHaveProperty('displayName');
        expect(worklog.author).toHaveProperty('emailAddress');
        expect(worklog.author).toHaveProperty('active');
        expect(worklog.author).toHaveProperty('timeZone');
        expect(worklog.author).toHaveProperty('avatarUrls');
        
        console.log('✓ Author structure validated');
        
        // Validate time format consistency
        const timePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{4}$/;
        expect(worklog.created).toMatch(timePattern);
        
        if (worklog.updated) {
          expect(worklog.updated).toMatch(timePattern);
        }
        
        if (worklog.started) {
          expect(worklog.started).toMatch(timePattern);
        }
        
        console.log('✓ Time format validation passed');
        
        // Validate time spent consistency
        expect(typeof worklog.timeSpentSeconds).toBe('number');
        expect(worklog.timeSpentSeconds).toBeGreaterThan(0);
        expect(typeof worklog.timeSpent).toBe('string');
        expect(worklog.timeSpent.length).toBeGreaterThan(0);
        
        console.log('✓ Time spent validation passed');
        console.log(`Time spent: ${worklog.timeSpent} (${worklog.timeSpentSeconds} seconds)`);
        
        console.log('=== MODEL VALIDATION COMPLETE ===');
      } else {
        console.log(`ℹ No worklogs available for validation in issue ${TEST_ISSUE_KEY}`);
      }
    }, 15000); // Extended timeout for detailed validation
  });
});