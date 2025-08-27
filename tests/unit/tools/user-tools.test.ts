/**
 * User Tools Module Tests
 *
 * Verifies the User tools module provides correctly structured
 * MCP tool definitions for User-related operations.
 */

import {
  getCurrentUserToolDefinition,
  getUserProfileToolDefinition,
  getUserTools,
} from '../../../src/server/tools/user-tools.js';

describe('User Tools Module', () => {
  describe('getCurrentUserToolDefinition', () => {
    it('should return a valid MCP tool definition', () => {
      const tool = getCurrentUserToolDefinition();

      expect(tool).toHaveProperty('name', 'getCurrentUser');
      expect(tool).toHaveProperty(
        'description',
        'Get information about the currently authenticated user for authentication verification. Enhanced field access available via jira://user/fields resource.'
      );
      expect(tool).toHaveProperty('inputSchema');
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.additionalProperties).toBe(false);
      expect(tool.inputSchema.properties).toHaveProperty('fields');
    });
  });

  describe('getUserProfileToolDefinition', () => {
    it('should return a valid MCP tool definition', () => {
      const tool = getUserProfileToolDefinition();

      expect(tool).toHaveProperty('name', 'getUserProfile');
      expect(tool).toHaveProperty(
        'description',
        'Get detailed profile information for a specific Jira user by username or email address. Enhanced field access available via jira://user/fields resource.'
      );
      expect(tool).toHaveProperty('inputSchema');
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.required).toEqual(['username']);
      expect(tool.inputSchema.properties).toHaveProperty('username');
      expect(tool.inputSchema.properties).toHaveProperty('fields');
      expect(tool.inputSchema.properties.username).toEqual({
        type: 'string',
        description:
          'The username or email address of the user (e.g., JIRAUSER23511, user@domain.com)',
      });
    });
  });

  describe('getUserTools', () => {
    it('should return all User tool definitions', () => {
      const tools = getUserTools();

      expect(tools).toHaveLength(2);
      expect(tools[0]).toEqual(getCurrentUserToolDefinition());
      expect(tools[1]).toEqual(getUserProfileToolDefinition());
    });

    it('should return tools with correct names in order', () => {
      const tools = getUserTools();
      const toolNames = tools.map(tool => tool.name);

      expect(toolNames).toEqual(['getCurrentUser', 'getUserProfile']);
    });
  });
});
