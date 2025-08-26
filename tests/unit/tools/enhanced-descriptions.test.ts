/**
 * Enhanced Tool Descriptions Tests
 *
 * Tests that verify tool descriptions contain proper field selection guidance
 * with resource references and comprehensive examples for AI assistants.
 */

import { describe, it, expect } from '@jest/globals';
import {
  getIssueToolDefinition,
  searchIssuesToolDefinition,
} from '../../../src/server/tools/issue-tools.js';
import {
  getProjectToolDefinition,
  getProjectIssuesToolDefinition,
} from '../../../src/server/tools/project-tools.js';
import {
  getBoardIssuesToolDefinition,
  getSprintIssuesToolDefinition,
} from '../../../src/server/tools/agile-tools.js';
import { ISSUE_FIELD_DEFINITIONS } from '../../../src/server/resources/static-definitions/issue-fields.js';

describe('Enhanced Tool Descriptions', () => {
  describe('Issue Tools Field Guidance', () => {
    it('getIssue should have enhanced field description with resource references', () => {
      const tool = getIssueToolDefinition();
      const fieldsProperty = tool.inputSchema.properties?.fields;

      expect(fieldsProperty).toBeDefined();
      expect(fieldsProperty.description).toContain('jira://issue/fields');
      expect(fieldsProperty.description).toContain('Enhanced capabilities');
      expect(fieldsProperty.description).toContain(
        'System fields: Full nested structure support'
      );
      expect(fieldsProperty.description).toContain(
        'Custom fields: Pattern matching with validation'
      );
      expect(fieldsProperty.description).toContain(
        'Smart validation: Real-time field validation'
      );
      expect(fieldsProperty.description).toContain(
        'Example field combinations'
      );
    });

    it('getIssue field examples should be valid against static definitions', () => {
      const tool = getIssueToolDefinition();
      const fieldsProperty = tool.inputSchema.properties?.fields;

      // Extract example fields from description
      const description = fieldsProperty.description || '';
      const basicExampleMatch = description.match(/Basic: \[([^\]]+)\]/);
      const mixedExampleMatch = description.match(/Mixed: \[([^\]]+)\]/);

      expect(basicExampleMatch).toBeTruthy();
      expect(mixedExampleMatch).toBeTruthy();

      if (basicExampleMatch) {
        const basicFields = basicExampleMatch[1]
          .split(',')
          .map(f => f.trim().replace(/"/g, ''));

        // Verify basic fields exist in static definitions
        basicFields.forEach(field => {
          const isValidPath = Object.values(
            ISSUE_FIELD_DEFINITIONS.fields
          ).some(fieldDef =>
            fieldDef.accessPaths.some(ap => ap.path === field)
          );
          expect(isValidPath).toBe(true);
        });
      }
    });

    it('searchIssues should have enhanced field description', () => {
      const tool = searchIssuesToolDefinition();
      const fieldsProperty = tool.inputSchema.properties?.fields;

      expect(fieldsProperty).toBeDefined();
      expect(fieldsProperty.description).toContain('jira://issue/fields');
      expect(fieldsProperty.description).toContain('Enhanced capabilities');
      expect(fieldsProperty.description).toContain(
        'Example field combinations'
      );
    });

    it('getProjectIssues should have enhanced field description', () => {
      const tool = getProjectIssuesToolDefinition();
      const fieldsProperty = tool.inputSchema.properties?.fields;

      expect(fieldsProperty).toBeDefined();
      expect(fieldsProperty.description).toContain('jira://issue/fields');
      expect(fieldsProperty.description).toContain('Enhanced capabilities');
    });
  });

  describe('Project Tools Field Guidance', () => {
    it('getProject should reference project fields resource', () => {
      const tool = getProjectToolDefinition();

      expect(tool.description).toContain('jira://project/fields');
      expect(tool.description).toContain('Enhanced field access');
    });
  });

  describe('Agile Tools Field Guidance', () => {
    it('getBoardIssues should have enhanced field description', () => {
      const tool = getBoardIssuesToolDefinition();
      const fieldsProperty = tool.inputSchema.properties?.fields;

      expect(fieldsProperty).toBeDefined();
      expect(fieldsProperty.description).toContain('jira://issue/fields');
      expect(fieldsProperty.description).toContain('Enhanced capabilities');
    });

    it('getSprintIssues should have enhanced field description', () => {
      const tool = getSprintIssuesToolDefinition();
      const fieldsProperty = tool.inputSchema.properties?.fields;

      expect(fieldsProperty).toBeDefined();
      expect(fieldsProperty.description).toContain('jira://issue/fields');
      expect(fieldsProperty.description).toContain('Enhanced capabilities');
    });
  });

  describe('Field Description Structure', () => {
    it('enhanced descriptions should follow consistent format', () => {
      const tool = getIssueToolDefinition();
      const description =
        tool.inputSchema.properties?.fields?.description || '';

      // Check for required sections
      expect(description).toMatch(/📋 Complete field reference:/);
      expect(description).toMatch(/🔥 Enhanced capabilities:/);
      expect(description).toMatch(/🎯 Example field combinations:/);
      expect(description).toMatch(/Note: Invalid fields are filtered/);
    });

    it('examples should include nested field access patterns', () => {
      const tool = getIssueToolDefinition();
      const description =
        tool.inputSchema.properties?.fields?.description || '';

      // Should include dot notation examples
      expect(description).toContain('status.statusCategory.key');
      expect(description).toContain('assignee.displayName');
      expect(description).toContain('project.');
    });

    it('examples should include custom field patterns', () => {
      const tool = getIssueToolDefinition();
      const description =
        tool.inputSchema.properties?.fields?.description || '';

      // Should include custom field examples
      expect(description).toContain('customfield_');
      expect(description).toContain('.value');
    });

    it('descriptions should be AI-assistant friendly', () => {
      const tool = getIssueToolDefinition();
      const description =
        tool.inputSchema.properties?.fields?.description || '';

      // Should have clear structure and guidance
      expect(description.length).toBeGreaterThan(300); // Comprehensive
      expect(description).toContain('•'); // Bullet points for clarity
      expect(description).toContain('suggestions provided'); // Help for invalid fields
    });
  });

  describe('Static Field Validation', () => {
    it('all example fields in descriptions should exist in static definitions', () => {
      const expectedFields = [
        'summary',
        'status.name',
        'status.statusCategory.key',
        'assignee.displayName',
        'project.name',
        'project.key',
        'issuetype.name',
        'priority.name',
        'reporter.displayName',
        'created',
        'updated',
      ];

      expectedFields.forEach(field => {
        const isValidPath = Object.values(ISSUE_FIELD_DEFINITIONS.fields).some(
          fieldDef => fieldDef.accessPaths.some(ap => ap.path === field)
        );
        expect(isValidPath).toBe(true);
      });
    });
  });
});
