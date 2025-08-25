/**
 * Integration tests for JiraClientWrapper.getAgileBoards method
 * 
 * These tests run against a real Jira Server instance to validate:
 * - Actual API compatibility and response handling
 * - Real authentication and authorization scenarios
 * - Actual data model validation
 * - Performance characteristics with production data
 * 
 * Prerequisites:
 * - Valid Jira Server environment (https://jira.dentsplysirona.com)
 * - Valid authentication credentials in .env
 * - Agile functionality enabled on the Jira Server
 * - Test projects with accessible boards
 */

import { JiraClientWrapper } from '../../src/client/jira-client-wrapper.js';
import { ApiError } from '../../src/types/api-error.js';
import { loadConfig } from '../../src/utils/config.js';

describe('JiraClientWrapper.getAgileBoards - Integration Tests', () => {
  let client: JiraClientWrapper;
  let config: ReturnType<typeof loadConfig>;

  beforeAll(() => {
    config = loadConfig();
    client = new JiraClientWrapper(config);
  });

  describe('Basic functionality with real Jira Server', () => {
    it('should retrieve all agile boards from Jira Server', async () => {
      // Act
      const boards = await client.getAgileBoards();

      // Assert
      expect(Array.isArray(boards)).toBe(true);
      expect(boards.length).toBeGreaterThan(0); // Expecting some boards to exist
      
      // Validate structure of first board
      const firstBoard = boards[0];
      expect(firstBoard).toHaveProperty('id');
      expect(firstBoard).toHaveProperty('self');
      expect(firstBoard).toHaveProperty('name');
      expect(firstBoard).toHaveProperty('type');
      
      expect(typeof firstBoard.id).toBe('number');
      expect(typeof firstBoard.self).toBe('string');
      expect(typeof firstBoard.name).toBe('string');
      expect(typeof firstBoard.type).toBe('string');
      
      // Validate self URL format
      expect(firstBoard.self).toMatch(/\/rest\/agile\/1\.0\/board\/\d+/);
      
      // Validate board type is one of expected values
      expect(['scrum', 'kanban', 'simple']).toContain(firstBoard.type);
      
      console.log(`✓ Retrieved ${boards.length} boards from Jira Server`);
      console.log(`✓ First board: ${firstBoard.name} (${firstBoard.type})`);
    }, 30000); // 30s timeout for real API

    it('should handle boards with different optional properties', async () => {
      // Act
      const boards = await client.getAgileBoards();
      
      // Assert - Check for variety in board properties
      const boardsWithLocation = boards.filter(board => board.location);
      const boardsWithAdmins = boards.filter(board => board.admins);
      const boardsWithEditPermission = boards.filter(board => board.canEdit !== undefined);
      
      expect(boards.length).toBeGreaterThan(0);
      
      console.log(`✓ Total boards: ${boards.length}`);
      console.log(`✓ Boards with location info: ${boardsWithLocation.length}`);
      console.log(`✓ Boards with admin info: ${boardsWithAdmins.length}`);
      console.log(`✓ Boards with edit permission info: ${boardsWithEditPermission.length}`);
      
      // If we have boards with location, validate the structure
      if (boardsWithLocation.length > 0) {
        const boardWithLocation = boardsWithLocation[0];
        expect(boardWithLocation.location).toHaveProperty('type');
        
        if (boardWithLocation.location?.type === 'project') {
          expect(boardWithLocation.location).toHaveProperty('projectKey');
          expect(typeof boardWithLocation.location.projectKey).toBe('string');
          console.log(`✓ Sample project board: ${boardWithLocation.name} -> ${boardWithLocation.location.projectKey}`);
        }
      }
    }, 30000);

    it('should validate board type distribution', async () => {
      // Act
      const boards = await client.getAgileBoards();
      
      // Assert - Analyze board types
      const boardTypes = boards.reduce((acc, board) => {
        acc[board.type] = (acc[board.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      expect(Object.keys(boardTypes).length).toBeGreaterThan(0);
      
      console.log('✓ Board type distribution:', boardTypes);
      
      // Validate that all board types are expected values
      Object.keys(boardTypes).forEach(type => {
        expect(['scrum', 'kanban', 'simple', 'next-gen']).toContain(type.toLowerCase());
      });
    }, 30000);
  });

  describe('Project filtering functionality', () => {
    it('should filter boards by DSCWA project if available', async () => {
      // Act
      const allBoards = await client.getAgileBoards();
      const dscwaBoards = await client.getAgileBoards('DSCWA');
      
      // Assert
      expect(Array.isArray(dscwaBoards)).toBe(true);
      expect(dscwaBoards.length).toBeLessThanOrEqual(allBoards.length);
      
      // All DSCWA boards should have DSCWA in their location
      dscwaBoards.forEach(board => {
        expect(board.location?.type).toBe('project');
        expect(board.location?.projectKey).toBe('DSCWA');
      });
      
      console.log(`✓ Total boards: ${allBoards.length}`);
      console.log(`✓ DSCWA project boards: ${dscwaBoards.length}`);
      
      if (dscwaBoards.length > 0) {
        console.log(`✓ Sample DSCWA board: ${dscwaBoards[0].name} (${dscwaBoards[0].type})`);
      }
    }, 30000);

    it('should return empty array for non-existent project', async () => {
      // Act
      const boards = await client.getAgileBoards('NONEXISTENT_PROJECT_XYZ123');
      
      // Assert
      expect(Array.isArray(boards)).toBe(true);
      expect(boards.length).toBe(0);
      
      console.log('✓ Non-existent project correctly returns empty array');
    }, 30000);

    it('should handle case-sensitive project matching', async () => {
      // First find a project board
      const allBoards = await client.getAgileBoards();
      const projectBoard = allBoards.find(board => 
        board.location?.type === 'project' && 
        board.location?.projectKey
      );
      
      if (projectBoard && projectBoard.location?.projectKey) {
        const projectKey = projectBoard.location.projectKey;
        
        // Act - Test exact match
        const exactMatch = await client.getAgileBoards(projectKey);
        const lowercaseMatch = await client.getAgileBoards(projectKey.toLowerCase());
        
        // Assert
        expect(exactMatch.length).toBeGreaterThan(0);
        expect(lowercaseMatch.length).toBe(0);
        
        console.log(`✓ Case sensitivity test: ${projectKey} found ${exactMatch.length} boards`);
        console.log(`✓ Case sensitivity test: ${projectKey.toLowerCase()} found ${lowercaseMatch.length} boards`);
      } else {
        console.log('⚠ No project boards available for case sensitivity test');
      }
    }, 30000);
  });

  describe('Data model validation', () => {
    it('should validate complete board model against real data', async () => {
      // Act
      const boards = await client.getAgileBoards();
      
      // Assert - Find a board with complete information
      const completeBoard = boards.find(board => 
        board.location && 
        (board.admins || board.canEdit !== undefined || board.isPrivate !== undefined)
      );
      
      if (completeBoard) {
        // Validate required fields
        expect(typeof completeBoard.id).toBe('number');
        expect(typeof completeBoard.self).toBe('string');
        expect(typeof completeBoard.name).toBe('string');
        expect(typeof completeBoard.type).toBe('string');
        
        // Validate optional fields if present
        if (completeBoard.location) {
          expect(typeof completeBoard.location.type).toBe('string');
          if (completeBoard.location.projectKey) {
            expect(typeof completeBoard.location.projectKey).toBe('string');
          }
          if (completeBoard.location.projectId) {
            expect(typeof completeBoard.location.projectId).toBe('number');
          }
        }
        
        if (completeBoard.admins) {
          expect(Array.isArray(completeBoard.admins.users)).toBe(true);
          expect(Array.isArray(completeBoard.admins.groups)).toBe(true);
        }
        
        if (completeBoard.canEdit !== undefined) {
          expect(typeof completeBoard.canEdit).toBe('boolean');
        }
        
        if (completeBoard.isPrivate !== undefined) {
          expect(typeof completeBoard.isPrivate).toBe('boolean');
        }
        
        if (completeBoard.favourite !== undefined) {
          expect(typeof completeBoard.favourite).toBe('boolean');
        }
        
        console.log('✓ Complete board model validation passed');
        console.log(`✓ Board: ${completeBoard.name}`);
        console.log(`✓ Location type: ${completeBoard.location?.type}`);
        console.log(`✓ Project: ${completeBoard.location?.projectKey || 'N/A'}`);
      } else {
        console.log('⚠ No boards with complete information found for detailed validation');
      }
    }, 30000);

    it('should validate board self URLs are accessible', async () => {
      // Act
      const boards = await client.getAgileBoards();
      
      // Assert - Check URL format for a sample of boards
      const sampleBoards = boards.slice(0, Math.min(5, boards.length));
      
      sampleBoards.forEach(board => {
        expect(board.self).toMatch(/^https?:\/\/.+\/rest\/agile\/1\.0\/board\/\d+$/);
        expect(board.self).toContain(config.url.replace(/\/$/, ''));
        
        console.log(`✓ Valid self URL: ${board.self}`);
      });
    }, 30000);
  });

  describe('Performance and pagination handling', () => {
    it('should handle large number of boards efficiently', async () => {
      const startTime = Date.now();
      
      // Act
      const boards = await client.getAgileBoards();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Assert
      expect(Array.isArray(boards)).toBe(true);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      
      console.log(`✓ Retrieved ${boards.length} boards in ${duration}ms`);
      console.log(`✓ Performance: ${(boards.length / duration * 1000).toFixed(2)} boards/second`);
    }, 30000);
  });

  describe('Error scenarios with real environment', () => {
    it('should handle agile functionality gracefully if not available', async () => {
      // This test validates that the API gracefully handles scenarios where
      // agile functionality might not be enabled or accessible
      
      try {
        // Act
        const boards = await client.getAgileBoards();
        
        // Assert - If successful, should be valid response
        expect(Array.isArray(boards)).toBe(true);
        console.log('✓ Agile functionality is available and working');
      } catch (error) {
        // If agile is not available, should be a proper ApiError
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        
        // Should be a 404 (not found) or 403 (forbidden) for agile functionality
        expect([404, 403]).toContain(apiError.statusCode);
        
        console.log(`✓ Agile functionality not available: ${apiError.message} (${apiError.statusCode})`);
      }
    }, 30000);
  });
});