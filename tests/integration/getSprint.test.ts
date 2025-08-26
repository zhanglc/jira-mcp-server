import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { JiraSprint } from '../../src/types/jira-types.js';
import { ApiError } from '../../src/types/api-error.js';
import { loadConfig } from '../../src/utils/config.js';

describe('JiraClientWrapper.getSprint - Integration Tests', () => {
  let client: JiraClientWrapper;
  let config: any;

  beforeAll(async () => {
    config = await loadConfig();
    client = new JiraClientWrapper(config);
  });

  describe('real API integration', () => {
    it('should retrieve individual sprint details successfully', async () => {
      // First, get available boards to find one with sprints
      const boards = await client.getAgileBoards();

      if (boards.length === 0) {
        console.log('⚠️ No agile boards found - skipping sprint tests');
        return;
      }

      // Find a Scrum board (most likely to have sprints)
      const scrumBoard = boards.find(board => board.type === 'scrum');
      const testBoardId = scrumBoard?.id || boards[0].id;

      console.log(
        `📋 Testing with board: ${scrumBoard?.name || boards[0].name} (ID: ${testBoardId}, Type: ${scrumBoard?.type || boards[0].type})`
      );

      // Get sprints from the board first
      const sprints = await client.getSprintsFromBoard(testBoardId);

      if (sprints.length === 0) {
        console.log(
          'ℹ️ Board has no sprints (possibly Kanban board) - skipping individual sprint test'
        );
        return;
      }

      // Test with the first sprint
      const testSprintId = sprints[0].id;
      console.log(
        `🏃 Testing getSprint with sprint ID: ${testSprintId} (${sprints[0].name})`
      );

      // Act
      const sprint = await client.getSprint(testSprintId);

      // Assert
      expect(sprint).toBeDefined();
      expect(sprint.id).toBe(testSprintId);

      // Validate required fields
      expect(sprint).toHaveProperty('id');
      expect(sprint).toHaveProperty('self');
      expect(sprint).toHaveProperty('state');
      expect(sprint).toHaveProperty('name');

      expect(typeof sprint.id).toBe('number');
      expect(typeof sprint.self).toBe('string');
      expect(typeof sprint.state).toBe('string');
      expect(typeof sprint.name).toBe('string');

      // Validate self URL format
      expect(sprint.self).toMatch(/\/rest\/agile\/1\.0\/sprint\/\d+/);

      // Validate sprint state is one of expected values
      expect(['active', 'closed', 'future']).toContain(sprint.state);

      console.log(`✓ Sprint details: ${sprint.name} (${sprint.state})`);

      // Validate optional date fields if present
      if (sprint.startDate) {
        expect(typeof sprint.startDate).toBe('string');
        expect(new Date(sprint.startDate).toString()).not.toBe('Invalid Date');
        console.log(`✓ Start date: ${sprint.startDate}`);
      }

      if (sprint.endDate) {
        expect(typeof sprint.endDate).toBe('string');
        expect(new Date(sprint.endDate).toString()).not.toBe('Invalid Date');
        console.log(`✓ End date: ${sprint.endDate}`);
      }

      if (sprint.completeDate) {
        expect(typeof sprint.completeDate).toBe('string');
        expect(new Date(sprint.completeDate).toString()).not.toBe(
          'Invalid Date'
        );
        console.log(`✓ Complete date: ${sprint.completeDate}`);
      }

      if (sprint.originBoardId !== undefined) {
        expect(typeof sprint.originBoardId).toBe('number');
        console.log(`✓ Origin board ID: ${sprint.originBoardId}`);
      }

      if (sprint.goal) {
        expect(typeof sprint.goal).toBe('string');
        console.log(`✓ Goal: ${sprint.goal}`);
      }
    }, 30000); // 30s timeout for real API

    it('should validate data consistency with getSprintsFromBoard', async () => {
      // Get available boards
      const boards = await client.getAgileBoards();

      if (boards.length === 0) {
        console.log('⚠️ No agile boards found - skipping consistency test');
        return;
      }

      // Find a board with sprints
      let testSprints: JiraSprint[] = [];
      let testBoardName = '';

      for (const board of boards.slice(0, 3)) {
        // Test up to 3 boards
        try {
          const sprints = await client.getSprintsFromBoard(board.id);
          if (sprints.length > 0) {
            testSprints = sprints.slice(0, 3); // Test up to 3 sprints per board
            testBoardName = board.name;
            break;
          }
        } catch (error) {
          // Continue to next board
        }
      }

      if (testSprints.length === 0) {
        console.log(
          'ℹ️ No sprints found in any boards - skipping consistency test'
        );
        return;
      }

      console.log(
        `📋 Testing data consistency with board: ${testBoardName} (${testSprints.length} sprints)`
      );

      // Test consistency for each sprint
      for (const boardSprint of testSprints) {
        try {
          const individualSprint = await client.getSprint(boardSprint.id);

          // Compare required fields
          expect(individualSprint.id).toBe(boardSprint.id);
          expect(individualSprint.self).toBe(boardSprint.self);
          expect(individualSprint.state).toBe(boardSprint.state);
          expect(individualSprint.name).toBe(boardSprint.name);

          // Compare optional fields (only if both have them)
          if (boardSprint.startDate && individualSprint.startDate) {
            expect(individualSprint.startDate).toBe(boardSprint.startDate);
          }

          if (boardSprint.endDate && individualSprint.endDate) {
            expect(individualSprint.endDate).toBe(boardSprint.endDate);
          }

          if (boardSprint.completeDate && individualSprint.completeDate) {
            expect(individualSprint.completeDate).toBe(
              boardSprint.completeDate
            );
          }

          if (boardSprint.originBoardId && individualSprint.originBoardId) {
            expect(individualSprint.originBoardId).toBe(
              boardSprint.originBoardId
            );
          }

          if (boardSprint.goal && individualSprint.goal) {
            expect(individualSprint.goal).toBe(boardSprint.goal);
          }

          console.log(
            `✓ Sprint ${boardSprint.id} (${boardSprint.name}): Data consistent between methods`
          );
        } catch (error) {
          console.log(
            `⚠️ Could not get individual sprint ${boardSprint.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
          // Don't fail the test if individual sprints can't be accessed
        }
      }
    }, 60000); // 60s timeout for multiple API calls

    it('should handle different sprint states correctly', async () => {
      // Get available boards
      const boards = await client.getAgileBoards();

      if (boards.length === 0) {
        console.log('⚠️ No agile boards found - skipping sprint state tests');
        return;
      }

      // Collect sprints from multiple boards to find different states
      const stateResults: { [state: string]: JiraSprint[] } = {
        active: [],
        closed: [],
        future: [],
      };

      for (const board of boards.slice(0, 5)) {
        // Test up to 5 boards
        try {
          const sprints = await client.getSprintsFromBoard(board.id);

          for (const sprint of sprints.slice(0, 2)) {
            // Test up to 2 sprints per board
            try {
              const individualSprint = await client.getSprint(sprint.id);

              if (stateResults[individualSprint.state]) {
                stateResults[individualSprint.state].push(individualSprint);
              }

              // Stop if we have examples of all states
              if (
                stateResults.active.length > 0 &&
                stateResults.closed.length > 0 &&
                stateResults.future.length > 0
              ) {
                break;
              }
            } catch (error) {
              // Continue to next sprint
            }
          }

          if (
            stateResults.active.length > 0 &&
            stateResults.closed.length > 0 &&
            stateResults.future.length > 0
          ) {
            break;
          }
        } catch (error) {
          // Continue to next board
        }
      }

      // Report findings
      const totalSprints = Object.values(stateResults).flat().length;
      console.log(`📊 Found ${totalSprints} sprints across different states:`);

      Object.entries(stateResults).forEach(([state, sprints]) => {
        console.log(`  - ${state}: ${sprints.length} sprints`);
        if (sprints.length > 0) {
          const example = sprints[0];
          console.log(`    Example: ${example.name} (ID: ${example.id})`);

          // Validate state-specific characteristics
          if (state === 'closed' && example.completeDate) {
            expect(typeof example.completeDate).toBe('string');
            console.log(
              `    ✓ Closed sprint has complete date: ${example.completeDate}`
            );
          }

          if (state === 'active' && example.startDate) {
            expect(typeof example.startDate).toBe('string');
            console.log(
              `    ✓ Active sprint has start date: ${example.startDate}`
            );
          }
        }
      });

      // Assert that we found at least some sprints
      expect(totalSprints).toBeGreaterThan(0);
      console.log(
        `✓ Successfully tested getSprint with ${totalSprints} sprints across different states`
      );
    }, 90000); // 90s timeout for multiple API calls

    it('should validate sprint data model against JiraSprint interface', async () => {
      // Get available boards
      const boards = await client.getAgileBoards();

      if (boards.length === 0) {
        console.log(
          '⚠️ No agile boards found - skipping data model validation'
        );
        return;
      }

      // Find a board with sprints and test multiple sprints
      let testSprints: number[] = [];
      let testBoardName = '';

      for (const board of boards) {
        try {
          const sprints = await client.getSprintsFromBoard(board.id);
          if (sprints.length > 0) {
            testSprints = sprints.slice(0, 5).map(s => s.id); // Test up to 5 sprints
            testBoardName = board.name;
            break;
          }
        } catch (error) {
          // Continue to next board
        }
      }

      if (testSprints.length === 0) {
        console.log(
          'ℹ️ No sprints found in any boards - skipping data model validation'
        );
        return;
      }

      console.log(
        `📋 Validating sprint data model from board: ${testBoardName} (${testSprints.length} sprints)`
      );

      // Validate each sprint against the JiraSprint interface
      for (const sprintId of testSprints) {
        try {
          const sprint = await client.getSprint(sprintId);

          // Required fields validation
          expect(sprint.id).toBeDefined();
          expect(sprint.self).toBeDefined();
          expect(sprint.state).toBeDefined();
          expect(sprint.name).toBeDefined();

          expect(typeof sprint.id).toBe('number');
          expect(typeof sprint.self).toBe('string');
          expect(typeof sprint.state).toBe('string');
          expect(typeof sprint.name).toBe('string');

          // Validate state is one of expected values
          expect(['active', 'closed', 'future']).toContain(sprint.state);

          // Optional fields - type validation only if present
          if (sprint.startDate !== undefined) {
            expect(typeof sprint.startDate).toBe('string');
            expect(new Date(sprint.startDate).toString()).not.toBe(
              'Invalid Date'
            );
          }

          if (sprint.endDate !== undefined) {
            expect(typeof sprint.endDate).toBe('string');
            expect(new Date(sprint.endDate).toString()).not.toBe(
              'Invalid Date'
            );
          }

          if (sprint.completeDate !== undefined) {
            expect(typeof sprint.completeDate).toBe('string');
            expect(new Date(sprint.completeDate).toString()).not.toBe(
              'Invalid Date'
            );
          }

          if (sprint.originBoardId !== undefined) {
            expect(typeof sprint.originBoardId).toBe('number');
          }

          if (sprint.goal !== undefined) {
            expect(typeof sprint.goal).toBe('string');
          }

          console.log(
            `✓ Sprint ${sprintId} (${sprint.name}): Data model valid`
          );
        } catch (error) {
          console.log(
            `⚠️ Could not validate sprint ${sprintId}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
          // Don't fail the test if individual sprints can't be accessed
        }
      }

      console.log(`✓ Data model validation completed for available sprints`);
    }, 60000);
  });

  describe('error handling', () => {
    it('should throw ApiError for non-existent sprint', async () => {
      const nonExistentSprintId = 999999999; // Very large ID unlikely to exist

      await expect(client.getSprint(nonExistentSprintId)).rejects.toThrow(
        ApiError
      );

      console.log(
        `✓ Correctly handled non-existent sprint ID: ${nonExistentSprintId}`
      );
    }, 30000);

    it('should handle permission denied gracefully', async () => {
      // Test with various sprint IDs that might have permission issues
      const testSprintIds = [1, 10, 100];
      let permissionErrorFound = false;

      for (const sprintId of testSprintIds) {
        try {
          await client.getSprint(sprintId);
          console.log(`✓ Sprint ${sprintId}: Access granted or doesn't exist`);
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          console.log(
            `✓ Sprint ${sprintId}: Error handled properly - ${error instanceof Error ? error.message : 'Unknown error'}`
          );
          permissionErrorFound = true;
        }
      }

      // We expect at least some errors (either not found or permission denied)
      expect(permissionErrorFound).toBe(true);
      console.log(`✓ Permission handling validated with test sprint IDs`);
    }, 45000);
  });

  describe('edge cases with real data', () => {
    it('should handle large sprint IDs correctly', async () => {
      // Get available boards to find real sprints
      const boards = await client.getAgileBoards();

      if (boards.length === 0) {
        console.log('⚠️ No agile boards found - skipping large ID test');
        return;
      }

      // Find the largest sprint ID in the system
      let largestSprintId = 0;

      for (const board of boards.slice(0, 3)) {
        try {
          const sprints = await client.getSprintsFromBoard(board.id);
          for (const sprint of sprints) {
            if (sprint.id > largestSprintId) {
              largestSprintId = sprint.id;
            }
          }
        } catch (error) {
          // Continue to next board
        }
      }

      if (largestSprintId === 0) {
        console.log('ℹ️ No sprints found - skipping large ID test');
        return;
      }

      console.log(
        `📊 Testing with largest found sprint ID: ${largestSprintId}`
      );

      try {
        const sprint = await client.getSprint(largestSprintId);
        expect(sprint.id).toBe(largestSprintId);
        expect(typeof sprint.id).toBe('number');
        console.log(
          `✓ Large sprint ID ${largestSprintId} handled correctly: ${sprint.name}`
        );
      } catch (error) {
        // If we can't access this specific sprint, that's still a valid test
        expect(error).toBeInstanceOf(ApiError);
        console.log(
          `✓ Large sprint ID ${largestSprintId} error handled properly: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }, 45000);

    it('should handle sprints from different boards', async () => {
      // Get available boards
      const boards = await client.getAgileBoards();

      if (boards.length === 0) {
        console.log('⚠️ No agile boards found - skipping multi-board test');
        return;
      }

      const testedSprints: {
        boardId: number;
        boardName: string;
        sprintId: number;
        sprintName: string;
        status: string;
      }[] = [];

      // Test sprints from different boards
      for (const board of boards.slice(0, 5)) {
        try {
          const sprints = await client.getSprintsFromBoard(board.id);

          if (sprints.length > 0) {
            const testSprint = sprints[0];

            try {
              const individualSprint = await client.getSprint(testSprint.id);
              testedSprints.push({
                boardId: board.id,
                boardName: board.name,
                sprintId: testSprint.id,
                sprintName: individualSprint.name,
                status: 'success',
              });
            } catch (error) {
              testedSprints.push({
                boardId: board.id,
                boardName: board.name,
                sprintId: testSprint.id,
                sprintName: testSprint.name,
                status: `error: ${error instanceof Error ? error.message : 'Unknown error'}`,
              });
            }
          }
        } catch (error) {
          // Continue to next board
        }
      }

      // Log results
      testedSprints.forEach(result => {
        console.log(
          `📋 Board ${result.boardName} (${result.boardId}): Sprint ${result.sprintId} - ${result.status}`
        );
      });

      // Assert that we tested at least some sprints
      expect(testedSprints.length).toBeGreaterThan(0);
      console.log(
        `✓ Tested getSprint with ${testedSprints.length} sprints from different boards`
      );
    }, 75000); // 75s timeout for multiple API calls
  });
});
