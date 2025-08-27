import type { ResourceDefinition } from '../../../types/field-definition.js';

/**
 * Static field definitions for Jira project fields
 * Covers core project fields with complete nested access paths
 */
export const PROJECT_FIELD_DEFINITIONS: ResourceDefinition = {
  uri: 'jira://project/fields',
  entityType: 'project',
  lastUpdated: new Date().toISOString(),
  version: '1.0.0',
  totalFields: 12, // Core project fields

  fields: {
    key: {
      id: 'key',
      name: 'Project Key',
      description: 'Unique project identifier key',
      type: 'string',
      accessPaths: [
        {
          path: 'key',
          description: 'Project key (e.g., "DEMO", "TEST")',
          type: 'string',
          frequency: 'high',
        },
      ],
      examples: ['key'],
      commonUsage: [['key']],
    },

    name: {
      id: 'name',
      name: 'Project Name',
      description: 'Human-readable project name',
      type: 'string',
      accessPaths: [
        {
          path: 'name',
          description: 'Project display name',
          type: 'string',
          frequency: 'high',
        },
      ],
      examples: ['name'],
      commonUsage: [['name']],
    },

    id: {
      id: 'id',
      name: 'Project ID',
      description: 'Numeric project identifier',
      type: 'string',
      accessPaths: [
        {
          path: 'id',
          description: 'Project ID',
          type: 'string',
          frequency: 'medium',
        },
      ],
      examples: ['id'],
      commonUsage: [['id']],
    },

    description: {
      id: 'description',
      name: 'Description',
      description: 'Project description text',
      type: 'string',
      accessPaths: [
        {
          path: 'description',
          description: 'Project description content',
          type: 'string',
          frequency: 'medium',
        },
      ],
      examples: ['description'],
      commonUsage: [['description']],
    },

    lead: {
      id: 'lead',
      name: 'Project Lead',
      description: 'Project lead user information',
      type: 'object',
      accessPaths: [
        {
          path: 'lead.displayName',
          description: 'Project lead display name',
          type: 'string',
          frequency: 'high',
        },
        {
          path: 'lead.emailAddress',
          description: 'Project lead email address',
          type: 'string',
          frequency: 'high',
        },
        {
          path: 'lead.name',
          description: 'Project lead username',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'lead.key',
          description: 'Project lead user key',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'lead.accountId',
          description: 'Project lead account ID',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'lead.active',
          description: 'Project lead active status',
          type: 'boolean',
          frequency: 'medium',
        },
        {
          path: 'lead.self',
          description: 'Project lead REST API URL',
          type: 'string',
          frequency: 'low',
        },
        {
          path: 'lead.avatarUrls.48x48',
          description: 'Large avatar URL',
          type: 'string',
          frequency: 'low',
        },
        {
          path: 'lead.avatarUrls.24x24',
          description: 'Medium avatar URL',
          type: 'string',
          frequency: 'low',
        },
        {
          path: 'lead.avatarUrls.16x16',
          description: 'Small avatar URL',
          type: 'string',
          frequency: 'low',
        },
        {
          path: 'lead.avatarUrls.32x32',
          description: 'Default avatar URL',
          type: 'string',
          frequency: 'low',
        },
        {
          path: 'lead.timeZone',
          description: 'Project lead timezone',
          type: 'string',
          frequency: 'low',
        },
      ],
      examples: ['lead.displayName', 'lead.emailAddress'],
      commonUsage: [
        ['lead.displayName', 'lead.emailAddress'],
        ['lead.displayName', 'lead.active'],
        ['lead.name', 'lead.key'],
      ],
    },

    projectCategory: {
      id: 'projectCategory',
      name: 'Project Category',
      description: 'Project category classification',
      type: 'object',
      accessPaths: [
        {
          path: 'projectCategory.name',
          description: 'Project category name',
          type: 'string',
          frequency: 'high',
        },
        {
          path: 'projectCategory.id',
          description: 'Project category ID',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'projectCategory.description',
          description: 'Project category description',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'projectCategory.self',
          description: 'Project category REST API URL',
          type: 'string',
          frequency: 'low',
        },
      ],
      examples: ['projectCategory.name'],
      commonUsage: [
        ['projectCategory.name'],
        ['projectCategory.name', 'projectCategory.description'],
      ],
    },

    projectTypeKey: {
      id: 'projectTypeKey',
      name: 'Project Type Key',
      description: 'Project type identifier',
      type: 'string',
      accessPaths: [
        {
          path: 'projectTypeKey',
          description: 'Project type key (software, business, etc.)',
          type: 'string',
          frequency: 'medium',
        },
      ],
      examples: ['projectTypeKey'],
      commonUsage: [['projectTypeKey']],
    },

    components: {
      id: 'components',
      name: 'Components',
      description: 'Project components array',
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
          frequency: 'medium',
        },
        {
          path: 'components[].lead.displayName',
          description: 'Component lead display name',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'components[].lead.emailAddress',
          description: 'Component lead email address',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'components[].assigneeType',
          description: 'Component assignee type',
          type: 'string',
          frequency: 'low',
        },
        {
          path: 'components[].realAssigneeType',
          description: 'Component real assignee type',
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
      examples: ['components[].name', 'components[].description'],
      commonUsage: [
        ['components[].name'],
        ['components[].name', 'components[].description'],
        ['components[].name', 'components[].lead.displayName'],
      ],
    },

    versions: {
      id: 'versions',
      name: 'Versions',
      description: 'Project versions array',
      type: 'array',
      accessPaths: [
        {
          path: 'versions[].name',
          description: 'Version name',
          type: 'string',
          frequency: 'high',
        },
        {
          path: 'versions[].id',
          description: 'Version ID',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'versions[].description',
          description: 'Version description',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'versions[].releaseDate',
          description: 'Version release date',
          type: 'string',
          frequency: 'high',
        },
        {
          path: 'versions[].released',
          description: 'Version released flag',
          type: 'boolean',
          frequency: 'high',
        },
        {
          path: 'versions[].archived',
          description: 'Version archived flag',
          type: 'boolean',
          frequency: 'medium',
        },
        {
          path: 'versions[].startDate',
          description: 'Version start date',
          type: 'string',
          frequency: 'medium',
        },
        {
          path: 'versions[].self',
          description: 'Version REST API URL',
          type: 'string',
          frequency: 'low',
        },
      ],
      examples: ['versions[].name', 'versions[].released'],
      commonUsage: [
        ['versions[].name', 'versions[].released'],
        ['versions[].name', 'versions[].releaseDate'],
        ['versions[].name', 'versions[].description'],
      ],
    },

    url: {
      id: 'url',
      name: 'Project URL',
      description: 'Project URL link',
      type: 'string',
      accessPaths: [
        {
          path: 'url',
          description: 'Project URL',
          type: 'string',
          frequency: 'low',
        },
      ],
      examples: ['url'],
      commonUsage: [['url']],
    },

    self: {
      id: 'self',
      name: 'REST API URL',
      description: 'Project REST API URL',
      type: 'string',
      accessPaths: [
        {
          path: 'self',
          description: 'Project REST API URL',
          type: 'string',
          frequency: 'low',
        },
      ],
      examples: ['self'],
      commonUsage: [['self']],
    },

    style: {
      id: 'style',
      name: 'Project Style',
      description: 'Project visual style',
      type: 'string',
      accessPaths: [
        {
          path: 'style',
          description: 'Project style (classic, next-gen)',
          type: 'string',
          frequency: 'low',
        },
      ],
      examples: ['style'],
      commonUsage: [['style']],
    },
  },

  // Fast lookup index: path -> field ID
  pathIndex: {},
};

// Build the path index automatically
Object.entries(PROJECT_FIELD_DEFINITIONS.fields).forEach(([fieldId, field]) => {
  field.accessPaths.forEach(accessPath => {
    PROJECT_FIELD_DEFINITIONS.pathIndex[accessPath.path] = fieldId;
  });
});