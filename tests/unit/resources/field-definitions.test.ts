/**
 * Unit tests for FieldDefinitionProvider
 */

import { FieldDefinitionProvider } from '@/resources/field-definitions';
import type { JiraServerConfig } from '@/types';
import { createMockLogger } from '../../utils/test-helpers';

describe('FieldDefinitionProvider', () => {
  let provider: FieldDefinitionProvider;
  let mockConfig: JiraServerConfig;
  let mockLogger: any;

  beforeEach(() => {
    mockConfig = {
      url: 'https://test-jira.company.com',
      personalToken: 'test-token',
      sslVerify: true,
      timeout: 30000
    };
    
    mockLogger = createMockLogger();
    provider = new FieldDefinitionProvider(mockConfig, mockLogger);
  });

  describe('getIssueFields', () => {
    it('should return comprehensive issue field definitions', async () => {
      const result = await provider.getIssueFields();

      expect(result).toHaveProperty('fields');
      expect(result).toHaveProperty('nestedFields');
      expect(result).toHaveProperty('customFields');
      expect(result).toHaveProperty('metadata');

      // Check essential fields are present
      expect(result.fields).toHaveProperty('key');
      expect(result.fields).toHaveProperty('summary');
      expect(result.fields).toHaveProperty('status');
      expect(result.fields).toHaveProperty('assignee');
      expect(result.fields).toHaveProperty('reporter');

      // Check nested fields
      expect(result.nestedFields!['assignee.displayName']).toBeDefined();
      expect(result.nestedFields!['status.name']).toBeDefined();

      // Check custom fields
      expect(result.customFields).toHaveProperty('customfield_10008');
      expect(result.customFields).toHaveProperty('customfield_10009');

      // Check metadata
      expect(result.metadata.entityType).toBe('issue');
      expect(result.metadata.customFieldsIncluded).toBe(true);
      expect(result.metadata.totalFields).toBeGreaterThan(0);
    });

    it('should have valid field definitions structure', async () => {
      const result = await provider.getIssueFields();

      // Check field structure
      Object.entries(result.fields).forEach(([fieldName, fieldDef]) => {
        expect(fieldDef).toHaveProperty('type');
        expect(fieldDef).toHaveProperty('description');
        expect(typeof fieldDef.type).toBe('string');
        expect(typeof fieldDef.description).toBe('string');
      });

      // Check nested field structure  
      Object.entries(result.nestedFields || {}).forEach(([path, nestedDef]) => {
        expect(nestedDef).toHaveProperty('path');
        expect(nestedDef).toHaveProperty('parentField');
        expect(nestedDef).toHaveProperty('nestedField');
        expect(path).toContain('.');
        expect(nestedDef.path).toBe(path);
      });
    });
  });

  describe('getProjectFields', () => {
    it('should return project field definitions', async () => {
      const result = await provider.getProjectFields();

      expect(result).toHaveProperty('fields');
      expect(result).toHaveProperty('metadata');

      // Check essential project fields
      expect(result.fields).toHaveProperty('key');
      expect(result.fields).toHaveProperty('name');
      expect(result.fields).toHaveProperty('lead');
      expect(result.fields).toHaveProperty('projectTypeKey');

      // Check metadata
      expect(result.metadata.entityType).toBe('project');
      expect(result.metadata.customFieldsIncluded).toBe(false);
    });

    it('should include nested field for project lead', async () => {
      const result = await provider.getProjectFields();

      expect(result.nestedFields!['lead.displayName']).toBeDefined();
      expect(result.nestedFields!['lead.displayName'].parentField).toBe('lead');
      expect(result.nestedFields!['lead.displayName'].nestedField).toBe('displayName');
    });
  });

  describe('getUserFields', () => {
    it('should return user field definitions', async () => {
      const result = await provider.getUserFields();

      expect(result).toHaveProperty('fields');
      expect(result).toHaveProperty('metadata');

      // Check essential user fields
      expect(result.fields).toHaveProperty('displayName');
      expect(result.fields).toHaveProperty('emailAddress');
      expect(result.fields).toHaveProperty('active');
      expect(result.fields).toHaveProperty('timeZone');

      // Check metadata
      expect(result.metadata.entityType).toBe('user');
    });

    it('should have proper email format validation', async () => {
      const result = await provider.getUserFields();

      expect(result.fields.emailAddress.format).toBe('email');
    });
  });

  describe('getBoardFields', () => {
    it('should return board field definitions', async () => {
      const result = await provider.getBoardFields();

      expect(result.fields).toHaveProperty('id');
      expect(result.fields).toHaveProperty('name');
      expect(result.fields).toHaveProperty('type');
      expect(result.fields).toHaveProperty('location');

      expect(result.metadata.entityType).toBe('board');
    });

    it('should include board type enum values', async () => {
      const result = await provider.getBoardFields();

      expect(result.fields.type.enum).toContain('scrum');
      expect(result.fields.type.enum).toContain('kanban');
      expect(result.fields.type.enum).toContain('simple');
    });
  });

  describe('getSprintFields', () => {
    it('should return sprint field definitions', async () => {
      const result = await provider.getSprintFields();

      expect(result.fields).toHaveProperty('id');
      expect(result.fields).toHaveProperty('name');
      expect(result.fields).toHaveProperty('state');
      expect(result.fields).toHaveProperty('startDate');
      expect(result.fields).toHaveProperty('endDate');

      expect(result.metadata.entityType).toBe('sprint');
    });

    it('should include sprint state enum values', async () => {
      const result = await provider.getSprintFields();

      expect(result.fields.state.enum).toContain('future');
      expect(result.fields.state.enum).toContain('active');
      expect(result.fields.state.enum).toContain('closed');
    });
  });

  describe('getWorklogFields', () => {
    it('should return worklog field definitions', async () => {
      const result = await provider.getWorklogFields();

      expect(result.fields).toHaveProperty('id');
      expect(result.fields).toHaveProperty('author');
      expect(result.fields).toHaveProperty('timeSpent');
      expect(result.fields).toHaveProperty('timeSpentSeconds');
      expect(result.fields).toHaveProperty('comment');

      expect(result.metadata.entityType).toBe('worklog');
    });

    it('should include nested author fields', async () => {
      const result = await provider.getWorklogFields();

      expect(result.nestedFields!['author.displayName']).toBeDefined();
    });
  });

  describe('getCustomFields', () => {
    it('should return custom field definitions', async () => {
      const result = await provider.getCustomFields();

      expect(result).toHaveProperty('fields');
      expect(result).toHaveProperty('metadata');

      // Check specific custom fields
      expect(result.fields).toHaveProperty('customfield_10008');
      expect(result.fields).toHaveProperty('customfield_10009');
      expect(result.fields).toHaveProperty('customfield_10010');

      // Check custom field structure
      const epicLink = result.fields['customfield_10008'];
      expect(epicLink.fieldId).toBe('customfield_10008');
      expect(epicLink.fieldName).toBe('Epic Link');
      expect(epicLink.fieldType).toBe('com.pyxis.greenhopper.jira:gh-epic-link');
      expect(epicLink.isGlobal).toBe(true);
      expect(epicLink.isLocked).toBe(false);
    });

    it('should have proper metadata structure', async () => {
      const result = await provider.getCustomFields();

      expect(result.metadata).toHaveProperty('totalCustomFields');
      expect(result.metadata).toHaveProperty('lastScanned');
      expect(result.metadata).toHaveProperty('serverVersion');
      expect(result.metadata).toHaveProperty('includedProjects');
      expect(result.metadata).toHaveProperty('fieldTypes');

      expect(result.metadata.totalCustomFields).toBeGreaterThan(0);
      expect(Array.isArray(result.metadata.includedProjects)).toBe(true);
      expect(Array.isArray(result.metadata.fieldTypes)).toBe(true);
    });
  });

  describe('field definition consistency', () => {
    it('should have consistent metadata format across all field types', async () => {
      const issueFields = await provider.getIssueFields();
      const projectFields = await provider.getProjectFields();
      const userFields = await provider.getUserFields();

      // All should have metadata with required properties
      [issueFields, projectFields, userFields].forEach(fields => {
        expect(fields.metadata).toHaveProperty('entityType');
        expect(fields.metadata).toHaveProperty('version');
        expect(fields.metadata).toHaveProperty('lastUpdated');
        expect(fields.metadata).toHaveProperty('source');
        expect(fields.metadata).toHaveProperty('totalFields');
        
        expect(fields.metadata.version).toBe('1.0.0');
        expect(fields.metadata.source).toBe('configuration');
      });
    });

    it('should generate valid ISO date strings', async () => {
      const result = await provider.getIssueFields();
      
      const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      expect(result.metadata.lastUpdated).toMatch(isoDateRegex);
    });
  });
});