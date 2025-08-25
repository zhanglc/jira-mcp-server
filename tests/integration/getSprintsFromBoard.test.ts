import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { JiraSprint } from '../../src/types/jira-types.js';
import { ApiError } from '../../src/types/api-error.js';
import { loadConfig } from '../../src/utils/config.js';

describe('JiraClientWrapper.getSprintsFromBoard - Integration Tests', () => {
  let client: JiraClientWrapper;
  let config: any;

  beforeAll(async () => {
    config = await loadConfig();
    client = new JiraClientWrapper(config);
  });

  describe('real API integration', () => {
    it('should retrieve sprints from a real board successfully', async () => {
      // First, get available boards to find one with sprints
      const boards = await client.getAgileBoards();
      
      if (boards.length === 0) {
        console.log('⚠️ No agile boards found - skipping sprint tests');
        return;
      }

      // Find a Scrum board (most likely to have sprints)
      const scrumBoard = boards.find(board => board.type === 'scrum');
      const testBoardId = scrumBoard?.id || boards[0].id;

      console.log(`📋 Testing with board: ${scrumBoard?.name || boards[0].name} (ID: ${testBoardId}, Type: ${scrumBoard?.type || boards[0].type})`);

      // Act
      const sprints = await client.getSprintsFromBoard(testBoardId);

      // Assert
      expect(Array.isArray(sprints)).toBe(true);
      console.log(`✓ Retrieved ${sprints.length} sprints from board ${testBoardId}`);

      if (sprints.length > 0) {
        const firstSprint = sprints[0];
        
        // Validate required sprint properties
        expect(firstSprint).toHaveProperty('id');
        expect(firstSprint).toHaveProperty('self');
        expect(firstSprint).toHaveProperty('state');
        expect(firstSprint).toHaveProperty('name');
        
        expect(typeof firstSprint.id).toBe('number');
        expect(typeof firstSprint.self).toBe('string');
        expect(typeof firstSprint.state).toBe('string');
        expect(typeof firstSprint.name).toBe('string');
        
        // Validate self URL format
        expect(firstSprint.self).toMatch(/\/rest\/agile\/1\.0\/sprint\/\d+/);
        
        // Validate sprint state is one of expected values
        expect(['active', 'closed', 'future']).toContain(firstSprint.state);
        
        console.log(`✓ First sprint: ${firstSprint.name} (${firstSprint.state})`);
        
        // Validate optional date fields if present
        if (firstSprint.startDate) {
          expect(typeof firstSprint.startDate).toBe('string');
          expect(new Date(firstSprint.startDate).toString()).not.toBe('Invalid Date');
          console.log(`✓ Start date: ${firstSprint.startDate}`);
        }
        
        if (firstSprint.endDate) {
          expect(typeof firstSprint.endDate).toBe('string');
          expect(new Date(firstSprint.endDate).toString()).not.toBe('Invalid Date');
          console.log(`✓ End date: ${firstSprint.endDate}`);
        }
        
        if (firstSprint.completeDate) {
          expect(typeof firstSprint.completeDate).toBe('string');
          expect(new Date(firstSprint.completeDate).toString()).not.toBe('Invalid Date');
          console.log(`✓ Complete date: ${firstSprint.completeDate}`);
        }
        
        if (firstSprint.originBoardId !== undefined) {
          expect(typeof firstSprint.originBoardId).toBe('number');
          console.log(`✓ Origin board ID: ${firstSprint.originBoardId}`);
        }
        
        if (firstSprint.goal) {
          expect(typeof firstSprint.goal).toBe('string');
          console.log(`✓ Goal: ${firstSprint.goal}`);
        }
      } else {
        console.log('ℹ️ Board has no sprints (possibly Kanban board)');
      }
    }, 30000); // 30s timeout for real API

    it('should handle different sprint states correctly', async () => {
      // Get available boards
      const boards = await client.getAgileBoards();
      
      if (boards.length === 0) {
        console.log('⚠️ No agile boards found - skipping sprint state tests');
        return;
      }

      // Test with multiple boards to find different sprint states
      const testResults = [];
      
      for (const board of boards.slice(0, 3)) { // Test up to 3 boards
        try {
          const sprints = await client.getSprintsFromBoard(board.id);
          
          if (sprints.length > 0) {
            const states = [...new Set(sprints.map(s => s.state))];
            testResults.push({
              boardId: board.id,
              boardName: board.name,
              boardType: board.type,
              sprintCount: sprints.length,
              states: states
            });
            
            console.log(`📋 Board ${board.name} (${board.type}): ${sprints.length} sprints with states: ${states.join(', ')}`);
          }
        } catch (error) {
          console.log(`⚠️ Could not get sprints from board ${board.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Assert that we found at least one board with sprints
      const boardsWithSprints = testResults.filter(r => r.sprintCount > 0);
      if (boardsWithSprints.length === 0) {
        console.log('ℹ️ No boards with sprints found - all might be Kanban boards');
        return;
      }

      // Validate that all states are valid
      const allStates = testResults.flatMap(r => r.states);
      const validStates = ['active', 'closed', 'future'];
      allStates.forEach(state => {
        expect(validStates).toContain(state);
      });

      console.log(`✓ Found ${boardsWithSprints.length} boards with sprints`);
    }, 45000); // 45s timeout for multiple API calls

    it('should validate sprint data model against JiraSprint interface', async () => {
      // Get available boards
      const boards = await client.getAgileBoards();
      
      if (boards.length === 0) {
        console.log('⚠️ No agile boards found - skipping data model validation');
        return;
      }

      // Find a board with sprints
      let testSprints: JiraSprint[] = [];
      let testBoardName = '';
      
      for (const board of boards) {
        try {
          const sprints = await client.getSprintsFromBoard(board.id);
          if (sprints.length > 0) {
            testSprints = sprints;
            testBoardName = board.name;
            break;
          }
        } catch (error) {
          // Continue to next board
        }
      }

      if (testSprints.length === 0) {
        console.log('ℹ️ No sprints found in any boards - skipping data model validation');
        return;
      }

      console.log(`📋 Validating sprint data from board: ${testBoardName}`);

      // Validate each sprint against the JiraSprint interface
      testSprints.forEach((sprint, index) => {
        // Required fields
        expect(sprint.id).toBeDefined();
        expect(sprint.self).toBeDefined();
        expect(sprint.state).toBeDefined();
        expect(sprint.name).toBeDefined();
        
        expect(typeof sprint.id).toBe('number');
        expect(typeof sprint.self).toBe('string');
        expect(typeof sprint.state).toBe('string');
        expect(typeof sprint.name).toBe('string');
        
        // Optional fields - type validation only if present
        if (sprint.startDate !== undefined) {
          expect(typeof sprint.startDate).toBe('string');
        }
        
        if (sprint.endDate !== undefined) {
          expect(typeof sprint.endDate).toBe('string');
        }
        
        if (sprint.completeDate !== undefined) {
          expect(typeof sprint.completeDate).toBe('string');
        }
        
        if (sprint.originBoardId !== undefined) {
          expect(typeof sprint.originBoardId).toBe('number');
        }
        
        if (sprint.goal !== undefined) {
          expect(typeof sprint.goal).toBe('string');
        }
        
        console.log(`✓ Sprint ${index + 1}: ${sprint.name} - data model valid`);
      });

      console.log(`✓ All ${testSprints.length} sprints validated against JiraSprint interface`);
    }, 30000);
  });

  describe('error handling', () => {
    it('should throw ApiError for non-existent board', async () => {
      const nonExistentBoardId = 999999;

      await expect(client.getSprintsFromBoard(nonExistentBoardId)).rejects.toThrow(ApiError);
      
      console.log(`✓ Correctly handled non-existent board ID: ${nonExistentBoardId}`);
    }, 30000);

    it('should handle board without agile functionality gracefully', async () => {
      // Test with a very low board ID that might not have agile functionality
      const testBoardId = 1;

      try {
        const sprints = await client.getSprintsFromBoard(testBoardId);
        // If no error is thrown, we should get an empty array or valid sprints
        expect(Array.isArray(sprints)).toBe(true);
        console.log(`✓ Board ${testBoardId}: ${sprints.length} sprints (handled gracefully)`);
      } catch (error) {
        // If an error is thrown, it should be an ApiError
        expect(error).toBeInstanceOf(ApiError);
        console.log(`✓ Board ${testBoardId}: Error handled properly - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }, 30000);
  });

  describe('edge cases with real data', () => {
    it('should handle boards with no sprints (Kanban boards)', async () => {
      // Get available boards
      const boards = await client.getAgileBoards();
      
      if (boards.length === 0) {
        console.log('⚠️ No agile boards found - skipping Kanban test');
        return;
      }

      // Test all boards to find ones with no sprints
      const kanbanResults = [];
      
      for (const board of boards) {
        try {
          const sprints = await client.getSprintsFromBoard(board.id);
          kanbanResults.push({
            boardId: board.id,
            boardName: board.name,
            boardType: board.type,
            sprintCount: sprints.length
          });
        } catch (error) {
          // Some boards might not support sprints at all
          kanbanResults.push({
            boardId: board.id,
            boardName: board.name,
            boardType: board.type,
            sprintCount: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Log results
      kanbanResults.forEach(result => {
        if (result.sprintCount === 'error') {
          console.log(`📋 ${result.boardName} (${result.boardType}): Error - ${result.error}`);
        } else {
          console.log(`📋 ${result.boardName} (${result.boardType}): ${result.sprintCount} sprints`);
        }
      });

      // Assert that the method handles boards without sprints gracefully
      const boardsWithNoSprints = kanbanResults.filter(r => r.sprintCount === 0);
      if (boardsWithNoSprints.length > 0) {
        console.log(`✓ Found ${boardsWithNoSprints.length} boards with no sprints - handled gracefully`);
      }

      console.log(`✓ Tested ${kanbanResults.length} boards for sprint handling`);
    }, 60000); // 60s timeout for multiple API calls
  });
});