/**
 * Agile Tools Module Tests
 * 
 * Verifies the agile tools module exports correct tool definitions
 * for Jira Agile functionality including boards and sprints.
 */

import {
  getAgileBoardsToolDefinition,
  getBoardIssuesToolDefinition,
  getSprintsFromBoardToolDefinition,
  getSprintIssuesToolDefinition,
  getSprintToolDefinition,
  getAgileTools
} from '../../../src/server/tools/agile-tools.js';

describe('Agile Tools Module', () => {
  describe('Individual Tool Definitions', () => {
    it('should export getAgileBoardsToolDefinition function', () => {
      expect(typeof getAgileBoardsToolDefinition).toBe('function');
    });

    it('should export getBoardIssuesToolDefinition function', () => {
      expect(typeof getBoardIssuesToolDefinition).toBe('function');
    });

    it('should export getSprintsFromBoardToolDefinition function', () => {
      expect(typeof getSprintsFromBoardToolDefinition).toBe('function');
    });

    it('should export getSprintIssuesToolDefinition function', () => {
      expect(typeof getSprintIssuesToolDefinition).toBe('function');
    });

    it('should export getSprintToolDefinition function', () => {
      expect(typeof getSprintToolDefinition).toBe('function');
    });

    it('should export getAgileTools function', () => {
      expect(typeof getAgileTools).toBe('function');
    });
  });

  describe('getAgileBoardsToolDefinition', () => {
    it('should return valid tool definition', () => {
      const tool = getAgileBoardsToolDefinition();
      
      expect(tool.name).toBe('getAgileBoards');
      expect(tool.description).toContain('agile boards');
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.properties).toBeDefined();
      expect((tool.inputSchema.properties as any).projectKey).toBeDefined();
      expect((tool.inputSchema.properties as any).projectKey.type).toBe('string');
    });
  });

  describe('getBoardIssuesToolDefinition', () => {
    it('should return valid tool definition', () => {
      const tool = getBoardIssuesToolDefinition();
      
      expect(tool.name).toBe('getBoardIssues');
      expect(tool.description).toContain('issues from a specific agile board');
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.properties).toBeDefined();
      expect((tool.inputSchema.properties as any).boardId).toBeDefined();
      expect((tool.inputSchema.properties as any).boardId.type).toBe('number');
      expect(tool.inputSchema.required).toEqual(['boardId']);
    });

    it('should have optional pagination and fields parameters', () => {
      const tool = getBoardIssuesToolDefinition();
      
      expect((tool.inputSchema.properties as any).startAt).toBeDefined();
      expect((tool.inputSchema.properties as any).startAt.type).toBe('number');
      expect((tool.inputSchema.properties as any).maxResults).toBeDefined();
      expect((tool.inputSchema.properties as any).maxResults.type).toBe('number');
      expect((tool.inputSchema.properties as any).fields).toBeDefined();
      expect((tool.inputSchema.properties as any).fields.type).toBe('array');
    });
  });

  describe('getSprintsFromBoardToolDefinition', () => {
    it('should return valid tool definition', () => {
      const tool = getSprintsFromBoardToolDefinition();
      
      expect(tool.name).toBe('getSprintsFromBoard');
      expect(tool.description).toContain('sprints from a specific agile board');
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.properties).toBeDefined();
      expect((tool.inputSchema.properties as any).boardId).toBeDefined();
      expect((tool.inputSchema.properties as any).boardId.type).toBe('number');
      expect(tool.inputSchema.required).toEqual(['boardId']);
    });
  });

  describe('getSprintIssuesToolDefinition', () => {
    it('should return valid tool definition', () => {
      const tool = getSprintIssuesToolDefinition();
      
      expect(tool.name).toBe('getSprintIssues');
      expect(tool.description).toContain('issues from a specific sprint');
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.properties).toBeDefined();
      expect((tool.inputSchema.properties as any).sprintId).toBeDefined();
      expect((tool.inputSchema.properties as any).sprintId.type).toBe('number');
      expect(tool.inputSchema.required).toEqual(['sprintId']);
    });

    it('should have optional pagination and fields parameters', () => {
      const tool = getSprintIssuesToolDefinition();
      
      expect((tool.inputSchema.properties as any).startAt).toBeDefined();
      expect((tool.inputSchema.properties as any).startAt.type).toBe('number');
      expect((tool.inputSchema.properties as any).maxResults).toBeDefined();
      expect((tool.inputSchema.properties as any).maxResults.type).toBe('number');
      expect((tool.inputSchema.properties as any).fields).toBeDefined();
      expect((tool.inputSchema.properties as any).fields.type).toBe('array');
    });
  });

  describe('getSprintToolDefinition', () => {
    it('should return valid tool definition', () => {
      const tool = getSprintToolDefinition();
      
      expect(tool.name).toBe('getSprint');
      expect(tool.description).toContain('detailed information for a specific sprint');
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.properties).toBeDefined();
      expect((tool.inputSchema.properties as any).sprintId).toBeDefined();
      expect((tool.inputSchema.properties as any).sprintId.type).toBe('number');
      expect(tool.inputSchema.required).toEqual(['sprintId']);
    });
  });

  describe('getAgileTools', () => {
    it('should return array of all agile tools', () => {
      const tools = getAgileTools();
      
      expect(Array.isArray(tools)).toBe(true);
      expect(tools).toHaveLength(5);
    });

    it('should return tools in correct order', () => {
      const tools = getAgileTools();
      const expectedNames = [
        'getAgileBoards',
        'getBoardIssues',
        'getSprintsFromBoard',
        'getSprintIssues',
        'getSprint'
      ];
      
      expect(tools.map(tool => tool.name)).toEqual(expectedNames);
    });

    it('should return tools with valid structure', () => {
      const tools = getAgileTools();
      
      tools.forEach(tool => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(typeof tool.name).toBe('string');
        expect(typeof tool.description).toBe('string');
        expect(typeof tool.inputSchema).toBe('object');
      });
    });
  });
});