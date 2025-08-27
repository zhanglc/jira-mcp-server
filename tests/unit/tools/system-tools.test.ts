/**
 * System Tools Module Tests
 *
 * Verifies the system tools module exports correct tool definitions
 * with proper schemas and functionality.
 */

import {
  searchFieldsToolDefinition,
  getSystemInfoToolDefinition,
  getServerInfoToolDefinition,
  getSystemTools,
} from '../../../src/server/tools/system-tools.js';

describe('System Tools Module', () => {
  describe('searchFieldsToolDefinition', () => {
    it('should return correct tool definition', () => {
      const tool = searchFieldsToolDefinition();

      expect(tool.name).toBe('searchFields');
      expect(tool.description).toContain('Search for Jira fields');
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.properties).toHaveProperty('query');
      expect(tool.inputSchema.properties.query.type).toBe('string');
    });

    it('should have optional query parameter', () => {
      const tool = searchFieldsToolDefinition();

      expect((tool.inputSchema as any).required).toBeUndefined();
      expect(tool.inputSchema.properties.query.description).toContain(
        'Optional'
      );
    });
  });

  describe('getSystemInfoToolDefinition', () => {
    it('should return correct tool definition', () => {
      const tool = getSystemInfoToolDefinition();

      expect(tool.name).toBe('getSystemInfo');
      expect(tool.description).toContain('Get system information');
      expect(tool.description).toContain('Enhanced field access available via jira://system/fields resource');
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.properties).toHaveProperty('fields');
      expect((tool.inputSchema.properties as any).fields.type).toBe('array');
      expect(tool.inputSchema.additionalProperties).toBe(false);
    });

    it('should have optional fields parameter', () => {
      const tool = getSystemInfoToolDefinition();

      expect((tool.inputSchema as any).required).toBeUndefined();
      expect(Object.keys(tool.inputSchema.properties)).toHaveLength(1);
      expect(Object.keys(tool.inputSchema.properties)).toContain('fields');
    });
  });

  describe('getServerInfoToolDefinition', () => {
    it('should return correct tool definition', () => {
      const tool = getServerInfoToolDefinition();

      expect(tool.name).toBe('getServerInfo');
      expect(tool.description).toContain('Get server-specific information');
      expect(tool.description).toContain('Enhanced field access available via jira://system/fields resource');
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.properties).toHaveProperty('fields');
      expect((tool.inputSchema.properties as any).fields.type).toBe('array');
      expect(tool.inputSchema.additionalProperties).toBe(false);
    });

    it('should have optional fields parameter', () => {
      const tool = getServerInfoToolDefinition();

      expect((tool.inputSchema as any).required).toBeUndefined();
      expect(Object.keys(tool.inputSchema.properties)).toHaveLength(1);
      expect(Object.keys(tool.inputSchema.properties)).toContain('fields');
    });
  });

  describe('getSystemTools', () => {
    it('should return array of all system tools', () => {
      const tools = getSystemTools();

      expect(Array.isArray(tools)).toBe(true);
      expect(tools).toHaveLength(3);
    });

    it('should return tools in correct order', () => {
      const tools = getSystemTools();
      const toolNames = tools.map(tool => tool.name);

      expect(toolNames).toEqual([
        'searchFields',
        'getSystemInfo',
        'getServerInfo',
      ]);
    });

    it('should return tools with valid schemas', () => {
      const tools = getSystemTools();

      tools.forEach(tool => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(tool.inputSchema).toHaveProperty('type');
        expect(tool.inputSchema.type).toBe('object');
      });
    });
  });
});
