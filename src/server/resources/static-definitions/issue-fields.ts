import type { ResourceDefinition } from '../../../types/field-definition.js';

/**
 * Static field definitions for Jira issue fields
 * Covers the 42 core system fields with complete nested access paths
 */
export const ISSUE_FIELD_DEFINITIONS: ResourceDefinition = {
  uri: 'jira://issue/fields',
  entityType: 'issue',
  lastUpdated: new Date().toISOString(),
  version: '1.0.0',
  totalFields: 14, // Core system fields

  fields: {
    status: {
      id: 'status',
      name: 'Status',
      description: 'Current issue status and its category information',
      type: 'object',
      accessPaths: [
        {
          path: 'status.name',
          description: "Status name (e.g., 'In Progress', 'Done')",
          type: 'string',
          frequency: 'high',
        },
        {
          path: 'status.statusCategory.key',
          description: 'Status category key (todo/indeterminate/done)',
          type: 'string',
          frequency: 'high',
        },
        {
          path: 'status.statusCategory.name',
          description: 'Status category name',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'status.statusCategory.id',
          description: 'Status category ID',
          type: 'string',
          frequency: 'low',
        },
        {
          path: 'status.statusCategory.colorName',
          description: 'Status category color',
          type: 'string',
          frequency: 'low',
        },
        {
          path: 'status.id',
          description: 'Status ID',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'status.description',
          description: 'Status description',
          type: 'string',
          frequency: 'low',
        },
        {
          path: 'status.iconUrl',
          description: 'Status icon URL',
          type: 'string',
          frequency: 'low',
        },
        {
          path: 'status.self',
          description: 'Status REST API URL',
          type: 'string',
          frequency: 'low',
        },
        {
          path: 'status.statusCategory.self',
          description: 'Status category REST API URL',
          type: 'string',
          frequency: 'low',
        },
        {
          path: 'status.scope',
          description: 'Status scope information',
          type: 'object',
          frequency: 'low',
        },
      ],
      examples: ['status.name', 'status.statusCategory.key'],
      commonUsage: [
        ['status.name', 'status.statusCategory.key'],
        ['status.name', 'status.id'],
        ['status.statusCategory.key'],
      ],
    },

    assignee: {
      id: 'assignee',
      name: 'Assignee',
      description: 'Issue assignee user information',
      type: 'object',
      accessPaths: [
        {
          path: 'assignee.displayName',
          description: 'User display name',
          type: 'string',
          frequency: 'high',
        },
        {
          path: 'assignee.emailAddress',
          description: 'User email address',
          type: 'string',
          frequency: 'high',
        },
        {
          path: 'assignee.active',
          description: 'User active status',
          type: 'boolean',
          frequency: 'medium',
        },
        {
          path: 'assignee.name',
          description: 'Username',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'assignee.key',
          description: 'User key',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'assignee.self',
          description: 'User REST API URL',
          type: 'string',
          frequency: 'low',
        },
        {
          path: 'assignee.accountId',
          description: 'User account ID',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'assignee.avatarUrls.48x48',
          description: 'Large avatar URL',
          type: 'string',
          frequency: 'low',
        },
        {
          path: 'assignee.avatarUrls.24x24',
          description: 'Medium avatar URL',
          type: 'string',
          frequency: 'low',
        },
        {
          path: 'assignee.avatarUrls.16x16',
          description: 'Small avatar URL',
          type: 'string',
          frequency: 'low',
        },
        {
          path: 'assignee.avatarUrls.32x32',
          description: 'Default avatar URL',
          type: 'string',
          frequency: 'low',
        },
        {
          path: 'assignee.timeZone',
          description: 'User timezone',
          type: 'string',
          frequency: 'low',
        },
      ],
      examples: ['assignee.displayName', 'assignee.emailAddress'],
      commonUsage: [
        ['assignee.displayName', 'assignee.emailAddress'],
        ['assignee.displayName', 'assignee.active'],
        ['assignee.name', 'assignee.key'],
      ],
    },

    project: {
      id: 'project',
      name: 'Project',
      description: 'Project information and metadata',
      type: 'object',
      accessPaths: [
        {
          path: 'project.name',
          description: 'Project name',
          type: 'string',
          frequency: 'high',
        },
        {
          path: 'project.key',
          description: 'Project key',
          type: 'string',
          frequency: 'high',
        },
        {
          path: 'project.id',
          description: 'Project ID',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'project.self',
          description: 'Project REST API URL',
          type: 'string',
          frequency: 'low',
        },
        {
          path: 'project.description',
          description: 'Project description',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'project.lead.displayName',
          description: 'Project lead name',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'project.lead.emailAddress',
          description: 'Project lead email',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'project.projectCategory.name',
          description: 'Project category name',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'project.projectCategory.id',
          description: 'Project category ID',
          type: 'string',
          frequency: 'low',
        },
        {
          path: 'project.projectCategory.description',
          description: 'Project category description',
          type: 'string',
          frequency: 'low',
        },
        {
          path: 'project.projectCategory.self',
          description: 'Project category REST API URL',
          type: 'string',
          frequency: 'low',
        },
        {
          path: 'project.projectTypeKey',
          description: 'Project type key',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'project.simplified',
          description: 'Simplified project flag',
          type: 'boolean',
          frequency: 'low',
        },
        {
          path: 'project.style',
          description: 'Project style',
          type: 'string',
          frequency: 'low',
        },
        {
          path: 'project.url',
          description: 'Project URL',
          type: 'string',
          frequency: 'low',
        },
      ],
      examples: ['project.name', 'project.key'],
      commonUsage: [
        ['project.name', 'project.key'],
        ['project.key', 'project.id'],
        ['project.name', 'project.projectCategory.name'],
      ],
    },

    priority: {
      id: 'priority',
      name: 'Priority',
      description: 'Issue priority information',
      type: 'object',
      accessPaths: [
        {
          path: 'priority.name',
          description: 'Priority name',
          type: 'string',
          frequency: 'high',
        },
        {
          path: 'priority.id',
          description: 'Priority ID',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'priority.description',
          description: 'Priority description',
          type: 'string',
          frequency: 'low',
        },
        {
          path: 'priority.iconUrl',
          description: 'Priority icon URL',
          type: 'string',
          frequency: 'low',
        },
      ],
      examples: ['priority.name'],
      commonUsage: [['priority.name'], ['priority.name', 'priority.id']],
    },

    issuetype: {
      id: 'issuetype',
      name: 'Issue Type',
      description: 'Issue type classification',
      type: 'object',
      accessPaths: [
        {
          path: 'issuetype.name',
          description: 'Issue type name',
          type: 'string',
          frequency: 'high',
        },
        {
          path: 'issuetype.id',
          description: 'Issue type ID',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'issuetype.description',
          description: 'Issue type description',
          type: 'string',
          frequency: 'low',
        },
        {
          path: 'issuetype.iconUrl',
          description: 'Issue type icon URL',
          type: 'string',
          frequency: 'low',
        },
        {
          path: 'issuetype.subtask',
          description: 'Is subtask flag',
          type: 'boolean',
          frequency: 'medium',
        },
        {
          path: 'issuetype.avatarId',
          description: 'Issue type avatar ID',
          type: 'number',
          frequency: 'low',
        },
      ],
      examples: ['issuetype.name', 'issuetype.subtask'],
      commonUsage: [
        ['issuetype.name'],
        ['issuetype.name', 'issuetype.subtask'],
        ['issuetype.id', 'issuetype.name'],
      ],
    },

    reporter: {
      id: 'reporter',
      name: 'Reporter',
      description: 'Issue reporter user information',
      type: 'object',
      accessPaths: [
        {
          path: 'reporter.displayName',
          description: 'Reporter display name',
          type: 'string',
          frequency: 'high',
        },
        {
          path: 'reporter.emailAddress',
          description: 'Reporter email address',
          type: 'string',
          frequency: 'high',
        },
        {
          path: 'reporter.active',
          description: 'Reporter active status',
          type: 'boolean',
          frequency: 'medium',
        },
        {
          path: 'reporter.name',
          description: 'Reporter username',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'reporter.key',
          description: 'Reporter user key',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'reporter.self',
          description: 'Reporter REST API URL',
          type: 'string',
          frequency: 'low',
        },
        {
          path: 'reporter.accountId',
          description: 'Reporter account ID',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'reporter.avatarUrls.48x48',
          description: 'Large reporter avatar URL',
          type: 'string',
          frequency: 'low',
        },
      ],
      examples: ['reporter.displayName', 'reporter.emailAddress'],
      commonUsage: [
        ['reporter.displayName'],
        ['reporter.displayName', 'reporter.emailAddress'],
      ],
    },

    created: {
      id: 'created',
      name: 'Created',
      description: 'Issue creation timestamp',
      type: 'string',
      accessPaths: [
        {
          path: 'created',
          description: 'Issue creation date and time',
          type: 'string',
          frequency: 'high',
        },
      ],
      examples: ['created'],
      commonUsage: [['created']],
    },

    updated: {
      id: 'updated',
      name: 'Updated',
      description: 'Issue last update timestamp',
      type: 'string',
      accessPaths: [
        {
          path: 'updated',
          description: 'Issue last update date and time',
          type: 'string',
          frequency: 'high',
        },
      ],
      examples: ['updated'],
      commonUsage: [['updated']],
    },

    summary: {
      id: 'summary',
      name: 'Summary',
      description: 'Issue summary/title',
      type: 'string',
      accessPaths: [
        {
          path: 'summary',
          description: 'Issue summary text',
          type: 'string',
          frequency: 'high',
        },
      ],
      examples: ['summary'],
      commonUsage: [['summary']],
    },

    description: {
      id: 'description',
      name: 'Description',
      description: 'Issue description content',
      type: 'string',
      accessPaths: [
        {
          path: 'description',
          description: 'Issue description text',
          type: 'string',
          frequency: 'high',
        },
      ],
      examples: ['description'],
      commonUsage: [['description']],
    },

    resolution: {
      id: 'resolution',
      name: 'Resolution',
      description: 'Issue resolution information',
      type: 'object',
      accessPaths: [
        {
          path: 'resolution.name',
          description: 'Resolution name',
          type: 'string',
          frequency: 'high',
        },
        {
          path: 'resolution.id',
          description: 'Resolution ID',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'resolution.description',
          description: 'Resolution description',
          type: 'string',
          frequency: 'low',
        },
        {
          path: 'resolution.self',
          description: 'Resolution REST API URL',
          type: 'string',
          frequency: 'low',
        },
      ],
      examples: ['resolution.name'],
      commonUsage: [['resolution.name']],
    },

    labels: {
      id: 'labels',
      name: 'Labels',
      description: 'Issue labels array',
      type: 'array',
      accessPaths: [
        {
          path: 'labels',
          description: 'Array of issue labels',
          type: 'string[]',
          frequency: 'high',
        },
      ],
      examples: ['labels'],
      commonUsage: [['labels']],
    },

    components: {
      id: 'components',
      name: 'Components',
      description: 'Issue components array',
      type: 'array',
      accessPaths: [
        {
          path: 'components[].name',
          description: 'Component name',
          type: 'string',
          frequency: 'high',
        },
        {
          path: 'components[].id',
          description: 'Component ID',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'components[].description',
          description: 'Component description',
          type: 'string',
          frequency: 'low',
        },
        {
          path: 'components[].self',
          description: 'Component REST API URL',
          type: 'string',
          frequency: 'low',
        },
      ],
      examples: ['components[].name'],
      commonUsage: [['components[].name']],
    },

    fixVersions: {
      id: 'fixVersions',
      name: 'Fix Versions',
      description: 'Issue fix versions array',
      type: 'array',
      accessPaths: [
        {
          path: 'fixVersions[].name',
          description: 'Fix version name',
          type: 'string',
          frequency: 'high',
        },
        {
          path: 'fixVersions[].id',
          description: 'Fix version ID',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'fixVersions[].description',
          description: 'Fix version description',
          type: 'string',
          frequency: 'low',
        },
        {
          path: 'fixVersions[].releaseDate',
          description: 'Fix version release date',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'fixVersions[].released',
          description: 'Fix version released flag',
          type: 'boolean',
          frequency: 'medium',
        },
      ],
      examples: ['fixVersions[].name'],
      commonUsage: [['fixVersions[].name', 'fixVersions[].released']],
    },
  },

  // Fast lookup index: path -> field ID
  pathIndex: {},
};

// Build the path index automatically
Object.entries(ISSUE_FIELD_DEFINITIONS.fields).forEach(([fieldId, field]) => {
  field.accessPaths.forEach(accessPath => {
    ISSUE_FIELD_DEFINITIONS.pathIndex[accessPath.path] = fieldId;
  });
});
