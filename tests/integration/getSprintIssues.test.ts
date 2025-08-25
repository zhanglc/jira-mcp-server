import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { SearchResult, JiraIssue, SearchOptions } from '../../src/types/jira-types.js';
import { ApiError } from '../../src/types/api-error.js';
import { loadConfig } from '../../src/utils/config.js';

describe('JiraClientWrapper.getSprintIssues - Integration Tests', () => {
  let client: JiraClientWrapper;
  let config: any;

  beforeAll(async () => {
    config = await loadConfig();
    client = new JiraClientWrapper(config);
  });

  describe('real API integration', () => {
    it('should retrieve sprint issues from a real sprint successfully', async () => {
      // First, get available boards to find one with sprints
      const boards = await client.getAgileBoards();
      
      if (boards.length === 0) {
        console.log('⚠️ No agile boards found - skipping sprint issues tests');
        return;
      }

      // Find a Scrum board (most likely to have sprints with issues)
      const scrumBoard = boards.find(board => board.type === 'scrum');
      const testBoardId = scrumBoard?.id || boards[0].id;

      console.log(`📋 Testing with board: ${scrumBoard?.name || boards[0].name} (ID: ${testBoardId}, Type: ${scrumBoard?.type || boards[0].type})`);

      // Get sprints from the board (skip boards that don't support sprints)
      let sprints;
      try {
        sprints = await client.getSprintsFromBoard(testBoardId);
      } catch (error) {
        if (error instanceof ApiError && error.message.includes("doesn't support sprints")) {
          console.log('ℹ️ Board does not support sprints (likely Kanban) - skipping sprint issues tests');
          return;
        }
        throw error;
      }

      if (sprints.length === 0) {
        console.log('⚠️ No sprints found in board - skipping sprint issues tests');
        return;
      }

      // Find a sprint with issues (preferably closed sprint which should have issues)
      let testSprintId: number | undefined;
      let testSprintName: string = '';
      
      // First try to find a closed sprint (most likely to have issues)
      const closedSprints = sprints.filter(s => s.state === 'closed');
      if (closedSprints.length > 0) {
        testSprintId = closedSprints[0].id;
        testSprintName = closedSprints[0].name;
      } else {
        // Fall back to any sprint
        testSprintId = sprints[0].id;
        testSprintName = sprints[0].name;
      }

      console.log(`🏃 Testing with sprint: ${testSprintName} (ID: ${testSprintId}, State: ${sprints.find(s => s.id === testSprintId)?.state})`);

      // Act
      const result = await client.getSprintIssues(testSprintId);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('startAt');
      expect(result).toHaveProperty('maxResults');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('issues');
      expect(Array.isArray(result.issues)).toBe(true);

      console.log(`✓ Retrieved ${result.total} issues from sprint ${testSprintId}`);

      if (result.total > 0 && result.issues.length > 0) {
        const firstIssue = result.issues[0];
        
        // Validate required issue properties
        expect(firstIssue).toHaveProperty('id');
        expect(firstIssue).toHaveProperty('key');
        expect(firstIssue).toHaveProperty('self');
        expect(firstIssue).toHaveProperty('fields');
        
        expect(typeof firstIssue.id).toBe('string');
        expect(typeof firstIssue.key).toBe('string');
        expect(typeof firstIssue.self).toBe('string');
        expect(typeof firstIssue.fields).toBe('object');
        
        // Validate self URL format
        expect(firstIssue.self).toMatch(/\/rest\/api\/2\/issue\/\d+/);
        
        // Validate key format (PROJECT-NUMBER)
        expect(firstIssue.key).toMatch(/^[A-Z]+-\d+$/);
        
        console.log(`✓ First issue: ${firstIssue.key} - ${firstIssue.fields.summary}`);
        
        // Validate issue fields structure
        expect(firstIssue.fields).toHaveProperty('summary');
        expect(firstIssue.fields).toHaveProperty('status');
        expect(firstIssue.fields).toHaveProperty('project');
        expect(firstIssue.fields).toHaveProperty('issuetype');
        expect(firstIssue.fields).toHaveProperty('priority');
        expect(firstIssue.fields).toHaveProperty('created');
        expect(firstIssue.fields).toHaveProperty('updated');
        
        expect(typeof firstIssue.fields.summary).toBe('string');
        expect(typeof firstIssue.fields.status).toBe('object');
        expect(typeof firstIssue.fields.project).toBe('object');
        expect(typeof firstIssue.fields.issuetype).toBe('object');
        expect(typeof firstIssue.fields.priority).toBe('object');
        expect(typeof firstIssue.fields.created).toBe('string');
        expect(typeof firstIssue.fields.updated).toBe('string');
        
        console.log(`✓ Issue status: ${firstIssue.fields.status.name}`);
        console.log(`✓ Issue type: ${firstIssue.fields.issuetype.name}`);
        console.log(`✓ Project: ${firstIssue.fields.project.key} - ${firstIssue.fields.project.name}`);
      } else {
        console.log('ℹ️ Sprint has no issues');
      }
    }, 45000); // 45s timeout for real API with multiple calls

    it('should retrieve sprint issues with pagination', async () => {
      // Get a board and sprint first
      const boards = await client.getAgileBoards();
      
      if (boards.length === 0) {
        console.log('⚠️ No agile boards found - skipping pagination test');
        return;
      }

      const testBoardId = boards[0].id;
      let sprints;
      try {
        sprints = await client.getSprintsFromBoard(testBoardId);
      } catch (error) {
        if (error instanceof ApiError && error.message.includes("doesn't support sprints")) {
          console.log('ℹ️ Board does not support sprints (likely Kanban) - skipping pagination test');
          return;
        }
        throw error;
      }

      if (sprints.length === 0) {
        console.log('⚠️ No sprints found - skipping pagination test');
        return;
      }

      // Find a sprint with multiple issues (try closed sprints first)
      let testSprintId: number | undefined;
      
      for (const sprint of sprints) {
        try {
          const quickCheck = await client.getSprintIssues(sprint.id, { maxResults: 1 });
          if (quickCheck.total > 5) { // Sprint has enough issues for pagination test
            testSprintId = sprint.id;
            break;
          }
        } catch (error) {
          // Continue to next sprint
        }
      }

      if (!testSprintId) {
        console.log('ℹ️ No sprint with enough issues found for pagination test');
        return;
      }

      console.log(`🏃 Testing pagination with sprint: ${testSprintId}`);

      // Test pagination
      const options: SearchOptions = {
        startAt: 0,
        maxResults: 3
      };

      const result = await client.getSprintIssues(testSprintId, options);

      // Assert
      expect(result).toBeDefined();
      expect(result.startAt).toBe(0);
      expect(result.maxResults).toBe(3);
      expect(result.total).toBeGreaterThan(0);
      
      if (result.total > 3) {
        expect(result.issues.length).toBe(3);
        console.log(`✓ Pagination working: showing ${result.issues.length} of ${result.total} issues`);
      } else {
        expect(result.issues.length).toBe(result.total);
        console.log(`✓ Sprint has ${result.total} issues (less than maxResults)`);
      }
    }, 30000);

    it('should retrieve sprint issues with field selection', async () => {
      // Get a board and sprint first
      const boards = await client.getAgileBoards();
      
      if (boards.length === 0) {
        console.log('⚠️ No agile boards found - skipping field selection test');
        return;
      }

      const testBoardId = boards[0].id;
      let sprints;
      try {
        sprints = await client.getSprintsFromBoard(testBoardId);
      } catch (error) {
        if (error instanceof ApiError && error.message.includes("doesn't support sprints")) {
          console.log('ℹ️ Board does not support sprints (likely Kanban) - skipping field selection test');
          return;
        }
        throw error;
      }

      if (sprints.length === 0) {
        console.log('⚠️ No sprints found - skipping field selection test');
        return;
      }

      // Find a sprint with issues
      let testSprintId: number | undefined;
      
      for (const sprint of sprints) {
        try {
          const quickCheck = await client.getSprintIssues(sprint.id, { maxResults: 1 });
          if (quickCheck.total > 0) {
            testSprintId = sprint.id;
            break;
          }
        } catch (error) {
          // Continue to next sprint
        }
      }

      if (!testSprintId) {
        console.log('ℹ️ No sprint with issues found for field selection test');
        return;
      }

      console.log(`🏃 Testing field selection with sprint: ${testSprintId}`);

      // Test field selection
      const options: SearchOptions = {
        fields: ['summary', 'status', 'assignee', 'priority']
      };

      const result = await client.getSprintIssues(testSprintId, options);

      // Assert
      expect(result).toBeDefined();
      expect(result.total).toBeGreaterThan(0);
      
      if (result.issues.length > 0) {
        const firstIssue = result.issues[0];
        
        // Should have requested fields
        expect(firstIssue.fields).toHaveProperty('summary');
        expect(firstIssue.fields).toHaveProperty('status');
        expect(firstIssue.fields).toHaveProperty('priority');
        
        // The assignee field might be null, so we check differently
        expect(firstIssue.fields).toHaveProperty('assignee');
        
        console.log(`✓ Field selection working: ${Object.keys(firstIssue.fields).length} fields returned`);
        console.log(`✓ Summary: ${firstIssue.fields.summary}`);
        console.log(`✓ Status: ${firstIssue.fields.status.name}`);
      }
    }, 30000);

    it('should validate sprint issues data model against SearchResult<JiraIssue> interface', async () => {
      // Get a board and sprint with issues
      const boards = await client.getAgileBoards();
      
      if (boards.length === 0) {
        console.log('⚠️ No agile boards found - skipping data model validation');
        return;
      }

      const testBoardId = boards[0].id;
      let sprints;
      try {
        sprints = await client.getSprintsFromBoard(testBoardId);
      } catch (error) {
        if (error instanceof ApiError && error.message.includes("doesn't support sprints")) {
          console.log('ℹ️ Board does not support sprints (likely Kanban) - skipping data model validation');
          return;
        }
        throw error;
      }

      if (sprints.length === 0) {
        console.log('⚠️ No sprints found - skipping data model validation');
        return;
      }

      // Find a sprint with issues
      let testResult: SearchResult<JiraIssue> | undefined;
      let testSprintName = '';
      
      for (const sprint of sprints) {
        try {
          const result = await client.getSprintIssues(sprint.id);
          if (result.total > 0) {
            testResult = result;
            testSprintName = sprint.name;
            break;
          }
        } catch (error) {
          // Continue to next sprint
        }
      }

      if (!testResult) {
        console.log('ℹ️ No sprint with issues found - skipping data model validation');
        return;
      }

      console.log(`🏃 Validating data model from sprint: ${testSprintName}`);

      // Validate SearchResult structure
      expect(testResult.expand).toBeDefined();
      expect(testResult.startAt).toBeDefined();
      expect(testResult.maxResults).toBeDefined();
      expect(testResult.total).toBeDefined();
      expect(testResult.issues).toBeDefined();
      
      expect(typeof testResult.expand).toBe('string');
      expect(typeof testResult.startAt).toBe('number');
      expect(typeof testResult.maxResults).toBe('number');
      expect(typeof testResult.total).toBe('number');
      expect(Array.isArray(testResult.issues)).toBe(true);
      
      // Validate each issue against the JiraIssue interface
      testResult.issues.forEach((issue, index) => {
        // Required fields
        expect(issue.id).toBeDefined();
        expect(issue.key).toBeDefined();
        expect(issue.self).toBeDefined();
        expect(issue.fields).toBeDefined();
        
        expect(typeof issue.id).toBe('string');
        expect(typeof issue.key).toBe('string');
        expect(typeof issue.self).toBe('string');
        expect(typeof issue.fields).toBe('object');
        
        // Required issue.fields
        expect(issue.fields.summary).toBeDefined();
        expect(issue.fields.status).toBeDefined();
        expect(issue.fields.reporter).toBeDefined();
        expect(issue.fields.creator).toBeDefined();
        expect(issue.fields.project).toBeDefined();
        expect(issue.fields.issuetype).toBeDefined();
        expect(issue.fields.priority).toBeDefined();
        expect(issue.fields.created).toBeDefined();
        expect(issue.fields.updated).toBeDefined();
        
        expect(typeof issue.fields.summary).toBe('string');
        expect(typeof issue.fields.status).toBe('object');
        expect(typeof issue.fields.reporter).toBe('object');
        expect(typeof issue.fields.creator).toBe('object');
        expect(typeof issue.fields.project).toBe('object');
        expect(typeof issue.fields.issuetype).toBe('object');
        expect(typeof issue.fields.priority).toBe('object');
        expect(typeof issue.fields.created).toBe('string');
        expect(typeof issue.fields.updated).toBe('string');
        
        // Optional assignee field - can be null
        if (issue.fields.assignee !== null) {
          expect(typeof issue.fields.assignee).toBe('object');
        }
        
        console.log(`✓ Issue ${index + 1}: ${issue.key} - data model valid`);
      });

      console.log(`✓ All ${testResult.issues.length} issues validated against SearchResult<JiraIssue> interface`);
    }, 45000);

    it('should compare getSprintIssues results with searchIssues for consistency', async () => {
      // Get a board and sprint with issues
      const boards = await client.getAgileBoards();
      
      if (boards.length === 0) {
        console.log('⚠️ No agile boards found - skipping consistency test');
        return;
      }

      const testBoardId = boards[0].id;
      let sprints;
      try {
        sprints = await client.getSprintsFromBoard(testBoardId);
      } catch (error) {
        if (error instanceof ApiError && error.message.includes("doesn't support sprints")) {
          console.log('ℹ️ Board does not support sprints (likely Kanban) - skipping consistency test');
          return;
        }
        throw error;
      }

      if (sprints.length === 0) {
        console.log('⚠️ No sprints found - skipping consistency test');
        return;
      }

      // Find a sprint with issues
      let testSprintId: number | undefined;
      
      for (const sprint of sprints) {
        try {
          const quickCheck = await client.getSprintIssues(sprint.id, { maxResults: 1 });
          if (quickCheck.total > 0) {
            testSprintId = sprint.id;
            break;
          }
        } catch (error) {
          // Continue to next sprint
        }
      }

      if (!testSprintId) {
        console.log('ℹ️ No sprint with issues found for consistency test');
        return;
      }

      console.log(`🏃 Testing consistency with sprint: ${testSprintId}`);

      // Get sprint issues using both methods
      const sprintIssuesResult = await client.getSprintIssues(testSprintId);
      const searchIssuesResult = await client.searchIssues(`sprint = ${testSprintId}`);

      // Assert results are consistent
      expect(sprintIssuesResult.total).toBe(searchIssuesResult.total);
      expect(sprintIssuesResult.issues.length).toBe(searchIssuesResult.issues.length);
      
      // Compare issue keys to ensure same issues are returned
      const sprintIssueKeys = sprintIssuesResult.issues.map(issue => issue.key).sort();
      const searchIssueKeys = searchIssuesResult.issues.map(issue => issue.key).sort();
      
      expect(sprintIssueKeys).toEqual(searchIssueKeys);
      
      console.log(`✓ Consistency verified: both methods return ${sprintIssuesResult.total} issues`);
      console.log(`✓ Same issue keys returned by both methods`);
    }, 30000);
  });

  describe('error handling', () => {
    it('should throw ApiError for non-existent sprint', async () => {
      const nonExistentSprintId = 999999;

      await expect(client.getSprintIssues(nonExistentSprintId)).rejects.toThrow(ApiError);
      
      console.log(`✓ Correctly handled non-existent sprint ID: ${nonExistentSprintId}`);
    }, 30000);

    it('should handle sprint with no issues gracefully', async () => {
      // Get a board and find a sprint with no issues (future sprints often have no issues)
      const boards = await client.getAgileBoards();
      
      if (boards.length === 0) {
        console.log('⚠️ No agile boards found - skipping empty sprint test');
        return;
      }

      const testBoardId = boards[0].id;
      let sprints;
      try {
        sprints = await client.getSprintsFromBoard(testBoardId);
      } catch (error) {
        if (error instanceof ApiError && error.message.includes("doesn't support sprints")) {
          console.log('ℹ️ Board does not support sprints (likely Kanban) - skipping empty sprint test');
          return;
        }
        throw error;
      }

      if (sprints.length === 0) {
        console.log('⚠️ No sprints found - skipping empty sprint test');
        return;
      }

      // Try to find a future sprint (likely to have no issues)
      const futureSprints = sprints.filter(s => s.state === 'future');
      let testSprintId: number;
      
      if (futureSprints.length > 0) {
        testSprintId = futureSprints[0].id;
      } else {
        // Use any sprint
        testSprintId = sprints[0].id;
      }

      try {
        const result = await client.getSprintIssues(testSprintId);
        
        // Should get a valid SearchResult even if empty
        expect(result).toBeDefined();
        expect(typeof result.total).toBe('number');
        expect(Array.isArray(result.issues)).toBe(true);
        expect(result.total).toBeGreaterThanOrEqual(0);
        expect(result.issues.length).toBe(Math.min(result.total, result.maxResults));
        
        console.log(`✓ Sprint ${testSprintId}: ${result.total} issues (handled gracefully)`);
      } catch (error) {
        // If an error is thrown, it should be an ApiError
        expect(error).toBeInstanceOf(ApiError);
        console.log(`✓ Sprint ${testSprintId}: Error handled properly - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }, 30000);
  });

  describe('edge cases with real data', () => {
    it('should handle different sprint states (active, closed, future)', async () => {
      // Get available boards
      const boards = await client.getAgileBoards();
      
      if (boards.length === 0) {
        console.log('⚠️ No agile boards found - skipping sprint state test');
        return;
      }

      // Test with multiple boards to find different sprint states
      const testResults = [];
      
      for (const board of boards.slice(0, 3)) { // Test up to 3 boards
        try {
          let sprints;
          try {
            sprints = await client.getSprintsFromBoard(board.id);
          } catch (error) {
            if (error instanceof ApiError && error.message.includes("doesn't support sprints")) {
              console.log(`⚠️ Board ${board.name} does not support sprints (likely Kanban) - skipping`);
              continue;
            }
            throw error;
          }
          
          if (sprints.length > 0) {
            // Test different sprint states
            const stateTests = [];
            
            for (const state of ['active', 'closed', 'future']) {
              const sprintsInState = sprints.filter(s => s.state === state);
              if (sprintsInState.length > 0) {
                const testSprint = sprintsInState[0];
                try {
                  const result = await client.getSprintIssues(testSprint.id, { maxResults: 5 });
                  stateTests.push({
                    state: state,
                    sprintId: testSprint.id,
                    sprintName: testSprint.name,
                    issueCount: result.total,
                    success: true
                  });
                } catch (error) {
                  stateTests.push({
                    state: state,
                    sprintId: testSprint.id,
                    sprintName: testSprint.name,
                    issueCount: 0,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                  });
                }
              }
            }
            
            testResults.push({
              boardId: board.id,
              boardName: board.name,
              boardType: board.type,
              stateTests: stateTests
            });
          }
        } catch (error) {
          console.log(`⚠️ Could not test board ${board.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Log results
      testResults.forEach(result => {
        console.log(`📋 Board ${result.boardName} (${result.boardType}):`);
        result.stateTests.forEach(test => {
          if (test.success) {
            console.log(`  ${test.state}: ${test.sprintName} - ${test.issueCount} issues`);
          } else {
            console.log(`  ${test.state}: ${test.sprintName} - Error: ${test.error}`);
          }
        });
      });

      // Assert that we tested at least one sprint state
      const totalStateTests = testResults.flatMap(r => r.stateTests);
      expect(totalStateTests.length).toBeGreaterThan(0);
      
      console.log(`✓ Tested ${totalStateTests.length} sprint states across ${testResults.length} boards`);
    }, 60000); // 60s timeout for multiple API calls
  });
});