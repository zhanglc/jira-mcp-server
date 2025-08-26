import { ISSUE_FIELD_DEFINITIONS } from '@/server/resources/static-definitions/issue-fields';
import type { ResourceDefinition } from '@/types/field-definition';

describe('Static Issue Field Definitions', () => {
  describe('ISSUE_FIELD_DEFINITIONS', () => {
    it('should be a valid ResourceDefinition', () => {
      expect(ISSUE_FIELD_DEFINITIONS).toBeDefined();
      expect(ISSUE_FIELD_DEFINITIONS.uri).toBe('jira://issue/fields');
      expect(ISSUE_FIELD_DEFINITIONS.entityType).toBe('issue');
      expect(ISSUE_FIELD_DEFINITIONS.version).toBe('1.0.0');
      expect(typeof ISSUE_FIELD_DEFINITIONS.lastUpdated).toBe('string');
      expect(ISSUE_FIELD_DEFINITIONS.totalFields).toBeGreaterThan(0);
      expect(ISSUE_FIELD_DEFINITIONS.fields).toBeDefined();
      expect(ISSUE_FIELD_DEFINITIONS.pathIndex).toBeDefined();
    });

    it('should contain status field with nested access paths', () => {
      const statusField = ISSUE_FIELD_DEFINITIONS.fields.status;

      expect(statusField).toBeDefined();
      expect(statusField.id).toBe('status');
      expect(statusField.name).toBe('Status');
      expect(statusField.type).toBe('object');
      expect(statusField.accessPaths).toBeDefined();

      // Check for specific nested paths
      const paths = statusField.accessPaths.map(ap => ap.path);
      expect(paths).toContain('status.name');
      expect(paths).toContain('status.statusCategory.key');
      expect(paths).toContain('status.statusCategory.name');
      expect(paths).toContain('status.statusCategory.id');
      expect(paths).toContain('status.statusCategory.colorName');
      expect(paths).toContain('status.id');
      expect(paths).toContain('status.description');
      expect(paths).toContain('status.iconUrl');
      expect(paths).toContain('status.self');

      // Verify minimum expected paths for status (should have 11 paths)
      expect(statusField.accessPaths.length).toBeGreaterThanOrEqual(9);
    });

    it('should contain assignee field with user properties', () => {
      const assigneeField = ISSUE_FIELD_DEFINITIONS.fields.assignee;

      expect(assigneeField).toBeDefined();
      expect(assigneeField.id).toBe('assignee');
      expect(assigneeField.name).toBe('Assignee');
      expect(assigneeField.type).toBe('object');

      const paths = assigneeField.accessPaths.map(ap => ap.path);
      expect(paths).toContain('assignee.displayName');
      expect(paths).toContain('assignee.emailAddress');
      expect(paths).toContain('assignee.active');
      expect(paths).toContain('assignee.name');
      expect(paths).toContain('assignee.key');
      expect(paths).toContain('assignee.self');
      expect(paths).toContain('assignee.accountId');
      expect(paths).toContain('assignee.avatarUrls.48x48');
      expect(paths).toContain('assignee.avatarUrls.24x24');
      expect(paths).toContain('assignee.avatarUrls.16x16');
      expect(paths).toContain('assignee.avatarUrls.32x32');
      expect(paths).toContain('assignee.timeZone');

      // Verify minimum expected paths for assignee (should have 12 paths)
      expect(assigneeField.accessPaths.length).toBeGreaterThanOrEqual(12);
    });

    it('should contain project field with project properties', () => {
      const projectField = ISSUE_FIELD_DEFINITIONS.fields.project;

      expect(projectField).toBeDefined();
      expect(projectField.id).toBe('project');
      expect(projectField.name).toBe('Project');
      expect(projectField.type).toBe('object');

      const paths = projectField.accessPaths.map(ap => ap.path);
      expect(paths).toContain('project.name');
      expect(paths).toContain('project.key');
      expect(paths).toContain('project.id');
      expect(paths).toContain('project.self');
      expect(paths).toContain('project.description');
      expect(paths).toContain('project.lead.displayName');
      expect(paths).toContain('project.lead.emailAddress');
      expect(paths).toContain('project.projectCategory.name');
      expect(paths).toContain('project.projectCategory.id');
      expect(paths).toContain('project.projectCategory.description');
      expect(paths).toContain('project.projectCategory.self');
      expect(paths).toContain('project.projectTypeKey');
      expect(paths).toContain('project.simplified');
      expect(paths).toContain('project.style');
      expect(paths).toContain('project.url');

      // Verify minimum expected paths for project (should have 15 paths)
      expect(projectField.accessPaths.length).toBeGreaterThanOrEqual(15);
    });

    it('should contain priority field with priority properties', () => {
      const priorityField = ISSUE_FIELD_DEFINITIONS.fields.priority;

      expect(priorityField).toBeDefined();
      expect(priorityField.id).toBe('priority');
      expect(priorityField.name).toBe('Priority');
      expect(priorityField.type).toBe('object');

      const paths = priorityField.accessPaths.map(ap => ap.path);
      expect(paths).toContain('priority.name');
      expect(paths).toContain('priority.id');
      expect(paths).toContain('priority.description');
      expect(paths).toContain('priority.iconUrl');

      // Verify minimum expected paths for priority (should have 4 paths)
      expect(priorityField.accessPaths.length).toBeGreaterThanOrEqual(4);
    });

    it('should contain issuetype field with issue type properties', () => {
      const issueTypeField = ISSUE_FIELD_DEFINITIONS.fields.issuetype;

      expect(issueTypeField).toBeDefined();
      expect(issueTypeField.id).toBe('issuetype');
      expect(issueTypeField.name).toBe('Issue Type');
      expect(issueTypeField.type).toBe('object');

      const paths = issueTypeField.accessPaths.map(ap => ap.path);
      expect(paths).toContain('issuetype.name');
      expect(paths).toContain('issuetype.id');
      expect(paths).toContain('issuetype.description');
      expect(paths).toContain('issuetype.iconUrl');
      expect(paths).toContain('issuetype.subtask');
      expect(paths).toContain('issuetype.avatarId');

      // Verify minimum expected paths for issuetype
      expect(issueTypeField.accessPaths.length).toBeGreaterThanOrEqual(6);
    });

    it('should contain reporter field with user properties', () => {
      const reporterField = ISSUE_FIELD_DEFINITIONS.fields.reporter;

      expect(reporterField).toBeDefined();
      expect(reporterField.id).toBe('reporter');
      expect(reporterField.name).toBe('Reporter');
      expect(reporterField.type).toBe('object');

      const paths = reporterField.accessPaths.map(ap => ap.path);
      expect(paths).toContain('reporter.displayName');
      expect(paths).toContain('reporter.emailAddress');
      expect(paths).toContain('reporter.active');
      expect(paths).toContain('reporter.name');
      expect(paths).toContain('reporter.key');

      // Should have similar structure to assignee
      expect(reporterField.accessPaths.length).toBeGreaterThanOrEqual(8);
    });

    it('should contain created and updated fields as date strings', () => {
      const createdField = ISSUE_FIELD_DEFINITIONS.fields.created;
      const updatedField = ISSUE_FIELD_DEFINITIONS.fields.updated;

      expect(createdField).toBeDefined();
      expect(createdField.id).toBe('created');
      expect(createdField.type).toBe('string');

      expect(updatedField).toBeDefined();
      expect(updatedField.id).toBe('updated');
      expect(updatedField.type).toBe('string');
    });

    it('should contain summary and description as string fields', () => {
      const summaryField = ISSUE_FIELD_DEFINITIONS.fields.summary;
      const descriptionField = ISSUE_FIELD_DEFINITIONS.fields.description;

      expect(summaryField).toBeDefined();
      expect(summaryField.id).toBe('summary');
      expect(summaryField.type).toBe('string');

      expect(descriptionField).toBeDefined();
      expect(descriptionField.id).toBe('description');
      expect(descriptionField.type).toBe('string');
    });

    it('should have a pathIndex that maps all access paths to their field IDs', () => {
      const { pathIndex, fields } = ISSUE_FIELD_DEFINITIONS;

      // Collect all access paths from all fields
      const allPaths: string[] = [];
      Object.values(fields).forEach(field => {
        field.accessPaths.forEach(ap => {
          allPaths.push(ap.path);
        });
      });

      // Verify that pathIndex contains all access paths
      allPaths.forEach(path => {
        expect(pathIndex[path]).toBeDefined();
        expect(typeof pathIndex[path]).toBe('string');
      });

      // Verify that all paths in pathIndex point to existing fields
      Object.entries(pathIndex).forEach(([path, fieldId]) => {
        expect(fields).toHaveProperty(fieldId);

        // Verify the field actually contains this path
        const field = fields[fieldId];
        const fieldPaths = field.accessPaths.map(ap => ap.path);
        expect(fieldPaths).toContain(path);
      });
    });

    it('should have correct totalFields count matching the number of fields', () => {
      const fieldCount = Object.keys(ISSUE_FIELD_DEFINITIONS.fields).length;
      expect(ISSUE_FIELD_DEFINITIONS.totalFields).toBe(fieldCount);
    });

    it('should have all fields with proper examples and commonUsage', () => {
      Object.values(ISSUE_FIELD_DEFINITIONS.fields).forEach(field => {
        expect(field.examples).toBeDefined();
        expect(Array.isArray(field.examples)).toBe(true);
        expect(field.examples.length).toBeGreaterThan(0);

        expect(field.commonUsage).toBeDefined();
        expect(Array.isArray(field.commonUsage)).toBe(true);
        expect(field.commonUsage.length).toBeGreaterThan(0);

        // Verify examples are valid access paths
        field.examples.forEach(example => {
          const validPaths = field.accessPaths.map(ap => ap.path);
          expect(validPaths).toContain(example);
        });
      });
    });

    it('should have all access paths with proper frequency values', () => {
      Object.values(ISSUE_FIELD_DEFINITIONS.fields).forEach(field => {
        field.accessPaths.forEach(accessPath => {
          expect(['high', 'medium', 'low']).toContain(accessPath.frequency);
          expect(accessPath.path).toBeDefined();
          expect(accessPath.description).toBeDefined();
          expect(accessPath.type).toBeDefined();
        });
      });
    });
  });
});
