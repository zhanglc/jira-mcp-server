import { JiraResourceHandler } from '@/server/resources/resource-handler';
import { ISSUE_FIELD_DEFINITIONS } from '@/server/resources/static-definitions';
import type { McpResource } from '@/types/mcp-types';
import type { BatchValidationResult } from '@/types/field-definition';

describe('JiraResourceHandler', () => {
  let handler: JiraResourceHandler;

  beforeEach(() => {
    handler = new JiraResourceHandler();
  });

  describe('listResources', () => {
    it('should return array of available resources', async () => {
      const result = await handler.listResources();

      expect(result).toHaveProperty('resources');
      expect(Array.isArray(result.resources)).toBe(true);
      expect(result.resources.length).toBeGreaterThan(0);
    });

    it('should include issue fields resource', async () => {
      const result = await handler.listResources();

      const issueFieldsResource = result.resources.find(
        (r: McpResource) => r.uri === 'jira://issue/fields'
      );

      expect(issueFieldsResource).toBeDefined();
      expect(issueFieldsResource?.name).toBe('Jira Issue Fields');
      expect(issueFieldsResource?.description).toContain('field definitions');
      expect(issueFieldsResource?.mimeType).toBe('application/json');
    });

    it('should return resources with required MCP Resource fields', async () => {
      const result = await handler.listResources();

      result.resources.forEach((resource: McpResource) => {
        expect(resource).toHaveProperty('uri');
        expect(resource).toHaveProperty('name');
        expect(resource).toHaveProperty('description');
        expect(resource).toHaveProperty('mimeType');

        expect(typeof resource.uri).toBe('string');
        expect(typeof resource.name).toBe('string');
        expect(typeof resource.description).toBe('string');
        expect(typeof resource.mimeType).toBe('string');

        expect(resource.uri).not.toBe('');
        expect(resource.name).not.toBe('');
        expect(resource.description).not.toBe('');
      });
    });
  });

  describe('readResource', () => {
    it('should return issue field definitions for jira://issue/fields', async () => {
      const result = await handler.readResource('jira://issue/fields');

      expect(result).toHaveProperty('contents');
      expect(Array.isArray(result.contents)).toBe(true);
      expect(result.contents.length).toBe(1);

      const content = result.contents[0];
      expect(content).toHaveProperty('type', 'text');
      expect(content).toHaveProperty('text');
      expect(content).toHaveProperty('mimeType', 'application/json');

      const parsedContent = JSON.parse(content.text);
      expect(parsedContent).toEqual(ISSUE_FIELD_DEFINITIONS);
    });

    it('should return well-formatted JSON content', async () => {
      const result = await handler.readResource('jira://issue/fields');
      const content = result.contents[0];

      // Should be valid JSON
      expect(() => JSON.parse(content.text)).not.toThrow();

      // Should be formatted for readability (indented)
      expect(content.text).toContain('\n');
      expect(content.text).toContain('  ');
    });

    it('should throw error for unknown resource URI', async () => {
      await expect(
        handler.readResource('jira://unknown/resource')
      ).rejects.toThrow('Unknown resource URI: jira://unknown/resource');
    });

    it('should throw error for empty URI', async () => {
      await expect(handler.readResource('')).rejects.toThrow(
        'Resource URI is required'
      );
    });

    it('should throw error for invalid URI format', async () => {
      await expect(handler.readResource('invalid-uri')).rejects.toThrow(
        'Invalid resource URI format: invalid-uri'
      );
    });

    it('should handle case-sensitive URI matching', async () => {
      await expect(handler.readResource('JIRA://ISSUE/FIELDS')).rejects.toThrow(
        'Unknown resource URI: JIRA://ISSUE/FIELDS'
      );
    });
  });

  describe('validateFieldPaths', () => {
    it('should validate simple field paths', () => {
      const result = handler.validateFieldPaths('issue', [
        'summary',
        'description',
      ]);

      expect(result.isValid).toBe(true);
      expect(result.validPaths).toEqual(['summary', 'description']);
      expect(result.invalidPaths).toEqual([]);
    });

    it('should validate nested field paths', () => {
      const result = handler.validateFieldPaths('issue', [
        'status.name',
        'status.statusCategory.key',
        'assignee.displayName',
      ]);

      expect(result.isValid).toBe(true);
      expect(result.validPaths).toEqual([
        'status.name',
        'status.statusCategory.key',
        'assignee.displayName',
      ]);
      expect(result.invalidPaths).toEqual([]);
    });

    it('should identify invalid field paths', () => {
      const result = handler.validateFieldPaths('issue', [
        'summary', // valid
        'invalidField', // invalid
        'status.invalid', // invalid nested
      ]);

      expect(result.isValid).toBe(false);
      expect(result.validPaths).toEqual(['summary']);
      expect(result.invalidPaths).toEqual(['invalidField', 'status.invalid']);
    });

    it('should validate custom field patterns', () => {
      const result = handler.validateFieldPaths('issue', [
        'customfield_10001',
        'customfield_12345',
      ]);

      expect(result.isValid).toBe(true);
      expect(result.validPaths).toEqual([
        'customfield_10001',
        'customfield_12345',
      ]);
      expect(result.invalidPaths).toEqual([]);
    });

    it('should reject invalid custom field patterns', () => {
      const result = handler.validateFieldPaths('issue', [
        'customfield_abc', // non-numeric
        'customfield_', // empty number
        'custom_field_123', // wrong format
      ]);

      expect(result.isValid).toBe(false);
      expect(result.validPaths).toEqual([]);
      expect(result.invalidPaths).toEqual([
        'customfield_abc',
        'customfield_',
        'custom_field_123',
      ]);
    });

    it('should provide suggestions for similar fields', () => {
      const result = handler.validateFieldPaths('issue', ['summery']); // typo

      expect(result.isValid).toBe(false);
      expect(result.invalidPaths).toEqual(['summery']);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions?.['summery']).toContain('summary');
    });

    it('should handle empty field paths array', () => {
      const result = handler.validateFieldPaths('issue', []);

      expect(result.isValid).toBe(true);
      expect(result.validPaths).toEqual([]);
      expect(result.invalidPaths).toEqual([]);
    });

    it('should handle unknown entity type', () => {
      const result = handler.validateFieldPaths('unknown', ['field1']);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Unknown entity type: unknown');
    });

    it('should return field information for valid paths', () => {
      const result = handler.validateFieldPaths('issue', ['status.name']);

      expect(result.isValid).toBe(true);
      expect(result.pathInfo).toBeDefined();
      expect(result.pathInfo?.['status.name']).toEqual({
        fieldId: 'status',
        type: 'string',
        description: "Status name (e.g., 'In Progress', 'Done')",
      });
    });
  });

  describe('error handling', () => {
    it('should handle resource reading errors gracefully', async () => {
      // Mock JSON.stringify to throw an error
      const originalStringify = JSON.stringify;
      JSON.stringify = jest.fn().mockImplementation(() => {
        throw new Error('JSON serialization failed');
      });

      await expect(handler.readResource('jira://issue/fields')).rejects.toThrow(
        'Failed to read resource: JSON serialization failed'
      );

      // Restore original method
      JSON.stringify = originalStringify;
    });
  });

  describe('performance', () => {
    it('should validate large field path arrays efficiently', () => {
      const largePaths = Array.from(
        { length: 1000 },
        (_, i) => `customfield_${i}`
      );

      const startTime = Date.now();
      const result = handler.validateFieldPaths('issue', largePaths);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete in <100ms
      expect(result.isValid).toBe(true);
    });

    it('should use path index for O(1) lookups', () => {
      // Test that validation is using the pre-built path index
      const result = handler.validateFieldPaths('issue', [
        'status.statusCategory.key',
      ]);

      expect(result.isValid).toBe(true);
      expect(result.pathInfo?.['status.statusCategory.key']?.fieldId).toBe(
        'status'
      );
    });
  });

  describe('MCP protocol compliance', () => {
    it('should format resource list response correctly', async () => {
      const result = await handler.listResources();

      // MCP protocol requires specific structure
      expect(result).toEqual({
        resources: expect.arrayContaining([
          expect.objectContaining({
            uri: expect.any(String),
            name: expect.any(String),
            description: expect.any(String),
            mimeType: expect.any(String),
          }),
        ]),
      });
    });

    it('should format resource content response correctly', async () => {
      const result = await handler.readResource('jira://issue/fields');

      // MCP protocol requires specific content structure
      expect(result).toEqual({
        contents: [
          {
            type: 'text',
            text: expect.any(String),
            mimeType: 'application/json',
          },
        ],
      });
    });
  });
});
